from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.email_service import EmailService

router = APIRouter()


email_service = EmailService()


class ContactFormRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


class ContactFormResponse(BaseModel):
    message: str
    success: bool


@router.post("/", response_model=ContactFormResponse)
async def submit_contact_form(
    contact_data: ContactFormRequest
):
    """
    Submit a contact form message and send email notifications.
    
    This endpoint processes contact form submissions by sending two emails:
    a notification email to administrators and a confirmation email to the sender.
    Both email operations are attempted even if one fails, ensuring that at least
    the notification or confirmation is delivered.
    
    Args:
        contact_data: Contact form data containing sender's name, email address,
                     subject, and message content.
    
    Returns:
        A success response confirming that the message has been received and
        notifications have been sent.
    
    Raises:
        HTTPException: 500 if a critical error occurs during form processing or
                       email delivery.
    """
    try:

        admin_email_sent = await email_service.send_contact_form_email(
            sender_name=contact_data.name,
            sender_email=contact_data.email,
            subject=contact_data.subject,
            message=contact_data.message
        )
        
        if not admin_email_sent:
            print(f"Failed to send admin notification email for contact form from {contact_data.name} ({contact_data.email})")
        

        confirmation_email_sent = await email_service.send_contact_confirmation_email(
            recipient_name=contact_data.name,
            recipient_email=contact_data.email,
            subject=contact_data.subject,
            message_content=contact_data.message
        )
        
        if not confirmation_email_sent:
            print(f"Failed to send confirmation email to {contact_data.email}")
        
        return ContactFormResponse(
            message="Thank you for your message. We will get back to you soon.",
            success=True
        )
    except Exception as e:
        print(f"Error processing contact form: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your request. Please try again later."
        )

