import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  CircularProgress, 
  Typography, 
  Button, 
  Paper,
  Avatar, 
  Chip, 
  Alert, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton,
  Pagination,
  Stack,
  TextField,
  Autocomplete
} from '@mui/material';
import { 
  Edit, 
  Person, 
  Delete, 
  TrendingUp, 
  School,
  Add,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api, SavedScholar } from '../utils/api';
import { getSimilarityColor } from '../utils/similarity';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [savedScholars, setSavedScholars] = useState<SavedScholar[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [addingInterest, setAddingInterest] = useState(false);
  
  const [savedPage, setSavedPage] = useState(1);
  const [recsPage, setRecsPage] = useState(1);
  const [editRequests, setEditRequests] = useState<any[]>([]);
  const [editRequestsLoading, setEditRequestsLoading] = useState(false);
  const [editRequestsPage, setEditRequestsPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [scholars, recsResponse, interestsResponse, editRequestsData] = await Promise.all([
        api.getSavedScholars(),
        api.getRecommendations(user?.researchInterests),
        api.getUserInterests().catch(() => ({ interests: [] })),
        api.getMyEditRequests({ skip: 0, limit: 100 }).catch(() => []),
      ]);
      setSavedScholars(scholars);
      const interests = Array.isArray(interestsResponse) 
        ? interestsResponse 
        : (interestsResponse?.interests || []);
      setUserInterests(interests);
      
      let recs: any[] = [];
      if (Array.isArray(recsResponse)) {
        recs = recsResponse;
      } else if (recsResponse && typeof recsResponse === 'object') {
        const responseData = recsResponse as any;
        if (Array.isArray(responseData.recommendations)) {
          recs = responseData.recommendations;
        } else if (Array.isArray(responseData.data)) {
          recs = responseData.data;
        }
      }
      
      setRecommendations(recs);
      setEditRequests(editRequestsData || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableInterests = async (search: string = '') => {
    setLoadingInterests(true);
    try {
      const interests = await api.getAllResearchInterests(search || undefined);
      const filtered = interests.filter(interest => !userInterests.includes(interest));
      setAvailableInterests(filtered);
    } catch (error) {
      console.error('Failed to fetch available interests:', error);
      toast.error(t('failedToLoadInterests') || 'Failed to load available interests');
    } finally {
      setLoadingInterests(false);
    }
  };

  const handleAddInterest = async (interest: string) => {
    if (!interest || userInterests.includes(interest)) {
      return;
    }
    if (userInterests.length >= 15) {
      toast.error(t('maxInterestsReached') || 'Maximum 15 interests allowed');
      return;
    }
    setAddingInterest(true);
    try {
      await api.addUserInterest(interest);
      setUserInterests([...userInterests, interest]);
      setSearchInput('');
      setAvailableInterests([]);
      toast.success(t('interestAdded') || 'Interest added successfully');
      const updatedInterests = [...userInterests, interest].join(', ');
      const recsResponse = await api.getRecommendations(updatedInterests);
      let recs: any[] = [];
      if (Array.isArray(recsResponse)) {
        recs = recsResponse;
      } else if (recsResponse && typeof recsResponse === 'object') {
        const responseData = recsResponse as any;
        if (Array.isArray(responseData.recommendations)) {
          recs = responseData.recommendations;
        } else if (Array.isArray(responseData.data)) {
          recs = responseData.data;
        }
      }
      setRecommendations(recs);
    } catch (error: any) {
      console.error('Failed to add interest:', error);
      toast.error(t('failedToAddInterest'));
    } finally {
      setAddingInterest(false);
    }
  };

  const handleDeleteInterest = async (interest: string) => {
    try {
      await api.deleteUserInterest(interest);
      setUserInterests(userInterests.filter(i => i !== interest));
      toast.success(t('interestRemoved') || 'Interest removed successfully');
      const updatedInterests = userInterests.filter(i => i !== interest).join(', ');
      const recsResponse = await api.getRecommendations(updatedInterests);
      let recs: any[] = [];
      if (Array.isArray(recsResponse)) {
        recs = recsResponse;
      } else if (recsResponse && typeof recsResponse === 'object') {
        const responseData = recsResponse as any;
        if (Array.isArray(responseData.recommendations)) {
          recs = responseData.recommendations;
        } else if (Array.isArray(responseData.data)) {
          recs = responseData.data;
        }
      }
      setRecommendations(recs);
    } catch (error: any) {
      console.error('Failed to delete interest:', error);
      toast.error(t('failedToRemoveInterest'));
    }
  };

  const handleInterestSearch = (value: string) => {
    setSearchInput(value);
    if (value.length >= 2) {
      fetchAvailableInterests(value);
    } else if (value.length === 0) {
      setAvailableInterests([]);
    }
  };

  const handleRemoveSavedScholar = async (scholarId: string) => {
    try {
      await api.deleteSavedScholar(scholarId);
      setSavedScholars(savedScholars.filter((s) => s.scholarId !== scholarId));
      toast.success(t('scholarRemoved'));
    } catch (error) {
      toast.error(t('failedToRemoveScholar'));
    }
  };

  const paginatedScholars = savedScholars.slice(
    (savedPage - 1) * ITEMS_PER_PAGE,
    savedPage * ITEMS_PER_PAGE
  );

  const totalSavedPages = Math.ceil(savedScholars.length / ITEMS_PER_PAGE);

  const paginatedRecs = recommendations.slice(
    (recsPage - 1) * ITEMS_PER_PAGE,
    recsPage * ITEMS_PER_PAGE
  );

  const totalRecsPages = Math.ceil(recommendations.length / ITEMS_PER_PAGE);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h3">{t('dashboard')}</Typography>
        <Button
          variant="outlined"
          startIcon={<Edit />}
          onClick={() => navigate('/profile/edit')}
        >
          {t('editProfile')}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        {/* Left Column - User Info */}
        <Box sx={{ width: { xs: '100%', md: 360 }, flexShrink: 0 }}>
          <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'primary.main',
                  mb: 2,
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  boxShadow: '0 8px 16px rgba(13, 71, 161, 0.2)'
                }}
              >
                {user.name.charAt(0)}
              </Avatar>
              <Typography variant="h5" fontWeight={700} gutterBottom align="center">
                {user.name}
              </Typography>
              <Typography color="text.secondary" gutterBottom align="center" sx={{ mb: 2 }}>
                {user.email}
              </Typography>
              <Chip
                icon={<Person />}
                label={user.role === 'admin' ? t('userRoleAdmin') : t('userRoleUser')}
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Paper>

          {user.researchInterests && (
            <Paper elevation={0} sx={{ mt: 3, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 1.5 }}>
                {t('researchInterests')}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {user.researchInterests}
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Right Column - Content */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {/* Saved Scholars Section */}
          <Paper elevation={0} sx={{ mb: 3, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
              {t('savedScholars')}
            </Typography>
            
            {savedScholars.length === 0 ? (
              <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                {t('noSavedScholars')}
              </Alert>
            ) : (
              <>
                <List disablePadding>
                  {paginatedScholars.map((scholar) => (
                    <ListItem 
                      key={scholar.scholarId}
                      component="div"
                      onClick={() => navigate(`/scholar/${scholar.scholarId}`)}
                      sx={{ 
                        mb: 1.5, 
                        borderRadius: 2, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'primary.light',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          mr: 2, 
                          bgcolor: 'primary.main',
                          width: 48,
                          height: 48,
                          fontWeight: 600
                        }} 
                        src={scholar.image || undefined}
                      >
                        {!scholar.image && scholar.name.charAt(0)}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight={600}>
                            {scholar.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {scholar.institution} - {scholar.department}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {t('savedDate')} {scholar.savedAt ? new Date(scholar.savedAt).toLocaleDateString('tr-TR', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : t('na')}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSavedScholar(scholar.scholarId);
                          }}
                          sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                
                {totalSavedPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination 
                      count={totalSavedPages} 
                      page={savedPage} 
                      onChange={(_, value) => setSavedPage(value)}
                      color="primary"
                      shape="rounded"
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>

          {/* Research Interests Section */}
          <Paper elevation={0} sx={{ mb: 3, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
              {t('researchInterests')}
            </Typography>
            
            {/* Add Interest Input */}
            <Box sx={{ mb: 2 }}>
              <Autocomplete<string, false, false, true>
                freeSolo
                options={availableInterests}
                inputValue={searchInput}
                onInputChange={(_, value) => handleInterestSearch(value)}
                loading={loadingInterests}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('searchInterests') || 'Search and add research interests'}
                    placeholder={t('typeToSearch') || 'Type to search...'}
                    variant="outlined"
                    fullWidth
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchInput && searchInput.trim() && !userInterests.includes(searchInput.trim())) {
                        const inputValue = searchInput.trim();
                        e.preventDefault();
                        handleAddInterest(inputValue);
                      }
                    }}
                  />
                )}
                onChange={(_, value) => {
                  if (value && typeof value === 'string') {
                    handleAddInterest(value);
                  }
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    {option as string}
                  </Box>
                )}
                sx={{ mb: 2 }}
              />
              <Typography variant="caption" color="text.secondary">
                {t('interestsCount') || 'You can add up to 15 interests'}: {userInterests.length}/15
              </Typography>
            </Box>

            {/* Current Interests */}
            {userInterests.length === 0 ? (
              <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                {t('noInterestsAdded') || 'No research interests added yet. Search and add interests to get personalized recommendations!'}
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {userInterests.map((interest) => (
                  <Chip
                    key={interest}
                    label={interest}
                    onDelete={() => handleDeleteInterest(interest)}
                    deleteIcon={<Cancel />}
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText'
                      }
                    }}
                  />
                ))}
              </Box>
            )}
          </Paper>

          {/* Recommendations Section */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
              {t('recommendations')}
            </Typography>
            
            {recommendations.length === 0 ? (
              <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                {t('noRecommendationsAvailable')}
              </Alert>
            ) : (
              <>
                <List disablePadding>
                  {paginatedRecs.map((rec: any) => (
                    <ListItem
                      key={rec.rec_id || rec.scholar_id}
                      component="div"
                      onClick={() => navigate(`/scholar/${rec.scholar_id}`)}
                      sx={{ 
                        mb: 1.5, 
                        borderRadius: 2, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'primary.light',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          mr: 2, 
                          bgcolor: 'secondary.main',
                          width: 48,
                          height: 48,
                          fontWeight: 600
                        }}
                      >
                        {(rec.scholar_name || rec.scholar?.name || '?').charAt(0).toLocaleUpperCase(language === 'tr' ? 'tr-TR' : 'en-US')}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight={600}>
                            {rec.scholar_name || rec.scholar?.name || rec.name || t('unknownScholar')}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {rec.scholar_institution || rec.scholar?.institution || rec.institution || ''}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              {rec.similarity_score !== undefined && (
                                <Chip
                                  icon={<TrendingUp sx={{ fontSize: 16 }} />}
                                  label={`${t('match')}: ${Math.round((rec.similarity_score) * 100)}%`}
                                  size="small"
                                  color={getSimilarityColor(rec.similarity_score)}
                                  sx={{ fontWeight: 500 }}
                                />
                              )}
                              {rec.explanation?.matching_research_areas && (
                                <Chip
                                  icon={<School sx={{ fontSize: 16 }} />}
                                  label={`${rec.explanation.matching_research_areas.length} ${t('matchingAreas')}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                {totalRecsPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination 
                      count={totalRecsPages} 
                      page={recsPage} 
                      onChange={(_, value) => setRecsPage(value)}
                      color="primary"
                      shape="rounded"
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>

          {/* Edit Requests Section */}
          <Paper elevation={0} sx={{ mt: 3, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
              {t('myEditRequests')}
            </Typography>
            
            {editRequestsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : editRequests.length === 0 ? (
              <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                {t('noEditRequests')}
              </Alert>
            ) : (
              <>
                <List disablePadding>
                  {editRequests.slice((editRequestsPage - 1) * ITEMS_PER_PAGE, editRequestsPage * ITEMS_PER_PAGE).map((edit) => (
                    <ListItem
                      key={edit.request_id}
                      component="div"
                      onClick={() => navigate(`/scholar/${edit.scholar_id}`)}
                      sx={{ 
                        mb: 1.5, 
                        borderRadius: 2, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'primary.light',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {edit.scholar_id}
                            </Typography>
                            <Chip
                              label={edit.status ? t(`status${edit.status}`) : t('statusPENDING')}
                              size="small"
                              color={
                                edit.status === 'APPROVED' ? 'success' :
                                edit.status === 'REJECTED' ? 'error' : 'warning'
                              }
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {t('submittedAt')}: {edit.submitted_at 
                                ? new Date(edit.submitted_at).toLocaleString()
                                : 'N/A'}
                            </Typography>
                            {edit.status === 'REJECTED' && edit.changes_json?._rejection_reason && (
                              <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                                {t('rejectionReason')}: {edit.changes_json._rejection_reason}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                {Math.ceil(editRequests.length / ITEMS_PER_PAGE) > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination 
                      count={Math.ceil(editRequests.length / ITEMS_PER_PAGE)} 
                      page={editRequestsPage} 
                      onChange={(_, value) => setEditRequestsPage(value)}
                      color="primary"
                      shape="rounded"
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}