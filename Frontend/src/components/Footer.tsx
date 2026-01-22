import { Box, Container, Typography, Link, Grid, IconButton } from '@mui/material';
import { GitHub, Email, Language } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
export default function Footer() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1a1a1a',
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white" style={{ marginRight: '12px' }}>
                <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
              </svg>
              <Typography variant="h6">{t('appTitle')}</Typography>
            </Box>
            <Typography variant="body2" color="grey.400" sx={{ mb: 2 }}>
              {t('footerDesc')}
            </Typography>
            <Box>
              <IconButton color="inherit" href="https://github.com/Hivemind-Devs" target="_blank">
                <GitHub />
              </IconButton>
              <IconButton color="inherit" href="mailto:info@fediva.tr">
                <Email />
              </IconButton>
              <IconButton color="inherit" onClick={() => navigate('/')}>
                <Language />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" gutterBottom>
              {t('platform')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link 
                component={RouterLink}
                to="/"
                color="grey.400" 
                underline="hover" 
                onClick={() => window.scrollTo(0, 0)}
                sx={{ cursor: 'pointer' }}
              >
                {t('home')}
              </Link>
              <Link 
                color="grey.400" 
                underline="hover" 
                onClick={(e) => { e.preventDefault(); navigate('/search'); }}
                sx={{ cursor: 'pointer' }}
              >
                {t('searchScholars')}
              </Link>
              <Link 
                color="grey.400" 
                underline="hover" 
                onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
                sx={{ cursor: 'pointer' }}
              >
                {t('dashboard')}
              </Link>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" gutterBottom>
              {t('resources')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link 
                color="grey.400" 
                underline="hover"
                href="https://sapi.fediva.tr/docs"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('documentation')}
              </Link>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" gutterBottom>
              {t('about')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link 
                color="grey.400" 
                underline="hover"
                onClick={(e) => { e.preventDefault(); navigate('/about'); }}
                sx={{ cursor: 'pointer' }}
              >
                {t('aboutUs')}
              </Link>
              <Link 
                color="grey.400" 
                underline="hover"
                onClick={(e) => { e.preventDefault(); navigate('/team'); }}
                sx={{ cursor: 'pointer' }}
              >
                {t('team')}
              </Link>
              <Link 
                color="grey.400" 
                underline="hover"
                onClick={(e) => { e.preventDefault(); navigate('/contact'); }}
                sx={{ cursor: 'pointer' }}
              >
                {t('contact')}
              </Link>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" gutterBottom>
              {t('legal')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link 
                color="grey.400" 
                underline="hover" 
                onClick={(e) => { e.preventDefault(); navigate('/privacy-policy'); }}
                sx={{ cursor: 'pointer' }}
              >
                {t('privacyPolicy')}
              </Link>
              <Link 
                color="grey.400" 
                underline="hover" 
                onClick={(e) => { e.preventDefault(); navigate('/terms-of-service'); }}
                sx={{ cursor: 'pointer' }}
              >
                {t('termsOfService')}
              </Link>
              <Link 
                color="grey.400" 
                underline="hover" 
                onClick={(e) => { e.preventDefault(); navigate('/kvkk-compliance'); }}
                sx={{ cursor: 'pointer' }}
              >
                {t('kvkkCompliance')}
              </Link>
            </Box>
          </Grid>
        </Grid>
        <Box
          sx={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            mt: 4,
            pt: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="grey.500">
            {t('rightsReserved')}
          </Typography>
          <Typography variant="body2" color="grey.500">
            {language === 'tr' 
              ? 'Veriler YÖK Akademik\'ten alınmıştır • Son güncelleme: Aralık 2025'
              : 'Data sourced from YÖK Akademik • Last updated: December 2025'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}