import React from 'react';
import { Shield, Zap, Sun, Moon, LogOut, Settings, Award } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  token: string | null;
  user: any;
  theme: string;
  toggleTheme: () => void;
  handleLogout: () => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  token,
  user,
  theme,
  toggleTheme,
  handleLogout
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 border-b glass-panel transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => setCurrentTab(token ? 'dashboard' : 'landing')}
          >
            <div className="bg-indigo-600 p-2 rounded-lg text-white group-hover:bg-indigo-500 transition-colors">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Second Opinion
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">
              Trainer
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {token ? (
              <>
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    currentTab === 'dashboard'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800/30 dark:hover:bg-slate-900/30'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentTab('caseworkspace')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    currentTab === 'caseworkspace'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800/30 dark:hover:bg-slate-900/30'
                  }`}
                >
                  Case Work
                </button>
                <button
                  onClick={() => setCurrentTab('analytics')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    currentTab === 'analytics'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800/30 dark:hover:bg-slate-900/30'
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setCurrentTab('knowledgebase')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    currentTab === 'knowledgebase'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800/30 dark:hover:bg-slate-900/30'
                  }`}
                >
                  Knowledge Base
                </button>
                <button
                  onClick={() => setCurrentTab('leaderboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    currentTab === 'leaderboard'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800/30 dark:hover:bg-slate-900/30'
                  }`}
                >
                  Leaderboard
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setCurrentTab('admin')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      currentTab === 'admin'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/20'
                    }`}
                  >
                    Admin
                  </button>
                )}
              </>
            ) : (
              <>
                <a href="#features" onClick={() => setCurrentTab('landing')} className="px-3 py-2 text-slate-400 hover:text-white text-sm font-medium">Features</a>
                <a href="#howitworks" onClick={() => setCurrentTab('landing')} className="px-3 py-2 text-slate-400 hover:text-white text-sm font-medium">How It Works</a>
              </>
            )}
          </div>

          {/* Right Side Info & Settings */}
          <div className="flex items-center space-x-3">
            {/* Gamification indicators */}
            {token && user && (
              <div className="flex items-center space-x-2 bg-slate-800/50 dark:bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-700/50 text-xs">
                {/* Points */}
                <div className="flex items-center space-x-1 text-yellow-500" title="Total Points">
                  <Award className="h-3.5 w-3.5 fill-current" />
                  <span className="font-bold">{user.points} pts</span>
                </div>
                {/* Streak */}
                <div className="flex items-center space-x-1 text-orange-500 font-semibold" title="Learning Streak">
                  <Zap className="h-3.5 w-3.5 fill-current animate-bounce" />
                  <span>{user.streak} days</span>
                </div>
              </div>
            )}

            {/* Dark/Light mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-700/50 hover:bg-slate-800/50 dark:hover:bg-slate-900/50 text-slate-400 hover:text-white transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Auth Actions */}
            {token ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentTab('settings')}
                  className="p-2 rounded-lg border border-slate-700/50 hover:bg-slate-800/50 dark:hover:bg-slate-900/50 text-slate-400 hover:text-indigo-400 transition-colors"
                  title="Profile Settings"
                >
                  <Settings className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg border border-red-900/30 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentTab('auth')}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all text-sm font-medium"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setCurrentTab('auth');
                    // We can tell the auth component to show register view
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-sm text-sm font-medium"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
