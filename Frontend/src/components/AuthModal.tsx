import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  Tab,
  Tabs,
  Alert,
  Link,
  Divider,
  Stack,
  CircularProgress,
} from '@mui/material';
import { Close, ArrowBack } from '@mui/icons-material';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/api';
import { toast } from 'sonner';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);
interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'signup';
  isAdminLogin?: boolean;
}
export default function AuthModal({ open, onClose, defaultTab = 'login', isAdminLogin = false }: AuthModalProps) {
  const { login, loginWithCredentials, signup } = useAuth();
  const { t } = useLanguage();
  const [currentTab, setCurrentTab] = useState<'login' | 'signup'>(defaultTab);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'password'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState('');
  const handleClose = () => {
    setFormData({ name: '', email: '', password: '' });
    setResetPasswordData({ newPassword: '', confirmPassword: '' });
    setResetEmail('');
    setResetCode('');
    setShowForgotPassword(false);
    setResetStep('email');
    setError('');
    setOauthLoading(null);
    onClose();
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setError(t('pleaseEnterEmail'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.requestPasswordReset(resetEmail);
      setResetStep('code');
      toast.success(t('resetCodeSent'));
    } catch (error: any) {
      setError(t('failedToSendResetCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!resetCode || resetCode.length !== 6) {
      setError(t('pleaseEnterValidCode'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.verifyPasswordResetCode(resetEmail, resetCode);
      setResetStep('password');
    } catch (error: any) {
      setError(t('invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordData.newPassword) {
      setError(t('enterNewPassword'));
      return;
    }
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.resetPassword(resetEmail, resetCode, resetPasswordData.newPassword);
      toast.success(t('passwordResetSuccess'));
      handleClose();
      setCurrentTab('login');
      setFormData({ ...formData, email: resetEmail, password: '', name: '' });
    } catch (error: any) {
      setError(t('failedToResetPassword'));
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (currentTab === 'signup') {
        await signup(formData.name, formData.email, formData.password);
      } else {
        await loginWithCredentials(formData.email, formData.password, isAdminLogin);
      }
      handleClose();
    } catch (error) {
      console.error('Auth error:', error);
      setError(t('authFailed'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 0, position: 'relative', overflow: 'visible' }}>
        <Box sx={{ position: 'relative', p: 4, overflow: 'visible' }}>
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              zIndex: 1,
              color: 'grey.500',
              minWidth: 40,
              minHeight: 40,
              padding: 1,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Close />
          </IconButton>
          {showForgotPassword ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetStep('email');
                    setResetEmail('');
                    setResetCode('');
                    setResetPasswordData({ newPassword: '', confirmPassword: '' });
                    setError('');
                  }}
                  sx={{ mr: 1 }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="h4" sx={{ color: '#0D47A1', fontWeight: 600 }}>
                  {t('resetPasswordTitle')}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {resetStep === 'email' ? t('resetPasswordDesc') : 
                 resetStep === 'code' ? t('resetCodeSent') :
                 t('enterNewPassword')}
              </Typography>
              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
              
              {resetStep === 'email' && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('emailAddress')}
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder={t('enterEmail')}
                    />
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleForgotPassword}
                    disabled={loading || !resetEmail}
                    sx={{
                      bgcolor: '#0D47A1',
                      py: 1.5,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#1565C0',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      t('sendCode')
                    )}
                  </Button>
                </Box>
              )}

              {resetStep === 'code' && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('enterResetCode')}
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      inputProps={{
                        maxLength: 6,
                        style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontFamily: 'monospace' }
                      }}
                    />
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleVerifyCode}
                    disabled={loading || resetCode.length !== 6}
                    sx={{
                      bgcolor: '#0D47A1',
                      py: 1.5,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#1565C0',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      t('verifyCode')
                    )}
                  </Button>
                </Box>
              )}

              {resetStep === 'password' && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('newPassword')}
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      type="password"
                      value={resetPasswordData.newPassword}
                      onChange={(e) => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                      placeholder={t('enterNewPassword')}
                    />
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('confirmPassword')}
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      type="password"
                      value={resetPasswordData.confirmPassword}
                      onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                      placeholder={t('confirmNewPassword')}
                    />
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleResetPassword}
                    disabled={loading || !resetPasswordData.newPassword || !resetPasswordData.confirmPassword}
                    sx={{
                      bgcolor: '#0D47A1',
                      py: 1.5,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#1565C0',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      t('resetPasswordButton')
                    )}
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <>
              {!isAdminLogin && (
                <Tabs
                  value={currentTab}
                  onChange={(_, value) => setCurrentTab(value)}
                  sx={{ mb: 3 }}
                >
                  <Tab label={t('login')} value="login" />
                  <Tab label={t('signUp')} value="signup" />
                </Tabs>
              )}
              <Typography variant="h4" gutterBottom sx={{ color: '#0D47A1', fontWeight: 600 }}>
                {isAdminLogin ? t('adminLogin') : currentTab === 'login' ? t('welcomeBack') : t('createAccount')}
              </Typography>
              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
              
              {/* OAuth Buttons */}
              {!isAdminLogin && (
                <Box sx={{ mt: 3, mb: 3 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      onClick={async () => {
                        setOauthLoading('google');
                        try {
                          await login('google');
                        } catch (error) {
                          setOauthLoading(null);
                        }
                      }}
                      disabled={oauthLoading !== null}
                      startIcon={oauthLoading === 'google' ? <CircularProgress size={20} /> : <GoogleIcon />}
                      sx={{
                        borderColor: '#dadce0',
                        color: '#3c4043',
                        textTransform: 'none',
                        py: 1.5,
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        '&:hover': {
                          borderColor: '#dadce0',
                          bgcolor: '#f8f9fa',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        },
                        '&:disabled': {
                          borderColor: '#dadce0',
                          color: '#3c4043',
                        },
                      }}
                    >
                      {oauthLoading === 'google' ? t('loading') : t('continueWithGoogle')}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      onClick={async () => {
                        setOauthLoading('github');
                        try {
                          await login('github');
                        } catch (error) {
                          setOauthLoading(null);
                        }
                      }}
                      disabled={oauthLoading !== null}
                      startIcon={oauthLoading === 'github' ? <CircularProgress size={20} /> : <GitHubIcon />}
                      sx={{
                        borderColor: '#24292e',
                        color: '#24292e',
                        textTransform: 'none',
                        py: 1.5,
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        '&:hover': {
                          borderColor: '#24292e',
                          bgcolor: '#f6f8fa',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        },
                        '&:disabled': {
                          borderColor: '#24292e',
                          color: '#24292e',
                        },
                      }}
                    >
                      {oauthLoading === 'github' ? t('loading') : t('continueWithGithub')}
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* Divider with "OR" */}
              {!isAdminLogin && (
                <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
                  <Divider sx={{ flex: 1 }} />
                  <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
                    {t('or') || 'OR'}
                  </Typography>
                  <Divider sx={{ flex: 1 }} />
                </Box>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: !isAdminLogin ? 0 : 3 }}>
            {currentTab === 'signup' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('fullName')}
                </Typography>
                <TextField
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('enterFullName')}
                />
              </Box>
            )}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('emailAddress')}
              </Typography>
              <TextField
                fullWidth
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('enterEmail')}
              />
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('password')}
              </Typography>
              <TextField
                fullWidth
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={t('enterPassword')}
              />
            </Box>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                bgcolor: '#0D47A1',
                py: 1.5,
                fontSize: '1.1rem',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#1565C0',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                currentTab === 'login' ? t('login') : t('signUp')
              )}
            </Button>
            {currentTab === 'login' && !isAdminLogin && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setResetEmail(formData.email);
                    setError('');
                  }}
                  sx={{ cursor: 'pointer' }}
                >
                  {t('forgotPassword')}
                </Link>
              </Box>
            )}
          </Box>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}