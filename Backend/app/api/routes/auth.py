from typing import Any
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.security import OAuth2PasswordRequestForm
from app.api import deps
from app.core.security import create_access_token
from app.core.config import settings
from app.services.user_service import UserService
from app.services.password_reset_service import PasswordResetService
from app.services.log_service import LogService
from app.services.email_service import EmailService
from app.schemas.token import Token
from app.schemas.password_reset import PasswordResetRequest, PasswordResetVerify, PasswordResetComplete
import httpx

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
    user_service: UserService = Depends(deps.get_user_service),
    log_service: LogService = Depends(deps.get_log_service)
) -> Any:
    """
    Authenticate a user and generate an access token.
    
    This endpoint validates user credentials (email and password) and returns a JWT access token
    upon successful authentication. The login attempt is automatically logged for security purposes.
    
    Args:
        form_data: OAuth2 password request form containing username (email) and password.
        request: HTTP request object for extracting client IP and user agent information.
    
    Returns:
        A token response containing the access token and token type ('bearer').
        The access token expires after 30 minutes.
    
    Raises:
        HTTPException: 400 if email or password is incorrect, or if the user account is inactive.
    """
    user = await user_service.authenticate(
        email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    

    ip_address = request.client.host if request else None
    user_agent = request.headers.get("user-agent") if request else None
    await log_service.log_login(
        user_id=user.user_id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    access_token_expires = timedelta(minutes=30)

    return {
        "access_token": create_access_token(
            subject=str(user.user_id), expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/oauth/google")
async def google_oauth_login():
    """
    Generate and return the Google OAuth authentication URL.
    
    This endpoint initiates the Google OAuth authentication flow by providing the authorization
    URL that the frontend application should redirect users to. The URL includes all necessary
    OAuth parameters configured for Google authentication.
    
    Returns:
        A dictionary containing the 'auth_url' field with the complete Google OAuth
        authorization URL that should be used for user redirection.
    
    Raises:
        HTTPException: 500 if Google OAuth is not properly configured in the system settings.
    """
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    redirect_uri = f"{settings.oauth_redirect_base_url}/auth/oauth/google/callback"
    google_oauth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.google_client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope=openid email profile&"
        f"access_type=online"
    )
    
    return {"auth_url": google_oauth_url}

@router.get("/oauth/google/callback")
async def google_oauth_callback(
    code: str = Query(...),
    request: Request = None,
    user_service: UserService = Depends(deps.get_user_service),
    log_service: LogService = Depends(deps.get_log_service),
    email_service: EmailService = Depends(deps.get_email_service)
):
    """
    Handle the callback from Google OAuth authentication flow.
    
    This endpoint processes the authorization code returned by Google after user consent,
    exchanges it for an access token, retrieves user information from Google's API, and
    either logs in an existing user or creates a new user account. A welcome email is
    automatically sent to new users upon registration.
    
    Args:
        code: Authorization code received from Google OAuth redirect.
        request: HTTP request object for extracting client information.
    
    Returns:
        A dictionary containing the access token, token type, and a redirect URL
        that the frontend should use to complete the authentication process.
    
    Raises:
        HTTPException: 400 if OAuth code exchange fails or user data is invalid.
        HTTPException: 500 if Google OAuth is not configured or authentication fails.
    """
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    

    backend_url = settings.oauth_redirect_base_url.rstrip('/') if settings.oauth_redirect_base_url else str(request.base_url).rstrip('/')
    redirect_uri = f"{backend_url}/auth/oauth/google/callback"
    

    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            token_response.raise_for_status()
            token_data = token_response.json()
            access_token = token_data["access_token"]
            

            user_info_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_info_response.raise_for_status()
            user_info = user_info_response.json()
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=400, detail=f"OAuth error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to authenticate with Google: {str(e)}")
    

    email = user_info.get("email")
    full_name = user_info.get("name", email.split("@")[0] if email else "User")
    oauth_id = user_info.get("id")
    
    if not email or not oauth_id:
        raise HTTPException(status_code=400, detail="Invalid user data from Google")
    

    user = await user_service.get_by_oauth("google", oauth_id)
    if not user:
        user = await user_service.create_oauth_user(
            email=email,
            full_name=full_name,
            provider="google",
            oauth_id=oauth_id
        )

        try:
            await email_service.send_welcome_email(
                recipient_name=full_name,
                recipient_email=email
            )
        except Exception as e:
            print(f"Failed to send welcome email to {email}: {e}")
    

    ip_address = request.client.host if request else None
    user_agent = request.headers.get("user-agent") if request else None
    await log_service.log_login(
        user_id=user.user_id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        subject=str(user.user_id), expires_delta=access_token_expires
    )
    

    frontend_url = (settings.frontend_base_url or settings.oauth_redirect_base_url or "http://localhost:3000").rstrip('/')
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "redirect_url": f"{frontend_url}/auth/callback?token={access_token}"
    }

@router.get("/oauth/github")
async def github_oauth_login(request: Request):
    """
    Generate and return the GitHub OAuth authentication URL.
    
    This endpoint initiates the GitHub OAuth authentication flow by providing the authorization
    URL that the frontend application should redirect users to. The URL includes all necessary
    OAuth parameters configured for GitHub authentication.
    
    Args:
        request: HTTP request object used to determine the callback URL base.
    
    Returns:
        A dictionary containing the 'auth_url' field with the complete GitHub OAuth
        authorization URL that should be used for user redirection.
    
    Raises:
        HTTPException: 500 if GitHub OAuth is not properly configured in the system settings.
    """
    if not settings.github_client_id:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    

    backend_url = settings.oauth_redirect_base_url.rstrip('/') if settings.oauth_redirect_base_url else str(request.base_url).rstrip('/')
    redirect_uri = f"{backend_url}/auth/oauth/github/callback"
    github_oauth_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={settings.github_client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope=user:email"
    )
    
    return {"auth_url": github_oauth_url}

@router.get("/oauth/github/callback")
async def github_oauth_callback(
    code: str = Query(...),
    request: Request = None,
    user_service: UserService = Depends(deps.get_user_service),
    log_service: LogService = Depends(deps.get_log_service),
    email_service: EmailService = Depends(deps.get_email_service)
):
    """
    Handle the callback from GitHub OAuth authentication flow.
    
    This endpoint processes the authorization code returned by GitHub after user consent,
    exchanges it for an access token, retrieves user information and email addresses from
    GitHub's API, and either logs in an existing user or creates a new user account.
    A welcome email is automatically sent to new users upon registration.
    
    Args:
        code: Authorization code received from GitHub OAuth redirect.
        request: HTTP request object for extracting client information.
    
    Returns:
        A dictionary containing the access token, token type, and a redirect URL
        that the frontend should use to complete the authentication process.
    
    Raises:
        HTTPException: 400 if OAuth code exchange fails or user data is invalid.
        HTTPException: 500 if GitHub OAuth is not configured or authentication fails.
    """
    if not settings.github_client_id or not settings.github_client_secret:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    

    backend_url = settings.oauth_redirect_base_url.rstrip('/') if settings.oauth_redirect_base_url else str(request.base_url).rstrip('/')
    redirect_uri = f"{backend_url}/auth/oauth/github/callback"
    

    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "code": code,
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "redirect_uri": redirect_uri,
                },
                headers={"Accept": "application/json"},
            )
            token_response.raise_for_status()
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise HTTPException(status_code=400, detail="Failed to get access token from GitHub")
            

            user_info_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_info_response.raise_for_status()
            user_info = user_info_response.json()
            

            email_response = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            email_response.raise_for_status()
            emails = email_response.json()

            primary_email = next((e["email"] for e in emails if e.get("primary")), None)
            email = primary_email or next((e["email"] for e in emails if e.get("verified")), None)
            email = email or (emails[0]["email"] if emails else None)
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=400, detail=f"OAuth error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to authenticate with GitHub: {str(e)}")
    

    full_name = user_info.get("name") or user_info.get("login", "User")
    oauth_id = str(user_info.get("id"))
    
    if not email or not oauth_id:
        raise HTTPException(status_code=400, detail="Invalid user data from GitHub")
    

    user = await user_service.get_by_oauth("github", oauth_id)
    if not user:
        user = await user_service.create_oauth_user(
            email=email,
            full_name=full_name,
            provider="github",
            oauth_id=oauth_id
        )

        try:
            await email_service.send_welcome_email(
                recipient_name=full_name,
                recipient_email=email
            )
        except Exception as e:
            print(f"Failed to send welcome email to {email}: {e}")
    

    ip_address = request.client.host if request else None
    user_agent = request.headers.get("user-agent") if request else None
    await log_service.log_login(
        user_id=user.user_id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        subject=str(user.user_id), expires_delta=access_token_expires
    )
    

    frontend_url = (settings.frontend_base_url or settings.oauth_redirect_base_url or "http://localhost:3000").rstrip('/')
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "redirect_url": f"{frontend_url}/auth/callback?token={access_token}"
    }

