"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Send, Award, BookOpen, GraduationCap, Sparkles, BrainCircuit, 
  Hash, Terminal, Cpu, X, Phone, MapPin, Calendar, Building, 
  Percent, FileText, Clock, Edit2, Save, LogOut, BookMarked
} from 'lucide-react';
import type { Student, Course, Application, ChatMessage, AIActivityLog } from './types';
import { chatApi, courseApi, studentApi } from './lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [aiLogs, setAiLogs] = useState<AIActivityLog[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  
  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingEducation, setIsEditingEducation] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);
  const [editedEducation, setEditedEducation] = useState<Student['education']>(null);

  // AI Sidebar state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: "Hello! I'm your AI assistant. Ask me anything about your profile or use natural language to update your information." }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const refreshDashboardData = async (authToken: string) => {
    const [profile, courseList, applicationList, logEntries] = await Promise.all([
      studentApi.getProfile(authToken),
      courseApi.list(),
      studentApi.getApplications(authToken),
      studentApi.getAiLogs(authToken, 50),
    ]);

    setStudent(profile);
    setEditedStudent(profile);
    setEditedEducation(
      profile.education ?? {
        id: 0,
        student_id: profile.id,
        tenth_board: null,
        tenth_percentage: null,
        twelfth_board: null,
        twelfth_percentage: null,
      }
    );
    setCourses(courseList);
    setApplications(applicationList);
    setAiLogs(logEntries);
  };

  useEffect(() => {
    const existingToken = localStorage.getItem('token');
    if (!existingToken) {
      router.replace('/auth');
      setLoading(false);
      return;
    }

    setToken(existingToken);

    const bootstrap = async () => {
      try {
        await refreshDashboardData(existingToken);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('studentId');
    router.replace('/auth');
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !input.trim() || !token) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput("");
    setIsProcessing(true);

    try {
      const chatResponse = await chatApi.send(userMessage, token);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: chatResponse.response,
      }]);

      const isCommandLikeMessage = /\b(update|change|set|add|remove|delete|apply)\b/i.test(userMessage);
      if (chatResponse.success && isCommandLikeMessage) {
        await refreshDashboardData(token);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: error instanceof Error ? error.message : 'Chat request failed',
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedStudent || !token) return;
    try {
      const updatedStudent = await studentApi.updateProfile(
        {
          full_name: editedStudent.full_name,
          phone: editedStudent.phone ?? undefined,
          date_of_birth: editedStudent.date_of_birth ?? undefined,
          city: editedStudent.city ?? undefined,
        },
        token
      );

      setStudent(updatedStudent);
      setEditedStudent(updatedStudent);
      setEditedEducation(updatedStudent.education);
      setIsEditingProfile(false);
      setActionMessage('Profile updated successfully.');
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Failed to update profile.');
    }
  };

  const handleSaveEducation = async () => {
    if (!editedEducation || !student || !token) return;

    const payload = {
      tenth_board: editedEducation.tenth_board ?? undefined,
      tenth_percentage: editedEducation.tenth_percentage ?? undefined,
      twelfth_board: editedEducation.twelfth_board ?? undefined,
      twelfth_percentage: editedEducation.twelfth_percentage ?? undefined,
    };

    try {
      let updatedEducation = null;
      if (student.education) {
        updatedEducation = await studentApi.updateEducation(payload, token);
      } else {
        updatedEducation = await studentApi.createEducation(payload, token);
      }

      const updatedStudent = { ...student, education: updatedEducation };
      setStudent(updatedStudent);
      setEditedEducation(updatedEducation);
      setIsEditingEducation(false);
      setActionMessage('Education details updated successfully.');
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Failed to update education details.');
    }
  };

  const handleApply = async (course: Course) => {
    if (!token) return;
    try {
      await studentApi.applyForCourse(course.id, token);
      const refreshedApplications = await studentApi.getApplications(token);
      setApplications(refreshedApplications);
      setActionMessage(`Applied for ${course.title}.`);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Failed to apply for course.');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  const formatTimestamp = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const summarizeLog = (log: AIActivityLog) => {
    if (typeof log.query === 'string') return log.query;
    if (typeof log.command === 'string') return log.command;
    if (typeof log.response === 'string') return log.response;
    if (typeof log.error === 'string') return log.error;
    return 'Activity recorded';
  };

  const appliedCourseIds = new Set(
    applications
      .map((app) => app.course_id ?? app.course?.id)
      .filter((id): id is number => Boolean(id))
  );

  const hasApplied = (courseId: number) => appliedCourseIds.has(courseId);

  const availableCourses = courses.filter((course) => !hasApplied(course.id));

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] text-slate-300 font-sans flex items-center justify-center">
        <div className="text-sm tracking-wider uppercase text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  if (pageError || !student || !editedStudent) {
    return (
      <div className="h-screen bg-[#050505] text-slate-300 font-sans flex items-center justify-center px-6">
        <div className="max-w-xl p-8 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
          <p className="text-red-400 mb-4">{pageError ?? 'Unable to load student profile.'}</p>
          <button
            onClick={handleSignOut}
            className="px-5 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] text-slate-300 font-sans flex overflow-hidden relative">
      
      {/* --- LEFT SIDE: AI CHAT SIDEBAR --- */}
      <aside className={`transition-all duration-500 ease-in-out border-r border-white/5 flex flex-col relative overflow-hidden bg-[#0A0A0A] ${isAiOpen ? 'w-[35%]' : 'w-0 border-none'}`}>
        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-20"></div>

        {/* AI Header */}
        <div className="p-8 pb-4 min-w-[300px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-violet-600 blur-md opacity-30 animate-pulse"></div>
                <Cpu className="relative text-violet-400" size={24} />
              </div>
              <h2 className="text-white font-bold tracking-widest text-xs uppercase">AI Assistant</h2>
            </div>
            <button onClick={() => setIsAiOpen(false)} className="text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide min-w-[300px]">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-tighter ${m.role === 'user' ? 'text-slate-500' : 'text-violet-400'}`}>
                {m.role === 'user' ? <User size={10} /> : <Sparkles size={10} />}
                {m.role === 'user' ? 'You' : 'AI Assistant'}
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
          {isProcessing && (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-tighter text-violet-400">
                <Sparkles size={10} />
                AI Assistant
              </div>
              <div className="max-w-[90%] p-4 text-sm font-medium leading-relaxed rounded-2xl bg-violet-600/10 text-violet-100 border border-violet-500/20 rounded-tl-none shadow-[0_0_20px_rgba(139,92,246,0.05)] animate-pulse">
                Thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-6 bg-[#0D0D0D] border-t border-white/5 min-w-[300px]">
          <form onSubmit={handleChatSubmit} className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your profile or request updates..."
              disabled={isProcessing}
              className={`w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-5 pr-12 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
            <button
              type="submit"
              disabled={isProcessing}
              className={`absolute right-2 top-2 p-2 text-violet-400 transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
            >
              <Send size={20} />
            </button>
          </form>
          <div className="mt-3 flex gap-4 text-[10px] text-slate-600 font-mono">
            <span className="flex items-center gap-1"><Terminal size={10}/> Connected</span>
            <span className="flex items-center gap-1"><Hash size={10}/> AI Powered</span>
          </div>
        </div>
      </aside>

      {/* --- RIGHT SIDE: MAIN DASHBOARD --- */}
      <main className="flex-1 relative overflow-y-auto bg-gradient-to-br from-[#050505] to-[#0a0a0c] transition-all duration-500">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="p-10 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-[1px] w-12 bg-violet-500/50"></div>
                <span className="text-xs font-bold tracking-[0.3em] text-violet-500 uppercase">Student Dashboard</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
                {student.full_name}<span className="text-violet-600">.</span>
              </h1>
              <p className="text-slate-500 text-lg font-light">{student.email}</p>
            </div>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-500 hover:text-white hover:border-white/20 transition-all text-sm"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>

          {actionMessage && (
            <div className="mb-8 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">
              {actionMessage}
            </div>
          )}

          {/* Single-page sections */}
          <div className="space-y-10">
            {/* Profile */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase flex items-center gap-3">
                    <User size={14}/> Personal Information
                  </h2>
                  <button 
                    onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      isEditingProfile 
                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                        : 'border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {isEditingProfile ? <><Save size={14}/> Save</> : <><Edit2 size={14}/> Edit</>}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-2">
                      <User size={12}/> Full Name
                    </label>
                    {isEditingProfile ? (
                      <input 
                        type="text"
                        value={editedStudent.full_name}
                        onChange={(e) => setEditedStudent({ ...editedStudent, full_name: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500/50"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-white">{student.full_name}</p>
                    )}
                  </div>

                  {/* Email (Read-only) */}
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-2">
                      <FileText size={12}/> Email Address
                    </label>
                    <p className="text-2xl font-bold text-white">{student.email}</p>
                    <p className="text-xs text-slate-600 mt-1">Cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-2">
                      <Phone size={12}/> Phone Number
                    </label>
                    {isEditingProfile ? (
                      <input 
                        type="tel"
                        value={editedStudent.phone || ''}
                        onChange={(e) => setEditedStudent({ ...editedStudent, phone: e.target.value })}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500/50"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-white">{student.phone || 'Not set'}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-2">
                      <Calendar size={12}/> Date of Birth
                    </label>
                    {isEditingProfile ? (
                      <input 
                        type="date"
                        value={editedStudent.date_of_birth || ''}
                        onChange={(e) => setEditedStudent({ ...editedStudent, date_of_birth: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500/50"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-white">{formatDate(student.date_of_birth)}</p>
                    )}
                  </div>

                  {/* City */}
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-2">
                      <MapPin size={12}/> City
                    </label>
                    {isEditingProfile ? (
                      <input 
                        type="text"
                        value={editedStudent.city || ''}
                        onChange={(e) => setEditedStudent({ ...editedStudent, city: e.target.value })}
                        placeholder="Enter your city"
                        className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500/50"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-white">{student.city || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>

            {/* Education */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase flex items-center gap-3">
                    <GraduationCap size={14}/> Education Details
                  </h2>
                  <button 
                    onClick={() =>
                      isEditingEducation
                        ? handleSaveEducation()
                        : (() => {
                            if (!editedEducation && student) {
                              setEditedEducation({
                                id: 0,
                                student_id: student.id,
                                tenth_board: null,
                                tenth_percentage: null,
                                twelfth_board: null,
                                twelfth_percentage: null,
                              });
                            }
                            setIsEditingEducation(true);
                          })()
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      isEditingEducation 
                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                        : 'border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {isEditingEducation ? <><Save size={14}/> Save</> : <><Edit2 size={14}/> Edit</>}
                  </button>
                </div>

                {/* 10th Standard */}
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 text-sm font-black">10</div>
                    10th Standard
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 block flex items-center gap-2">
                        <Building size={12}/> Board
                      </label>
                      {isEditingEducation ? (
                        <input 
                          type="text"
                          value={editedEducation?.tenth_board || ''}
                          onChange={(e) => setEditedEducation(prev => prev ? { ...prev, tenth_board: e.target.value } : null)}
                          placeholder="e.g., CBSE, ICSE, State Board"
                          className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500/50"
                        />
                      ) : (
                        <p className="text-3xl font-black text-white">{student.education?.tenth_board || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 block flex items-center gap-2">
                        <Percent size={12}/> Percentage
                      </label>
                      {isEditingEducation ? (
                        <input 
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editedEducation?.tenth_percentage || ''}
                          onChange={(e) => setEditedEducation(prev => prev ? { ...prev, tenth_percentage: parseFloat(e.target.value) } : null)}
                          placeholder="e.g., 92.5"
                          className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500/50"
                        />
                      ) : (
                        <p className="text-3xl font-black text-white">
                          {student.education?.tenth_percentage !== null ? `${student.education?.tenth_percentage}%` : 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 12th Standard */}
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 text-sm font-black">12</div>
                    12th Standard
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 block flex items-center gap-2">
                        <Building size={12}/> Board
                      </label>
                      {isEditingEducation ? (
                        <input 
                          type="text"
                          value={editedEducation?.twelfth_board || ''}
                          onChange={(e) => setEditedEducation(prev => prev ? { ...prev, twelfth_board: e.target.value } : null)}
                          placeholder="e.g., CBSE, ICSE, State Board"
                          className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500/50"
                        />
                      ) : (
                        <p className="text-3xl font-black text-white">{student.education?.twelfth_board || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 block flex items-center gap-2">
                        <Percent size={12}/> Percentage
                      </label>
                      {isEditingEducation ? (
                        <input 
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editedEducation?.twelfth_percentage || ''}
                          onChange={(e) => setEditedEducation(prev => prev ? { ...prev, twelfth_percentage: parseFloat(e.target.value) } : null)}
                          placeholder="e.g., 88.3"
                          className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500/50"
                        />
                      ) : (
                        <p className="text-3xl font-black text-white">
                          {student.education?.twelfth_percentage !== null ? `${student.education?.twelfth_percentage}%` : 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            {/* My Courses (enrolled) */}
            <div className="space-y-6">
              <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase flex items-center gap-3">
                <FileText size={14}/> My Courses
              </h2>

              {applications.length === 0 ? (
                <div className="p-12 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                  <FileText className="mx-auto text-slate-600 mb-4" size={48} />
                  <p className="text-slate-500">You have no enrolled courses yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map(app => (
                    <div key={app.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
                          <BookOpen className="text-violet-400" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{app.course?.title}</h3>
                          <p className="text-sm text-slate-500">Enrolled on {formatDate(app.applied_at)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>Duration</span>
                          <span className="text-white font-medium">
                            {app.course?.duration_months ? `${app.course.duration_months} months` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award size={14} />
                          <span>Fee</span>
                          <span className="text-white font-medium">
                            {typeof app.course?.fee === 'number' ? `₹${app.course.fee.toLocaleString()}` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Activity Logs */}
            <div className="space-y-6">
              <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase flex items-center gap-3">
                <Terminal size={14}/> AI Activity
              </h2>

              {aiLogs.length === 0 ? (
                <div className="p-12 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                  <Terminal className="mx-auto text-slate-600 mb-4" size={48} />
                  <p className="text-slate-500">No AI activity logged yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiLogs.map((log, idx) => (
                    <div key={`${log.ts}-${idx}`} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-xs text-slate-500 uppercase tracking-[0.15em]">
                          <span className="px-3 py-1 rounded-full bg-white/5 text-white/80 border border-white/10 font-bold">{log.kind}</span>
                          <span>{formatTimestamp(log.ts)}</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                          {summarizeLog(log)}
                        </p>
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono bg-black/30 border border-white/5 rounded-lg px-3 py-2 max-w-xs break-words">
                        {log.query !== undefined && <div className="mb-1"><span className="text-slate-500">Q:</span> <span>{String(log.query)}</span></div>}
                        {log.command !== undefined && <div className="mb-1"><span className="text-slate-500">CMD:</span> <span>{String(log.command)}</span></div>}
                        {log.response !== undefined && <div className="mb-1"><span className="text-slate-500">RES:</span> <span>{String(log.response)}</span></div>}
                        {log.error !== undefined && <div className="text-red-400"><span className="text-slate-500">ERR:</span> <span>{String(log.error)}</span></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Courses */}
            <div className="space-y-6">
                <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase flex items-center gap-3">
                  <BookMarked size={14}/> Available Courses
                </h2>
                
                {availableCourses.length === 0 ? (
                  <div className="p-12 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                    <BookMarked className="mx-auto text-slate-600 mb-4" size={48} />
                    <p className="text-slate-500">All courses are already in your list.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {availableCourses.map(course => (
                      <div key={course.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-violet-500/20 transition-all">
                        <h3 className="text-xl font-bold text-white mb-4">{course.title}</h3>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 flex items-center gap-2">
                              <Clock size={14}/> Duration
                            </span>
                            <span className="text-white font-medium">{course.duration_months} months</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 flex items-center gap-2">
                              <Award size={14}/> Fee
                            </span>
                            <span className="text-white font-medium">₹{course.fee?.toLocaleString()}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleApply(course)}
                          className="w-full py-3 rounded-xl font-bold text-sm transition-all bg-violet-600 text-white hover:bg-violet-700"
                        >
                          Enroll Now
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Floating AI Trigger Button */}
        {!isAiOpen && (
          <div className="fixed bottom-10 left-10 z-50 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <button 
              onClick={() => setIsAiOpen(true)}
              className="group flex items-center gap-4 bg-[#0A0A0A] border border-white/10 p-2 pl-6 rounded-full hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300"
            >
              <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 group-hover:text-violet-400 transition-colors uppercase">
                AI Assistant
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
