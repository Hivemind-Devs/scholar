import {
  Container,
  Typography,
  Box,
  Grid,
  Avatar,
  Chip,
  Paper,
  Link,
} from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

export default function Team() {
  const { t, language } = useLanguage();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toLocaleUpperCase(language === 'tr' ? 'tr-TR' : 'en-US')
      .slice(0, 2);
  };
  
  const teamMembers = [
    {
      id: '1',
      name: 'Zehra Pınar Yayla',
      roles: [t('projectManager'), t('scrumMaster')],
      avatar: '',
    },
    {
      id: '2',
      name: 'İbrahim Enes Duran',
      roles: [t('technicalLead'), t('crManager')],
      avatar: '',
    },
    {
      id: '3',
      name: 'Baran Adanır',
      roles: [t('mlAiEngineer'), t('documentationManager')],
      avatar: '',
    },
    {
      id: '4',
      name: 'Zülal Dündar',
      roles: [t('databaseArchitect'), t('riskManager')],
      avatar: '',
    },
    {
      id: '5',
      name: 'Doruk İlhan',
      roles: [t('devopsEngineer'), t('deploymentManager')],
      avatar: '',
    },
    {
      id: '6',
      name: 'Laura Hysa',
      roles: [t('dataScrapingEngineer'), t('testingQaLead')],
      avatar: '',
    },
    {
      id: '7',
      name: 'Mustafa Eren Koç',
      roles: [t('fullStackDeveloper'), t('uiUxLead')],
      avatar: '',
    },
    {
      id: '8',
      name: 'Hasan Altay Uğur',
      roles: [t('fullStackDeveloper'), t('qaCoordinator')],
      avatar: '',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
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
          {t('ourTeam')}
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ maxWidth: '800px', mx: 'auto', fontWeight: 400 }}
        >
          {t('meetTeamDesc')}
        </Typography>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        {teamMembers.map((member) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={member.id}>
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                textAlign: 'center',
                p: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  transform: 'translateY(-4px)',
                  borderColor: 'primary.main',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(13, 71, 161, 0.25)',
                }}
              >
                {getInitials(member.name)}
              </Avatar>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  mb: 1.5,
                  fontSize: '1.1rem',
                }}
              >
                {member.name}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, minHeight: 64 }}>
                {member.roles.map((role, index) => (
                  <Chip
                    key={index}
                    label={role}
                    size="small"
                    sx={{
                      bgcolor: index === 0 ? 'primary.main' : 'primary.light',
                      color: 'white',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      height: 28,
                      '& .MuiChip-label': {
                        px: 1.5,
                      },
                    }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper
        elevation={0}
        sx={{
          mt: 8,
          p: { xs: 3, md: 5 },
          textAlign: 'center',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          background: 'linear-gradient(to bottom, rgba(13, 71, 161, 0.03), rgba(255, 255, 255, 1))',
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          {t('joinOurTeam')}
        </Typography>
        <Typography color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 2 }}>
          {t('joinTeamDesc')}
        </Typography>
        <Typography>
          {t('interestedJoin')}
          <Link
            href="mailto:careers@fediva.tr"
            sx={{ 
              color: 'primary.main', 
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            careers@fediva.tr
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}