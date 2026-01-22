import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Pagination,
  Avatar,
  CircularProgress,
  Alert,
  Autocomplete,
  useTheme,
  useMediaQuery,
  Paper,
  InputAdornment,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  Search, 
  Clear, 
  BookmarkBorder, 
  Bookmark, 
  FilterList, 
  School, 
  Business, 
  Person,
  Article,
  FormatQuote,
  TrendingUp,
  ArrowForward,
  Save,
  Delete,
  Edit,
  History
} from '@mui/icons-material';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { toast } from 'sonner';
interface Scholar {
  id: string;
  name: string;
  title: string;
  institution: string;
  department: string;
  researchInterests: string[];
  hIndex: number;
  citationCount: number;
  publicationCount: number;
  availability: string;
  email: string;
  image?: string | null;
}
export default function SearchResults() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [institution, setInstitution] = useState('');
  const [universityId, setUniversityId] = useState<string>('');
  const [department, setDepartment] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [academicTitle, setAcademicTitle] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [page, setPage] = useState(1);
  const [savedScholarIds, setSavedScholarIds] = useState<Set<string>>(new Set());
  const [backendConnected, setBackendConnected] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [universities, setUniversities] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(false);
  const [interestsSearchInput, setInterestsSearchInput] = useState('');
  
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [savedSearchesLoading, setSavedSearchesLoading] = useState(false);
  const [saveSearchDialogOpen, setSaveSearchDialogOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [editingSearchId, setEditingSearchId] = useState<string | null>(null);
  const [editSearchDialogOpen, setEditSearchDialogOpen] = useState(false);
  const [editSearchName, setEditSearchName] = useState('');
  const [isLoadingSavedSearch, setIsLoadingSavedSearch] = useState(false);
  const fetchScholarsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const theme = useTheme();
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));
  const isSm = useMediaQuery(theme.breakpoints.up('sm'));
  const columns = isXl ? 3 : (isSm ? 2 : 1);
  const itemsPerPage = columns * 5;

  useEffect(() => {
    const fetchTitles = async () => {
      try {
        const data = await api.getScholarTitles();
        setTitles(data || []);
      } catch (error) {
        console.error('Failed to fetch titles:', error);
      }
    };
    fetchTitles();
  }, []);

  useEffect(() => {
    const fetchAllInterests = async () => {
      setInterestsLoading(true);
      try {
        const data = await api.getAllResearchInterests();
        setAvailableInterests(data || []);
      } catch (error) {
        console.error('Failed to fetch research interests:', error);
      } finally {
        setInterestsLoading(false);
      }
    };
    fetchAllInterests();
  }, []);

  useEffect(() => {
    if (interestsSearchInput.length < 2) {
      return;
    }
    
    const fetchInterests = async () => {
      setInterestsLoading(true);
      try {
        const data = await api.getAllResearchInterests(interestsSearchInput);
        setAvailableInterests(data || []);
      } catch (error) {
        console.error('Failed to fetch research interests:', error);
      } finally {
        setInterestsLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(() => {
      fetchInterests();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [interestsSearchInput]);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const data = await api.getUniversities();
        setUniversities(data || []);
      } catch (error) {
        console.error('Failed to fetch universities:', error);
      }
    };
    fetchUniversities();
  }, []);
  useEffect(() => {
    const fetchDepartments = async () => {
      let targetUniId = universityId;

      if (!targetUniId && institution) {
        const selectedUni = universities.find(u => u.name === institution);
        if (selectedUni) {
          targetUniId = selectedUni.university_id;
        }
      }

      if (targetUniId) {
        try {
          const data = await api.getUniversityDepartments(targetUniId);
          setDepartments(data || []);
        } catch (error) {
          console.error('Failed to fetch departments:', error);
          setDepartments([]);
        }
      } else {
        setDepartments([]);
      }
    };
    
    if (universityId || institution) {
      fetchDepartments();
    } else {
      setDepartments([]);
    }
  }, [institution, universityId, universities]);

  useEffect(() => {
    const fetchSaved = async () => {
      if (user) {
        try {
          const saved = await api.getSavedScholars();
          setSavedScholarIds(new Set(saved.map((s) => s.scholarId)));
        } catch (error) {
          console.error('Failed to fetch saved scholars:', error);
        }
      } else {
        setSavedScholarIds(new Set());
      }
    };
    fetchSaved();
  }, [user]);

  useEffect(() => {
    const fetchSavedSearches = async () => {
      if (user) {
        setSavedSearchesLoading(true);
        try {
          const searches = await api.getSavedSearches({ skip: 0, limit: 100 });
          setSavedSearches(searches || []);
        } catch (error) {
          console.error('Failed to fetch saved searches:', error);
        } finally {
          setSavedSearchesLoading(false);
        }
      } else {
        setSavedSearches([]);
      }
    };
    fetchSavedSearches();
  }, [user]);

  useEffect(() => {
    const uniId = searchParams.get('university_id');
    if (uniId && universities.length > 0) {
      const uni = universities.find(u => u.university_id === uniId);
      if (uni) {
        setUniversityId(uniId);
        setInstitution(uni.name);
      }
    } else if (!uniId) {
      const inst = searchParams.get('institution');
      if (!inst) {
        setUniversityId('');
      }
    }
  }, [universities, searchParams]);

  const fetchScholars = async (overrideParams: any = {}) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const searchInst = overrideParams.institution ?? institution;
      const searchDept = overrideParams.department ?? department;
      let universityId = overrideParams.university_id;
      let departmentId = undefined;

      if (!universityId && searchInst && universities.length > 0) {
        const uni = universities.find((u: any) => u.name === searchInst);
        if (uni) universityId = uni.university_id;
      }

      if (searchDept && departments.length > 0) {
        const dept = departments.find((d: any) => d.name === searchDept);
        if (dept) departmentId = dept.department_id;
      }

      const params: any = {
        search: overrideParams.search ?? searchQuery,
        title: overrideParams.title ?? academicTitle,
        page: overrideParams.page ?? page,
        limit: itemsPerPage,
        sortBy: overrideParams.sortBy ?? sortBy,
      };

      if (overrideParams.researchInterests !== undefined) {
        if (Array.isArray(overrideParams.researchInterests) && overrideParams.researchInterests.length > 0) {
          params.interests = overrideParams.researchInterests.join(',');
        } else if (typeof overrideParams.researchInterests === 'string' && overrideParams.researchInterests) {
          params.interests = overrideParams.researchInterests;
        }
      } else if (researchInterests.length > 0) {
        params.interests = researchInterests.join(',');
      }

      if (universityId) {
        params.university_id = universityId;
      } else {
        params.institution = searchInst;
      }
      if (departmentId) {
        params.department_id = departmentId;
      } else {
        params.department = searchDept;
      }
      const result = await api.getScholars(params);
      setScholars(result.scholars);
      setTotal(result.total);
      setBackendConnected(true);
    } catch (error: any) {
      if (error.message === 'BACKEND_NOT_CONNECTED') {
        setBackendConnected(false);
        setScholars([]);
        setTotal(0);
      } else {
        console.error('Failed to fetch scholars:', error);
        toast.error(t('failedToLoadScholars'));
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [searchParams]);

  useEffect(() => {
    if (departments.length > 0 && department) {
      const selectedDept = departments.find(d => d.name === department || d.name.toLowerCase() === department.toLowerCase());
      if (selectedDept) {
        setDepartmentId(selectedDept.department_id);
      }
    }
  }, [departments, department]);

  useEffect(() => {
    const q = searchParams.get('q');
    const inst = searchParams.get('institution');
    const uniId = searchParams.get('university_id');
    const dept = searchParams.get('department');
    const title = searchParams.get('title');
    const sort = searchParams.get('sort');
    const p = searchParams.get('page');
    const interests = searchParams.get('interests');
    
    if (q !== null || inst !== null || dept !== null || title !== null || sort !== null || uniId !== null || interests !== null) {
      const interestsArray = interests ? interests.split(',').filter(i => i.trim()) : [];
      const pageNum = p ? parseInt(p) : 1;
      
      if (!uniId || universities.length > 0) {
        const timeoutId = setTimeout(() => {
          setSearchQuery(q || '');
          setDepartment(dept || '');
          
          setAcademicTitle(title || '');
          setSortBy(sort || 'name_asc');
          setPage(pageNum);
          setResearchInterests(prev => {
            if (JSON.stringify(prev) === JSON.stringify(interestsArray)) return prev;
            return interestsArray;
          });
          
          if (uniId) {
            setUniversityId(uniId);
            if (universities.length > 0) {
              const uni = universities.find(u => u.university_id === uniId);
              if (uni) {
                setInstitution(uni.name);
              }
            }
          } else if (inst) {
            setUniversityId('');
            setInstitution(inst);
          } else {
            setUniversityId('');
            setInstitution('');
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [searchParams, universities, isLoadingSavedSearch]);
  useEffect(() => {
    const hasCriteria = searchQuery || department || academicTitle || universityId || institution || researchInterests.length > 0;
    
    if ((hasSearched || hasCriteria) && !isLoadingSavedSearch) {
      if (fetchScholarsTimeoutRef.current) {
        clearTimeout(fetchScholarsTimeoutRef.current);
      }
      
      fetchScholarsTimeoutRef.current = setTimeout(() => {
        fetchScholars();
        const params: any = {
          q: searchQuery,
          department,
          title: academicTitle,
          sort: sortBy,
          page: page.toString(),
        };
        if (researchInterests.length > 0) {
          params.interests = researchInterests.join(',');
        }
        if (universityId) {
          params.university_id = universityId;
        } else if (institution) {
          params.institution = institution;
        }
        setSearchParams(params);
        fetchScholarsTimeoutRef.current = null;
      }, 100);

      return () => {
        if (fetchScholarsTimeoutRef.current) {
          clearTimeout(fetchScholarsTimeoutRef.current);
          fetchScholarsTimeoutRef.current = null;
        }
      };
    }
  }, [page, itemsPerPage, sortBy, researchInterests, universityId, departmentId, isLoadingSavedSearch, searchQuery, academicTitle]);
  const handleSearch = () => {
    setPage(1);
    const params: any = {
      q: searchQuery,
      department,
      title: academicTitle,
      sort: sortBy,
      page: '1',
    };
    if (researchInterests.length > 0) {
      params.interests = researchInterests.join(',');
    }
    if (universityId) {
      params.university_id = universityId;
    } else if (institution) {
      params.institution = institution;
    }
    setSearchParams(params);
    fetchScholars({ page: 1, researchInterests });
  };
  const handleClearFilters = () => {
    setInstitution('');
    setUniversityId('');
    setDepartment('');
    setAcademicTitle('');
    setSearchQuery('');
    setResearchInterests([]);
    setSortBy('name_asc');
    setPage(1);
    setSearchParams({});
    fetchScholars({
      search: '',
      institution: '',
      department: '',
      sortBy: 'name_asc',
      page: 1,
      researchInterests: [],
    });
  };
  const handleSaveScholar = async (scholarId: string) => {
    if (!user) {
      toast.error(t('loginToSave'));
      return;
    }

    const isSaved = savedScholarIds.has(scholarId);
    const newSaved = new Set(savedScholarIds);
    
    if (isSaved) {
      newSaved.delete(scholarId);
    } else {
      newSaved.add(scholarId);
    }
    setSavedScholarIds(newSaved);

    try {
      if (isSaved) {
        await api.deleteSavedScholar(scholarId);
        toast.success(t('scholarRemoved'));
      } else {
        await api.saveScholar(scholarId);
        toast.success(t('scholarSaved'));
      }
    } catch (error) {
      console.error('Failed to update saved scholar:', error);
      toast.error(t('failedToUpdateSavedStatus'));
      setSavedScholarIds(savedScholarIds);
    }
  };

  const handleSaveSearch = () => {
    if (!user) {
      toast.error(t('loginToSave'));
      return;
    }
    if (!hasSearched) {
      toast.error(t('pleasePerformSearch'));
      return;
    }
    setSaveSearchName('');
    setSaveSearchDialogOpen(true);
  };

  const handleConfirmSaveSearch = async () => {
    if (!saveSearchName.trim()) {
      toast.error(t('searchNameRequired'));
      return;
    }
    if (!user || !hasSearched) return;

    try {
      const queryParams: any = {};
      if (searchQuery) queryParams.search = searchQuery;
      if (department) queryParams.department = department;
      if (academicTitle) queryParams.title = academicTitle;
      if (sortBy) queryParams.sortBy = sortBy;
      if (researchInterests.length > 0) queryParams.interests = researchInterests.join(',');
      
      if (universityId) {
        queryParams.university_id = universityId;
      } else if (institution) {
        queryParams.institution = institution;
      }
      
      if (departments.length > 0) {
        const selectedDept = departments.find((d: any) => d.name === department);
        if (selectedDept) {
          queryParams.department_id = selectedDept.department_id;
        }
      }

      await api.createSavedSearch({
        name: saveSearchName.trim(),
        query_params: queryParams,
        result_snapshot: total,
      });
      
      toast.success(t('searchSaved'));
      setSaveSearchDialogOpen(false);
      setSaveSearchName('');
      
      const searches = await api.getSavedSearches({ skip: 0, limit: 100 });
      setSavedSearches(searches || []);
    } catch (error) {
      console.error('Failed to save search:', error);
      toast.error(t('failedToSaveSearch'));
    }
  };

  const handleLoadSavedSearch = async (search: any) => {
    try {
      setIsLoadingSavedSearch(true);
      const queryParams = search.query_params || {};
      
      const interestsArray = queryParams.interests
        ? (typeof queryParams.interests === 'string' 
            ? queryParams.interests.split(',').filter((i: string) => i.trim())
            : queryParams.interests)
        : [];
      
      const params: any = {
        q: queryParams.search || '',
        department: queryParams.department || '',
        title: queryParams.title || '',
        sort: queryParams.sortBy || 'name_asc',
        page: '1',
      };
      if (interestsArray.length > 0) {
        params.interests = typeof queryParams.interests === 'string' 
          ? queryParams.interests 
          : interestsArray.join(',');
      }
      if (queryParams.university_id) {
        params.university_id = queryParams.university_id;
      } else if (queryParams.institution) {
        params.institution = queryParams.institution;
      }
      
      setSearchParams(params);
      
      setTimeout(() => {
        setIsLoadingSavedSearch(false);
      }, 200);
      
      window.scrollTo(0, 0);
    } catch (error) {
      setIsLoadingSavedSearch(false);
      console.error('Failed to load saved search:', error);
      toast.error(t('failedToLoadSavedSearch'));
    }
  };

  const handleDeleteSavedSearch = async (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    try {
      await api.deleteSavedSearch(searchId);
      toast.success(t('searchDeleted'));
      const searches = await api.getSavedSearches({ skip: 0, limit: 100 });
      setSavedSearches(searches || []);
    } catch (error) {
      console.error('Failed to delete saved search:', error);
      toast.error(t('failedToDeleteSearch'));
    }
  };

  const handleEditSavedSearch = (search: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSearchId(search.search_id);
    setEditSearchName(search.name || '');
    setEditSearchDialogOpen(true);
  };

  const handleConfirmEditSearch = async () => {
    if (!editSearchName.trim() || !editingSearchId) {
      toast.error(t('searchNameRequired'));
      return;
    }
    
    try {
      await api.updateSavedSearch(editingSearchId, {
        name: editSearchName.trim(),
      });
      toast.success(t('profileUpdatedSuccess'));
      setEditSearchDialogOpen(false);
      setEditingSearchId(null);
      setEditSearchName('');
      
      const searches = await api.getSavedSearches({ skip: 0, limit: 100 });
      setSavedSearches(searches || []);
    } catch (error) {
      console.error('Failed to update saved search:', error);
      toast.error(t('failedToSaveSearch'));
    }
  };
  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)', bgcolor: '#f8f9fa' }}>
      { }
      <Box
        sx={{
          width: 340,
          p: 3,
          position: 'sticky',
          top: 64,
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
          display: { xs: 'none', md: 'block' }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <FilterList color="primary" />
            <Typography variant="h6" fontWeight={700}>
              {t('search')}
            </Typography>
          </Box>

          <Stack spacing={2.5}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 2,
                  bgcolor: 'grey.50',
                  '& fieldset': { borderColor: 'grey.200' },
                  '&:hover fieldset': { borderColor: 'grey.300' },
                } 
              }}
            />

            <FormControl fullWidth size="small">
              <Autocomplete
                freeSolo
                size="small"
                options={universities.map((u) => u.name)}
                value={institution}
                onChange={(_, newValue) => {
                  setInstitution(newValue || '');
                  const selectedUni = universities.find(u => u.name === newValue);
                  if (selectedUni) {
                    setUniversityId(selectedUni.university_id);
                  } else {
                    setUniversityId('');
                  }
                }}
                onInputChange={(_, newInputValue) => {
                  setInstitution(newInputValue);
                  const selectedUni = universities.find(u => u.name === newInputValue);
                  if (selectedUni) {
                    setUniversityId(selectedUni.university_id);
                  } else {
                    setUniversityId('');
                  }
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label={t('institution')} 
                    fullWidth 
                    sx={{ 
                      '& .MuiOutlinedInput-root': { borderRadius: 2 } 
                    }}
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth size="small">
              <Autocomplete
                freeSolo
                size="small"
                disabled={!departments.length}
                options={departments.map((d) => d.name)}
                value={department}
                onChange={(_, newValue) => {
                  setDepartment(newValue || '');
                  const selectedDept = departments.find(d => d.name === newValue);
                  if (selectedDept) {
                    setDepartmentId(selectedDept.department_id);
                  } else {
                    setDepartmentId('');
                  }
                }}
                onInputChange={(_, newInputValue) => {
                  setDepartment(newInputValue);
                  const selectedDept = departments.find(d => d.name === newInputValue);
                  if (selectedDept) {
                    setDepartmentId(selectedDept.department_id);
                  } else {
                    setDepartmentId('');
                  }
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label={t('department')} 
                    fullWidth
                    sx={{ 
                      '& .MuiOutlinedInput-root': { borderRadius: 2 } 
                    }}
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>{t('academicTitle')}</InputLabel>
              <Select
                value={academicTitle}
                onChange={(e) => setAcademicTitle(e.target.value)}
                label={t('academicTitle')}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">{t('allTitles')}</MenuItem>
                {titles.map((title) => (
                  <MenuItem key={title} value={title}>
                    {title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <Autocomplete
                multiple
                size="small"
                options={availableInterests}
                value={researchInterests}
                onChange={(_, newValue) => {
                  setResearchInterests(newValue);
                }}
                inputValue={interestsSearchInput}
                onInputChange={(_, newInputValue) => {
                  setInterestsSearchInput(newInputValue);
                }}
                loading={interestsLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('researchInterests')}
                    placeholder={t('typeToSearch') || 'Type to search...'}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { borderRadius: 2 } 
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option}
                      label={option}
                      size="small"
                      sx={{ 
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '& .MuiChip-deleteIcon': {
                          color: 'primary.contrastText'
                        }
                      }}
                    />
                  ))
                }
              />
            </FormControl>

            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSearch}
                disabled={loading}
                size="large"
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                }}
              >
                {t('search')}
              </Button>
              {user && hasSearched && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleSaveSearch}
                  disabled={loading}
                  startIcon={<Save />}
                  sx={{ 
                    borderRadius: 2, 
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  {t('saveSearch')}
                </Button>
              )}
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                onClick={handleClearFilters}
                disabled={loading}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none',
                  color: 'text.secondary',
                  bgcolor: 'grey.100',
                  borderColor: 'grey.300',
                  '&:hover': { bgcolor: 'grey.200', borderColor: 'grey.400' }
                }}
              >
                {t('clearFilters')}
              </Button>
            </Box>

            {/* Saved Searches Section */}
            {user && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <History color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={600}>
                    {t('savedSearches')}
                  </Typography>
                </Box>
                {savedSearchesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : savedSearches.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    {t('noSavedSearches')}
                  </Typography>
                ) : (
                  <List disablePadding>
                    {savedSearches.map((search) => (
                      <ListItem
                        key={search.search_id}
                        component="button"
                        onClick={() => handleLoadSavedSearch(search)}
                        sx={{
                          mb: 1,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            borderColor: 'primary.light',
                          }
                        }}
                      >
                        <ListItemText
                          primary={search.name}
                          secondary={
                            search.result_snapshot 
                              ? `${search.result_snapshot} results`
                              : new Date(search.created_at).toLocaleDateString()
                          }
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption',
                          }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => handleEditSavedSearch(search, e)}
                            sx={{ mr: 0.5 }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => handleDeleteSavedSearch(search.search_id, e)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </>
            )}
          </Stack>
        </Paper>
      </Box>

      { }
      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, width: { md: 'calc(100% - 340px)' } }}>
        <Box sx={{ width: '100%' }}>
          { }
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: 'text.primary' }}>
                {t('searchResults')}
              </Typography>
              {!loading && (
                <Typography variant="body1" color="text.secondary">
                  {total > 0 ? (
                    <><Box component="span" fontWeight={600} color="primary.main">{total}</Box> {t('scholarsFound')}</>
                  ) : t('noResults')}
                </Typography>
              )}
            </Box>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>{t('sortBy')}</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label={t('sortBy')}
                sx={{ borderRadius: 2, bgcolor: 'white' }}
              >
                <MenuItem value="name_asc">{t('nameAsc')}</MenuItem>
                <MenuItem value="name_desc">{t('nameDesc')}</MenuItem>
                <MenuItem value="publications">{t('publicationCount')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          { }
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : !hasSearched ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('enterSearchCriteria')}
            </Alert>
          ) : !backendConnected ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>{t('backendNotConnected')}</Typography>
              <Typography paragraph>
                {t('backendErrorDesc')}
              </Typography>
            </Alert>
          ) : scholars.length === 0 ? (
            <Alert severity="info">
              {t('noScholarsFound')}
            </Alert>
          ) : (
            <>
              { }
              { }
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr', 
                    sm: '1fr 1fr', 
                    md: '1fr 1fr', 
                    lg: '1fr 1fr', 
                    xl: '1fr 1fr 1fr', 
                  },
                  gap: 3, 
                }}
              >
                {scholars.map((scholar) => (
                  <Card
                    key={scholar.id}
                    elevation={0}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.15)',
                        borderColor: 'primary.light'
                      },
                      height: '100%', 
                    }}
                    onClick={() => navigate(`/scholar/${scholar.id}`)}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Avatar
                          src={scholar.image}
                          sx={{ 
                            width: 64, 
                            height: 64, 
                            bgcolor: 'primary.main',
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(13, 71, 161, 0.2)'
                          }}
                        >
                          {!scholar.image && scholar.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="subtitle1" fontWeight={700} noWrap title={scholar.name} sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                              {scholar.name}
                            </Typography>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveScholar(scholar.id);
                              }}
                              sx={{ 
                                minWidth: 32, 
                                width: 32, 
                                height: 32, 
                                borderRadius: '50%',
                                p: 0,
                                ml: 1,
                                color: savedScholarIds.has(scholar.id) ? 'primary.main' : 'action.active'
                              }}
                            >
                              {savedScholarIds.has(scholar.id) ? <Bookmark /> : <BookmarkBorder />}
                            </Button>
                          </Box>
                          <Typography variant="body2" color="primary.main" fontWeight={500} gutterBottom>
                            {scholar.title}
                          </Typography>
                        </Box>
                      </Box>

                      <Stack spacing={1} mb={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <School sx={{ fontSize: 18 }} />
                          <Typography variant="body2" noWrap title={scholar.institution}>
                            {scholar.institution}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <Business sx={{ fontSize: 18 }} />
                          <Typography variant="body2" noWrap title={scholar.department}>
                            {scholar.department}
                          </Typography>
                        </Box>
                      </Stack>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
                        {scholar.researchInterests?.slice(0, 3).map((interest, idx) => (
                          <Chip 
                            key={idx} 
                            label={interest} 
                            size="small" 
                            sx={{ 
                              bgcolor: 'grey.100',
                              color: 'text.primary',
                              borderRadius: 1.5,
                              fontWeight: 500
                            }} 
                          />
                        ))}
                        {scholar.researchInterests?.length > 3 && (
                          <Chip 
                            label={`+${scholar.researchInterests.length - 3}`} 
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 1.5, borderColor: 'divider' }}
                          />
                        )}
                      </Box>
                    </CardContent>

                    <Divider sx={{ opacity: 0.6 }} />

                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', bgcolor: 'grey.50' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                          {t('hIndex')}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                          <TrendingUp sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                          {scholar.hIndex}
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                          {t('citations')}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          <FormatQuote sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                          {scholar.citationCount.toLocaleString()}
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                          {t('pubs')}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          <Article sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                          {scholar.publicationCount}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>
              { }
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={Math.ceil(total / itemsPerPage)}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  size="large"
                />
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Save Search Dialog */}
      <Dialog 
        open={saveSearchDialogOpen} 
        onClose={() => setSaveSearchDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {t('saveSearch')}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('savedSearchName')}
            placeholder={t('enterSearchName')}
            fullWidth
            variant="outlined"
            value={saveSearchName}
            onChange={(e) => setSaveSearchName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleConfirmSaveSearch();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSaveSearchDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleConfirmSaveSearch} variant="contained">
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Search Dialog */}
      <Dialog 
        open={editSearchDialogOpen} 
        onClose={() => {
          setEditSearchDialogOpen(false);
          setEditingSearchId(null);
          setEditSearchName('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {t('editSavedSearch')}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('savedSearchName')}
            placeholder={t('enterSearchName')}
            fullWidth
            variant="outlined"
            value={editSearchName}
            onChange={(e) => setEditSearchName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleConfirmEditSearch();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => {
            setEditSearchDialogOpen(false);
            setEditingSearchId(null);
            setEditSearchName('');
          }}>
            {t('cancel')}
          </Button>
          <Button onClick={handleConfirmEditSearch} variant="contained">
            {t('updateSearch')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}