"use client";
import React, { useState, useEffect, useRef } from 'react';
import { User, Send, Award, BookOpen, Sparkles, BrainCircuit, Hash, Terminal, Cpu, MessageSquare, X, ChevronRight } from 'lucide-react';

export default function AestheticSplitDashboard() {
  const [profile, setProfile] = useState({
    name: "Anant",
    major: "AI Engineering",
    gpa: 3.82,
    credits: 64,
    skills: ["Next.js", "Python", "Rust"],
  });

  // State to control AI Sidebar visibility
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Cortex-1 System Online. Standing by for profile optimization." }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightField, setHighlightField] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const val = input.toLowerCase();
    setInput("");
    setIsProcessing(true);

    setTimeout(() => {
      let response = "Instruction processed. No data variance detected.";
      
      if (val.includes("gpa")) {
        const num = val.match(/\d+(\.\d+)?/)?.[0] || "4.0";
        setProfile(p => ({ ...p, gpa: parseFloat(num) }));
        setHighlightField('gpa');
        response = `GPA parameters successfully recalibrated to ${num}.`;
      } else if (val.includes("skill")) {
        const skill = val.split("skill")[1]?.trim() || "Cloud Arch";
        setProfile(p => ({ ...p, skills: [...p.skills, skill] }));
        setHighlightField('skills');
        response = `Skill vector "${skill}" has been integrated into your neural profile.`;
      }

      setMessages(prev => [...prev, { role: 'ai', content: response }]);
      setIsProcessing(false);
      setTimeout(() => setHighlightField(null), 3000);
    }, 1000);
  };

  return (
    <div className="h-screen bg-[#050505] text-slate-300 font-sans flex overflow-hidden relative">
      
      {/* --- LEFT SIDE: THE AI CONTROL STRIP (Conditional Width) --- */}
      <aside className={`transition-all duration-500 ease-in-out border-r border-white/5 flex flex-col relative overflow-hidden bg-[#0A0A0A] ${isAiOpen ? 'w-[35%]' : 'w-0 border-none'}`}>
        {/* Subtle Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-20"></div>

        {/* AI Identity Header */}
        <div className="p-8 pb-4 min-w-[300px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-violet-600 blur-md opacity-30 animate-pulse"></div>
                <Cpu className="relative text-violet-400" size={24} />
              </div>
              <h2 className="text-white font-bold tracking-widest text-xs uppercase">Cortex-1 Agent</h2>
            </div>
            <button onClick={() => setIsAiOpen(false)} className="text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="mt-6 flex gap-2">
            <div className="h-1 flex-1 bg-violet-600/20 rounded-full overflow-hidden">
              <div className={`h-full bg-violet-500 transition-all duration-1000 ${isProcessing ? 'w-full' : 'w-1/3'}`}></div>
            </div>
            <div className="h-1 flex-1 bg-white/5 rounded-full"></div>
            <div className="h-1 flex-1 bg-white/5 rounded-full"></div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide min-w-[300px]">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-tighter ${m.role === 'user' ? 'text-slate-500' : 'text-violet-400'}`}>
                {m.role === 'user' ? <User size={10} /> : <Sparkles size={10} />}
                {m.role === 'user' ? 'Student' : 'AI Assistant'}
              </div>
              <div className={`max-w-[90%] p-4 text-sm font-medium leading-relaxed rounded-2xl ${
                m.role === 'user' 
                ? 'bg-white/5 text-slate-200 border border-white/10 rounded-tr-none' 
                : 'bg-violet-600/10 text-violet-100 border border-violet-500/20 rounded-tl-none shadow-[0_0_20px_rgba(139,92,246,0.05)]'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Dock */}
        <div className="p-6 bg-[#0D0D0D] border-t border-white/5 min-w-[300px]">
          <form onSubmit={handleCommand} className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Sync instructions..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-5 pr-12 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
            />
            <button className="absolute right-2 top-2 p-2 text-violet-400 hover:text-white transition-colors">
              <Send size={20} />
            </button>
          </form>
          <div className="mt-3 flex gap-4 text-[10px] text-slate-600 font-mono">
            <span className="flex items-center gap-1"><Terminal size={10}/> SSH: Secured</span>
            <span className="flex items-center gap-1"><Hash size={10}/> Ver: 2.0.4</span>
          </div>
        </div>
      </aside>

      {/* --- RIGHT SIDE: THE ACADEMIC WORKSPACE --- */}
      <main className="flex-1 relative overflow-y-auto bg-gradient-to-br from-[#050505] to-[#0a0a0c] transition-all duration-500">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="p-16 max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-[1px] w-12 bg-violet-500/50"></div>
              <span className="text-xs font-bold tracking-[0.3em] text-violet-500 uppercase">Profile Dossier</span>
            </div>
            <h1 className="text-7xl font-black text-white tracking-tighter mb-4">
              {profile.name}<span className="text-violet-600">.</span>
            </h1>
            <p className="text-slate-500 text-xl font-light">Senior Year • {profile.major}</p>
          </div>

          <div className="grid grid-cols-2 gap-12">
            
            {/* Metric Card */}
            <div className={`group transition-all duration-700 ${highlightField === 'gpa' ? 'translate-x-4' : ''}`}>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-6xl font-black text-white tracking-tighter">{profile.gpa}</span>
                <span className={`text-xs font-bold uppercase transition-colors duration-500 ${highlightField === 'gpa' ? 'text-violet-400' : 'text-slate-600'}`}>GPA Index</span>
              </div>
              <div className={`h-[1px] w-full bg-white/10 relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-violet-500 transition-all duration-1000 ${highlightField === 'gpa' ? 'translate-x-0' : '-translate-x-full'}`}></div>
              </div>
            </div>

            {/* Metric Card */}
            <div className="group">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-6xl font-black text-white tracking-tighter">{profile.credits}</span>
                <span className="text-xs font-bold uppercase text-slate-600">Credits Completed</span>
              </div>
              <div className="h-[1px] w-full bg-white/10"></div>
            </div>

            {/* Skills Section */}
            <div className={`col-span-2 mt-12 transition-all duration-700 ${highlightField === 'skills' ? 'scale-[1.02]' : ''}`}>
              <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-8 flex items-center gap-3">
                <BookOpen size={14}/> Integrated Expertise
              </h3>
              <div className="flex flex-wrap gap-4">
                {profile.skills.map((s, i) => (
                  <div key={i} className={`px-6 py-4 border rounded-xl transition-all duration-500 ${highlightField === 'skills' && i === profile.skills.length - 1 ? 'border-violet-500 bg-violet-500/5 text-white' : 'border-white/5 bg-white/[0.02] text-slate-400'}`}>
                    <span className="text-sm font-mono tracking-tight">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- FLOATING AI TRIGGER BUTTON (Bottom Left of Workspace) --- */}
        {!isAiOpen && (
          <div className="fixed bottom-10 left-10 z-50 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <button 
              onClick={() => setIsAiOpen(true)}
              className="group flex items-center gap-4 bg-[#0A0A0A] border border-white/10 p-2 pl-6 rounded-full hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300"
            >
              <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 group-hover:text-violet-400 transition-colors uppercase">
                Initialize Cortex
              </span>
              <div className="h-12 w-12 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-900/40 group-hover:scale-110 transition-transform">
                <BrainCircuit size={20} />
              </div>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}