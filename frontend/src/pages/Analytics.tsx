import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, BookOpen, CheckCircle, Zap } from 'lucide-react';

interface AnalyticsProps {
  token: string;
}

export default function Analytics({ token }: AnalyticsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const baseUrl = 'http://localhost:8000';

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/analytics/metrics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const metricsData = await response.json();
        if (!response.ok) throw new Error(metricsData.detail || 'Failed to fetch analytics');
        setData(metricsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-12 text-center text-xs text-red-400">
        Failed to compile performance tracking. Start case simulations to populate analytics.
      </div>
    );
  }

  const scores = data.scores_over_time || [];
  const biases = data.biases_frequency || {};
  const competencies = data.specialty_competency || {};
  const caseCounts = data.completed_cases_by_specialty || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Clinical reasoning Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Review diagnostic curves, cognitive vulnerabilities, and recommendations.</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Streak card */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-700/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active learning streak</span>
            <div className="text-2xl font-black text-slate-200 mt-1">{data.learning_streak} Days</div>
          </div>
          <div className="bg-orange-500/10 p-3 rounded-xl text-orange-500 border border-orange-500/20">
            <Zap className="h-6 w-6 fill-current animate-pulse" />
          </div>
        </div>

        {/* Biases detected card */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-700/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Common bias identified</span>
            <div className="text-xl font-bold text-slate-200 mt-1 truncate max-w-[200px]">
              {Object.keys(biases).length > 0 
                ? Object.keys(biases).reduce((a, b) => biases[a] > biases[b] ? a : b)
                : 'None Flagged'}
            </div>
          </div>
          <div className="bg-red-500/10 p-3 rounded-xl text-red-500 border border-red-500/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Competency card */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-700/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Top Competency Specialty</span>
            <div className="text-xl font-bold text-slate-200 mt-1 truncate max-w-[200px]">
              {Object.keys(competencies).length > 0 
                ? Object.keys(competencies).reduce((a, b) => competencies[a] > competencies[b] ? a : b)
                : 'None'}
            </div>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Recommendations Banner */}
      <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-900/30 text-xs">
        <h3 className="font-bold text-slate-200 mb-3 flex items-center">
          <BookOpen className="h-4.5 w-4.5 mr-2 text-indigo-400" />
          <span>AI attending Clinical Suggestions</span>
        </h3>
        <ul className="space-y-2 text-slate-300 list-disc pl-4 leading-relaxed">
          {data.recommendations.map((rec: string, idx: number) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: rec }}></li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Score Trend (Custom SVG Line Chart) */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-700/50 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center">
            <TrendingUp className="h-4.5 w-4.5 mr-2 text-indigo-400" />
            <span>Diagnostic accuracy Trend</span>
          </h3>
          {scores.length > 1 ? (
            <div className="relative h-64 w-full">
              {/* Simple inline SVG line chart */}
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" strokeWidth="0.5" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" strokeWidth="0.5" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="#1e293b" strokeWidth="0.5" />
                
                {/* Line Path */}
                <path
                  d={scores.map((s: any, idx: number) => {
                    const x = (idx / (scores.length - 1)) * 500;
                    const y = 200 - (s.score / 100) * 160 - 20; // Bound between 20 and 180
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                />

                {/* Nodes */}
                {scores.map((s: any, idx: number) => {
                  const x = (idx / (scores.length - 1)) * 500;
                  const y = 200 - (s.score / 100) * 160 - 20;
                  return (
                    <g key={idx} className="group cursor-pointer">
                      <circle cx={x} cy={y} r="5" fill="#a78bfa" stroke="#4f46e5" strokeWidth="2" />
                      <text x={x} y={y - 10} fill="#f1f5f9" fontSize="8" textAnchor="middle" className="font-bold">
                        {s.score}%
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1">
                <span>Case 1</span>
                <span>Case {scores.length}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-xs text-slate-500">
              Not enough data points yet. Complete at least 2 clinical cases to view trends.
            </div>
          )}
        </div>

        {/* Competency by Specialty (Custom Bar Chart) */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-700/50 space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Competency by Specialty</h3>
          <div className="space-y-4">
            {Object.keys(competencies).length > 0 ? (
              Object.keys(competencies).map((spec: string) => {
                const score = competencies[spec];
                const count = caseCounts[spec] || 0;
                return (
                  <div key={spec} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="font-semibold">{spec} ({count} case{count > 1 ? 's' : ''})</span>
                      <span className="font-bold">{score}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all"
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 text-xs text-slate-500">
                Complete cases to analyze specialty competencies.
              </div>
            )}
          </div>
        </div>

        {/* Cognitive Biases breakdown */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-slate-700/50 space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Cognitive Bias Vulnerabilities</h3>
          {Object.keys(biases).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {Object.keys(biases).map((bias: string) => {
                const count = biases[bias];
                return (
                  <div key={bias} className="p-4 rounded-xl border border-red-900/20 bg-red-950/10 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-red-400">{bias}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Flagged in your reasoning {count} time{count > 1 ? 's' : ''}.
                      </p>
                    </div>
                    <span className="self-end mt-4 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400">
                      Occurrences: {count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">
              No cognitive biases have been flagged in your submissions. Excellent diagnostic reasoning!
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
