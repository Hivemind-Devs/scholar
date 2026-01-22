import {
  Container,
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Email,
  School,
  Business,
  TrendingUp,
  Description,
  People,
  Link as LinkIcon,
  History,
  MenuBook,
  SupervisorAccount,
  AdminPanelSettings,
  Search,
  Edit,
  ArrowBack,
} from '@mui/icons-material';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { toast } from 'sonner';
import CollaborationGraph from '../components/CollaborationGraph';
import PublicationTrends from '../components/PublicationTrends';
interface Education {
  edu_id: string;
  year_range: string;
  degree: string;
  university: string;
  department_info: string;
  thesis_title: string;
}
interface AcademicHistory {
  acad_id: string;
  year: string;
  position: string;
  university: string;
  department_info: string;
}
interface Course {
  course_id: string;
  academic_year: string;
  name: string;
  language: string;
  hours: string;
}
interface Thesis {
  thesis_id: string;
  year: string;
  student_name: string;
  title: string;
  institution: string;
}
interface Duty {
  duty_id: string;
  year_range: string;
  title: string;
  content: string;
}
interface Publication {
  pub_id: string;
  title: string;
  year: string;
  venue: string;
  authors: string[];
  type: string;
  doi: string | null;
}
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
  bio?: string;
  image?: string | null;
  orcid?: string;
  profileUrl?: string;
  education?: Education[];
  academicHistory?: AcademicHistory[];
  courses?: Course[];
  thesisSupervisions?: Thesis[];
  administrativeDuties?: Duty[];
  publications?: Publication[];
}
export default function ScholarProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [scholar, setScholar] = useState<Scholar | null>(null);
  const [loading, setLoading] = useState(true);
  const [pubPage, setPubPage] = useState(1);
  const [coursePage, setCoursePage] = useState(1);
  const [thesisPage, setThesisPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [pubSearch, setPubSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [thesisSearch, setThesisSearch] = useState('');
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editChanges, setEditChanges] = useState<any>({});
  const [editReason, setEditReason] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  useEffect(() => {
    const fetchScholar = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await api.getScholar(id);
        setScholar(data);
      } catch (error) {
        console.error('Failed to fetch scholar:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchScholar();
  }, [id]);
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  if (!scholar) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {t('scholarNotFound')}
        </Alert>
      </Container>
    );
  }
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          {t('back')}
        </Button>
      </Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <Avatar
              src={scholar.image}
              alt={scholar.name}
              sx={{
                width: 120,
                height: 120,
                bgcolor: '#0D47A1',
                fontSize: '3rem',
              }}
            >
              {!scholar.image && scholar.name.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {scholar.name}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {scholar.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip icon={<School />} label={scholar.institution} />
                <Chip icon={<Business />} label={scholar.department} />
                <Chip
                  icon={<TrendingUp />}
                  label={scholar.availability === 'Accepting Students' ? t('acceptingStudents') : scholar.availability === 'Available' ? t('available') : t('notAccepting')}
                  color={
                    scholar.availability === 'Accepting Students'
                      ? 'success'
                      : 'default'
                  }
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<Email />}
                  href={`mailto:${scholar.email}`}
                >
                  {t('contact')}
                </Button>
                {user && (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => {
                      setEditChanges({
                        name: scholar.name,
                        title: scholar.title,
                        institution: scholar.institution,
                        department: scholar.department,
                        bio: scholar.bio || '',
                      });
                      setEditReason('');
                      setEditDialogOpen(true);
                    }}
                  >
                    {t('editScholarInfo')}
                  </Button>
                )}
                {scholar.profileUrl && (
                  <Button
                    variant="outlined"
                    startIcon={<LinkIcon />}
                    href={scholar.profileUrl}
                    target="_blank"
                  >
                    {t('yokProfile')}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
          {scholar.orcid && (
             <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  ORCID: <Link href={`https://orcid.org/${scholar.orcid}`} target="_blank">{scholar.orcid}</Link>
                </Typography>
             </Box>
          )}
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {scholar.hIndex}
                </Typography>
                <Typography color="text.secondary">{t('hIndex')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {scholar.citationCount.toLocaleString()}
                </Typography>
                <Typography color="text.secondary">{t('citations')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {scholar.publicationCount}
                </Typography>
                <Typography color="text.secondary">{t('publications')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {scholar.courses?.length || 0}
                </Typography>
                <Typography color="text.secondary">{t('courses')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {scholar.thesisSupervisions?.length || 0}
                </Typography>
                <Typography color="text.secondary">{t('supervisions')}</Typography>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('researchInterests')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {scholar.researchInterests.map((interest, index) => (
                <Chip key={index} label={interest} variant="outlined" />
              ))}
            </Box>
          </Box>
          {scholar.bio && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('biography')}
              </Typography>
              <Typography>{scholar.bio}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
      { }
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, val) => setCurrentTab(val)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<History />} label={t('overview')} />
          <Tab icon={<Description />} label={t('publications')} />
          <Tab icon={<MenuBook />} label={t('courses')} />
          <Tab icon={<SupervisorAccount />} label={t('supervisions')} />
          <Tab icon={<TrendingUp />} label={t('trends')} />
          <Tab icon={<People />} label={t('collaborations')} />
        </Tabs>
      </Box>
      { }
      {currentTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          { }
          {scholar.education && scholar.education.length > 0 && (
            <Card variant="outlined" sx={{ overflow: 'visible' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 600 }}>
                  <School sx={{ mr: 1.5 }} /> {t('education')}
                </Typography>
                <Divider sx={{ mb: 2, borderColor: 'primary.light', opacity: 0.3 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {scholar.education.map((edu) => (
                    <Box key={edu.edu_id} sx={{ position: 'relative', pl: 2, borderLeft: '3px solid', borderColor: 'grey.200' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {edu.degree}
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({edu.year_range})
                        </Typography>
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        {edu.university}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {edu.department_info}
                      </Typography>
                      {edu.thesis_title && (
                        <Paper variant="outlined" sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50' }}>
                          <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold">
                            {t('thesis')}
                          </Typography>
                          <Typography variant="body2">
                            {edu.thesis_title}
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
          { }
          {scholar.academicHistory && scholar.academicHistory.length > 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 600 }}>
                  <History sx={{ mr: 1.5 }} /> {t('academicHistory')}
                </Typography>
                <Divider sx={{ mb: 2, borderColor: 'primary.light', opacity: 0.3 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {scholar.academicHistory.map((hist) => (
                    <Box key={hist.acad_id} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 3 } }}>
                      <Box sx={{ minWidth: '120px' }}>
                        <Chip label={hist.year} size="small" color="primary" variant="outlined" />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {hist.position}
                        </Typography>
                        <Typography variant="body1">
                          {hist.university}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {hist.department_info}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
          { }
          {scholar.administrativeDuties && scholar.administrativeDuties.length > 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 600 }}>
                  <AdminPanelSettings sx={{ mr: 1.5 }} /> {t('administrativeDuties')}
                </Typography>
                <Divider sx={{ mb: 2, borderColor: 'primary.light', opacity: 0.3 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {scholar.administrativeDuties.map((duty) => (
                    <Paper key={duty.duty_id} elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {duty.title}
                        </Typography>
                        <Chip label={duty.year_range} size="small" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {duty.content}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
      { }
      {currentTab === 1 && (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 600 }}>
                <Description sx={{ mr: 1.5 }} /> {t('publications')}
              </Typography>
              <TextField
                size="small"
                placeholder={t('searchPublications')}
                value={pubSearch}
                onChange={(e) => {
                  setPubSearch(e.target.value);
                  setPubPage(1);
                }}
                InputProps={{
                  startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ width: { xs: '100%', sm: 300 } }}
              />
            </Box>
            <Divider sx={{ mb: 3, opacity: 0.5 }} />
            {scholar.publications && scholar.publications.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {scholar.publications
                    .filter(pub => 
                      pub.title.toLowerCase().includes(pubSearch.toLowerCase()) || 
                      pub.venue.toLowerCase().includes(pubSearch.toLowerCase())
                    )
                    .slice((pubPage - 1) * ITEMS_PER_PAGE, pubPage * ITEMS_PER_PAGE)
                    .map((pub) => (
                    <Paper key={pub.pub_id} elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2, transition: 'all 0.2s', '&:hover': { bgcolor: 'grey.100' } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="text.primary">
                            {pub.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {pub.authors.join(', ')}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                            <Chip label={pub.year} size="small" sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }} />
                            <Chip label={pub.venue} size="small" variant="outlined" />
                            <Chip label={pub.type} size="small" color="primary" variant="outlined" />
                            {pub.doi && (
                              <Link href={pub.doi} target="_blank" underline="none">
                                <Chip 
                                  label="DOI" 
                                  size="small" 
                                  clickable 
                                  color="info" 
                                  variant="outlined" 
                                  icon={<LinkIcon style={{ fontSize: 14 }} />}
                                />
                              </Link>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                  {scholar.publications.filter(pub => 
                      pub.title.toLowerCase().includes(pubSearch.toLowerCase()) || 
                      pub.venue.toLowerCase().includes(pubSearch.toLowerCase())
                    ).length === 0 && (
                    <Alert severity="info" variant="outlined">{t('noPublicationsMatch')}</Alert>
                  )}
                </Box>
                {scholar.publications.filter(pub => 
                    pub.title.toLowerCase().includes(pubSearch.toLowerCase()) || 
                    pub.venue.toLowerCase().includes(pubSearch.toLowerCase())
                  ).length > ITEMS_PER_PAGE && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination 
                      count={Math.ceil(scholar.publications.filter(pub => 
                        pub.title.toLowerCase().includes(pubSearch.toLowerCase()) || 
                        pub.venue.toLowerCase().includes(pubSearch.toLowerCase())
                      ).length / ITEMS_PER_PAGE)}
                      page={pubPage}
                      onChange={(_, p) => setPubPage(p)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            ) : (
               <Alert severity="info" variant="outlined">{t('noPublicationsFound')}</Alert>
            )}
          </CardContent>
        </Card>
      )}
      { }
      {currentTab === 2 && (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 600 }}>
                <MenuBook sx={{ mr: 1.5 }} /> {t('courses')}
              </Typography>
              <TextField
                size="small"
                placeholder={t('searchCourses')}
                value={courseSearch}
                onChange={(e) => {
                  setCourseSearch(e.target.value);
                  setCoursePage(1);
                }}
                InputProps={{
                  startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ width: { xs: '100%', sm: 300 } }}
              />
            </Box>
            <Divider sx={{ mb: 3, opacity: 0.5 }} />
             {scholar.courses && scholar.courses.length > 0 ? (
               <>
                 <TableContainer component={Paper} elevation={0} variant="outlined">
                   <Table>
                     <TableHead sx={{ bgcolor: 'grey.50' }}>
                       <TableRow>
                         <TableCell sx={{ fontWeight: 'bold' }}>{t('academicYear')}</TableCell>
                         <TableCell sx={{ fontWeight: 'bold' }}>{t('courseName')}</TableCell>
                         <TableCell sx={{ fontWeight: 'bold' }}>{t('language')}</TableCell>
                         <TableCell sx={{ fontWeight: 'bold' }}>{t('hours')}</TableCell>
                       </TableRow>
                     </TableHead>
                     <TableBody>
                       {scholar.courses
                         .filter(course => 
                           course.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
                           course.academic_year.includes(courseSearch)
                         )
                         .slice((coursePage - 1) * ITEMS_PER_PAGE, coursePage * ITEMS_PER_PAGE)
                         .map((course) => (
                         <TableRow key={course.course_id} hover>
                           <TableCell>{course.academic_year}</TableCell>
                           <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{course.name}</TableCell>
                           <TableCell>
                             <Chip label={course.language} size="small" variant="outlined" />
                           </TableCell>
                           <TableCell>{course.hours}</TableCell>
                         </TableRow>
                       ))}
                       {scholar.courses.filter(course => 
                           course.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
                           course.academic_year.includes(courseSearch)
                         ).length === 0 && (
                         <TableRow>
                           <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                             {t('noCoursesMatch')}
                           </TableCell>
                         </TableRow>
                       )}
                     </TableBody>
                   </Table>
                 </TableContainer>
                 {scholar.courses.filter(course => 
                     course.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
                     course.academic_year.includes(courseSearch)
                   ).length > ITEMS_PER_PAGE && (
                   <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                     <Pagination 
                       count={Math.ceil(scholar.courses.filter(course => 
                         course.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
                         course.academic_year.includes(courseSearch)
                       ).length / ITEMS_PER_PAGE)}
                       page={coursePage}
                       onChange={(_, p) => setCoursePage(p)}
                       color="primary"
                     />
                   </Box>
                 )}
               </>
             ) : (
               <Alert severity="info" variant="outlined">{t('noCoursesFound')}</Alert>
             )}
          </CardContent>
        </Card>
      )}
      { }
      {currentTab === 3 && (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 600 }}>
                <SupervisorAccount sx={{ mr: 1.5 }} /> {t('supervisions')}
              </Typography>
              <TextField
                size="small"
                placeholder={t('searchSupervisions')}
                value={thesisSearch}
                onChange={(e) => {
                  setThesisSearch(e.target.value);
                  setThesisPage(1);
                }}
                InputProps={{
                  startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ width: { xs: '100%', sm: 300 } }}
              />
            </Box>
            <Divider sx={{ mb: 3, opacity: 0.5 }} />
             {scholar.thesisSupervisions && scholar.thesisSupervisions.length > 0 ? (
               <>
                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                   {scholar.thesisSupervisions
                     .filter(thesis => 
                       thesis.title.toLowerCase().includes(thesisSearch.toLowerCase()) ||
                       thesis.student_name.toLowerCase().includes(thesisSearch.toLowerCase())
                     )
                     .slice((thesisPage - 1) * ITEMS_PER_PAGE, thesisPage * ITEMS_PER_PAGE)
                     .map((thesis) => (
                     <Paper key={thesis.thesis_id} elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                       <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                         <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
                           <School fontSize="small" />
                         </Avatar>
                         <Box sx={{ flex: 1 }}>
                           <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                             {thesis.title}
                           </Typography>
                           <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                               <People fontSize="small" sx={{ fontSize: 16 }} />
                               <Typography variant="body2" component="span" fontWeight="medium" color="text.primary">
                                 {thesis.student_name}
                               </Typography>
                             </Box>
                             <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                             <Typography variant="body2">{thesis.year}</Typography>
                             <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                             <Typography variant="body2">{thesis.institution}</Typography>
                           </Box>
                         </Box>
                       </Box>
                     </Paper>
                   ))}
                   {scholar.thesisSupervisions.filter(thesis => 
                       thesis.title.toLowerCase().includes(thesisSearch.toLowerCase()) ||
                       thesis.student_name.toLowerCase().includes(thesisSearch.toLowerCase())
                     ).length === 0 && (
                     <Alert severity="info" variant="outlined">{t('noSupervisionsMatch')}</Alert>
                   )}
                 </Box>
                 {scholar.thesisSupervisions.filter(thesis => 
                     thesis.title.toLowerCase().includes(thesisSearch.toLowerCase()) ||
                     thesis.student_name.toLowerCase().includes(thesisSearch.toLowerCase())
                   ).length > ITEMS_PER_PAGE && (
                   <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                     <Pagination 
                       count={Math.ceil(scholar.thesisSupervisions.filter(thesis => 
                         thesis.title.toLowerCase().includes(thesisSearch.toLowerCase()) ||
                         thesis.student_name.toLowerCase().includes(thesisSearch.toLowerCase())
                       ).length / ITEMS_PER_PAGE)}
                       page={thesisPage}
                       onChange={(_, p) => setThesisPage(p)}
                       color="primary"
                     />
                   </Box>
                 )}
               </>
             ) : (
               <Alert severity="info" variant="outlined">{t('noSupervisionsFound')}</Alert>
             )}
          </CardContent>
        </Card>
      )}
      { }
      {currentTab === 4 && (
        <Card>
          <CardContent>
            <PublicationTrends scholarId={id || ''} />
          </CardContent>
        </Card>
      )}
      { }
      {currentTab === 5 && (
        <Card>
          <CardContent>
            <CollaborationGraph scholarId={id || ''} />
          </CardContent>
        </Card>
      )}

      {/* Edit Request Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => {
          setEditDialogOpen(false);
          setEditChanges({});
          setEditReason('');
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
          {t('submitEditRequest')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('name')}
              fullWidth
              value={editChanges.name || ''}
              onChange={(e) => setEditChanges({ ...editChanges, name: e.target.value })}
              variant="outlined"
            />
            <TextField
              label={t('academicTitle')}
              fullWidth
              value={editChanges.title || ''}
              onChange={(e) => setEditChanges({ ...editChanges, title: e.target.value })}
              variant="outlined"
            />
            <TextField
              label={t('institution')}
              fullWidth
              value={editChanges.institution || ''}
              onChange={(e) => setEditChanges({ ...editChanges, institution: e.target.value })}
              variant="outlined"
            />
            <TextField
              label={t('department')}
              fullWidth
              value={editChanges.department || ''}
              onChange={(e) => setEditChanges({ ...editChanges, department: e.target.value })}
              variant="outlined"
            />
            <TextField
              label={t('biography')}
              fullWidth
              multiline
              rows={4}
              value={editChanges.bio || ''}
              onChange={(e) => setEditChanges({ ...editChanges, bio: e.target.value })}
              variant="outlined"
            />
            <TextField
              label={t('editReason')}
              fullWidth
              multiline
              rows={3}
              placeholder={t('enterEditReason')}
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              variant="outlined"
              helperText={t('editReason')}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => {
              setEditDialogOpen(false);
              setEditChanges({});
              setEditReason('');
            }}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={async () => {
              if (!id || !scholar) return;
              setSubmittingEdit(true);
              try {
                const changes: any = {};
                if (editChanges.name && editChanges.name !== scholar.name) {
                  changes.name = editChanges.name;
                }
                if (editChanges.title && editChanges.title !== scholar.title) {
                  changes.title = editChanges.title;
                }
                if (editChanges.institution && editChanges.institution !== scholar.institution) {
                  changes.institution = editChanges.institution;
                }
                if (editChanges.department && editChanges.department !== scholar.department) {
                  changes.department = editChanges.department;
                }
                if (editChanges.bio !== undefined && editChanges.bio !== (scholar.bio || '')) {
                  changes.bio = editChanges.bio;
                }

                if (Object.keys(changes).length === 0) {
                  toast.error(t('noChangesDetected'));
                  setSubmittingEdit(false);
                  return;
                }

                await api.submitEdit(id, changes, editReason || undefined);
                toast.success(t('editRequestSubmitted'));
                setEditDialogOpen(false);
                setEditChanges({});
                setEditReason('');
              } catch (error) {
                console.error('Failed to submit edit request:', error);
                toast.error(t('failedToSubmitEdit'));
              } finally {
                setSubmittingEdit(false);
              }
            }}
            variant="contained"
            disabled={submittingEdit}
          >
            {submittingEdit ? t('saving') : t('saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}