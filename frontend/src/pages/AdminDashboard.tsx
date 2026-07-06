import { useEffect, useState } from 'react';
import { ShieldAlert, Users, Award, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';

interface AdminDashboardProps {
  token: string;
}

export default function AdminDashboard({ token }: AdminDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/analytics/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setStats(data);
        } else {
          setError(data.detail || 'Access denied or server error');
        }
      } catch (err) {
        setError('Network error pulling administrator statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-md mx-auto py-12 text-center text-xs text-red-400">
        <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <span>{error || 'You do not have administrative privileges to access this report.'}</span>
      </div>
    );
  }

  const biases = stats.global_biases_frequency || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Institutional Administrative Panel</h1>
        <p className="text-slate-400 text-sm mt-1">Review aggregated learning metrics across all registered healthcare students.</p>
      </div>

      {/* Global Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Users */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-700/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Enrolled Students</span>
            <div className="text-2xl font-black text-slate-200 mt-1">{stats.total_users} Students</div>
          </div>
          <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Total Completed */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-700/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Completed Simulations</span>
            <div className="text-2xl font-black text-slate-200 mt-1">{stats.total_completed_cases} Cases</div>
          </div>
          <div className="bg-purple-500/10 p-3 rounded-xl text-purple-400 border border-purple-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Global Average */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-700/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Global Average Score</span>
            <div className="text-2xl font-black text-slate-200 mt-1">{Math.round(stats.average_score)}% Accuracy</div>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 border border-emerald-500/20">
            <Award className="h-6 w-6" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Global Bias Frequency (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl glass-panel border border-slate-700/50 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center">
            <AlertTriangle className="h-4.5 w-4.5 mr-2 text-red-500 animate-pulse" />
            <span>Aggregate Bias Distribution</span>
          </h3>
          <p className="text-xs text-slate-500">
            Shows which reasoning heuristics are most frequently flagged across all completed sandbox case submissions.
          </p>
          <div className="space-y-4 mt-6">
            {Object.keys(biases).length > 0 ? (
              Object.keys(biases).map((bias: string) => {
                const count = biases[bias];
                return (
                  <div key={bias} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-semibold">{bias}</span>
                      <span className="font-bold text-slate-300">{count} flags</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-850 overflow-hidden">
                      <div 
                        className="bg-red-500 h-full rounded-full" 
                        style={{ width: `${Math.min(100, (count / Math.max(1, stats.total_completed_cases)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 text-center py-10">No biases flagged across student records yet.</p>
            )}
          </div>
        </div>

        {/* Global Audit Log (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl glass-panel border border-slate-700/50 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center">
            <Activity className="h-4.5 w-4.5 mr-2 text-indigo-400" />
            <span>System Action Feed</span>
          </h3>
          <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
            {stats.system_activities && stats.system_activities.length > 0 ? (
              stats.system_activities.map((act: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-slate-800 last:border-0 last:pb-0">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-200">{act.username}</span>
                      <span className="text-slate-500">completed</span>
                      <span className="font-semibold text-slate-300 line-clamp-1">{act.case_title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{act.date}</span>
                  </div>
                  {act.score !== null ? (
                    <span className="font-black text-indigo-400">{act.score}%</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-500 animate-pulse">Debating</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-10">No recent activities on the server logs.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
