import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';
import {
  Sparkles,
  Users,
  CheckCircle2,
  Split,
  Merge,
  Send,
  X,
  Lock,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export function GroupManagementPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Group Details & Operations Modal
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupItems, setGroupItems] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Actions
  const [sharedAnswerText, setSharedAnswerText] = useState('');
  const [publishToKB, setPublishToKB] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/faculty/doubt-groups');
      if (res.data.success) {
        setGroups(res.data.groups);
      }
    } catch (err) {
      console.error('Failed to load doubt groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleOpenGroupModal = async group => {
    setSelectedGroup(group);
    setModalLoading(true);
    try {
      const res = await api.get(`/faculty/doubt-groups/${group._id}`);
      if (res.data.success) {
        setGroupItems(res.data.items || []);
        setSharedAnswerText(group.sharedAnswer?.content || '');
      }
    } catch (err) {
      alert('Failed to load group details');
    } finally {
      setModalLoading(false);
    }
  };

  const handlePublishGroupAnswer = async e => {
    e.preventDefault();
    if (!sharedAnswerText.trim()) return;

    setSubmittingAnswer(true);
    try {
      const res = await api.post(`/faculty/doubt-groups/${selectedGroup._id}/answers`, {
        content: sharedAnswerText,
        publishToKnowledgeBase: publishToKB
      });

      if (res.data.success) {
        alert(res.data.message);
        setSelectedGroup(null);
        fetchGroups();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish group answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleSplitDoubt = async doubtId => {
    if (!confirm('Are you sure you want to split this doubt into an independent concept group?')) return;
    try {
      const res = await api.patch(`/faculty/doubt-groups/${selectedGroup._id}/split`, { doubtId });
      if (res.data.success) {
        alert('Doubt successfully split into a new group!');
        setSelectedGroup(null);
        fetchGroups();
      }
    } catch (err) {
      alert('Failed to split doubt');
    }
  };

  const handleMergeGroup = async () => {
    if (!mergeTargetId) return;
    try {
      const res = await api.post('/faculty/doubt-groups/merge', {
        sourceGroupId: selectedGroup._id,
        targetGroupId: mergeTargetId
      });
      if (res.data.success) {
        alert(res.data.message);
        setSelectedGroup(null);
        fetchGroups();
      }
    } catch (err) {
      alert('Failed to merge groups');
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        title="AI Doubt Groups"
        subtitle="Review semantic clusters, split mismatched queries, merge cohorts, and answer groups"
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex items-center justify-between">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Vector Semantic Grouping Active
            </div>
            <h2 className="text-xl font-bold">Concept Cohorts & Batch Resolution</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              When students submit doubts with matching mathematical, conceptual, or debugging intent, AIDMS groups them here. Answering a cohort resolves all linked questions simultaneously.
            </p>
          </div>
          <div className="hidden md:block text-right">
            <span className="text-3xl font-extrabold text-cyan-400">{groups.length}</span>
            <p className="text-xs text-slate-400">Active Groups</p>
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200 space-y-2">
            <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No active doubt groups</p>
            <p className="text-xs text-slate-400">New doubt groups are automatically synthesized as students ask questions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(grp => (
              <div
                key={grp._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-brand-400 hover:shadow-md transition-all space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-brand-600 uppercase tracking-wider">
                      {grp.subject?.code} · {grp.topic}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      grp.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {grp.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2">
                    {grp.representativeTitle}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {grp.representativeQuestion}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <strong>{grp.doubtCount || 1}</strong> student {grp.doubtCount === 1 ? 'question' : 'questions'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenGroupModal(grp)}
                    className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                  >
                    <span>Manage Group</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Group Details & Operations Modal */}
        {selectedGroup && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                    {selectedGroup.subject?.code} · {selectedGroup.topic}
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 mt-0.5">
                    {selectedGroup.representativeTitle}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Linked Doubts List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Original Questions in this Cohort ({groupItems.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Confidence: {(selectedGroup.similarityMetadata?.averageConfidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto">
                  {groupItems.map(item => (
                    <div
                      key={item._id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {item.doubt?.privacyMode === 'anonymous' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">
                              <Lock className="w-3 h-3 text-slate-500" /> Anonymous Student
                            </span>
                          ) : (
                            <span className="font-bold text-slate-900">{item.doubt?.student?.name}</span>
                          )}
                          <StatusBadge status={item.doubt?.resolutionStatus} />
                        </div>
                        <p className="font-semibold text-slate-800">{item.doubt?.title}</p>
                        <p className="text-slate-500 text-[11px] line-clamp-2">{item.doubt?.questionText}</p>
                      </div>

                      {/* Split Button */}
                      <button
                        type="button"
                        onClick={() => handleSplitDoubt(item.doubt?._id)}
                        title="Extract this doubt into its own separate group if incorrectly grouped"
                        className="px-2.5 py-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0"
                      >
                        <Split className="w-3 h-3" />
                        <span>Split Out</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shared Answer Publisher */}
              <form onSubmit={handlePublishGroupAnswer} className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Publish Official Shared Explanation to Group
                  </label>
                  <textarea
                    rows={6}
                    value={sharedAnswerText}
                    onChange={e => setSharedAnswerText(e.target.value)}
                    placeholder="Provide a comprehensive academic explanation that addresses this concept for all grouped students..."
                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="text-xs text-purple-900">
                    <p className="font-bold">Add to Institutional Knowledge Base</p>
                    <p className="text-[11px] text-purple-700">Makes explanation searchable for future semester cohorts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={publishToKB}
                    onChange={e => setPublishToKB(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {/* Merge with other group selector */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={mergeTargetId}
                      onChange={e => setMergeTargetId(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none max-w-[200px]"
                    >
                      <option value="">Merge into another group...</option>
                      {groups
                        .filter(g => g._id !== selectedGroup._id)
                        .map(g => (
                          <option key={g._id} value={g._id}>
                            {g.topic} - {g.representativeTitle.slice(0, 30)}...
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleMergeGroup}
                      disabled={!mergeTargetId}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1"
                    >
                      <Merge className="w-3.5 h-3.5" />
                      <span>Merge</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingAnswer || !sharedAnswerText.trim()}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {submittingAnswer
                        ? 'Publishing...'
                        : `Answer All ${groupItems.length} Students`}
                    </span>
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
