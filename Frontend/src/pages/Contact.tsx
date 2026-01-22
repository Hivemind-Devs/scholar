import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Paper,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Email, LocationOn, Send } from '@mui/icons-material';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Contact() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.submitContactForm(formData);
      toast.success(t('contactSuccess') || 'Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      if (error instanceof Error && error.message === 'BACKEND_NOT_CONNECTED') {
        toast.error(t('contactBackendError') || 'Backend is not running. Start the API server and try again.');
      } else {
        toast.error(t('contactError') || 'Failed to send message. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 }, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {t('contact')}
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            maxWidth: '800px', 
            mx: 'auto',
            fontWeight: 400,
            lineHeight: 1.6,
          }}
        >
          {t('contactSubtitle') || 'Have questions? We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.'}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 6, mx: 0 }}>
        {/* Contact Information Cards */}
        <Grid item xs={12} sm={6} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 32px rgba(13, 71, 161, 0.15)',
                transform: 'translateY(-6px)',
                borderColor: 'primary.main',
              },
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 4px 16px rgba(13, 71, 161, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
            >
              <Email sx={{ fontSize: 36, color: 'white' }} />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
              {t('email') || 'Email'}
            </Typography>
            <Typography color="text.secondary" gutterBottom sx={{ fontSize: '1.05rem', mb: 1 }}>
              info@fediva.tr
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '1.05rem' }}>
              support@fediva.tr
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 32px rgba(76, 175, 80, 0.15)',
                transform: 'translateY(-6px)',
                borderColor: 'success.main',
              },
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
            >
              <LocationOn sx={{ fontSize: 36, color: 'white' }} />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
              {t('address') || 'Address'}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '1.05rem', mb: 1 }}>
              İstanbul Teknik Üniversitesi
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '1.05rem' }}>
              Maslak, 34469 İstanbul, Türkiye
            </Typography>
          </Paper>
        </Grid>

        {/* Contact Form */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 5, md: 6 },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            {/* Header */}
            <Box sx={{ mb: 5, textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700, 
                  mb: 2,
                  background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {t('sendMessage') || 'Send us a Message'}
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  maxWidth: 600,
                  mx: 'auto',
                  fontSize: '1.05rem',
                  lineHeight: 1.6,
                }}
              >
                {t('contactFormDesc') || 'Fill out the form below and we\'ll get back to you within 24 hours.'}
              </Typography>
            </Box>

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label={t('contactName') || 'Your Name'}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          },
                        },
                        '&.Mui-focused': {
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          },
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 500,
                        color: 'text.secondary',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="email"
                    label={t('contactEmail') || 'Your Email'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          },
                        },
                        '&.Mui-focused': {
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          },
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 500,
                        color: 'text.secondary',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label={t('contactSubject') || 'Subject'}
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          },
                        },
                        '&.Mui-focused': {
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          },
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 500,
                        color: 'text.secondary',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={6}
                    label={t('contactMessage') || 'Message'}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          },
                        },
                        '&.Mui-focused': {
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          },
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 500,
                        color: 'text.secondary',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    mt: 2,
                  }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                      disabled={loading}
                      sx={{
                        px: 6,
                        py: 1.5,
                        minWidth: 200,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)',
                        boxShadow: '0 4px 14px rgba(13, 71, 161, 0.25)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 8px 24px rgba(13, 71, 161, 0.35)',
                          transform: 'translateY(-2px)',
                          background: 'linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)',
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                        },
                        '&.Mui-disabled': {
                          background: 'rgba(13, 71, 161, 0.6)',
                        },
                      }}
                    >
                      {loading ? (t('sending') || 'Sending...') : (t('sendMessage') || 'Send Message')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

      </Grid>
    </Container>
  );
}