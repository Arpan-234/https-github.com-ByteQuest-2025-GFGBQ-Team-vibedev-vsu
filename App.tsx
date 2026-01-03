
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { TrustState, AnalysisHistory, User } from './types';
import { runTrustPipeline } from './services/trustGraph';
import { extractAndAnalyzeClaims, performDeepTrustReview, analyzeMedia, generateSpeech, startChat } from './services/geminiService';
import ScoreGauge from './components/ScoreGauge';
import ClaimCard from './components/ClaimCard';
import CitationNetwork from './components/CitationNetwork';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'auth' | 'dashboard' | 'history' | 'voice'>('auth');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('');
  const [state, setState] = useState<TrustState | null>(null);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [webGrounding, setWebGrounding] = useState(false);
  const [deepThinking, setDeepThinking] = useState(true);

  // Load History
  useEffect(() => {
    const saved = localStorage.getItem('veri_trust_history_v2');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ id: '1', email: 'user@veritrust.ai', name: 'Demo Analyst' });
    setView('dashboard');
  };

  const handleVerify = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setState(null);
    try {
      const result = await runTrustPipeline(inputText, webGrounding, deepThinking, (s) => setStep(s));
      setState(result);
      
      const newEntry: AnalysisHistory = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        text_preview: inputText.substring(0, 100) + '...',
        score: result.trust_score,
        level: result.trust_level,
        full_state: result
      };
      const updatedHistory = [newEntry, ...history].slice(0, 20);
      setHistory(updatedHistory);
      localStorage.setItem('veri_trust_history_v2', JSON.stringify(updatedHistory));
    } catch (err) {
      alert("Pipeline Error: Check API connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const exportPDF = () => {
    if (!state) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("VeriTrust Analysis Report", 20, 30);
    doc.setFontSize(12);
    doc.text(`Score: ${state.trust_score} (${state.trust_level} Trust)`, 20, 45);
    doc.text(`Timestamp: ${new Date().toLocaleString()}`, 20, 52);
    doc.text("--------------------------------------------------", 20, 60);
    doc.text("Analysis Summary:", 20, 70);
    const splitExplanation = doc.splitTextToSize(state.explanation, 170);
    doc.text(splitExplanation, 20, 80);
    doc.save(`VeriTrust-Report-${Date.now()}.pdf`);
  };

  if (view === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full"></div>
          <div className="text-center mb-8 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black mb-4 shadow-lg shadow-blue-500/20">V</div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">VeriTrust <span className="text-blue-500">Pro</span></h1>
            <p className="text-slate-400 text-sm">Enterprise Multi-Modal Trust Intelligence</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4 relative z-10">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Work Email</label>
              <input type="email" placeholder="analyst@firm.com" className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all mt-1" required />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Security Key</label>
              <input type="password" placeholder="••••••••" className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all mt-1" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95">
              Access Dashboard
            </button>
          </form>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <button onClick={handleAuth} className="text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-widest">Request Enterprise Sandbox</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden pb-20">
      {/* Navigation */}
      <nav className="sticky top-0 z-[100] glass-dark border-b border-white/5 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-white">V</div>
            <span className="font-extrabold tracking-tighter text-xl">VERITRUST</span>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-bold text-slate-400">
            <button onClick={() => setView('dashboard')} className={`${view === 'dashboard' ? 'text-blue-400' : 'hover:text-white'} transition-colors`}>Analyze</button>
            <button onClick={() => setView('history')} className={`${view === 'history' ? 'text-blue-400' : 'hover:text-white'} transition-colors`}>History</button>
            <button onClick={() => setView('voice')} className={`${view === 'voice' ? 'text-blue-400' : 'hover:text-white'} transition-colors`}>Voice Lab</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-xs font-bold">{user?.name}</span>
            <span className="text-[10px] text-green-500 font-mono">NODE ACTIVE</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
          </div>
          <button onClick={() => setView('auth')} className="p-2 hover:text-red-400 transition-colors"><i className="fa-solid fa-right-from-bracket"></i></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
              <div className="grid lg:grid-cols-12 gap-8">
                {/* Input Wing */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="glass-dark p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-3">
                        <i className="fa-solid fa-microscope text-blue-500"></i>
                        Verification Lab
                      </h2>
                      <div className="flex gap-2">
                        <button onClick={() => setInputText("According to Dr. Smith, a 100% cure for cancer has been found. Experts say it works instantly.")} className="text-[9px] font-bold px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">Load Risk</button>
                        <button onClick={() => setInputText("Recent studies (Jones, 2022) suggest that climate trends are evolving. However, uncertainty remains in long-term projections.")} className="text-[9px] font-bold px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md">Load Trust</button>
                      </div>
                    </div>
                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="w-full h-64 bg-slate-900/30 border border-white/5 rounded-3xl p-6 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-medium leading-relaxed"
                      placeholder="Paste investigative text or AI-generated output for deep chain verification..."
                    />
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <button 
                        onClick={() => setWebGrounding(!webGrounding)}
                        className={`p-4 rounded-2xl border transition-all flex flex-col gap-1 text-left ${webGrounding ? 'bg-blue-500/10 border-blue-500/50' : 'bg-slate-900/50 border-white/5'}`}
                      >
                        <i className={`fa-solid fa-earth-americas ${webGrounding ? 'text-blue-400' : 'text-slate-500'}`}></i>
                        <span className="text-xs font-bold">Web Grounding</span>
                        <span className="text-[9px] opacity-40">Flash Search</span>
                      </button>
                      <button 
                        onClick={() => setDeepThinking(!deepThinking)}
                        className={`p-4 rounded-2xl border transition-all flex flex-col gap-1 text-left ${deepThinking ? 'bg-purple-500/10 border-purple-500/50' : 'bg-slate-900/50 border-white/5'}`}
                      >
                        <i className={`fa-solid fa-brain ${deepThinking ? 'text-purple-400' : 'text-slate-500'}`}></i>
                        <span className="text-xs font-bold">Thinking Mode</span>
                        <span className="text-[9px] opacity-40">Pro Logic</span>
                      </button>
                    </div>

                    <button 
                      onClick={handleVerify}
                      disabled={isProcessing || !inputText}
                      className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] disabled:opacity-50 text-white font-black py-4 rounded-3xl shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm uppercase tracking-widest">{step}</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-bolt-lightning"></i>
                          EXECUTE ANALYSIS
                        </>
                      )}
                    </button>
                  </div>

                  {/* Multi-Modal Lab Section */}
                  <div className="glass-dark p-8 rounded-[2rem] border border-white/5">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-6">Multimodal Ingest</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-blue-500/50 transition-colors">
                        <i className="fa-solid fa-image text-2xl mb-2 text-blue-500"></i>
                        <span className="text-[10px] font-bold">Analyze Photo</span>
                        <input type="file" className="hidden" accept="image/*" />
                      </label>
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-purple-500/50 transition-colors">
                        <i className="fa-solid fa-video text-2xl mb-2 text-purple-500"></i>
                        <span className="text-[10px] font-bold">Verify Video</span>
                        <input type="file" className="hidden" accept="video/*" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Output Wing */}
                <div className="lg:col-span-7 space-y-8">
                  {!state && !isProcessing && (
                    <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 space-y-6">
                      <div className="w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center animate-float">
                        <i className="fa-solid fa-shield-virus text-5xl text-blue-500/50"></i>
                      </div>
                      <h2 className="text-3xl font-black gradient-text">System Ready</h2>
                      <p className="text-slate-500 max-w-sm font-medium">Pipeline idle. Submit a data set to initiate multi-node verification and risk aggregation.</p>
                    </div>
                  )}

                  {state && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <ScoreGauge score={state.trust_score} label={state.trust_level} />
                           <div className="flex flex-col">
                             <h2 className="text-2xl font-black">Analysis Result</h2>
                             <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{state.trust_level} Trust Authority</span>
                           </div>
                        </div>
                        <button onClick={exportPDF} className="p-4 glass rounded-2xl hover:bg-white/10 transition-colors">
                          <i className="fa-solid fa-file-pdf mr-2"></i> Report
                        </button>
                      </div>

                      {/* Deep explanation */}
                      <div className="glass-dark p-8 rounded-[2.5rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                          <i className="fa-solid fa-quote-right text-4xl text-white/5"></i>
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-4">Pipeline Rationale</h3>
                        <p className="text-lg font-medium leading-relaxed italic text-slate-200">"{state.explanation}"</p>
                      </div>

                      {/* D3 Viz */}
                      <CitationNetwork claims={state.claims} citations={state.citation_results} />

                      {/* Detailed Cards */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {state.claims.map(claim => (
                          <ClaimCard key={claim.id} claim={claim} />
                        ))}
                      </div>

                      {/* Citations List with Metadata */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Academic Verifications</h3>
                        <div className="grid gap-3">
                          {state.citation_results.map((cit, idx) => (
                            <div key={idx} className="glass-dark p-5 rounded-3xl flex items-center justify-between border-l-4 border-l-blue-500">
                              <div>
                                <span className="text-[10px] font-bold text-blue-400 uppercase mb-1 block">{cit.source_type}</span>
                                <p className="text-sm font-bold">{cit.citation}</p>
                                {cit.metadata?.title && <p className="text-[11px] opacity-60 mt-1 italic">"{cit.metadata.title}"</p>}
                              </div>
                              <div className={`px-4 py-1 rounded-full text-[10px] font-black ${cit.verified ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {cit.verified ? 'VERIFIED' : 'INVALID'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <h1 className="text-4xl font-black">History Vault</h1>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map(item => (
                  <div key={item.id} onClick={() => { setState(item.full_state); setView('dashboard'); }} className="glass-dark p-6 rounded-[2rem] hover:scale-[1.02] cursor-pointer transition-all border border-white/5 hover:border-blue-500/30 group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.score > 75 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{item.level}</div>
                      <span className="text-2xl font-black text-white/20 group-hover:text-blue-500/50 transition-colors">{item.score}</span>
                    </div>
                    <p className="text-sm font-medium line-clamp-3 opacity-60 mb-6 italic">"{item.text_preview}"</p>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      <i className="fa-solid fa-chevron-right group-hover:translate-x-1 transition-transform"></i>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'voice' && (
            <motion.div key="voice" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[600px] text-center space-y-8">
              <div className="relative">
                 <div className="w-48 h-48 bg-blue-600/20 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-32 h-32 bg-blue-500/40 rounded-full flex items-center justify-center">
                       <i className="fa-solid fa-microphone-lines text-6xl text-blue-500"></i>
                    </div>
                 </div>
                 {/* Visualizer rings */}
                 <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full animate-ping scale-150 opacity-0"></div>
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black">Voice Analyst v2.5</h1>
                <p className="text-slate-400 max-w-md mx-auto">Real-time conversational audit. Discuss claims naturally and receive low-latency native audio responses.</p>
              </div>
              <button className="px-10 py-5 bg-blue-600 rounded-3xl font-black shadow-2xl shadow-blue-500/30 hover:scale-105 transition-all active:scale-95">
                START LIVE SESSION
              </button>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Native Audio Preview 09-2025</div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Chatbot Button */}
      <div className="fixed bottom-10 right-10 z-[200]">
        <button className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl shadow-2xl flex items-center justify-center hover:rotate-12 transition-all active:scale-90 group relative">
          <i className="fa-solid fa-comment-dots text-2xl text-white"></i>
          <span className="absolute right-full mr-4 bg-slate-900 px-3 py-1 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">AI CONSULTANT</span>
        </button>
      </div>
    </div>
  );
};

export default App;
