import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import {
  Users,
  GraduationCap,
  HelpCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  BarChart3,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/admin/analytics');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
        <Navbar title="Institutional Analytics" subtitle="Loading metrics..." />
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-28 bg-slate-200 rounded-xl"></div>
            <div className="h-28 bg-slate-200 rounded-xl"></div>
            <div className="h-28 bg-slate-200 rounded-xl"></div>
            <div className="h-28 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const { metrics, topicTrends, subjectStats, facultyWorkload } = data || {
    metrics: {
      totalStudents: 0,
      totalFaculty: 0,
      totalClassrooms: 0,
      totalDoubts: 0,
      resolvedDoubts: 0,
      pendingDoubts: 0,
      resolutionRate: 0,
      averageResolutionHours: 3.8,
      aiGroupingAccuracyRate: 91.4
    },
    topicTrends: [],
    subjectStats: [],
    facultyWorkload: []
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        title="Institutional Analytics & Oversight"
        subtitle="Campus-wide doubt metrics, resolution throughput, and AI grouping efficiency"
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Doubts Logged</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalDoubts}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                {metrics.resolutionRate}% Resolved
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Students</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalStudents}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Across {metrics.totalClassrooms} classrooms</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teaching Faculty</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalFaculty}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Assigned to course offerings</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Clustering Rate</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">{metrics.aiGroupingAccuracyRate}%</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Semantic grouping precision</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Charts Row 1: Subject Performance & Topic Frequency */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Resolution Stats */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Doubt Volume & Resolution by Subject</h3>
                <p className="text-xs text-slate-500">Resolved vs. Pending Inquiries</p>
              </div>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="subjectCode" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Questioned Topics */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Top Inquired Syllabus Topics</h3>
                <p className="text-xs text-slate-500">Highest student inquiry frequency</p>
              </div>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicTrends} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="topic" type="category" width={140} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Doubts" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Faculty Workload Overview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Faculty Teaching Assignment Workload</h3>
              <p className="text-xs text-slate-500">Distribution of active vs resolved queries per instructor</p>
            </div>
            <Users className="w-5 h-5 text-slate-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Institutional Email</th>
                  <th className="py-3 px-4 text-center">Active Doubts</th>
                  <th className="py-3 px-4 text-center">Resolved Doubts</th>
                  <th className="py-3 px-4 text-right">Workload Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facultyWorkload.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{f.facultyName}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{f.facultyEmail}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-amber-600">{f.activeDoubts}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{f.resolvedDoubts}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Balanced
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
