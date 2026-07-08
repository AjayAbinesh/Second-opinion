import { useEffect, useState } from 'react';
import { Award, Zap, Activity, Clock, Play, CheckCircle, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { fetchWithTimeout } from '../utils/api';

interface DashboardProps {
  token: string;
  setCurrentTab: (tab: string) => void;
  setSelectedSessionId: (id: number | null) => void;
}

export default function Dashboard({ token, setCurrentTab, setSelectedSessionId }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch Dashboard stats
      const statsRes = await fetchWithTimeout(`${baseUrl}/api/analytics/dashboard`, { headers });
      const statsData = await statsRes.json();
      
      // Fetch Active sessions
      const activeRes = await fetchWithTimeout(`${baseUrl}/api/cases/active-sessions`, { headers });
      const activeData = await activeRes.json();

      // Fetch Case templates
      const templatesRes = await fetchWithTimeout(`${baseUrl}/api/cases/templates`, { headers });
      const templatesData = await templatesRes.json();

      if (statsRes.ok) setStats(statsData);
      if (activeRes.ok) setActiveSessions(activeData);
      if (templatesRes.ok) setTemplates(templatesData);
    } catch (err) {
      setError('Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleStartCase = async (caseId: number) => {
    try {
      setLoading(true);
      const response = await fetchWithTimeout(`${baseUrl}/api/cases/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ case_id: caseId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to start case');
      
      setSelectedSessionId(data.id);
      setCurrentTab('caseworkspace');
    } catch (err: any) {
      setError(err.message || 'Failed to start case. Please try again.');
      setLoading(false);
    }
  };

  const handleResumeCase = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setCurrentTab('caseworkspace');
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        <p className="text-xs text-slate-500 animate-pulse">Connecting to server... (may take a moment on first load)</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-sm flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Welcome Banner */}
      <div className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/20 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Clinical Sandbox</h1>
          <p className="text-slate-300 text-sm mt-1">
            Choose a clinical scenario template below or continue your pending diagnostic analysis.
          </p>
        </div>
        <button
          onClick={() => {
            if (templates.length > 0) {
              handleStartCase(templates[0].id);
            }
          }}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>Quick Start Case</span>
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl glass-panel border border-slate-700/50">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Streak</div>
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-orange-500 fill-current animate-pulse" />
              <span className="text-2xl font-black">{stats.streak} Days</span>
            </div>
          </div>
          <div className="p-5 rounded-2xl glass-panel border border-slate-700/50">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Simulations Completed</div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-indigo-500" />
              <span className="text-2xl font-black">{stats.completed_cases_count} Cases</span>
            </div>
          </div>
          <div className="p-5 rounded-2xl glass-panel border border-slate-700/50">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Average Score</div>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-purple-500" />
              <span className="text-2xl font-black">{Math.round(stats.average_score)}%</span>
            </div>
          </div>
          <div className="p-5 rounded-2xl glass-panel border border-slate-700/50">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Reputation Points</div>
            <div className="flex items-center space-x-2">
              <Award className="h-6 w-6 text-yellow-500 fill-current" />
              <span className="text-2xl font-black">{stats.points} pts</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Ongoing Cases & Case Selection */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Ongoing Cases */}
          {activeSessions.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center text-slate-200">
                <Clock className="h-5 w-5 mr-2 text-indigo-400" />
                <span>Pending Diagnoses</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="p-5 rounded-xl border border-indigo-900/30 bg-indigo-950/10 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {session.current_stage}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(session.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-200 line-clamp-2">Case Session #{session.id}</h3>
                    </div>
                    <button
                      onClick={() => handleResumeCase(session.id)}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <span>Resume Analysis</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start New Case */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center text-slate-200">
              <Play className="h-5 w-5 mr-2 text-indigo-400" />
              <span>Select Clinical Case Specialty</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl glass-card border border-slate-700/50 flex flex-col justify-between h-44">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
                        {c.specialty}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        Difficulty: {c.difficulty}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-200 text-sm leading-snug line-clamp-2">{c.title}</h3>
                  </div>
                  <button
                    onClick={() => handleStartCase(c.id)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Generate Case Simulation
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Achievements & Activities */}
        <div className="space-y-8">
          
          {/* Achievements list */}
          {stats && (
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center text-slate-200">
                <Award className="h-5 w-5 mr-2 text-yellow-500" />
                <span>Achievements Earned</span>
              </h2>
              <div className="glass-panel rounded-2xl p-5 border border-slate-700/50 space-y-4">
                {stats.achievements.length > 0 ? (
                  stats.achievements.map((ach: any) => (
                    <div key={ach.id} className="flex items-center space-x-3.5 p-2 border-b border-slate-800 last:border-0 pb-3 last:pb-0">
                      <div className="bg-yellow-500/10 p-2.5 rounded-xl text-yellow-500 border border-yellow-500/20">
                        <Award className="h-5 w-5 fill-current" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-200">{ach.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{ach.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Complete case reviews to unlock learning milestone badges!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {stats && stats.recent_activities.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center text-slate-200">
                <Activity className="h-5 w-5 mr-2 text-indigo-400" />
                <span>Activity Feed</span>
              </h2>
              <div className="glass-panel rounded-2xl p-5 border border-slate-700/50 space-y-4">
                {stats.recent_activities.map((act: any, idx: number) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (act.score === null) {
                        handleResumeCase(act.id);
                      }
                    }}
                    className={`flex justify-between items-center text-xs pb-3 border-b border-slate-800 last:border-b-0 last:pb-0 ${act.score === null ? 'cursor-pointer hover:bg-slate-800/20 p-1.5 rounded' : ''}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-300 line-clamp-1">{act.title}</p>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{act.date}</span>
                    </div>
                    {act.score !== null ? (
                      <span className={`font-black text-xs px-2 py-1 rounded ${
                        act.score >= 85 ? 'bg-emerald-950/30 text-emerald-400' : 'bg-amber-950/30 text-amber-400'
                      }`}>
                        {act.score}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-indigo-400 font-extrabold uppercase animate-pulse">
                        Resume
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
