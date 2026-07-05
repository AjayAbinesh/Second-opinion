import React, { useEffect, useState } from 'react';
import { Shield, Key, Moon, Sun, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface ProfileSettingsProps {
  token: string;
  theme: string;
  toggleTheme: () => void;
  user: any;
}

export default function ProfileSettings({ token, theme, toggleTheme, user }: ProfileSettingsProps) {
  const [settings, setSettings] = useState<any>(null);
  const [grokKey, setGrokKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const baseUrl = 'http://localhost:8000';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/auth/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setSettings(data);
          setGrokKey(data.grok_api_key || '');
        }
      } catch (err) {
        setError('Failed to fetch user settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [token]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${baseUrl}/api/auth/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          grok_api_key: grokKey || null,
          theme: theme
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to save settings');
      
      setMessage('Configuration updated successfully!');
      setSettings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Trainer Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure workspace keys, credentials, and dark/light interfaces.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl text-xs flex items-center">
          <CheckCircle className="h-4.5 w-4.5 mr-2 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs flex items-center">
          <AlertCircle className="h-4.5 w-4.5 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Profile Card */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-700/50 space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 flex items-center">
            <Shield className="h-4 w-4 mr-1.5" />
            <span>Student Credentials Summary</span>
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Username</span>
              <span className="font-bold text-slate-300">{user?.username}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Email</span>
              <span className="font-bold text-slate-300">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-700/50 space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 flex items-center">
            {theme === 'dark' ? <Moon className="h-4 w-4 mr-1.5" /> : <Sun className="h-4 w-4 mr-1.5" />}
            <span>Theme Preferences</span>
          </h3>
          <div className="flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-slate-300 block">Workspace Theme</span>
              <span className="text-slate-500 mt-0.5 block">Toggle between light and dark modes</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-600 hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-200 transition-all cursor-pointer"
            >
              Set to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>

        {/* API Credentials */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-700/50 space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 flex items-center">
            <Key className="h-4 w-4 mr-1.5" />
            <span>xAI Grok Integration credentials</span>
          </h3>
          <div className="space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              To power case simulations with the actual Grok API, supply your key below. Leave empty to use the built-in, medically sound simulation engine (which is completely free!).
            </p>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Grok API Key</label>
              <input
                type="password"
                value={grokKey}
                onChange={(e) => setGrokKey(e.target.value)}
                placeholder="xai-xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={submitLoading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer animate-pulse-slow"
        >
          {submitLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
          <span>Save Workspace Preferences</span>
        </button>

      </form>

    </div>
  );
}
