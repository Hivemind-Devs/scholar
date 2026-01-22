import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import HomePage from './pages/HomePage';
import SearchResults from './pages/SearchResults';
import ScholarProfile from './pages/ScholarProfile';
import Dashboard from './pages/Dashboard';
import ProfileEdit from './pages/ProfileEdit';
import AdminPanel from './pages/AdminPanel';
import About from './pages/About';
import Team from './pages/Team';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import KVKKCompliance from './pages/KVKKCompliance';
import OAuthCallback from './pages/OAuthCallback';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
const theme = createTheme({
  palette: {
    primary: {
      main: '#0D47A1',
    },
    secondary: {
      main: '#00B0FF',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" richColors closeButton />
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Header />
              <div style={{ flex: 1 }}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/scholar/:id" element={<ScholarProfile />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile/edit" element={<ProfileEdit />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/kvkk-compliance" element={<KVKKCompliance />} />
                  <Route path="/auth/oauth/google/callback" element={<OAuthCallback />} />
                  <Route path="/auth/oauth/github/callback" element={<OAuthCallback />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              <Footer />
            </div>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
export default App;