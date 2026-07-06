import { useEffect, useState } from 'react';
import { Zap, Trophy, ShieldAlert, Star } from 'lucide-react';

interface LeaderboardProps {
  token: string;
}

export default function Leaderboard({ token }: LeaderboardProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/analytics/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setEntries(data);
        } else {
          setError('Failed to load leaderboard data');
        }
      } catch (err) {
        setError('Network error loading rankings');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex bg-yellow-500/10 p-3 rounded-full text-yellow-500 mb-3 border border-yellow-500/20">
          <Trophy className="h-6 w-6 fill-current" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Gamified Student Leaderboard</h1>
        <p className="text-slate-400 text-sm mt-1">Friendly educational competition based on accumulated clinical training achievements.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs flex items-center">
          <ShieldAlert className="h-4.5 w-4.5 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Rankings List */}
      <div className="glass-panel rounded-2xl border border-slate-700/50 overflow-hidden">
        
        <div className="flex border-b border-slate-800 bg-slate-900/40 p-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
          <div className="w-12 text-center">Rank</div>
          <div className="grow">Student Username</div>
          <div className="w-24 text-center">Streak</div>
          <div className="w-24 text-right">Reputation</div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {entries.length > 0 ? (
            entries.map((entry, index) => {
              const rank = index + 1;
              
              let badgeColor = 'bg-slate-800/45';
              if (rank === 1) {
                
                badgeColor = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
              } else if (rank === 2) {
                
                badgeColor = 'bg-slate-300/10 border-slate-300/20 text-slate-300';
              } else if (rank === 3) {
                
                badgeColor = 'bg-amber-600/10 border-amber-600/20 text-amber-600';
              }

              return (
                <div key={entry.username} className="flex p-4 items-center text-xs text-slate-300 hover:bg-slate-800/20 transition-all">
                  
                  {/* Rank circle */}
                  <div className="w-12 text-center">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full border text-[10px] font-bold ${badgeColor}`}>
                      {rank}
                    </span>
                  </div>

                  {/* Username */}
                  <div className="grow font-bold text-slate-200 flex items-center space-x-1.5">
                    <span>{entry.username}</span>
                    {rank === 1 && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                  </div>

                  {/* Streak */}
                  <div className="w-24 text-center text-orange-500 font-semibold flex items-center justify-center space-x-1">
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>{entry.streak}d</span>
                  </div>

                  {/* Points */}
                  <div className="w-24 text-right font-black text-indigo-400">
                    {entry.points} pts
                  </div>

                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 text-center py-10">No students ranked on the board yet.</p>
          )}
        </div>

      </div>

    </div>
  );
}
