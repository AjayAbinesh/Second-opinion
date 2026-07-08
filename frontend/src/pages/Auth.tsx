import React, { useState } from 'react';
import { Shield, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import { fetchWithTimeout } from '../utils/api';

interface AuthProps {
  setToken: (token: string) => void;
  setUser: (user: any) => void;
  setCurrentTab: (tab: string) => void;
}

export default function Auth({ setToken, setUser, setCurrentTab }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      if (isLogin) {
        // Build URL encoded form data
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetchWithTimeout(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Authentication failed');
        }

        setToken(data.access_token);
        setUser(data.user);
        setCurrentTab('dashboard');
      } else {
        const response = await fetchWithTimeout(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Registration failed');
        }

        // Auto-login after register
        setIsLogin(true);
        setPassword('');
        setError('Account created! Please enter your password to log in.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center relative px-4">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 rounded-2xl glass-panel relative border border-slate-700/50">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-indigo-500/10 p-3 rounded-2xl text-indigo-400 mb-4 border border-indigo-500/20">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isLogin ? 'Sign in to Second Opinion' : 'Create your workspace'}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {isLogin ? 'Improve your medical reasoning skills' : 'Start simulating cases and diagnosing errors'}
          </p>
        </div>

        {/* Error panel */}
        {error && (
          <div className={`p-4 rounded-xl border mb-6 flex items-start text-sm ${
            error.includes('created') 
              ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' 
              : 'bg-red-950/20 border-red-900/30 text-red-400'
          }`}>
            <AlertCircle className="h-4.5 w-4.5 mr-2.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="dr_smith"
                className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="smith@hospital.edu"
                  className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.01] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register Account'}</span>
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Footer selector */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
          <span>{isLogin ? "Don't have an account?" : 'Already registered?'}</span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="ml-1 text-indigo-400 font-bold hover:underline"
          >
            {isLogin ? 'Create one now' : 'Sign in here'}
          </button>
        </div>

      </div>
    </div>
  );
}
