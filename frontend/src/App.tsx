import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ClinicalCaseWorkspace from './pages/ClinicalCaseWorkspace';
import Analytics from './pages/Analytics';
import KnowledgeBase from './pages/KnowledgeBase';
import Leaderboard from './pages/Leaderboard';
import ProfileSettings from './pages/ProfileSettings';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';
import { fetchWithTimeout } from './utils/api';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [theme, setTheme] = useState<string>(localStorage.getItem('theme') || 'dark');

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Synchronize token state with localstorage
  const handleSetToken = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleSetUser = (newUser: any) => {
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    }
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setSelectedSessionId(null);
    setCurrentTab('landing');
  };

  // Synchronize theme configuration
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.className = 'dark min-h-screen';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      document.body.className = 'light min-h-screen';
    }
  }, [theme]);

  // Validate session on page load - resilient to backend cold starts
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setLoadingUser(false);
        return;
      }
      // If we have cached user data, show dashboard immediately
      if (user) {
        setCurrentTab('dashboard');
        setLoadingUser(false);
        // Validate in background, don't block UI
        try {
          const resp = await fetchWithTimeout(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resp.ok) {
            const d = await resp.json();
            handleSetUser(d);
          } else if (resp.status === 401) {
            handleLogout();
          }
        } catch {
          // Backend unreachable (cold start) - keep session alive
        }
        return;
      }
      // No cached user - must validate
      try {
        const resp = await fetchWithTimeout(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d = await resp.json();
        if (resp.ok) {
          handleSetUser(d);
          setCurrentTab('dashboard');
        } else if (resp.status === 401) {
          handleLogout();
        }
      } catch {
        // Backend unreachable - keep token, show landing
      } finally {
        setLoadingUser(false);
      }
    };
    validateToken();
  }, [token]);

  const [loadingUser, setLoadingUser] = useState(true);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#080b11] text-slate-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme}`}>
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        token={token}
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
      />

      <main className="min-h-[calc(100vh-4rem)]">
        {currentTab === 'landing' && <LandingPage setCurrentTab={setCurrentTab} />}
        {currentTab === 'auth' && (
          <Auth
            setToken={handleSetToken}
            setUser={handleSetUser}
            setCurrentTab={setCurrentTab}
          />
        )}
        {token && (
          <>
            {currentTab === 'dashboard' && (
              <Dashboard
                token={token}
                setCurrentTab={setCurrentTab}
                setSelectedSessionId={setSelectedSessionId}
              />
            )}
            {currentTab === 'caseworkspace' && (
              <ClinicalCaseWorkspace
                token={token}
                sessionId={selectedSessionId}
                setCurrentTab={setCurrentTab}
                setSelectedSessionId={setSelectedSessionId}
              />
            )}
            {currentTab === 'analytics' && <Analytics token={token} />}
            {currentTab === 'knowledgebase' && <KnowledgeBase token={token} />}
            {currentTab === 'leaderboard' && <Leaderboard token={token} />}
            {currentTab === 'settings' && (
              <ProfileSettings
                token={token}
                theme={theme}
                toggleTheme={toggleTheme}
                user={user}
              />
            )}
            {currentTab === 'admin' && <AdminDashboard token={token} />}
          </>
        )}
      </main>
    </div>
  );
}
