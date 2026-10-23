import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge.jsx';
import {
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  X,
  Send,
  Eye,
  BookOpen
} from 'lucide-react';

export function DoubtQueuePage() {
  const [doubts, setDoubts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClassSubject, setSelectedClassSubject] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Answer Modal
  const [activeDoubt, setActiveDoubt] = useState(null);
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [publishToKB, setPublishToKB] = useState(false);

  useEffect(() => {
    async function loadAssignments() {
      try {
        const res = await api.get('/faculty/assignments');
        if (res.data.success) {
          setAssignments(res.data.assignments);
        }
      } catch (err) {
        console.error('Failed to load assignments:', err);
      }
    }
    loadAssignments();
  }, []);

  const fetchDoubts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClassSubject) params.append('classSubjectId', selectedClassSubject);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const res = await api.get(`/faculty/doubts?${params.toString()}`);
      if (res.data.success) {
        setDoubts(res.data.doubts);
      }
    } catch (err) {
      console.error('Failed to load faculty doubts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, [selectedClassSubject, statusFilter, priorityFilter]);

  const handleOpenAnswerModal = doubt => {
    setActiveDoubt(doubt);
    // Pre-populate with AI draft if available
    setAnswerContent(doubt.aiDraftAnswer?.content || '');
    setPublishToKB(false);
  };

  const handlePublishAnswer = async e => {
    e.preventDefault();
    if (!answerContent.trim()) return;

    setSubmittingAnswer(true);
    try {
      const res = await api.post(`/faculty/doubts/${activeDoubt._id}/answers`, {
        content: answerContent,
        publishToKnowledgeBase: publishToKB
      });

      if (res.data.success) {
        // Update doubt in local state
        setDoubts(prev =>
          prev.map(d =>
            d._id === activeDoubt._id ? { ...d, resolutionStatus: 'answered' } : d
          )
        );
        setActiveDoubt(null);
        setAnswerContent('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleUpdateStatus = async (doubtId, newStatus) => {
    try {
      const res = await api.patch(`/faculty/doubts/${doubtId}/status`, { status: newStatus });
      if (res.data.success) {
        setDoubts(prev =>
          prev.map(d => (d._id === doubtId ? { ...d, resolutionStatus: newStatus } : d))
        );
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredDoubts = doubts.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.student?.name && d.student.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        title="Faculty Doubt Queue"
        subtitle="Manage and answer questions across your authorized classes and subjects"
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Filters and Controls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search doubt title, topic, or student..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            {/* Class-Subject Filter */}
            <select
              value={selectedClassSubject}
              onChange={e => setSelectedClassSubject(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="">All Assigned Classes & Subjects</option>
              {assignments.map(a => (
                <option key={a.classSubject?._id} value={a.classSubject?._id}>
                  {a.classSubject?.subject?.code} - {a.classSubject?.subject?.name} (Sem {a.classSubject?.classroom?.semester}{a.classSubject?.classroom?.section})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="under_review">Under Review</option>
              <option value="answered">Answered</option>
              <option value="resolved">Resolved</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Doubts Queue Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 space-y-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
                ))}
              </div>
            ) : filteredDoubts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No doubts found</p>
                <p className="text-xs text-slate-400">All student questions in this view have been resolved.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-5">Question & Topic</th>
                    <th className="py-3 px-4">Subject & Class</th>
                    <th className="py-3 px-4">Submitter Identity</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredDoubts.map(d => (
                    <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5 max-w-sm">
                        <div className="font-bold text-slate-900 line-clamp-1">{d.title}</div>
                        <p className="text-slate-500 line-clamp-1 mt-0.5 text-[11px]">{d.questionText}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                            {d.topic}
                          </span>
                          {d.group && (
                            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Grouped
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800 block">{d.subject?.code}</span>
                        <span className="text-[11px] text-slate-400">
                          Sem {d.classSubject?.classroom?.semester}{d.classSubject?.classroom?.section}
                        </span>
                      </td>

                      {/* Section 12 Rule: Anonymous students MUST be masked in faculty view */}
                      <td className="py-4 px-4">
                        {d.privacyMode === 'anonymous' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                            <Lock className="w-3 h-3 text-slate-400" />
                            Anonymous Student
                          </span>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-900 block">{d.student?.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{d.student?.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <PriorityBadge priority={d.priority} />
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={d.resolutionStatus} />
                      </td>

                      <td className="py-4 px-4 text-slate-400 text-[11px]">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-4 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenAnswerModal(d)}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Answer
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(
                              d._id,
                              d.resolutionStatus === 'resolved' ? 'reopened' : 'resolved'
                            )
                          }
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          {d.resolutionStatus === 'resolved' ? 'Reopen' : 'Resolve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Answer Modal */}
        {activeDoubt && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                    {activeDoubt.subject?.code} · {activeDoubt.topic}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">
                    Official Response to Student Doubt
                  </h3>
                </div>
                <button
                  onClick={() => setActiveDoubt(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student Question Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Student: <strong>{activeDoubt.student?.name}</strong></span>
                  <PriorityBadge priority={activeDoubt.priority} />
                </div>
                <p className="font-bold text-slate-900 text-sm">{activeDoubt.title}</p>
                <p className="text-slate-600 whitespace-pre-wrap">{activeDoubt.questionText}</p>
              </div>

              {/* Faculty Answer Form */}
              <form onSubmit={handlePublishAnswer} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Faculty Explanation & Steps
                    </label>
                    {activeDoubt.aiDraftAnswer?.content && (
                      <button
                        type="button"
                        onClick={() => setAnswerContent(activeDoubt.aiDraftAnswer.content)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Re-insert AI Draft
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={8}
                    value={answerContent}
                    onChange={e => setAnswerContent(e.target.value)}
                    placeholder="Provide step-by-step guidance, references to syllabus notes, or code explanations..."
                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="text-xs text-purple-900">
                    <p className="font-bold">Publish to Course Knowledge Base</p>
                    <p className="text-[11px] text-purple-700">Future students will be able to search this approved explanation</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={publishToKB}
                    onChange={e => setPublishToKB(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveDoubt(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAnswer || !answerContent.trim()}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submittingAnswer ? 'Delivering...' : 'Publish Answer & Notify Student'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
