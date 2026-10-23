import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge.jsx';
import { HelpCircle, Search, Filter, PlusCircle, ArrowRight } from 'lucide-react';

export function MyDoubtsPage() {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchDoubts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', page);
      params.append('limit', 12);

      const res = await api.get(`/doubts/my?${params.toString()}`);
      if (res.data.success) {
        setDoubts(res.data.doubts);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch doubts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, [statusFilter, page]);

  const filteredDoubts = doubts.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar title="My Doubts" subtitle="Track your question history, AI processing status, and faculty responses" />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Controls & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 w-full md:w-auto items-center space-x-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search doubt titles or topics..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="under_review">Under Review</option>
                <option value="answered">Answered</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <Link
            to="/student/ask"
            className="w-full md:w-auto px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ask New Doubt</span>
          </Link>
        </div>

        {/* Doubts Grid / List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-44 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        ) : filteredDoubts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">No Doubts Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {statusFilter
                ? `You have no doubts matching the '${statusFilter}' filter.`
                : 'You have not submitted any academic doubts yet.'}
            </p>
            <Link
              to="/student/ask"
              className="inline-block px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-brand-700 mt-2"
            >
              Ask a Doubt
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoubts.map(doubt => (
              <Link
                key={doubt._id}
                to={`/student/doubts/${doubt._id}`}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-brand-300 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                    <span className="font-bold text-brand-600 uppercase tracking-wider">
                      {doubt.subject?.code} · {doubt.topic}
                    </span>
                    <PriorityBadge priority={doubt.priority} />
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2">
                    {doubt.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {doubt.questionText}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={doubt.resolutionStatus} />
                    {doubt.privacyMode === 'anonymous' && (
                      <span className="text-[10px] text-slate-500 font-medium">🔒 Anon</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(doubt.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
