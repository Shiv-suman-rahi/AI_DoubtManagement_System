import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import { BookOpen, HelpCircle, Layers, CheckCircle } from 'lucide-react';

export function BrowseSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/student/subjects');
        if (res.data.success) {
          setSubjects(res.data.subjects);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar title="Curriculum & Subjects" subtitle="Explore your course syllabi, core modules, and reference materials" />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
            No subjects currently assigned to your classroom.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjects.map(subj => (
              <div key={subj.subjectId} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg">
                      {subj.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Credits: {subj.credits || 4}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900">{subj.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{subj.description}</p>

                  {/* Syllabus Modules */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-brand-600" /> Syllabus Modules ({subj.syllabus?.length || 0})
                    </p>
                    <div className="space-y-2">
                      {subj.syllabus?.map((topicItem, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <p className="font-semibold text-slate-800">{topicItem.topic}</p>
                          {topicItem.subtopics?.length > 0 && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              Topics: {topicItem.subtopics.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to="/student/ask"
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Ask Doubt in {subj.code}
                  </Link>
                  <Link
                    to="/chat"
                    className="text-xs font-semibold text-slate-600 hover:text-brand-600"
                  >
                    Open Subject Forum &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