@router.post("/password-reset/request")
async def request_password_reset(
    request_data: PasswordResetRequest,
    user_repo = Depends(deps.get_user_repository),
    email_service: EmailService = Depends(deps.get_email_service)
):
    """
    Request a password reset code to be sent via email.
    
    This endpoint initiates the password reset process by generating a secure verification
    code and sending it to the user's email address if the account exists. For security
    purposes, the endpoint always returns a success message regardless of whether the
    email exists in the system, preventing email enumeration attacks.
    
    Args:
        request_data: Contains the email address of the user requesting password reset.
    
    Returns:
        A success message indicating that an email will be sent if the account exists.
        This message is always returned to maintain security, even if the email is not found.
    """
    password_reset_service = PasswordResetService(user_repo, email_service)
    await password_reset_service.request_password_reset(request_data.email)
    

    return {"message": "If the email exists, a reset code has been sent."}

@router.post("/password-reset/verify")
async def verify_password_reset_code(
    request_data: PasswordResetVerify,
    user_repo = Depends(deps.get_user_repository),
    email_service: EmailService = Depends(deps.get_email_service)
):
    """
    Verify the validity of a password reset code.
    
    This endpoint validates whether the provided password reset code is correct and
    has not expired. It should be called before allowing the user to proceed with
    the password reset process to ensure the code is valid.
    
    Args:
        request_data: Contains the email address and the reset code to be verified.
    
    Returns:
        A success message confirming that the reset code is valid.
    
    Raises:
        HTTPException: 400 if the reset code is invalid, expired, or does not match
                       the provided email address.
    """
    password_reset_service = PasswordResetService(user_repo, email_service)
    is_valid = await password_reset_service.verify_reset_code(
        request_data.email,
        request_data.code
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset code"
        )
    
    return {"message": "Reset code is valid"}

@router.post("/password-reset/complete")
async def complete_password_reset(
    request_data: PasswordResetComplete,
    user_repo = Depends(deps.get_user_repository),
    email_service: EmailService = Depends(deps.get_email_service),
    log_service: LogService = Depends(deps.get_log_service),
    request: Request = None
):
    """
    Complete the password reset process by setting a new password.
    
    This endpoint finalizes the password reset procedure by validating the reset code
    and updating the user's password with the new one provided. The password change
    is automatically logged for security auditing purposes.
    
    Args:
        request_data: Contains the email address, reset code, and the new password.
        request: HTTP request object for extracting client IP and user agent for logging.
    
    Returns:
        A success message confirming that the password has been reset successfully.
    
    Raises:
        HTTPException: 400 if the reset code is invalid, expired, or does not match
                       the provided email address.
    """
    password_reset_service = PasswordResetService(user_repo, email_service)
    success = await password_reset_service.reset_password(
        request_data.email,
        request_data.code,
        request_data.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset code"
        )
    

    user = await user_repo.get_by_email(request_data.email)
    if user:
        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        await log_service.log_password_change(
            user_id=user.user_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    return {"message": "Password has been reset successfully"}
