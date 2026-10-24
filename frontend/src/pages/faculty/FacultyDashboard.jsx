import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Navbar } from '../../components/common/Navbar.jsx';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge.jsx';
import {
  HelpCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Lock
} from 'lucide-react';

export function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/faculty/dashboard');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load faculty dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
        <Navbar title="Faculty Workspace" subtitle="Loading operational queue..." />
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
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

  const { stats, recentDoubts, activeGroups, assignments } = data || {
    stats: {
      pendingDoubtsCount: 0,
      resolvedDoubtsCount: 0,
      suggestedGroupsCount: 0,
      awaitingReviewCount: 0,
      activeAssignmentsCount: 0,
      averageResponseTimeHours: 4.2
    },
    recentDoubts: [],
    activeGroups: [],
    assignments: []
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        title="Faculty Academic Workspace"
        subtitle={`Welcome, ${user?.name} · Multi-Class Doubt Queue & AI Grouping Operations`}
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900">My current teaching assignments</h2>
              <p className="text-xs text-slate-500 mt-1">Doubt access is limited to these active class-subjects.</p>
            </div>
            <Link to="/faculty/profile" className="text-xs font-semibold text-brand-600 hover:text-brand-800">View profile</Link>
          </div>
          {assignments?.length ? (
            <div className="flex flex-wrap gap-2">
              {assignments.map(assignment => (
                <span key={assignment._id} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                  <strong>{assignment.classSubject?.subject?.code}</strong> · {assignment.classSubject?.subject?.name} — {assignment.classSubject?.classroom?.program?.code} {assignment.classSubject?.classroom?.branch}, Sem {assignment.classSubject?.classroom?.semester}, Sec {assignment.classSubject?.classroom?.section}
                </span>
              ))}
            </div>
          ) : <p className="text-xs text-amber-700">No active teaching assignments. Contact an administrator.</p>}
        </section>
        {/* Workload Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Doubts</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingDoubtsCount}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting instructor response</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved Doubts</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.resolvedDoubtsCount}</h3>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">Official answers delivered</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Semantic Groups</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">{activeGroups.length}</h3>
              <p className="text-[11px] text-indigo-600/80 mt-0.5">Answer once for all students</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Response Time</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.averageResponseTimeHours} hrs</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Within SLA guidelines</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* AI Groups & Fast Resolution Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                AI Smart Doubt Clustering
              </div>
              <h2 className="text-xl md:text-2xl font-bold">
                Resolve Multiple Inquiries with One Comprehensive Explanation
              </h2>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-xl">
                The AIDMS engine groups semantically equivalent queries from your classes. Publishing an answer resolves all linked doubts simultaneously while maintaining complete individual privacy.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/faculty/groups"
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>Manage AI Doubt Groups</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/faculty/queue"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all"
              >
                Open Full Doubt Queue
              </Link>
            </div>
          </div>

          {/* Quick Stats on Groups */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Active Concept Cohorts
              </h3>
              <div className="space-y-2">
                {activeGroups.slice(0, 3).map(grp => (
                  <Link
                    key={grp._id}
                    to={`/faculty/groups`}
                    className="block p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 transition-colors"
                  >
                    <span className="text-[10px] font-bold text-brand-600 uppercase">
                      {grp.subject?.code} · {grp.topic}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                      {grp.representativeTitle}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <Link
              to="/faculty/groups"
              className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center justify-between pt-2 border-t border-slate-100"
            >
              <span>View All Groups</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Priority Doubt Queue Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Recent Student Doubts</h3>
              <p className="text-xs text-slate-500">Authorized class & subject assignments</p>
            </div>
            <Link
              to="/faculty/queue"
              className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              Open Full Queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentDoubts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active doubts in your queue. All caught up!
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-5">Question</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Received</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recentDoubts.map(d => (
                    <tr key={d._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-900 max-w-xs truncate">
                        {d.title}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">{d.subject?.code}</td>
                      <td className="py-3.5 px-4">
                        {d.privacyMode === 'anonymous' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">
                            <Lock className="w-3 h-3 text-slate-400" /> Anonymous
                          </span>
                        ) : (
                          <span className="font-medium text-slate-800">{d.student?.name}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={d.priority} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={d.resolutionStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/faculty/queue?id=${d._id}`}
                          className="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg font-bold text-xs transition-colors"
                        >
                          Respond
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
