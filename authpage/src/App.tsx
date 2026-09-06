import React, { useState } from 'react';
import { AuthProvider, useAuth, UserRole } from './context/AuthContext';
import { BackgroundVisual } from './components/BackgroundVisual';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { LoginModal } from './components/LoginModal';
import { SignupModal } from './components/SignupModal';
import { HelpModal } from './components/HelpModal';
import { AboutModal } from './components/AboutModal';
import { RolePortalPlaceholder } from './components/RolePortalPlaceholder';
import { PostLoginLoader } from './components/PostLoginLoader';

const MainAuthContent: React.FC = () => {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'signup' | 'help' | 'about'>('none');
  const [modalRole, setModalRole] = useState<UserRole>('patient');
  const [showPortalView, setShowPortalView] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [transitionRole, setTransitionRole] = useState<UserRole>('patient');

  const handleOpenLogin = (role: UserRole = 'patient') => {
    setModalRole(role);
    setActiveModal('login');
  };

  const handleOpenSignup = (role: UserRole = 'patient') => {
    setModalRole(role);
    setActiveModal('signup');
  };

  const handleOpenHelp = () => {
    setActiveModal('help');
  };

  const handleOpenAbout = () => {
    setActiveModal('about');
  };

  const handleCloseModal = () => {
    setActiveModal('none');
  };

  const handleLoginSuccess = (role: UserRole) => {
    setActiveModal('none');
    setTransitionRole(role);
    setIsTransitioning(true);
  };

  const handleSignupSuccess = (role: UserRole) => {
    setActiveModal('none');
    setTransitionRole(role);
    setIsTransitioning(true);
  };

  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
    const currentUser = user || (() => {
      try {
        return JSON.parse(localStorage.getItem('neuronova_auth_session') || '{}');
      } catch (_) {
        return {};
      }
    })();

    if (transitionRole === 'patient') {
      setIsRedirecting(true);
      const nameParam = encodeURIComponent(currentUser?.name || 'Friend');
      const uidParam = encodeURIComponent(currentUser?.uid || `user_${(currentUser?.name || 'friend').toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
      const roleParam = encodeURIComponent(currentUser?.role || 'patient');
      // Redirect to patient home screen (/homepage on port 5175) with persistent identity
      window.location.href = `http://localhost:5175/?userId=${uidParam}&name=${nameParam}&role=${roleParam}`;
    } else if (transitionRole === 'caregiver') {
      setIsRedirecting(true);
      const nameParam = encodeURIComponent(currentUser?.name || 'Caregiver');
      const uidParam = encodeURIComponent(currentUser?.uid || `user_${(currentUser?.name || 'caregiver').toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
      // Redirect to Caregiver Dashboard (/caregiverpage on port 5179)
      window.location.href = `http://localhost:5179/?userId=${uidParam}&name=${nameParam}&role=caregiver`;
    } else {
      setShowPortalView(true);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col justify-between font-brand-body">
      {/* 1. Full-Screen Background Visual (Mouse-Scrubbed Video + Warm Dadi & Dada Portrait) */}
      <BackgroundVisual />

      {/* 2. Fixed Navbar */}
      <Navbar
        onOpenHelp={handleOpenHelp}
        onOpenAbout={handleOpenAbout}
        activeView={activeModal}
      />

      {/* 3. Main Center Content: Hero Section or Role Portal Placeholder */}
      <main className="relative z-10 w-full flex-grow flex items-center">
        {user && showPortalView ? (
          <RolePortalPlaceholder onBackToAuth={() => setShowPortalView(false)} />
        ) : (
          <HeroSection
            onSelectAction={(action, preselectedRole) => {
              if (action === 'login') {
                handleOpenLogin(preselectedRole || 'patient');
              } else {
                handleOpenSignup(preselectedRole || 'patient');
              }
            }}
            onOpenHelp={handleOpenHelp}
          />
        )}
      </main>

      {/* 4. Modals */}
      <LoginModal
        isOpen={activeModal === 'login'}
        onClose={handleCloseModal}
        onSwitchToSignup={(role) => handleOpenSignup(role || modalRole)}
        initialRole={modalRole}
        onLoginSuccess={handleLoginSuccess}
      />

      <SignupModal
        isOpen={activeModal === 'signup'}
        onClose={handleCloseModal}
        onSwitchToLogin={(role) => handleOpenLogin(role || modalRole)}
        initialRole={modalRole}
        onSignupSuccess={handleSignupSuccess}
      />

      <HelpModal
        isOpen={activeModal === 'help'}
        onClose={handleCloseModal}
      />

      <AboutModal
        isOpen={activeModal === 'about'}
        onClose={handleCloseModal}
      />

      {/* 5. Full-Screen Post-Login Transition Loader */}
      {isTransitioning && (
        <PostLoginLoader 
          userName={user?.name} 
          onComplete={handleTransitionComplete} 
        />
      )}

      {/* 6. Seamless Warm Cream Curtain during Navigation to Homepage */}
      {isRedirecting && (
        <div 
          className="fixed inset-0 z-50 bg-[#FAF7F2] transition-opacity duration-300"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAuthContent />
    </AuthProvider>
  );
};

export default App;
