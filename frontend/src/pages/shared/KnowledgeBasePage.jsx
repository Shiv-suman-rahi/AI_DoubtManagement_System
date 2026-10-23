import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import {
  Library,
  Search,
  Sparkles,
  ThumbsUp,
  BookOpen,
  UserCheck,
  CheckCircle2,
  X
} from 'lucide-react';

export function KnowledgeBasePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);

      const res = await api.get(`/knowledge-base?${params.toString()}`);
      if (res.data.success) {
        setArticles(res.data.articles);
      }
    } catch (err) {
      console.error('Failed to load knowledge base articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleSearchSubmit = e => {
    e.preventDefault();
    fetchArticles();
  };

  const handleVoteHelpful = async articleId => {
    try {
      const res = await api.post(`/knowledge-base/${articleId}/helpful`);
      if (res.data.success) {
        setArticles(prev =>
          prev.map(a => (a._id === articleId ? { ...a, helpfulCount: res.data.helpfulCount } : a))
        );
        if (selectedArticle && selectedArticle._id === articleId) {
          setSelectedArticle(prev => ({ ...prev, helpfulCount: res.data.helpfulCount }));
        }
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        title="Institutional Knowledge Base"
        subtitle="Search verified faculty explanations, solved academic doubts, and model solutions"
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Search Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Peer & Faculty Verified Academic Repository
          </div>
          <h2 className="text-xl md:text-2xl font-bold">
            Search Solved Doubts & Faculty Answers
          </h2>

          <form onSubmit={handleSearchSubmit} className="max-w-2xl flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by topic, concept, keyword (e.g. BCNF, Banker Algorithm, Paging)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-xs text-white placeholder:text-slate-400 focus:bg-white focus:text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
            No articles match your query. Try a broader search term.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(art => (
              <div
                key={art._id}
                onClick={() => setSelectedArticle(art)}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-brand-400 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-brand-600 font-bold uppercase tracking-wider">
                    <span>{art.subject?.code} · {art.topic}</span>
                    <span className="flex items-center gap-1 text-slate-400 font-normal">
                      <ThumbsUp className="w-3 h-3 text-slate-400" /> {art.helpfulCount || 0}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors line-clamp-2">
                    {art.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {art.approvedExplanation}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>{art.approvedBy?.name}</strong>
                  </span>
                  <span>{new Date(art.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Article Full Detail Modal */}
        {selectedArticle && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                  {selectedArticle.subject?.code} · {selectedArticle.topic}
                </span>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-slate-900">
                  {selectedArticle.title}
                </h2>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <span>Approved by <strong>{selectedArticle.approvedBy?.name}</strong></span>
                  <span>·</span>
                  <span>{new Date(selectedArticle.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {selectedArticle.questionSummary && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">Original Inquired Scenario:</p>
                  <p>{selectedArticle.questionSummary}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Faculty Approved Explanation
                </p>
                <div className="p-5 bg-emerald-50/40 rounded-xl border border-emerald-200 text-xs md:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedArticle.approvedExplanation}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleVoteHelpful(selectedArticle._id)}
                  className="px-4 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Helpful ({selectedArticle.helpfulCount || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
