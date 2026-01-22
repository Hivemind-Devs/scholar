import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, IconButton } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useState } from 'react';
import AuthModal from './AuthModal';
export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };
  const handleLoginClick = () => {
    setIsAdminLogin(false);
    setAuthModalOpen(true);
  };
  const handleAdminLogin = () => {
    setIsAdminLogin(true);
    setAuthModalOpen(true);
  };
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ marginRight: '12px' }}>
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
            </svg>
            <Typography variant="h6" component="div">
              {t('appTitle')}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, ml: 4 }}>
            <Button color="inherit" onClick={() => navigate('/search')}>
              {t('search')}
            </Button>
            {user && (
              <Button color="inherit" onClick={() => navigate('/dashboard')}>
                {t('dashboard')}
              </Button>
            )}
            {user?.role === 'admin' && (
              <Button color="inherit" onClick={() => navigate('/admin')}>
                {t('adminPanel')}
              </Button>
            )}
          </Box>
          <Button 
            color="inherit" 
            onClick={toggleLanguage} 
            sx={{ 
              mr: 1,
              minWidth: 'auto',
              px: 1.5,
              fontWeight: 500
            }}
          >
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: language === 'en' ? 1 : 0.6,
                  fontWeight: language === 'en' ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                EN
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.6 }}>|</Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: language === 'tr' ? 1 : 0.6,
                  fontWeight: language === 'tr' ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                TR
              </Typography>
            </Box>
          </Button>
          {user ? (
            <div>
              <IconButton
                size="large"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {user.name}
                </Typography>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => { handleClose(); navigate('/dashboard'); }}>
                  {t('dashboard')}
                </MenuItem>
                {user.role === 'admin' && (
                  <MenuItem onClick={() => { handleClose(); navigate('/admin'); }}>
                    {t('adminPanel')}
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>{t('logout')}</MenuItem>
              </Menu>
            </div>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" onClick={handleLoginClick}>
                {t('login')}
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        isAdminLogin={isAdminLogin}
      />
    </>
  );
}