import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge.jsx';
import {
  HelpCircle,
  Sparkles,
  UserCheck,
  Send,
  MessageSquare,
  Star,
  FileText,
  Lock,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

export function DoubtDetailPage() {
  const { id } = useParams();
  const [doubt, setDoubt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Follow-up
  const [followUpMsg, setFollowUpMsg] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  // Feedback
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    async function loadDoubt() {
      try {
        const res = await api.get(`/doubts/${id}`);
        if (res.data.success) {
          setDoubt(res.data.doubt);
          setAnswers(res.data.answers || []);
          if (res.data.doubt.feedback?.rating) {
            setFeedbackSubmitted(true);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load doubt details');
      } finally {
        setLoading(false);
      }
    }
    loadDoubt();
  }, [id]);

  const handleSendFollowUp = async e => {
    e.preventDefault();
    if (!followUpMsg.trim()) return;

    setSubmittingFollowUp(true);
    try {
      const res = await api.post(`/doubts/${id}/follow-ups`, { message: followUpMsg });
      if (res.data.success) {
        setDoubt(prev => ({
          ...prev,
          followUps: res.data.followUps
        }));
        setFollowUpMsg('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send follow up');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await api.post(`/doubts/${id}/feedback`, { rating, comment: feedbackComment });
      setFeedbackSubmitted(true);
    } catch (err) {
      alert('Failed to submit feedback');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
        <Navbar title="Doubt Thread" subtitle="Loading details..." />
        <div className="p-8 max-w-4xl mx-auto w-full animate-pulse space-y-6">
          <div className="h-48 bg-slate-200 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !doubt) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
        <Navbar title="Error" />
        <div className="p-8 max-w-md mx-auto text-center space-y-4">
          <p className="text-sm font-semibold text-rose-600">{error || 'Doubt not found'}</p>
          <Link to="/student/doubts" className="text-xs font-bold text-brand-600 underline">
            Return to My Doubts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        title={`Doubt #${doubt._id.slice(-6).toUpperCase()}`}
        subtitle={`${doubt.subject?.name} (${doubt.subject?.code}) · ${doubt.topic}`}
      />

      <main className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        <Link
          to="/student/doubts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Doubts
        </Link>

        {/* Primary Doubt Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                {doubt.subject?.code} · {doubt.topic}
              </span>
              {doubt.privacyMode === 'anonymous' && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                  <Lock className="w-3 h-3 text-slate-500" /> Anonymous Submission
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <PriorityBadge priority={doubt.priority} />
              <StatusBadge status={doubt.resolutionStatus} />
            </div>
          </div>

          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              {doubt.title}
            </h1>
            <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap leading-relaxed">
              {doubt.questionText}
            </p>
          </div>

          {/* Code Snippet if present */}
          {doubt.codeSnippet?.code && (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <div className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-mono flex items-center justify-between border-b border-slate-800">
                <span>Code Snippet ({doubt.codeSnippet.language})</span>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto">
                <code>{doubt.codeSnippet.code}</code>
              </pre>
            </div>
          )}

          {/* Attachments if present */}
          {doubt.attachments?.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attachments</p>
              <div className="flex flex-wrap gap-2">
                {doubt.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium border border-slate-200 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>{att.originalName}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>Submitted on {new Date(doubt.createdAt).toLocaleString()}</span>
            <span>Faculty Assigned: <strong>{doubt.assignedFaculty?.name || 'Review Queue'}</strong></span>
          </div>
        </div>

        {/* AI Preliminary Synthesis Card */}
        {doubt.aiDraftAnswer?.content && (
          <div className="bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-slate-50 rounded-2xl border border-indigo-200/80 p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>AI Preliminary Concept Synthesis</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 lowercase font-normal">
                automated draft
              </span>
            </div>
            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {doubt.aiDraftAnswer.content}
            </div>
          </div>
        )}

        {/* Official Faculty Answers */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Official Faculty Explanation ({answers.length})
          </h3>

          {answers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
              Your assigned faculty is reviewing this doubt. An official verified answer will appear here once published.
            </div>
          ) : (
            answers.map(ans => (
              <div
                key={ans._id}
                className="bg-white rounded-2xl border-2 border-emerald-200/80 shadow-md p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs border border-emerald-200">
                      {ans.author?.name?.charAt(0) || 'F'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{ans.author?.name}</p>
                      <p className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
                        Verified Course Faculty
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(ans.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="text-xs md:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {ans.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Follow-up Discussion Thread */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-600" />
            Discussion & Follow-Up Questions
          </h3>

          <div className="space-y-3">
            {doubt.followUps?.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No follow-ups yet.</p>
            ) : (
              doubt.followUps.map(fu => (
                <div
                  key={fu._id}
                  className={`p-3.5 rounded-xl text-xs space-y-1 ${
                    fu.isFaculty
                      ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-900'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-bold">{fu.isFaculty ? 'Faculty Instructor' : 'You (Student)'}</span>
                    <span>{new Date(fu.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{fu.message}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendFollowUp} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Ask a clarifying follow-up question..."
              value={followUpMsg}
              onChange={e => setFollowUpMsg(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <button
              type="submit"
              disabled={submittingFollowUp || !followUpMsg.trim()}
              className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Feedback Component for Answered Doubts */}
        {answers.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Was this explanation helpful?
            </h4>
            {feedbackSubmitted ? (
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Thank you! Your feedback has been recorded for institutional quality improvement.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-slate-600 ml-2">{rating} out of 5</span>
                </div>
                <input
                  type="text"
                  placeholder="Optional comment on faculty answer..."
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSubmitFeedback}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors"
                >
                  Submit Review
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
