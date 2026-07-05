import React, { useEffect, useState } from 'react';
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

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [theme, setTheme] = useState<string>(localStorage.getItem('theme') || 'dark');

  const baseUrl = 'http://localhost:8000';

  // Synchronize token state with localstorage
  const handleSetToken = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
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

  // Validate session on page load
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setLoadingUser(false);
        return;
      }
      try {
        const response = await fetch(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data);
          setCurrentTab('dashboard');
        } else {
          handleLogout();
        }
      } catch {
        handleLogout();
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
            setUser={setUser}
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
