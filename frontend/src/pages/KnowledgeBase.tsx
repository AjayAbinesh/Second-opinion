import React, { useEffect, useState } from 'react';
import { Search, Book, HelpCircle, ChevronRight, Activity } from 'lucide-react';

interface KnowledgeBaseProps {
  token: string;
}

export default function KnowledgeBase({ token }: KnowledgeBaseProps) {
  const [guidelines, setGuidelines] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuideline, setSelectedGuideline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const baseUrl = 'http://localhost:8000';

  const fetchGuidelines = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${baseUrl}/api/cases/knowledge-base/guidelines`, { headers });
      const data = await res.json();
      if (res.ok) {
        setGuidelines(data);
        if (data.length > 0) setSelectedGuideline(data[0]);
      }
    } catch (err) {
      setError('Failed to fetch clinical guidelines');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchGuidelines();
      return;
    }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${baseUrl}/api/cases/knowledge-base/search?query=${encodeURIComponent(searchQuery)}`, { headers });
      const data = await res.json();
      if (res.ok) {
        setGuidelines(data);
        if (data.length > 0) setSelectedGuideline(data[0]);
      }
    } catch (err) {
      setError('Search query failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuidelines();
  }, [token]);

  if (loading && guidelines.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Clinical Knowledge Base</h1>
          <p className="text-slate-400 text-sm mt-1">
            Search clinical guidelines grounded in verified curriculum criteria.
          </p>
        </div>
        
        {/* Search */}
        <form onSubmit={handleSearch} className="w-full md:w-80 flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symptoms, diseases..."
            className="grow bg-slate-900/50 border border-slate-700/60 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl flex items-center justify-center shadow-md transition-colors cursor-pointer"
          >
            <Search className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Guidelines Index List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-2">Available Guidelines</h3>
          {guidelines.length > 0 ? (
            guidelines.map((g) => (
              <div
                key={g.id}
                onClick={() => setSelectedGuideline(g)}
                className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedGuideline?.id === g.id
                    ? 'bg-indigo-950/20 border-indigo-500 text-slate-200 font-bold'
                    : 'bg-slate-900/15 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/10'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    {g.specialty}
                  </span>
                  <ChevronRight className="h-3 w-3" />
                </div>
                <h4 className="truncate font-semibold">{g.title}</h4>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic py-4">No matching guidelines found.</p>
          )}
        </div>

        {/* Right Side: Detailed Guideline Viewer (8 Cols) */}
        <div className="lg:col-span-8">
          {selectedGuideline ? (
            <div className="p-6 rounded-2xl glass-panel border border-slate-700/50 space-y-6">
              
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">
                  {selectedGuideline.specialty} Guideline Context
                </span>
                <h2 className="text-xl font-extrabold text-slate-200 mt-1">{selectedGuideline.title}</h2>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <h4 className="font-bold text-slate-400 flex items-center">
                  <Book className="h-4 w-4 mr-1.5 text-indigo-400" />
                  <span>Clinical Standard Practices</span>
                </h4>
                <p className="p-4 bg-slate-950/30 rounded-xl border border-slate-900 font-normal leading-relaxed">
                  {selectedGuideline.content}
                </p>
              </div>

              <div className="p-4 bg-indigo-950/10 rounded-xl border border-indigo-900/20 text-xs text-slate-400 leading-relaxed">
                <h4 className="font-bold text-slate-300 flex items-center mb-1.5">
                  <HelpCircle className="h-4 w-4 mr-1.5 text-indigo-400" />
                  <span>Curriculum Reasoning Integration</span>
                </h4>
                This guideline document acts as the reference source for vector search and generation validation queries. When launching a simulation under this specialty, the generator and Devil's Advocate agents use these parameters to cross-examine diagnostic decisions.
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              Select a clinical guideline from the index panel to view standard clinical protocols.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
