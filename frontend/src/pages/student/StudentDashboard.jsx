import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Navbar } from '../../components/common/Navbar.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';
import {
  HelpCircle,
  CheckCircle2,
  Clock,
  BookOpen,
  PlusCircle,
  MessageSquare,
  Sparkles,
  ArrowRight,
  GraduationCap
} from 'lucide-react';

export function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get('/student/dashboard');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
        <Navbar title="Student Academic Dashboard" subtitle="Loading metrics..." />
        <div className="p-8 space-y-6 animate-pulse max-w-7xl mx-auto w-full">
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-28 bg-slate-200 rounded-xl"></div>
            <div className="h-28 bg-slate-200 rounded-xl"></div>
            <div className="h-28 bg-slate-200 rounded-xl"></div>
            <div className="h-28 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const { stats, profile, recentDoubts, recommendedArticles } = data || {
    stats: { totalSubmitted: 0, answeredCount: 0, pendingCount: 0, activeClassesCount: 1 },
    profile: null,
    recentDoubts: [],
    recommendedArticles: []
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        title="Student Dashboard"
        subtitle={`Welcome back, ${user?.name} · Academic Year ${profile?.academicYear || 'pending'}`}
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Welcome & Profile Summary Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              AI-Powered Doubt Resolution Active
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Submit your academic questions anytime. Our AI engine groups matching queries and alerts your course professors for prompt resolution.
            </p>
          </div>

          {/* Student Profile Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-xs space-y-1.5 shrink-0 min-w-[220px]">
            <p className="text-brand-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" /> Academic Enrollment
            </p>
            <div className="text-slate-200 space-y-1 pt-1">
              <div className="flex justify-between"><span className="text-slate-400">Program:</span> <span className="font-semibold">{profile?.programRef?.name || profile?.program || 'Pending selection'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Semester:</span> <span className="font-semibold">{profile?.semester ? `Sem ${profile.semester} · Sec ${profile.section}` : 'Pending selection'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Roll No:</span> <span className="font-mono text-cyan-300 font-bold">{profile?.rollNumber || 'Not assigned'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Student ID:</span> <span className="font-mono">{profile?.studentId || 'Not assigned'}</span></div>
              <Link to="/student/profile" className="inline-block pt-1 text-cyan-300 hover:text-white font-semibold">View academic profile →</Link>
            </div>
          </div>
        </div>

        {profile?.academicProfileStatus === 'pending' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-amber-900 text-sm">Complete your academic profile</p>
              <p className="text-xs text-amber-800 mt-1">Choose your initial classroom once to unlock your enrolled subjects and doubt submission.</p>
            </div>
            <Link to="/student/profile" className="shrink-0 px-4 py-2 rounded-lg bg-amber-700 text-white text-xs font-bold hover:bg-amber-800">
              Select my class
            </Link>
          </div>
        )}

        {/* Real Dynamic Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doubts Asked</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalSubmitted}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Lifetime submissions</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved / Answered</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.answeredCount}</h3>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">With faculty explanation</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingCount}</h3>
              <p className="text-[11px] text-amber-600/80 mt-0.5">Faculty reviewing</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Subjects</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">{stats.activeSubjectsCount || 0}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Active curriculum</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/student/ask"
            className="p-4 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/20 rounded-lg">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Ask a New Doubt</h4>
                <p className="text-xs text-brand-100">AI auto-groups & routes to faculty</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            to="/chat"
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-brand-300 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-brand-50 text-brand-600 rounded-lg">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Live Academic Chat</h4>
                <p className="text-xs text-slate-500">Subject rooms & college lounge</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            to="/knowledge-base"
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-brand-300 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Knowledge Base</h4>
                <p className="text-xs text-slate-500">Approved faculty explanations</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Recent Doubts Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Doubts & Progress</h3>
              <p className="text-xs text-slate-500">Real-time resolution updates from your faculty</p>
            </div>
            <Link
              to="/student/doubts"
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              View All Doubts <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentDoubts.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No doubts submitted yet</p>
                <p className="text-xs text-slate-500">Have a question from today's lecture? Submit it to get started!</p>
                <Link
                  to="/student/ask"
                  className="inline-block mt-3 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-brand-700"
                >
                  Ask First Doubt
                </Link>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Question</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Topic</th>
                    <th className="py-3 px-4">Faculty Assigned</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recentDoubts.map(d => (
                    <tr key={d._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-900 max-w-xs truncate">
                        <Link to={`/student/doubts/${d._id}`} className="hover:text-brand-600 transition-colors">
                          {d.title}
                        </Link>
                        {d.privacyMode === 'anonymous' && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-normal">
                            🔒 Anonymous
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">{d.subject?.code}</td>
                      <td className="py-3.5 px-4 text-slate-600">{d.topic}{d.subtopic ? ` · ${d.subtopic}` : ''}</td>
                      <td className="py-3.5 px-4 text-slate-600">{d.assignedFaculty?.name || 'Assigned'}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={d.resolutionStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/student/doubts/${d._id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 rounded transition-colors"
                        >
                          View Thread
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* AI Suggested Explanations from Knowledge Base */}
        {recommendedArticles.length > 0 && (
          <div className="bg-indigo-50/40 rounded-2xl border border-indigo-100/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Faculty-Approved Explanations for Your Courses</h3>
                  <p className="text-xs text-slate-500">Instant answers verified by course instructors</p>
                </div>
              </div>
              <Link to="/knowledge-base" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                Explore Repository
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedArticles.map(art => (
                <Link
                  key={art._id}
                  to={`/knowledge-base/${art._id}`}
                  className="p-4 bg-white rounded-xl border border-indigo-100 hover:border-indigo-300 shadow-sm hover:shadow transition-all group"
                >
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    {art.subject?.code} · {art.topic}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1 group-hover:text-indigo-600 transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {art.approvedExplanation}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
