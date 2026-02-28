"use client";
import React, { useState } from 'react';
import { Lock, Mail, ChevronRight, Cpu, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Hackathon Effect: Simulate a secure handshake/loading before redirect
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1500);
  };

  return (
    <div className="h-screen bg-[#050505] text-slate-300 font-sans flex items-center justify-center overflow-hidden relative">
      
      {/* --- AMBIENT BACKGROUND LAYER --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/10 blur-[120px] rounded-full" />
        
        {/* Subtle Scanline Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] opacity-20" />
      </div>

      {/* --- MAIN AUTH CONTAINER --- */}
      <main className="relative z-10 w-full max-w-5xl h-[620px] flex bg-[#0A0A0A] border border-white/5 rounded-[3rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
        
        {/* LEFT PANEL: BRANDING & STATUS */}
        <div className="w-[42%] bg-[#0D0D0D] p-12 flex flex-col justify-between border-r border-white/5 relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-10">
              <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
                <Cpu className="text-violet-500" size={20} />
              </div>
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-500">Nexus LMS v2.0</span>
            </div>
            
            <h1 className="text-6xl font-black text-white tracking-tighter leading-[0.9]">
              Student<br />
              <span className="text-violet-600">Portal.</span>
            </h1>
            
            <p className="mt-8 text-slate-500 text-sm font-medium leading-relaxed max-w-[280px]">
              Securely access your academic dossier and AI-powered profile synchronization.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em]">
              <ShieldCheck size={16} className="text-emerald-500/50" />
              <span>End-to-End Encrypted</span>
            </div>
            <div className="h-[1px] w-full bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          {/* Abstract background shape for flair */}
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl" />
        </div>

        {/* RIGHT PANEL: INTERACTIVE FORM */}
        <div className="flex-1 p-16 flex flex-col justify-center bg-[#080808]">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-12">
              <h2 className="text-4xl font-black text-white tracking-tighter">
                {isLogin ? "Sign In" : "Register"}
              </h2>
              <p className="text-slate-500 text-sm mt-3 font-medium">
                {isLogin ? "Enter your credentials to synchronize data." : "Initialize your academic profile node."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Email Input */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-violet-400 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    required
                    placeholder="student@nexus.edu"
                    className="w-full bg-black border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-slate-800"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Password</label>
                  {isLogin && <button type="button" className="text-[10px] text-slate-600 hover:text-violet-400 uppercase font-bold tracking-tighter transition-colors">Forgot?</button>}
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-violet-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full bg-black border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-slate-800"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-white text-black font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-violet-600 hover:text-white transition-all duration-500 active:scale-[0.98] disabled:opacity-50 overflow-hidden relative group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 border-2 border-black group-hover:border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs tracking-widest uppercase">Initializing...</span>
                  </div>
                ) : (
                  <>
                    <span className="tracking-tight">{isLogin ? "AUTHORIZE ACCESS" : "CREATE ACCOUNT"}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* View Toggle */}
            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[11px] font-bold text-slate-500 hover:text-violet-400 uppercase tracking-[0.2em] transition-all"
              >
                {isLogin ? "Need a new account? Register here" : "Return to secure login portal"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative Branding Detail */}
      <div className="fixed bottom-8 left-8 flex items-center gap-4 opacity-20 pointer-events-none">
        <div className="h-[1px] w-12 bg-white" />
        <span className="text-[10px] font-mono tracking-widest uppercase">System Core // Active</span>
      </div>
    </div>
  );
}