import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Divider,
  Alert,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';

export default function ProfileEdit() {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/dashboard');
      return;
    }
    setFormData({
      full_name: user.name || '',
      old_password: '',
      new_password: '',
      confirm_password: '',
    });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.new_password) {
        if (!formData.old_password) {
          setError(t('oldPasswordRequired'));
          setLoading(false);
          return;
        }
        if (formData.new_password !== formData.confirm_password) {
          setError(t('passwordsDoNotMatch'));
          setLoading(false);
          return;
        }
      }

      const updateData: any = {};
      
      if (formData.full_name !== user?.name) {
        updateData.full_name = formData.full_name;
      }
      
      if (formData.new_password && formData.old_password) {
        updateData.old_password = formData.old_password;
        updateData.new_password = formData.new_password;
      }

      if (Object.keys(updateData).length === 0) {
        setError(t('noChangesMade'));
        setLoading(false);
        return;
      }

      await updateProfile(updateData);
      
      setFormData({
        ...formData,
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
      
      toast.success(t('profileUpdatedSuccess'));
      navigate('/dashboard');
    } catch (error: any) {
      setError(t('profileUpdateError'));
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 2 }}
        >
          {t('back')}
        </Button>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t('editProfile')}
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Full Name Field */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('fullName')}
            </Typography>
            <TextField
              fullWidth
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              placeholder={t('enterFullName')}
              variant="outlined"
            />
          </Box>

          {/* Email Field (Read-only) */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('email')}
            </Typography>
            <TextField
              fullWidth
              value={user.email}
              disabled
              variant="outlined"
              sx={{
                '& .MuiInputBase-input': {
                  color: 'text.secondary',
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {t('emailCannotBeChanged')}
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Password Change Section */}
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
            {t('changePassword')}
          </Typography>

          {/* Old Password */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('oldPassword')} *
            </Typography>
            <TextField
              fullWidth
              type="password"
              value={formData.old_password}
              onChange={(e) =>
                setFormData({ ...formData, old_password: e.target.value })
              }
              placeholder={t('enterCurrentPassword')}
              variant="outlined"
              disabled={loading}
            />
          </Box>

          {/* New Password */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('newPassword')} *
            </Typography>
            <TextField
              fullWidth
              type="password"
              value={formData.new_password}
              onChange={(e) =>
                setFormData({ ...formData, new_password: e.target.value })
              }
              placeholder={t('enterNewPassword')}
              variant="outlined"
              disabled={loading}
            />
          </Box>

          {/* Confirm New Password */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('confirmPassword')} *
            </Typography>
            <TextField
              fullWidth
              type="password"
              value={formData.confirm_password}
              onChange={(e) =>
                setFormData({ ...formData, confirm_password: e.target.value })
              }
              placeholder={t('confirmNewPassword')}
              variant="outlined"
              disabled={loading}
            />
          </Box>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Submit Button */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
              disabled={loading}
              sx={{
                bgcolor: '#0D47A1',
                '&:hover': {
                  bgcolor: '#1565C0',
                },
                px: 4,
              }}
            >
              {loading ? t('saving') : t('save')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

