import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button,
  Chip,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Pagination,
  Radio,
  RadioGroup,
  FormLabel,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from '@mui/material';
import { Edit, Delete, CheckCircle, Cancel, Visibility, MergeType } from '@mui/icons-material';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/api';
import { toast } from 'sonner';
export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [scrapeLoading, setScrapeLoading] = useState<'universities' | 'departments' | 'scholars' | null>(null);
  const [scrapeConfirmDialog, setScrapeConfirmDialog] = useState<'universities' | 'departments' | 'scholars' | null>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit, setLogsLimit] = useState(50);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsTotalPages, setLogsTotalPages] = useState(0);
  const [logsFilters, setLogsFilters] = useState<{
    user_id?: string;
    action_type?: string;
  }>({});

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    role: 'USER',
    is_active: true,
    password: '',
  });

  const [pendingEdits, setPendingEdits] = useState<any[]>([]);
  const [pendingEditsLoading, setPendingEditsLoading] = useState(false);
  const [pendingEditsPage, setPendingEditsPage] = useState(1);
  const [pendingEditsLimit, setPendingEditsLimit] = useState(50);
  const [selectedEdit, setSelectedEdit] = useState<any>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [viewEditDialogOpen, setViewEditDialogOpen] = useState(false);

  const [duplicates, setDuplicates] = useState<any[][]>([]);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);
  const [duplicatesPage, setDuplicatesPage] = useState(1);
  const [duplicatesLimit] = useState(20); // 20 groups per page
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState<any[]>([]);
  const [primaryScholarId, setPrimaryScholarId] = useState<string>('');
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'admin')) {
      toast.error(t('accessDenied'));
      navigate('/');
      return;
    }
    setLoading(false);
  }, [user, navigate, t]);
  const loadSystemLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const response = await api.getSystemLogs({
        page: logsPage,
        limit: logsLimit,
        user_id: logsFilters.user_id || undefined,
        action_type: logsFilters.action_type || undefined,
      });
      setLogs(response.logs || []);
      setLogsTotal(response.total || 0);
      setLogsTotalPages(response.total_pages || 0);
    } catch (error: any) {
      console.error('Failed to load system logs:', error);
      toast.error(t('failedToLoadSystemLogs'));
    } finally {
      setLogsLoading(false);
    }
  }, [logsPage, logsLimit, logsFilters]);

  const loadPendingEdits = useCallback(async () => {
    setPendingEditsLoading(true);
    try {
      const edits = await api.getPendingEdits({
        skip: (pendingEditsPage - 1) * pendingEditsLimit,
        limit: pendingEditsLimit,
      });
      setPendingEdits(edits || []);
    } catch (error: any) {
      console.error('Failed to load pending edits:', error);
      toast.error(t('failedToLoadEdits'));
    } finally {
      setPendingEditsLoading(false);
    }
  }, [pendingEditsPage, pendingEditsLimit, t]);

  const loadDuplicates = useCallback(async () => {
    setDuplicatesLoading(true);
    try {
      const data = await api.getDuplicateScholars();
      setDuplicates(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load duplicates:', error);
      toast.error(t('failedToLoadDuplicates'));
    } finally {
      setDuplicatesLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'admin')) return;
    if (currentTab === 0) {
      loadPendingEdits();
    }
    if (currentTab === 1) {
      loadDuplicates();
    }
    if (currentTab === 2 && users.length === 0 && !usersLoading) {
      loadUsers();
    }
    if (currentTab === 3) {
      loadSystemLogs();
    }
  }, [currentTab, user, users.length, usersLoading, loadSystemLogs, loadPendingEdits, loadDuplicates]);
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error(t('failedToLoadUsers'));
    } finally {
      setUsersLoading(false);
    }
  };

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'USER',
      is_active: user.is_active,
      password: '',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      const updateData: any = {
        full_name: editForm.full_name,
        email: editForm.email,
        role: editForm.role,
        is_active: editForm.is_active,
      };
      if (editForm.password) {
        updateData.password = editForm.password;
      }
      await api.updateUser(selectedUser.user_id, updateData);
      toast.success(t('userUpdatedSuccess'));
      setEditDialogOpen(false);
      loadUsers();
    } catch (error) {
      toast.error(t('failedToUpdateUser'));
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await api.deleteUser(selectedUser.user_id);
      toast.success(t('userDeletedSuccess'));
      setDeleteDialogOpen(false);
      loadUsers();
    } catch (error) {
      toast.error(t('failedToDeleteUser'));
    }
  };

  const handleApproveEdit = async () => {
    if (!selectedEdit) return;
    try {
      await api.approveEdit(selectedEdit.request_id);
      toast.success(t('editApproved'));
      setApproveDialogOpen(false);
      setSelectedEdit(null);
      loadPendingEdits();
    } catch (error) {
      toast.error(t('failedToApproveEdit'));
    }
  };

  const handleRejectEdit = async () => {
    if (!selectedEdit || !rejectReason.trim()) {
      toast.error(t('enterRejectReason'));
      return;
    }
    try {
      await api.rejectEdit(selectedEdit.request_id, rejectReason.trim());
      toast.success(t('editRejected'));
      setRejectDialogOpen(false);
      setSelectedEdit(null);
      setRejectReason('');
      loadPendingEdits();
    } catch (error) {
      toast.error(t('failedToRejectEdit'));
    }
  };

  const handleMergeDuplicates = async () => {
    if (!primaryScholarId || selectedDuplicateGroup.length < 2) {
      toast.error(t('selectPrimaryScholar'));
      return;
    }
    
    const duplicateIds = selectedDuplicateGroup
      .filter(scholar => scholar.scholar_id !== primaryScholarId)
      .map(scholar => scholar.scholar_id);

    if (duplicateIds.length === 0) {
      toast.error(t('selectDuplicatesToMerge'));
      return;
    }

    setMerging(true);
    try {
      await api.mergeScholars(primaryScholarId, duplicateIds);
      toast.success(t('scholarsMerged'));
      setMergeDialogOpen(false);
      setSelectedDuplicateGroup([]);
      setPrimaryScholarId('');
      loadDuplicates();
    } catch (error) {
      console.error('Failed to merge scholars:', error);
      toast.error(t('failedToMergeScholars'));
    } finally {
      setMerging(false);
    }
  };

  const handleLogsFilterChange = (key: 'user_id' | 'action_type', value: string) => {
    setLogsFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setLogsPage(1); // Reset to first page when filter changes
  };

  const handleScrapeClick = (type: 'universities' | 'departments' | 'scholars') => {
    setScrapeConfirmDialog(type);
  };

  const triggerScrape = async (type: 'universities' | 'departments' | 'scholars') => {
    setScrapeConfirmDialog(null);
    setScrapeLoading(type);
    try {
      if (type === 'universities') await api.triggerScrapeAllUniversities();
      if (type === 'departments') await api.triggerScrapeAllDepartments();
      if (type === 'scholars') await api.triggerScrapeAllScholars();
      toast.success(t('scraperJobStarted'));
    } catch (error: any) {
      if (error.message === 'BACKEND_NOT_CONNECTED') {
        toast.error(t('backendNotReachable'));
      } else {
        toast.error(t('failedToTriggerScraper'));
      }
    } finally {
      setScrapeLoading(null);
    }
  };
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  if (!user || (user.role !== 'ADMIN' && user.role !== 'admin')) {
    return null;
  }
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        {t('adminPanel')}
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}>
          <Tab label={t('pendingEdits')} />
          <Tab label={t('duplicateManagement')} />
          <Tab label={t('userManagement')} />
          <Tab label={t('activityLogs')} />
          <Tab label={t('scraperJobs')} />
        </Tabs>
      </Box>
      { }
      {currentTab === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                mb: 3,
                fontWeight: 600,
                color: 'primary.main'
              }}
            >
              {t('pendingEdits')}
            </Typography>
            
            {pendingEditsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : pendingEdits.length === 0 ? (
              <Alert severity="info">{t('noEditRequests')}</Alert>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell><strong>{t('scholar')}</strong></TableCell>
                        <TableCell><strong>{t('changes')}</strong></TableCell>
                        <TableCell><strong>{t('submittedAt')}</strong></TableCell>
                        <TableCell><strong>{t('status')}</strong></TableCell>
                        <TableCell align="right"><strong>{t('actions')}</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingEdits.map((edit) => (
                        <TableRow 
                          key={edit.request_id} 
                          hover
                          sx={{
                            '&:hover': {
                              bgcolor: 'action.hover',
                            }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {edit.scholar_id || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                maxWidth: 300, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={JSON.stringify(edit.changes_json || {}, null, 2)}
                            >
                              {Object.keys(edit.changes_json || {}).length} {t('changes')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {edit.submitted_at 
                                ? new Date(edit.submitted_at).toLocaleString()
                                : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={edit.status ? t(`status${edit.status}`) : t('statusPENDING')}
                              size="small"
                              color={edit.status === 'PENDING' ? 'warning' : edit.status === 'APPROVED' ? 'success' : edit.status === 'REJECTED' ? 'error' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <IconButton 
                                size="small"
                                onClick={() => {
                                  setSelectedEdit(edit);
                                  setViewEditDialogOpen(true);
                                }}
                                sx={{ color: 'info.main' }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small"
                                onClick={() => {
                                  setSelectedEdit(edit);
                                  setApproveDialogOpen(true);
                                }}
                                sx={{ color: 'success.main' }}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small"
                                onClick={() => {
                                  setSelectedEdit(edit);
                                  setRejectReason('');
                                  setRejectDialogOpen(true);
                                }}
                                sx={{ color: 'error.main' }}
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={Math.ceil(pendingEdits.length / pendingEditsLimit)}
                    page={pendingEditsPage}
                    onChange={(_, value) => setPendingEditsPage(value)}
                    color="primary"
                  />
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      )}
      { }
      {currentTab === 1 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  color: 'primary.main'
                }}
              >
                {t('duplicateManagement')}
            </Typography>
              {selectedDuplicateGroup.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<MergeType />}
                  onClick={() => setMergeDialogOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  {t('mergeScholars')} ({selectedDuplicateGroup.length})
                </Button>
              )}
            </Box>
            
            {duplicatesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : duplicates.length === 0 ? (
              <Alert severity="info">{t('noDuplicatesFound')}</Alert>
            ) : (
              <>
                {/* Paginated duplicate groups */}
                {duplicates
                  .slice((duplicatesPage - 1) * duplicatesLimit, duplicatesPage * duplicatesLimit)
                  .map((group, groupIndex) => {
                    const globalIndex = (duplicatesPage - 1) * duplicatesLimit + groupIndex;
                    const avgSimilarity = group.length > 0 
                      ? group.reduce((sum, s) => sum + (s.similarity_score || 0), 0) / group.length 
                      : 0;
                    
                    return (
                      <Paper
                        key={globalIndex}
                        variant="outlined"
                        sx={{
                          mb: 3,
                          p: 3,
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: avgSimilarity > 0.8 ? 'error.main' : avgSimilarity > 0.6 ? 'warning.main' : 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {t('duplicateScholars')} {globalIndex + 1}
                            </Typography>
                            <Chip
                              label={`${group.length} ${t('scholars')}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            {avgSimilarity > 0 && (
                              <Chip
                                label={`${t('similarityScore')}: ${(avgSimilarity * 100).toFixed(1)}%`}
                                size="small"
                                color={avgSimilarity > 0.8 ? 'error' : avgSimilarity > 0.6 ? 'warning' : 'default'}
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              const allSelected = group.every(s => selectedDuplicateGroup.some(sel => sel.scholar_id === s.scholar_id));
                              if (allSelected) {
                                const groupScholarIds = new Set(group.map(s => s.scholar_id));
                                setSelectedDuplicateGroup(prev => prev.filter(s => !groupScholarIds.has(s.scholar_id)));
                                if (groupScholarIds.has(primaryScholarId)) {
                                  setPrimaryScholarId('');
                                }
                              } else {
                                const newSelections = group.filter(s => !selectedDuplicateGroup.some(sel => sel.scholar_id === s.scholar_id));
                                setSelectedDuplicateGroup([...selectedDuplicateGroup, ...newSelections]);
                              }
                            }}
                          >
                            {group.every(s => selectedDuplicateGroup.some(sel => sel.scholar_id === s.scholar_id))
                              ? t('deselectAll')
                              : t('selectAll')}
                          </Button>
                        </Box>
                        
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell padding="checkbox"><strong></strong></TableCell>
                                <TableCell><strong>{t('name')}</strong></TableCell>
                                <TableCell><strong>YÖK ID</strong></TableCell>
                                <TableCell><strong>{t('institution')}</strong></TableCell>
                                <TableCell><strong>{t('similarityScore')}</strong></TableCell>
                                <TableCell align="right"><strong>{t('actions')}</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {group.map((scholar, scholarIndex) => {
                                const isSelected = selectedDuplicateGroup.some(s => s.scholar_id === scholar.scholar_id);
                                return (
                                  <TableRow 
                                    key={scholar.scholar_id || `${globalIndex}-${scholarIndex}`}
                                    hover
                                    selected={isSelected}
                                    sx={{
                                      '&:hover': {
                                        bgcolor: 'action.hover',
                                      },
                                      '&.Mui-selected': {
                                        bgcolor: 'primary.light',
                                        '&:hover': {
                                          bgcolor: 'primary.main',
                                        }
                                      }
                                    }}
                                  >
                                    <TableCell padding="checkbox">
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={isSelected}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedDuplicateGroup([...selectedDuplicateGroup, scholar]);
                                              } else {
                                                setSelectedDuplicateGroup(selectedDuplicateGroup.filter(s => s.scholar_id !== scholar.scholar_id));
                                                if (primaryScholarId === scholar.scholar_id) {
                                                  setPrimaryScholarId('');
                                                }
                                              }
                                            }}
                                            size="small"
                                          />
                                        }
                                        label=""
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {scholar.full_name || 'N/A'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                        {scholar.yok_id || 'N/A'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" color="text.secondary">
                                        {scholar.institution || 'N/A'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={`${((scholar.similarity_score || 0) * 100).toFixed(1)}%`}
                                        size="small"
                                        color={scholar.similarity_score > 0.8 ? 'error' : scholar.similarity_score > 0.6 ? 'warning' : 'default'}
                                        variant="outlined"
                                        sx={{ fontWeight: 600 }}
                                      />
                                    </TableCell>
                                    <TableCell align="right">
                                      <IconButton 
                                        size="small"
                                        onClick={() => navigate(`/scholar/${scholar.scholar_id}`)}
                                        sx={{ color: 'info.main' }}
                                      >
                                        <Visibility fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    );
                  })}

                {/* Pagination */}
                {Math.ceil(duplicates.length / duplicatesLimit) > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={Math.ceil(duplicates.length / duplicatesLimit)}
                      page={duplicatesPage}
                      onChange={(_, value) => {
                        setDuplicatesPage(value);
                        setSelectedDuplicateGroup([]);
                        setPrimaryScholarId('');
                      }}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
      { }
      {currentTab === 2 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                mb: 3,
                fontWeight: 600,
                color: 'primary.main'
              }}
            >
              {t('userManagement')}
            </Typography>
            {usersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : users.length === 0 ? (
              <Alert severity="info">{t('noUsersFound')}</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell><strong>{t('name')}</strong></TableCell>
                      <TableCell><strong>{t('email')}</strong></TableCell>
                      <TableCell><strong>{t('userRole')}</strong></TableCell>
                      <TableCell><strong>{t('status')}</strong></TableCell>
                      <TableCell align="right"><strong>{t('actions')}</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                {users.map((u) => (
                      <TableRow 
                        key={u.user_id} 
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: 'action.hover',
                          }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {u.full_name || u.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {u.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.role ? (u.role === 'ADMIN' ? t('userRoleAdmin') : u.role === 'USER' ? t('userRoleUser') : u.role) : t('userRoleUser')}
                            color={u.role === 'ADMIN' ? 'primary' : 'default'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                      <Chip
                            label={u.is_active ? t('active') : t('inactive')}
                            color={u.is_active ? 'success' : 'default'}
                        size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton 
                              size="small"
                              onClick={() => handleEditClick(u)}
                              sx={{ 
                                color: 'primary.main',
                                '&:hover': {
                                  bgcolor: 'primary.light',
                                  color: 'primary.contrastText',
                                }
                              }}
                            >
                              <Edit fontSize="small" />
                        </IconButton>
                            <IconButton 
                              size="small"
                              onClick={() => handleDeleteClick(u)}
                              sx={{ 
                                color: 'error.main',
                                '&:hover': {
                                  bgcolor: 'error.light',
                                  color: 'error.contrastText',
                                }
                              }}
                            >
                              <Delete fontSize="small" />
                        </IconButton>
                    </Stack>
                        </TableCell>
                      </TableRow>
                ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Edit User Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          fontWeight: 600,
          fontSize: '1.5rem',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          {t('editUser')}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label={t('fullName')}
              fullWidth
              value={editForm.full_name}
              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <TextField
              label={t('email')}
              fullWidth
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              variant="outlined"
              disabled
              helperText={t('emailCannotBeChanged')}
              sx={{
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: 'text.secondary',
                },
              }}
            />
            <FormControl fullWidth>
              <InputLabel>{t('userRole')}</InputLabel>
              <Select
                value={editForm.role}
                label={t('userRole')}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              >
                <MenuItem value="USER">{t('userRoleUser')}</MenuItem>
                <MenuItem value="ADMIN">{t('userRoleAdmin')}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t('newPasswordOptional')}
              fullWidth
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              variant="outlined"
              helperText={t('newPasswordOptional')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <Box sx={{ 
              p: 2, 
              borderRadius: 1, 
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider'
            }}>
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    color="primary"
                />
              }
                label={<Typography sx={{ fontWeight: 500 }}>{t('isActive')}</Typography>}
            />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 2, gap: 1 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleUpdateUser} 
            variant="contained"
            sx={{ minWidth: 100 }}
          >
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          fontWeight: 600,
          fontSize: '1.5rem',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'error.main'
        }}>
          {t('deleteUser')}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('deleteUserConfirm')}
          </Alert>
          <Typography variant="body1">
            <strong>{selectedUser?.full_name || selectedUser?.email}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {selectedUser?.email}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 2, gap: 1 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained"
            sx={{ minWidth: 100 }}
          >
            {t('deleteUser')}
          </Button>
        </DialogActions>
      </Dialog>
      { }
      {currentTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              {t('systemActivityLogs')}
            </Typography>

            {/* Filters */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label={t('userIdUuid')}
                  value={logsFilters.user_id || ''}
                  onChange={(e) => handleLogsFilterChange('user_id', e.target.value)}
                  placeholder={t('filterByUserId')}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label={t('actionType')}
                  value={logsFilters.action_type || ''}
                  onChange={(e) => handleLogsFilterChange('action_type', e.target.value)}
                  placeholder={t('filterByActionType')}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('itemsPerPage')}</InputLabel>
                  <Select
                    value={logsLimit}
                    label={t('itemsPerPage')}
                    onChange={(e) => {
                      setLogsLimit(Number(e.target.value));
                      setLogsPage(1);
                    }}
                  >
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                    <MenuItem value={200}>200</MenuItem>
                    <MenuItem value={500}>500</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Logs Table */}
            {logsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : logs.length === 0 ? (
              <Alert severity="info">{t('noLogsFound')}</Alert>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>{t('timestamp')}</strong></TableCell>
                        <TableCell><strong>{t('userId')}</strong></TableCell>
                        <TableCell><strong>{t('actionType')}</strong></TableCell>
                        <TableCell><strong>{t('details')}</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.map((log, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            {log.timestamp 
                              ? new Date(log.timestamp).toLocaleString()
                              : log.created_at 
                                ? new Date(log.created_at).toLocaleString()
                                : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {log.user_id || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={log.action_type || t('unknown')} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {JSON.stringify(log.details || log, null, 2).substring(0, 100)}
                              {JSON.stringify(log.details || log, null, 2).length > 100 ? '...' : ''}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {logsTotalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Showing {((logsPage - 1) * logsLimit) + 1} - {Math.min(logsPage * logsLimit, logsTotal)} of {logsTotal}
                    </Typography>
                    <Pagination
                      count={logsTotalPages}
                      page={logsPage}
                      onChange={(_, value) => setLogsPage(value)}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
      { }
      {currentTab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('triggerScraperJobs')}
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              {t('scraperJobsDesc')}
            </Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                onClick={() => handleScrapeClick('universities')}
                disabled={scrapeLoading !== null}
              >
                {scrapeLoading === 'universities' ? t('starting') : t('scrapeUniversities')}
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleScrapeClick('departments')}
                disabled={scrapeLoading !== null}
              >
                {scrapeLoading === 'departments' ? t('starting') : t('scrapeDepartments')}
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleScrapeClick('scholars')}
                disabled={scrapeLoading !== null}
              >
                {scrapeLoading === 'scholars' ? t('starting') : t('scrapeScholars')}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* View Edit Dialog */}
      <Dialog 
        open={viewEditDialogOpen} 
        onClose={() => {
          setViewEditDialogOpen(false);
          setSelectedEdit(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {t('viewDetails')}
        </DialogTitle>
        <DialogContent>
          {selectedEdit && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>{t('scholars')}:</strong> {selectedEdit.scholar_id}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>{t('submittedAt')}:</strong> {
                  selectedEdit.submitted_at 
                    ? new Date(selectedEdit.submitted_at).toLocaleString()
                    : 'N/A'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>{t('status')}:</strong> {selectedEdit.status ? t(`status${selectedEdit.status}`) : t('statusPENDING')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  {t('changes')}:
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50',
                    maxHeight: 400,
                    overflow: 'auto'
                  }}
                >
                  <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                    {JSON.stringify(selectedEdit.changes_json || {}, null, 2)}
                  </pre>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => {
            setViewEditDialogOpen(false);
            setSelectedEdit(null);
          }}>
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Edit Dialog */}
      <Dialog 
        open={approveDialogOpen} 
        onClose={() => {
          setApproveDialogOpen(false);
          setSelectedEdit(null);
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: 'success.main' }}>
          {t('approve')} {t('editRequests')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bu düzenleme isteğini onaylamak istediğinizden emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => {
            setApproveDialogOpen(false);
            setSelectedEdit(null);
          }}>
            {t('cancel')}
          </Button>
          <Button onClick={handleApproveEdit} variant="contained" color="success">
            {t('approve')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Edit Dialog */}
      <Dialog 
        open={rejectDialogOpen} 
        onClose={() => {
          setRejectDialogOpen(false);
          setSelectedEdit(null);
          setRejectReason('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>
          {t('reject')} {t('editRequests')}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('rejectReason')}
            placeholder={t('enterRejectReason')}
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => {
            setRejectDialogOpen(false);
            setSelectedEdit(null);
            setRejectReason('');
          }}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleRejectEdit} 
            variant="contained" 
            color="error"
            disabled={!rejectReason.trim()}
          >
            {t('reject')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Merge Scholars Dialog */}
      <Dialog 
        open={mergeDialogOpen} 
        onClose={() => {
          setMergeDialogOpen(false);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: 'primary.main' }}>
          {t('mergeScholars')}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            {t('mergeConfirmation')}
          </Alert>
          
          <Box sx={{ mb: 3 }}>
            <FormLabel sx={{ fontWeight: 600, mb: 2, display: 'block' }}>
              {t('selectPrimaryScholar')}
            </FormLabel>
            <RadioGroup
              value={primaryScholarId}
              onChange={(e) => setPrimaryScholarId(e.target.value)}
            >
              {selectedDuplicateGroup.map((scholar) => (
                <Box
                  key={scholar.scholar_id}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: '1px solid',
                    borderColor: primaryScholarId === scholar.scholar_id ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: primaryScholarId === scholar.scholar_id ? 'primary.light' : 'grey.50',
                  }}
                >
                  <FormControlLabel
                    value={scholar.scholar_id}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {scholar.full_name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {scholar.institution || 'N/A'} • YÖK ID: {scholar.yok_id || 'N/A'}
                        </Typography>
                        {scholar.similarity_score !== undefined && (
                          <Chip
                            label={`${t('similarityScore')}: ${((scholar.similarity_score) * 100).toFixed(1)}%`}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </Box>
              ))}
            </RadioGroup>
          </Box>

          {primaryScholarId && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>{t('duplicatesToMerge')}:</strong>
              </Typography>
              <List>
                {selectedDuplicateGroup
                  .filter(scholar => scholar.scholar_id !== primaryScholarId)
                  .map((scholar) => (
                    <ListItem key={scholar.scholar_id} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={scholar.full_name || 'N/A'}
                        secondary={`${scholar.institution || 'N/A'} • YÖK ID: ${scholar.yok_id || 'N/A'}`}
                      />
                    </ListItem>
                  ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => {
              setMergeDialogOpen(false);
            }}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleMergeDuplicates}
            variant="contained"
            color="primary"
            disabled={!primaryScholarId || selectedDuplicateGroup.length < 2 || merging}
          >
            {merging ? t('saving') : t('merge')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scrape Confirmation Dialogs */}
      <Dialog 
        open={scrapeConfirmDialog === 'universities'} 
        onClose={() => setScrapeConfirmDialog(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          fontWeight: 600,
          fontSize: '1.5rem',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'warning.main'
        }}>
          {t('confirmScrapeUniversities')}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('scrapeUniversitiesConfirm')}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 2, gap: 1 }}>
          <Button 
            onClick={() => setScrapeConfirmDialog(null)}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={() => triggerScrape('universities')} 
            variant="contained"
            color="warning"
            sx={{ minWidth: 100 }}
          >
            {t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={scrapeConfirmDialog === 'departments'} 
        onClose={() => setScrapeConfirmDialog(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          fontWeight: 600,
          fontSize: '1.5rem',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'warning.main'
        }}>
          {t('confirmScrapeDepartments')}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('scrapeDepartmentsConfirm')}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 2, gap: 1 }}>
          <Button 
            onClick={() => setScrapeConfirmDialog(null)}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={() => triggerScrape('departments')} 
            variant="contained"
            color="warning"
            sx={{ minWidth: 100 }}
          >
            {t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={scrapeConfirmDialog === 'scholars'} 
        onClose={() => setScrapeConfirmDialog(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          fontWeight: 600,
          fontSize: '1.5rem',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'warning.main'
        }}>
          {t('confirmScrapeScholars')}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('scrapeScholarsConfirm')}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 2, gap: 1 }}>
          <Button 
            onClick={() => setScrapeConfirmDialog(null)}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={() => triggerScrape('scholars')} 
            variant="contained"
            color="warning"
            sx={{ minWidth: 100 }}
          >
            {t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}