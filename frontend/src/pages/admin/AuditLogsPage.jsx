import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import { FileText, Search, Shield, Filter } from 'lucide-react';

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      params.append('limit', 50);

      const res = await api.get(`/admin/audit-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        title="Institutional Audit Logs"
        subtitle="Immutable security trail of administrative actions, privacy access, and group operations"
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="">All Security & Audit Events</option>
              <option value="user_login">User Login</option>
              <option value="user_created">User Created</option>
              <option value="user_updated">Academic / Assignment Updated</option>
              <option value="user_suspended">User Suspended</option>
              <option value="doubt_submitted">Doubt Submitted</option>
              <option value="doubt_reassigned">Doubt Reassigned</option>
              <option value="group_split">Group Split</option>
              <option value="group_merged">Group Merged</option>
              <option value="answer_published">Answer Published</option>
              <option value="anonymous_identity_accessed">Anonymous Identity Accessed</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Showing latest {logs.length} events
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 space-y-3 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No audit log records found.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-5">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">Metadata</th>
                    <th className="py-3 px-4 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {logs.map(log => (
                    <tr key={log._id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5 text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-800">
                        {log.actor?.name || 'System'} ({log.actor?.role || 'Service'})
                      </td>
                      <td className="py-3.5 px-4 text-brand-600 font-sans font-semibold">
                        {log.affectedResource?.modelName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-sans truncate max-w-xs">
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400">
                        {log.ipAddress || '127.0.0.1'}
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
