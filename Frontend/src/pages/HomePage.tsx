import { Box, Container, Typography, TextField, Button, InputAdornment, Chip } from '@mui/material';
import { Search as SearchIcon, TrendingUp, People, School, Article, LocationOn } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/api';
export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  const [popularTopics, setPopularTopics] = useState<string[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const data = await api.getMostPublicationsUniversities(6);
        if (data && Array.isArray(data)) {
          setInstitutions(data);
        }
      } catch (error) {
        console.error('Failed to fetch top institutions:', error);
      }
    };
    fetchInstitutions();
  }, []);

  useEffect(() => {
    const fetchPopularTopics = async () => {
      try {
        const data = await api.getAllResearchInterests(undefined, 10);
        if (data && Array.isArray(data)) {
          setPopularTopics(data);
        }
      } catch (error) {
        console.error('Failed to fetch popular topics:', error);
        setPopularTopics([]);
      }
    };
    fetchPopularTopics();
  }, []);

  return (
    <Box>
      { }
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)',
          color: 'white',
          py: 12,
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          }
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700, textAlign: 'center', mb: 2 }}
          >
            {t('findSupervisor')}
          </Typography>
          <Typography
            variant="h5"
            sx={{ textAlign: 'center', mb: 5, opacity: 0.95, fontWeight: 300 }}
          >
            {t('discoverAndConnect')}
          </Typography>
          { }
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{
                bgcolor: 'white',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              size="large"
              onClick={handleSearch}
              sx={{
                bgcolor: '#00B0FF',
                color: 'white',
                px: 4,
                '&:hover': {
                  bgcolor: '#0091EA',
                },
                whiteSpace: 'nowrap',
                minWidth: 'fit-content',
              }}
            >
              {t('searchButton')}
            </Button>
          </Box>
          { }
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 2,
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              p: 3,
              borderRadius: 2,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <People sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                100K+
              </Typography>
              <Typography variant="body2">{t('scholars')}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <School sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                200+
              </Typography>
              <Typography variant="body2">{t('institutions')}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Article sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                2M+
              </Typography>
              <Typography variant="body2">{t('publications')}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {t('daily')}
              </Typography>
              <Typography variant="body2">{t('updates')}</Typography>
            </Box>
          </Box>
        </Container>
      </Box>
      { }
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 4, textAlign: 'center', fontWeight: 600 }}>
          {t('popularTopics')}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          {popularTopics.length > 0 ? (
            popularTopics.map((topic) => (
              <Chip
                key={topic}
                label={topic}
                onClick={() => navigate(`/search?interests=${encodeURIComponent(topic)}`)}
                sx={{
                  fontSize: '1rem',
                  py: 2.5,
                  px: 1,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              Loading popular topics...
            </Typography>
          )}
        </Box>
      </Container>
      { }
      <Box sx={{ bgcolor: '#f8f9fa', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" gutterBottom sx={{ mb: 4, textAlign: 'center', fontWeight: 600 }}>
            {t('topInstitutions')}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {institutions.map((institution) => (
              <Box
                key={institution.university_id || institution.name}
                onClick={() => navigate(`/search?university_id=${institution.university_id}`)}
                sx={{
                  p: 3,
                  bgcolor: 'white',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
                    transform: 'translateY(-4px)',
                    borderColor: 'primary.main',
                    '& .hover-arrow': {
                      transform: 'translateX(4px)',
                      opacity: 1,
                    }
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'primary.50', 
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <School sx={{ fontSize: 32 }} />
                  </Box>
                  {institution.publication_count > 0 && (
                    <Chip 
                      label={institution.publication_count >= 1000 
                        ? `${(institution.publication_count / 1000).toFixed(1)}K+` 
                        : institution.publication_count.toString()}
                      size="small"
                      sx={{ 
                        fontWeight: 600, 
                        bgcolor: 'primary.main', 
                        color: 'white',
                        border: 'none',
                        '& .MuiChip-icon': {
                          color: 'inherit'
                        }
                      }}
                      icon={<Article sx={{ fontSize: '14px !important' }} />}
                    />
                  )}
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, lineHeight: 1.3, mb: 1 }}>
                    {institution.name}
                  </Typography>

                  {institution.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0, color: 'text.secondary' }}>
                      <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {institution.location}
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ mt: 2, pt: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 600, fontSize: '0.9rem' }}>
                    {t('exploreResearchers')}
                    <Box 
                      className="hover-arrow" 
                      component="span" 
                      sx={{ 
                        ml: 1, 
                        display: 'inline-flex', 
                        transition: 'all 0.2s', 
                        opacity: 0.6 
                      }}
                    >
                      →
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>
      { }
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 6, textAlign: 'center', fontWeight: 600 }}>
          {t('platformFeatures')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#E3F2FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 3,
              }}
            >
              <Typography sx={{ fontSize: '3rem' }}>🔍</Typography>
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {t('advancedSearch')}
            </Typography>
            <Typography color="text.secondary">
              {t('advancedSearchDesc')}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#E3F2FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 3,
              }}
            >
              <Typography sx={{ fontSize: '3rem' }}>🤝</Typography>
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {t('collaborationNetworks')}
            </Typography>
            <Typography color="text.secondary">
              {t('collaborationNetworksDesc')}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#E3F2FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 3,
              }}
            >
              <Typography sx={{ fontSize: '3rem' }}>🎯</Typography>
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {t('aiRecommendations')}
            </Typography>
            <Typography color="text.secondary">
              {t('aiRecommendationsDesc')}
            </Typography>
          </Box>
        </Box>
      </Container>
      { }
      <Box sx={{ bgcolor: '#0D47A1', color: 'white', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
            {t('startJourney')}
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            {t('joinThousands')}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/search')}
            sx={{
              bgcolor: 'white',
              color: '#0D47A1',
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              '&:hover': {
                bgcolor: '#f5f5f5',
              },
            }}
          >
            {t('exploreScholars')}
          </Button>
        </Container>
      </Box>
    </Box>
  );
}