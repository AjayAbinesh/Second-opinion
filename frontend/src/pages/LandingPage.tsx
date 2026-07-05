import React from 'react';
import { Shield, Brain, Sparkles, AlertTriangle, ChevronRight, Activity, HelpCircle, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  setCurrentTab: (tab: string) => void;
}

export default function LandingPage({ setCurrentTab }: LandingPageProps) {
  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
        <div className="text-center max-w-3xl mx-auto">
          
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Driven Healthcare Training</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Train How You Think, Not Just What You Know.
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed">
            Second Opinion is an agentic AI-powered simulation sandbox designed for medical, nursing, and clinical students to refine diagnostic pathways, defend clinical decisions, and eliminate cognitive biases.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
            <button
              onClick={() => setCurrentTab('auth')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/35 hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <span>Get Started Free</span>
              <ChevronRight className="h-5 w-5" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-700/60 hover:border-slate-500 text-slate-300 hover:text-white font-semibold transition-all hover:bg-slate-800/20 flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>

          {/* Ethics warning */}
          <div className="inline-flex items-start max-w-2xl bg-amber-950/20 dark:bg-amber-950/20 border border-amber-900/30 text-amber-500 p-4 rounded-xl text-xs text-left">
            <AlertTriangle className="h-5 w-5 mr-3 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wider mb-1">Educational Training Platform Only</span>
              Second Opinion does NOT diagnose patients or provide real-world medical advice. This platform is strictly designed for training clinical reasoning skills using realistic, fictional simulated scenarios.
            </div>
          </div>

        </div>
      </div>

      {/* Grid Features */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold">Engineered for Clinical Excellence</h2>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
            Our agentic workflow models the exact Socratic feedback loop medical students experience during hospital rounds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
            <div className="bg-indigo-500/10 p-3.5 rounded-xl text-indigo-400 inline-block mb-6 border border-indigo-500/20">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Agentic Case Generation</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Fetches evidence-based clinical guidelines using RAG, generating custom, medically sound fictional patients with diverse symptoms, histories, and vitals.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
            <div className="bg-purple-500/10 p-3.5 rounded-xl text-purple-400 inline-block mb-6 border border-purple-500/20">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Attending Attacking (Devil's Advocate)</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Forces you to defend your decisions. The agent analyzes your differential list and diagnostic reasoning, challenging you with lifethreatening mimics.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
            <div className="bg-emerald-500/10 p-3.5 rounded-xl text-emerald-400 inline-block mb-6 border border-emerald-500/20">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Cognitive Bias Screening</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Screens your actions and reasoning for common errors, including confirmation bias, anchoring bias, premature closure, and availability bias.
            </p>
          </div>

        </div>
      </div>

      {/* Workflow Showcase */}
      <div id="howitworks" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold">The Training Loop</h2>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
            From raw presentation parameters to Attending critique.
          </p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-indigo-500/20 -translate-x-1/2"></div>
          
          <div className="space-y-12">
            
            <div className="relative flex flex-col md:flex-row items-center justify-between">
              <div className="w-full md:w-5/12 text-left md:text-right md:pr-8 mb-6 md:mb-0">
                <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs block mb-1">Step 01</span>
                <h4 className="text-xl font-bold mb-2">Review EMR presentation</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Start a case session and check presenting complaint, medical history, medications, allergies, and vital signs table.
                </p>
              </div>
              <div className="z-10 bg-indigo-600 p-2.5 rounded-full text-white ring-4 ring-indigo-950">
                <Activity className="h-5 w-5" />
              </div>
              <div className="w-full md:w-5/12 hidden md:block"></div>
            </div>

            <div className="relative flex flex-col md:flex-row items-center justify-between">
              <div className="w-full md:w-5/12 hidden md:block"></div>
              <div className="z-10 bg-indigo-600 p-2.5 rounded-full text-white ring-4 ring-indigo-950">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="w-full md:w-5/12 text-left md:pl-8 mt-6 md:mt-0">
                <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs block mb-1">Step 02</span>
                <h4 className="text-xl font-bold mb-2">Request Investigations</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Order lab metrics (electrolytes, blood counts), cardiac enzymes, chest X-rays, or CT/MRI. View instant generated reports.
                </p>
              </div>
            </div>

            <div className="relative flex flex-col md:flex-row items-center justify-between">
              <div className="w-full md:w-5/12 text-left md:text-right md:pr-8 mb-6 md:mb-0">
                <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs block mb-1">Step 03</span>
                <h4 className="text-xl font-bold mb-2">Engage in Socratic Debate</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Provide diagnosis, differentials, and reasoning. The Attending Agent will challenge you to justify why you didn't treat competing emergency mimics.
                </p>
              </div>
              <div className="z-10 bg-indigo-600 p-2.5 rounded-full text-white ring-4 ring-indigo-950">
                <Brain className="h-5 w-5" />
              </div>
              <div className="w-full md:w-5/12 hidden md:block"></div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
