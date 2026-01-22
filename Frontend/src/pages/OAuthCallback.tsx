import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, transformUser } = useAuth();
  const { t } = useLanguage();
  const hasProcessed = useRef(false);
  
  useEffect(() => {
    if (hasProcessed.current) {
      return;
    }
    
    const handleCallback = async () => {
      hasProcessed.current = true;
      
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      const pathname = window.location.pathname;
      let provider: 'google' | 'github' | null = null;
      
      if (pathname.includes('/auth/oauth/google/callback')) {
        provider = 'google';
      } else if (pathname.includes('/auth/oauth/github/callback')) {
        provider = 'github';
      }
      
      if (error) {
        toast.error(t('oauthAuthFailed'));
        navigate('/');
        return;
      }
      
      if (!code) {
        toast.error(t('noAuthorizationCode'));
        navigate('/');
        return;
      }
      
      if (!provider) {
        toast.error(t('oauthProviderError'));
        navigate('/');
        return;
      }
      
      try {
        const tokenResponse = await api.handleOAuthCallback(provider, code);
        
        if (!tokenResponse.access_token) {
          throw new Error(t('noAccessToken'));
        }
        
        api.setToken(tokenResponse.access_token);
        
        const currentUser = await api.getCurrentUser();
        const mappedUser = transformUser(currentUser);
        setUser(mappedUser);
        
        toast.success(t('oauthLoginSuccess'));
        navigate('/dashboard');
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        if (error.message === 'BACKEND_NOT_CONNECTED') {
          toast.error(t('backendNotConnected'));
        } else {
          toast.error(t('oauthCallbackError'));
        }
        navigate('/');
      }
    };
    
    handleCallback();
  }, [searchParams, navigate, setUser, transformUser, t]);
  
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 3,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          {t('completingOAuth') || 'Completing authentication...'}
        </Typography>
      </Box>
    </Container>
  );
}

