"use client";
import React, { useState } from 'react';
import { Lock, Mail, Cpu, ShieldCheck, ArrowRight, ArrowLeft, User, GraduationCap, Building, Percent } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // Step 1: Basic info, Step 2: Education (register only)
  
  // Form fields - Basic
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Form fields - Education
  const [tenthBoard, setTenthBoard] = useState('');
  const [tenthPercentage, setTenthPercentage] = useState('');
  const [twelfthBoard, setTwelfthBoard] = useState('');
  const [twelfthPercentage, setTwelfthPercentage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For registration, go to step 2 first
    if (!isLogin && step === 1) {
      setStep(2);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // For now, just simulate - will connect to backend later
    setTimeout(() => {
      // Store mock token for demo
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('studentId', '1');
      window.location.href = "/";
    }, 1500);
  };

  const handleBack = () => {
    setStep(1);
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
      <main className="relative z-10 w-full max-w-5xl h-auto min-h-[620px] flex bg-[#0A0A0A] border border-white/5 rounded-[3rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
        
        {/* LEFT PANEL: BRANDING & STATUS */}
        <div className="w-[42%] bg-[#0D0D0D] p-12 flex flex-col justify-between border-r border-white/5 relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-10">
              <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
                <Cpu className="text-violet-500" size={20} />
              </div>
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-500">ProfileForge AI</span>
            </div>
            
            <h1 className="text-6xl font-black text-white tracking-tighter leading-[0.9]">
              Student<br />
              <span className="text-violet-600">Portal.</span>
            </h1>
            
            <p className="mt-8 text-slate-500 text-sm font-medium leading-relaxed max-w-[280px]">
              Securely access your academic dossier and AI-powered profile management.
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
        <div className="flex-1 p-12 flex flex-col justify-center bg-[#080808] overflow-y-auto">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-4xl font-black text-white tracking-tighter">
                {isLogin ? "Sign In" : (step === 1 ? "Register" : "Education Details")}
              </h2>
              <p className="text-slate-500 text-sm mt-3 font-medium">
                {isLogin 
                  ? "Enter your credentials to access your profile." 
                  : (step === 1 
                    ? "Create your academic profile." 
                    : "Enter your education information.")}
              </p>
              {!isLogin && (
                <div className="flex gap-2 mt-4">
                  <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-violet-500' : 'bg-white/10'}`} />
                  <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-violet-500' : 'bg-white/10'}`} />
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* STEP 1: Basic Info */}
              {(isLogin || step === 1) && (
                <>
                  {/* Full Name Input (Register only) */}
                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-violet-400 transition-colors">
                          <User size={18} />
                        </div>
                        <input 
                          type="text" 
                          required={!isLogin}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-slate-700"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-violet-400 transition-colors">
                        <Mail size={18} />
                      </div>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@university.edu"
                        className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-slate-700"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* STEP 2: Education Details (Register only) */}
              {!isLogin && step === 2 && (
                <>
                  {/* 10th Standard Section */}
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 text-xs font-black">10</div>
                      10th Standard
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Board</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-violet-400 transition-colors">
                            <Building size={16} />
                          </div>
                          <input 
                            type="text"
                            value={tenthBoard}
                            onChange={(e) => setTenthBoard(e.target.value)}
                            placeholder="CBSE"
                            className="w-full bg-black border border-white/5 rounded-xl py-3 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-slate-700"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Percentage</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-violet-400 transition-colors">
                            <Percent size={16} />
                          </div>
                          <input 
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={tenthPercentage}
                            onChange={(e) => setTenthPercentage(e.target.value)}
                            placeholder="92.5"
                            className="w-full bg-black border border-white/5 rounded-xl py-3 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 12th Standard Section */}
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 text-xs font-black">12</div>
                      12th Standard
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Board</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-violet-400 transition-colors">
                            <Building size={16} />
                          </div>
                          <input 
                            type="text"
                            value={twelfthBoard}
                            onChange={(e) => setTwelfthBoard(e.target.value)}
                            placeholder="CBSE"
                            className="w-full bg-black border border-white/5 rounded-xl py-3 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-slate-700"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Percentage</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-violet-400 transition-colors">
                            <Percent size={16} />
                          </div>
                          <input 
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={twelfthPercentage}
                            onChange={(e) => setTwelfthPercentage(e.target.value)}
                            placeholder="88.3"
                            className="w-full bg-black border border-white/5 rounded-xl py-3 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 text-center">
                    Education details are optional. You can add them later.
                  </p>
                </>
              )}

              {/* Action Buttons */}
              <div className={`flex gap-3 ${!isLogin && step === 2 ? 'mt-6' : 'mt-8'}`}>
                {!isLogin && step === 2 && (
                  <button 
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-4 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-violet-600 hover:text-white transition-all duration-500 active:scale-[0.98] disabled:opacity-50 overflow-hidden relative group"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 border-2 border-black group-hover:border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs tracking-widest uppercase">Creating Account...</span>
                    </div>
                  ) : (
                    <>
                      <span className="tracking-tight">
                        {isLogin ? "SIGN IN" : (step === 1 ? "CONTINUE" : "CREATE ACCOUNT")}
                      </span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* View Toggle */}
            <div className="mt-6 pt-6 border-t border-white/5 text-center">
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setStep(1);
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-violet-400 uppercase tracking-[0.2em] transition-all"
              >
                {isLogin ? "Need an account? Register here" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative Branding Detail */}
      <div className="fixed bottom-8 left-8 flex items-center gap-4 opacity-20 pointer-events-none">
        <div className="h-[1px] w-12 bg-white" />
        <span className="text-[10px] font-mono tracking-widest uppercase">ProfileForge AI // Active</span>
      </div>
    </div>
  );
}