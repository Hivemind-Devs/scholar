import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Avatar,
} from '@mui/material';
import { 
  School, 
  TrendingUp, 
  People, 
  Verified,
  AutoAwesome,
  Security,
  Speed,
  BarChart,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

export default function About() {
  const { t } = useLanguage();

  const stats = [
    { 
      icon: <School />, 
      value: '100,000+', 
      label: t('scholars'),
      color: 'primary.main',
    },
    { 
      icon: <TrendingUp />, 
      value: '6,000,000+', 
      label: t('publications'),
      color: 'success.main',
    },
    { 
      icon: <People />, 
      value: '600,000+', 
      label: t('collaborations'),
      color: 'warning.main',
    },
    { 
      icon: <Verified />, 
      value: '200+', 
      label: t('institutions'),
      color: 'info.main',
    },
  ];

  const technologies = [
    { icon: <AutoAwesome />, text: t('aboutTech1') },
    { icon: <Speed />, text: t('aboutTech2') },
    { icon: <People />, text: t('aboutTech3') },
    { icon: <TrendingUp />, text: t('aboutTech4') },
    { icon: <BarChart />, text: t('aboutTech5') },
    { icon: <Security />, text: t('aboutTech6') },
  ];

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
          {t('aboutTitle')}
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
          {t('aboutSubtitle')}
        </Typography>
      </Box>

      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 8, mx: 0 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  boxShadow: `0 12px 32px ${stat.color}30`,
                  transform: 'translateY(-6px)',
                  borderColor: stat.color,
                  '& .stat-icon': {
                    transform: 'scale(1.1) rotate(5deg)',
                  },
                },
              }}
            >
              <Avatar
                className="stat-icon"
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: stat.color,
                  mx: 'auto',
                  mb: 2,
                  transition: 'all 0.3s ease',
                  boxShadow: `0 4px 16px ${stat.color}40`,
                }}
              >
                {stat.icon}
              </Avatar>
              <Typography 
                variant="h3" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  color: stat.color,
                  mb: 1,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                }}
              >
                {stat.value}
              </Typography>
              <Typography 
                color="text.secondary" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                {stat.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Mission Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 6,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(13, 71, 161, 0.03) 0%, rgba(255, 255, 255, 1) 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #0D47A1 0%, #1976D2 100%)',
          },
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            mb: 3,
            color: 'primary.main',
          }}
        >
          {t('aboutMission')}
        </Typography>
        <Typography 
          paragraph 
          sx={{ 
            fontSize: '1.15rem',
            lineHeight: 1.8,
            mb: 2,
            color: 'text.primary',
            fontWeight: 400,
          }}
        >
          {t('aboutMissionDesc1')}
        </Typography>
        <Typography 
          paragraph 
          sx={{ 
            fontSize: '1.15rem',
            lineHeight: 1.8,
            color: 'text.primary',
            fontWeight: 400,
          }}
        >
          {t('aboutMissionDesc2')}
        </Typography>
      </Paper>

      {/* Vision Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 6,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            transform: 'translateY(-4px)',
            borderColor: 'primary.main',
          },
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            mb: 3,
            color: 'primary.main',
          }}
        >
          {t('aboutVision')}
        </Typography>
        <Typography 
          sx={{ 
            fontSize: '1.15rem',
            lineHeight: 1.8,
            color: 'text.primary',
          }}
        >
          {t('aboutVisionDesc')}
        </Typography>
      </Paper>

      {/* Technology Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 6,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(13, 71, 161, 0.02))',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            transform: 'translateY(-4px)',
            borderColor: 'info.main',
          },
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            mb: 2,
            color: 'primary.main',
          }}
        >
          {t('aboutTechnology')}
        </Typography>
        <Typography 
          paragraph 
          sx={{ 
            fontSize: '1.1rem',
            mb: 4,
            color: 'text.secondary',
            lineHeight: 1.7,
          }}
        >
          {t('aboutTechDesc')}
        </Typography>
        <Grid container spacing={3}>
          {technologies.map((tech, index) => {
            const colors = [
              'primary.main',
              'success.main',
              'warning.main',
              'info.main',
              'error.main',
              'secondary.main',
            ];
            const color = colors[index % colors.length];
            
            return (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    height: '100%',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                      borderColor: color,
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: color,
                      width: 48,
                      height: 48,
                      boxShadow: `0 4px 12px ${color}40`,
                    }}
                  >
                    {tech.icon}
                  </Avatar>
                  <Typography
                    sx={{
                      fontSize: '1.05rem',
                      lineHeight: 1.7,
                      pt: 0.5,
                      color: 'text.primary',
                      fontWeight: 400,
                    }}
                  >
                    {tech.text}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Container>
  );
}
