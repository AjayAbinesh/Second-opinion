import React, { useEffect, useState, useRef } from 'react';
import { Activity, ShieldAlert, Heart, RefreshCw, Send, Search, CheckCircle, AlertTriangle, FileText, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';

interface ClinicalCaseWorkspaceProps {
  token: string;
  sessionId: number | null;
  setCurrentTab: (tab: string) => void;
  setSelectedSessionId: (id: number | null) => void;
}

export default function ClinicalCaseWorkspace({
  token,
  sessionId,
  setCurrentTab,
  setSelectedSessionId
}: ClinicalCaseWorkspaceProps) {
  const [session, setSession] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'tests'>('info');
  const [testType, setTestType] = useState('CBC');
  const [testReason, setTestReason] = useState('');
  const [userDiagnosis, setUserDiagnosis] = useState('');
  const [userReasoning, setUserReasoning] = useState('');
  const [debateMessage, setDebateMessage] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const baseUrl = 'http://localhost:8000';

  const fetchSession = async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(`${baseUrl}/api/cases/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to fetch session details');
      setSession(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId, token]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.history]);

  const handleOrderTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testType || !sessionId) return;
    setSubmitLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/api/cases/session/${sessionId}/investigate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ test_type: testType, request_reason: testReason })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to order test');
      
      setTestReason('');
      fetchSession();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmitDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDiagnosis || !userReasoning || !sessionId) return;
    setSubmitLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/api/cases/session/${sessionId}/diagnose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_diagnosis: userDiagnosis, user_reasoning: userReasoning })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to submit diagnosis');
      
      fetchSession();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSendDebateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debateMessage.trim() || !sessionId) return;
    setSubmitLoading(true);
    setError('');
    const msg = debateMessage;
    setDebateMessage('');

    try {
      const response = await fetch(`${baseUrl}/api/cases/session/${sessionId}/debate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: msg })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to progress debate');
      
      fetchSession();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const getVitalAlertClass = (key: string, val: string | number) => {
    if (typeof val === 'string') {
      if (key === 'blood_pressure') {
        const systolic = parseInt(val.split('/')[0]);
        if (systolic > 140) return 'text-amber-500 font-bold';
        if (systolic < 95) return 'text-amber-500 font-bold';
      }
      if (key === 'oxygen_saturation') {
        const o2 = parseInt(val.replace('%', ''));
        if (o2 < 93) return 'text-red-500 font-bold animate-pulse';
        if (o2 < 95) return 'text-amber-500 font-bold';
      }
    } else if (typeof val === 'number') {
      if (key === 'heart_rate') {
        if (val > 100 || val < 60) return 'text-amber-500 font-bold';
      }
      if (key === 'respiratory_rate') {
        if (val > 22 || val < 12) return 'text-amber-500 font-bold';
      }
      if (key === 'temperature') {
        if (val > 38.0 || val < 36.0) return 'text-amber-500 font-bold';
      }
    }
    return 'text-slate-300';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!sessionId || !session) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <ShieldAlert className="h-12 w-12 text-slate-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-300">No Active Case Session</h2>
        <p className="text-slate-400 text-sm mt-2 mb-6">Select a case specialty from the dashboard to launch a simulation.</p>
        <button 
          onClick={() => setCurrentTab('dashboard')} 
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const patient = session.generated_case_data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4.1rem)] flex flex-col">
      
      {/* Top Banner */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              setSelectedSessionId(null);
              setCurrentTab('dashboard');
            }}
            className="p-2 border border-slate-700/60 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/30 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <h1 className="font-extrabold text-lg text-slate-200">Clinical Case #{session.id}</h1>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{session.case_specialty} Simulator</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-xs uppercase font-extrabold tracking-wider px-3 py-1 rounded-full ${
            session.status === 'completed' 
              ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30' 
              : 'bg-indigo-950/30 text-indigo-400 border border-indigo-900/30'
          }`}>
            Stage: {session.current_stage}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl mb-4 text-xs flex items-center shrink-0">
          <AlertCircle className="h-4.5 w-4.5 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Workspace Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 grow overflow-hidden min-h-0">
        
        {/* Left Side: EMR Patient Record (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col border border-slate-800 rounded-2xl bg-slate-900/10 dark:bg-slate-950/10 overflow-hidden">
          
          {/* Subtabs header */}
          <div className="flex border-b border-slate-800 shrink-0 bg-slate-900/40">
            <button
              onClick={() => setActiveSubTab('info')}
              className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeSubTab === 'info' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              EMR Chart
            </button>
            <button
              onClick={() => setActiveSubTab('tests')}
              className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition-all relative ${
                activeSubTab === 'tests' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Diagnostic Log ({session.investigations?.length || 0})
            </button>
          </div>

          {/* Subtab body content */}
          <div className="grow overflow-y-auto p-5 space-y-6">
            
            {activeSubTab === 'info' ? (
              <>
                {/* Patient Summary */}
                <div className="p-4 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 border border-slate-800">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 mb-3 flex items-center">
                    <Heart className="h-3.5 w-3.5 mr-1.5" />
                    <span>Demographic Record</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-0.5">Age</span>
                      <span className="font-bold text-slate-300">{patient?.demographics?.age} Yrs</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Sex</span>
                      <span className="font-bold text-slate-300">{patient?.demographics?.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Occupation</span>
                      <span className="font-bold text-slate-300 truncate block">{patient?.demographics?.occupation}</span>
                    </div>
                  </div>
                </div>

                {/* Vitals Signs Card */}
                <div className="p-4 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 border border-slate-800">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 mb-3 flex items-center">
                    <Activity className="h-3.5 w-3.5 mr-1.5" />
                    <span>Vital Parameters</span>
                  </h3>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800 pb-2">
                        <th className="font-medium pb-2">Metric</th>
                        <th className="font-medium pb-2 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      <tr>
                        <td className="py-2 text-slate-400">Blood Pressure (BP)</td>
                        <td className={`py-2 text-right ${getVitalAlertClass('blood_pressure', patient?.vital_signs?.blood_pressure)}`}>
                          {patient?.vital_signs?.blood_pressure}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-400">Heart Rate (HR)</td>
                        <td className={`py-2 text-right ${getVitalAlertClass('heart_rate', patient?.vital_signs?.heart_rate)}`}>
                          {patient?.vital_signs?.heart_rate}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-400">Respiratory Rate (RR)</td>
                        <td className={`py-2 text-right ${getVitalAlertClass('respiratory_rate', patient?.vital_signs?.respiratory_rate)}`}>
                          {patient?.vital_signs?.respiratory_rate}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-400">Temperature</td>
                        <td className={`py-2 text-right ${getVitalAlertClass('temperature', patient?.vital_signs?.temperature)}`}>
                          {patient?.vital_signs?.temperature}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-400">Oxygen Saturation (SpO2)</td>
                        <td className={`py-2 text-right ${getVitalAlertClass('oxygen_saturation', patient?.vital_signs?.oxygen_saturation)}`}>
                          {patient?.vital_signs?.oxygen_saturation}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Presenting Complaint & History */}
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-400 mb-1">Presenting Complaint</h4>
                    <p className="text-slate-300 leading-relaxed bg-slate-900/25 p-3 rounded-lg border border-slate-800/50">
                      {patient?.presenting_complaint}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-400 mb-1">Medical History</h4>
                    <p className="text-slate-300 leading-relaxed">{patient?.medical_history}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-400 mb-1">Current Medications</h4>
                    <p className="text-slate-300 leading-relaxed">{patient?.medications}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold text-slate-400 mb-1">Allergies</h4>
                      <p className="text-slate-300 leading-relaxed">{patient?.allergies}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-400 mb-1">Lifestyle Details</h4>
                      <p className="text-slate-300 leading-relaxed">{patient?.lifestyle}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {session.investigations?.length > 0 ? (
                  session.investigations.map((inv: any) => (
                    <div key={inv.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 text-xs">
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="font-bold text-indigo-400">{inv.test_type}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {inv.request_reason && (
                        <p className="text-slate-500 mb-2 italic">Reason: "{inv.request_reason}"</p>
                      )}
                      <div className="p-2.5 bg-slate-950/40 rounded border border-slate-800/80 font-mono text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                        {inv.result_content}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No investigations ordered yet. Request tests in the right workspace panel to diagnostic review.
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Right Side: Agent Interaction & Feedback Portal (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col border border-slate-800 rounded-2xl bg-slate-900/10 dark:bg-slate-950/10 overflow-hidden relative">
          
          {/* STAGE 1: Investigation and submit initial diagnosis */}
          {session.current_stage === 'investigation' && (
            <div className="grow overflow-y-auto p-6 space-y-8 flex flex-col justify-between">
              
              {/* Test Request Panel */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center">
                  <Search className="h-4.5 w-4.5 mr-2 text-indigo-400" />
                  <span>Order Investigations</span>
                </h3>
                <form onSubmit={handleOrderTest} className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Panel</label>
                      <select
                        value={testType}
                        onChange={(e) => setTestType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="ECG">12-Lead ECG</option>
                        <option value="Troponin I">Troponin Cardiac Panel</option>
                        <option value="Chest X-Ray">Chest X-Ray (CXR)</option>
                        <option value="CT Aortic Angiogram">CT Aortic Angiogram</option>
                        <option value="CBC">Complete Blood Count (CBC)</option>
                        <option value="Basic Metabolic Panel">Basic Metabolic Panel (BMP)</option>
                        <option value="Fingerstick Glucose">Fingerstick Glucose</option>
                        <option value="Non-Contrast Head CT">Non-Contrast Head CT</option>
                        <option value="Coagulation Panel">Coagulation Panel (PT/INR)</option>
                        <option value="D-Dimer">D-Dimer Panel</option>
                        <option value="Computed Tomography Pulmonary Angiography (CTPA)">CTPA Lung Scan</option>
                        <option value="Duplex Ultrasound Left Leg">Duplex Leg Ultrasound</option>
                        <option value="Abdominal Ultrasound">Abdominal Ultrasound</option>
                        <option value="Abdominal CT Scan">Abdominal CT Scan</option>
                        <option value="Urinalysis">Urinalysis (UA)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Clinical Justification</label>
                      <input
                        type="text"
                        required
                        value={testReason}
                        onChange={(e) => setTestReason(e.target.value)}
                        placeholder="e.g., Check for ischemic elevations / metabolic acidosis indicators"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>{submitLoading ? 'Requesting...' : 'Request Report (Adds to Log)'}</span>
                  </button>
                </form>
              </div>

              {/* Diagnosis Submission Panel */}
              <div className="border-t border-slate-800/80 pt-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center">
                  <FileText className="h-4.5 w-4.5 mr-2 text-indigo-400" />
                  <span>Clinical Impression & Case Submission</span>
                </h3>
                <form onSubmit={handleSubmitDiagnosis} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Diagnostic Impression (Primary Diagnosis)</label>
                    <input
                      type="text"
                      required
                      value={userDiagnosis}
                      onChange={(e) => setUserDiagnosis(e.target.value)}
                      placeholder="e.g. Acute Coronary Syndrome (NSTEMI)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Clinical Reasoning & Differential Assessment</label>
                    <textarea
                      required
                      rows={4}
                      value={userReasoning}
                      onChange={(e) => setUserReasoning(e.target.value)}
                      placeholder="Discuss positive test indications, explain why alternative differential options (e.g. Aortic Dissection, GERD) were excluded..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white rounded-lg transition-all flex items-center justify-center space-x-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    <span>Submit Diagnostic Impression to Senior Attending</span>
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* STAGE 2: Devil's Advocate Socratic debate */}
          {session.current_stage === 'debate' && (
            <div className="grow flex flex-col justify-between h-full overflow-hidden">
              
              {/* Attending Header */}
              <div className="p-4 bg-indigo-950/20 border-b border-slate-800/80 flex items-center space-x-3 shrink-0">
                <div className="bg-indigo-600/10 p-2 rounded-xl text-indigo-400 border border-indigo-500/20">
                  <Activity className="h-4.5 w-4.5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Senior Attending Critique</h3>
                  <span className="text-[10px] text-slate-500">Defend your diagnostic pathway and exclusions</span>
                </div>
              </div>

              {/* Chat box */}
              <div className="grow overflow-y-auto p-4 space-y-4">
                {session.history
                  .filter((h: any) => ['assistant_devil', 'user_devil', 'student_diagnosis'].includes(h.role))
                  .map((msg: any, idx: number) => {
                    const isAttending = msg.role === 'assistant_devil';
                    const isDiagnosisSubmit = msg.role === 'student_diagnosis';
                    
                    if (isDiagnosisSubmit) {
                      return (
                        <div key={idx} className="flex justify-end">
                          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl max-w-lg text-xs">
                            <span className="text-[9px] uppercase font-bold text-indigo-400 block mb-1">Your Submission</span>
                            <p className="font-bold text-slate-200">Diagnosis: {msg.diagnosis}</p>
                            <p className="text-slate-300 mt-1.5 leading-relaxed">{msg.reasoning}</p>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={idx} className={`flex ${isAttending ? 'justify-start' : 'justify-end'}`}>
                        <div className={`p-4 rounded-2xl max-w-lg text-xs leading-relaxed ${
                          isAttending 
                            ? 'bg-slate-950/40 border border-slate-800/80 text-slate-300' 
                            : 'bg-indigo-600 text-white font-medium'
                        }`}>
                          <span className={`text-[9px] uppercase font-bold block mb-1 ${
                            isAttending ? 'text-indigo-400' : 'text-indigo-200'
                          }`}>
                            {isAttending ? 'Attending Attending' : 'Your Defense'}
                          </span>
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}
                <div ref={chatEndRef}></div>
              </div>

              {/* Debate submission field */}
              <form onSubmit={handleSendDebateMessage} className="p-4 border-t border-slate-800 shrink-0 bg-slate-950/40">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    disabled={submitLoading}
                    value={debateMessage}
                    onChange={(e) => setDebateMessage(e.target.value)}
                    placeholder="Provide clinical reasoning to justify your decisions..."
                    className="grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* STAGE 3: Feedback, Score, Biases panel */}
          {session.current_stage === 'feedback' && (
            <div className="grow overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
              
              <div className="space-y-6">
                
                {/* Result header cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Score */}
                  <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 text-center flex flex-col justify-center items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Overall Score</span>
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <span className="text-2xl font-black">{session.score}%</span>
                    </div>
                  </div>

                  {/* Diagnoses details */}
                  <div className="sm:col-span-2 p-4 rounded-xl bg-slate-900/30 border border-slate-800 text-xs flex flex-col justify-center">
                    <div>
                      <span className="text-slate-500">Correct Diagnosis:</span>
                      <span className="font-bold text-emerald-400 block mt-0.5">{session.generated_case_data?.underlying_diagnosis}</span>
                    </div>
                    <div className="mt-3">
                      <span className="text-slate-500">Your Diagnosis:</span>
                      <span className="font-bold text-slate-200 block mt-0.5">{session.user_diagnosis}</span>
                    </div>
                  </div>

                </div>

                {/* Biases tags */}
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-2.5">Cognitive Bias Screening</h4>
                  <div className="flex flex-wrap gap-2">
                    {session.cognitive_biases && session.cognitive_biases.length > 0 ? (
                      session.cognitive_biases.map((bias: string, idx: number) => {
                        const isNone = bias.toLowerCase().includes('none');
                        return (
                          <span 
                            key={idx} 
                            className={`px-3 py-1 rounded-lg border text-xs font-bold flex items-center space-x-1.5 ${
                              isNone 
                                ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' 
                                : 'bg-red-950/20 text-red-400 border-red-900/30 animate-pulse'
                            }`}
                          >
                            {!isNone && <AlertTriangle className="h-3.5 w-3.5" />}
                            <span>{bias}</span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="px-3 py-1 rounded-lg border bg-emerald-950/20 text-emerald-400 border-emerald-900/30 text-xs font-bold">
                        No Cognitive Biases Flagged
                      </span>
                    )}
                  </div>
                </div>

                {/* AI attending text report */}
                <div className="border-t border-slate-800/80 pt-6">
                  <h4 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-3 flex items-center">
                    <FileText className="h-4.5 w-4.5 mr-1.5 text-indigo-400" />
                    <span>Attending Review and Critique</span>
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900/60 text-xs leading-relaxed text-slate-300 whitespace-pre-line max-h-80 overflow-y-auto">
                    {session.feedback_text}
                  </div>
                </div>

              </div>

              {/* Complete return button */}
              <button
                onClick={() => {
                  setSelectedSessionId(null);
                  setCurrentTab('dashboard');
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg shadow-md transition-all shrink-0 cursor-pointer"
              >
                Complete Review & Return to Hub
              </button>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
