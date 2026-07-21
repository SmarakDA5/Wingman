import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { useSubscriptionStore } from './stores/subscriptionStore';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { BottomNav } from './components/BottomNav';
import { SubscriptionModal } from './components/SubscriptionModal';
import { LandingView } from './views/LandingView';
import { SignupView } from './views/SignupView';
import { SigninView } from './views/SigninView';
import { FeedsView } from './views/FeedsView';
import { LikesView } from './views/LikesView';
import { InfoView } from './views/InfoView';
import { LegalPage } from './views/LegalPage';
import './App.css';

// Cross-tab auth state synchronization listener
function AuthSyncListener() {
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth-storage') {
        useAuthStore.persist.rehydrate();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return null;
}

// Authenticated Shell Component
const AuthenticatedShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { verifySubscription, has_access, loaded, error } = useSubscriptionStore();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    verifySubscription();
  }, []);

  useEffect(() => {
    // Only show modal after loading is complete AND subscription is not active (confirmed no-access only)
    const block = loaded && !has_access && !error;
    setShowSubscriptionModal(block);
  }, [has_access, loaded, error]);

  // Hide nav on landing/auth pages
  const hideNav = location.pathname === '/' || location.pathname === '/signup' || location.pathname === '/signin';

  return (
    <>
      <ThemeSwitcherWrapper />
      {children}
      {!hideNav && <BottomNav />}
      <SubscriptionModal isOpen={showSubscriptionModal} onDismiss={() => setShowSubscriptionModal(false)} />
    </>
  );
};

// Theme Switcher Wrapper to access store
const ThemeSwitcherWrapper = () => {
  const { isDarkMode, toggleTheme } = useThemeStore();
  return <ThemeSwitcher isDarkMode={isDarkMode} onToggle={toggleTheme} />;
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <AuthenticatedShell>{children}</AuthenticatedShell>;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/app/feeds" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthSyncListener />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicRoute><LandingView /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupView /></PublicRoute>} />
        <Route path="/signin" element={<PublicRoute><SigninView /></PublicRoute>} />

        {/* Legal Pages (public) */}
        <Route path="/privacy-policy" element={<LegalPage slug="privacy-policy" />} />
        <Route path="/terms-of-service" element={<LegalPage slug="terms-of-service" />} />
        <Route path="/contact" element={<LegalPage slug="contact" />} />

        {/* Protected Routes */}
        <Route path="/app" element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
          <Route index element={<Navigate to="/app/feeds" replace />} />
          <Route path="feeds" element={<FeedsView />} />
          <Route path="likes" element={<LikesView />} />
          <Route path="info" element={<InfoView />} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
