"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Send, Award, BookOpen, GraduationCap, Sparkles, BrainCircuit, 
  Hash, Terminal, Cpu, X, Phone, MapPin, Calendar, Building, 
  Percent, FileText, Clock, CheckCircle, XCircle, AlertCircle,
  Edit2, Save, LogOut, BookMarked
} from 'lucide-react';
import type { Student, EducationDetails, Course, Application, ChatMessage } from './types';

// Mock data - will be replaced with API calls later
const mockStudent: Student = {
  id: 1,
  full_name: "Anant Sharma",
  email: "anant@university.edu",
  phone: "+91 98765 43210",
  date_of_birth: "2002-05-15",
  city: "Mumbai",
  education: {
    id: 1,
    student_id: 1,
    tenth_board: "CBSE",
    tenth_percentage: 92.5,
    twelfth_board: "CBSE",
    twelfth_percentage: 88.3
  }
};

const mockCourses: Course[] = [
  { id: 1, title: "AI & Machine Learning", duration_months: 12, fee: 150000 },
  { id: 2, title: "Full Stack Development", duration_months: 9, fee: 120000 },
  { id: 3, title: "Data Science", duration_months: 10, fee: 130000 },
  { id: 4, title: "Cloud Architecture", duration_months: 8, fee: 100000 },
];

const mockApplications: Application[] = [
  { 
    id: 1, 
    student_id: 1, 
    course_id: 1, 
    status: 'accepted', 
    applied_at: "2024-01-15T10:30:00", 
    reviewed_at: "2024-01-20T14:00:00",
    course: mockCourses[0]
  },
  { 
    id: 2, 
    student_id: 1, 
    course_id: 2, 
    status: 'under_review', 
    applied_at: "2024-02-01T09:00:00", 
    reviewed_at: null,
    course: mockCourses[1]
  },
];

export default function Dashboard() {
  const [student, setStudent] = useState<Student>(mockStudent);
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'education' | 'courses' | 'applications'>('profile');
  
  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingEducation, setIsEditingEducation] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Student>(student);
  const [editedEducation, setEditedEducation] = useState(student.education);

  // AI Sidebar state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: "Hello! I'm your AI assistant. Ask me anything about your profile or use natural language to update your information." }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput("");
    setIsProcessing(true);

    // Mock response - will connect to /chat endpoint later
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "I understand you want to know about that. This will be connected to the backend AI agent soon!"
      }]);
      setIsProcessing(false);
    }, 1000);
  };

  const handleSaveProfile = () => {
    setStudent(editedStudent);
    setIsEditingProfile(false);
  };

  const handleSaveEducation = () => {
    setStudent(prev => ({ ...prev, education: editedEducation }));
    setIsEditingEducation(false);
  };

  const handleApply = (course: Course) => {
    const newApplication: Application = {
      id: Date.now(),
      student_id: student.id,
      course_id: course.id,
      status: 'submitted',
      applied_at: new Date().toISOString(),
      reviewed_at: null,
      course: course
    };
    setApplications(prev => [...prev, newApplication]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="text-emerald-500" size={16} />;
      case 'rejected': return <XCircle className="text-red-500" size={16} />;
      case 'under_review': return <AlertCircle className="text-yellow-500" size={16} />;
      default: return <Clock className="text-slate-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'under_review': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  const hasApplied = (courseId: number) => {
    return applications.some(app => app.course_id === courseId);
  };

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
          <div className="mt-6 flex gap-2">
            <div className={`h-1 flex-1 bg-violet-600/20 rounded-full overflow-hidden`}>
              <div className={`h-full bg-violet-500 transition-all duration-1000 ${isProcessing ? 'w-full' : 'w-1/3'}`}></div>
            </div>
            <div className="h-1 flex-1 bg-white/5 rounded-full"></div>
            <div className="h-1 flex-1 bg-white/5 rounded-full"></div>
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
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-5 pr-12 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
            />
            <button type="submit" className="absolute right-2 top-2 p-2 text-violet-400 hover:text-white transition-colors">
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
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/auth';
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-500 hover:text-white hover:border-white/20 transition-all text-sm"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-10 border-b border-white/5 pb-4">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'education', label: 'Education', icon: GraduationCap },
              { id: 'courses', label: 'Courses', icon: BookMarked },
              { id: 'applications', label: 'Applications', icon: FileText },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${
                  activeTab === tab.id 
                    ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
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
                        onChange={(e) => setEditedStudent(prev => ({ ...prev, full_name: e.target.value }))}
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
                        onChange={(e) => setEditedStudent(prev => ({ ...prev, phone: e.target.value }))}
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
                        onChange={(e) => setEditedStudent(prev => ({ ...prev, date_of_birth: e.target.value }))}
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
                        onChange={(e) => setEditedStudent(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Enter your city"
                        className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500/50"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-white">{student.city || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase flex items-center gap-3">
                    <GraduationCap size={14}/> Education Details
                  </h2>
                  <button 
                    onClick={() => isEditingEducation ? handleSaveEducation() : setIsEditingEducation(true)}
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
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div className="space-y-6">
                <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase flex items-center gap-3">
                  <BookMarked size={14}/> Available Courses
                </h2>
                
                <div className="grid grid-cols-2 gap-6">
                  {courses.map(course => (
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
                        onClick={() => !hasApplied(course.id) && handleApply(course)}
                        disabled={hasApplied(course.id)}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                          hasApplied(course.id)
                            ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                            : 'bg-violet-600 text-white hover:bg-violet-700'
                        }`}
                      >
                        {hasApplied(course.id) ? 'Already Applied' : 'Apply Now'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div className="space-y-6">
                <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase flex items-center gap-3">
                  <FileText size={14}/> My Applications
                </h2>
                
                {applications.length === 0 ? (
                  <div className="p-12 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                    <FileText className="mx-auto text-slate-600 mb-4" size={48} />
                    <p className="text-slate-500">No applications yet. Apply for a course to get started!</p>
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
                            <p className="text-sm text-slate-500">Applied on {formatDate(app.applied_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${getStatusColor(app.status)}`}>
                            {getStatusIcon(app.status)}
                            {app.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
