import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import {
  Layers,
  GraduationCap,
  BookOpen,
  PlusCircle,
  X,
  ChevronRight,
  FolderTree
} from 'lucide-react';

export function AcademicHierarchyPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create Classroom Modal
  const [showClassModal, setShowClassModal] = useState(false);
  const [progId, setProgId] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [semester, setSemester] = useState(5);
  const [section, setSection] = useState('A');
  const [academicYear, setAcademicYear] = useState('2025-2026');

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/hierarchy');
      if (res.data.success) {
        setData(res.data);
        if (res.data.programs.length > 0) setProgId(res.data.programs[0]._id);
      }
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const handleCreateClassroom = async e => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/classrooms', {
        programId: progId,
        branch,
        semester,
        section,
        academicYear
      });
      if (res.data.success) {
        alert('Classroom created successfully');
        setShowClassModal(false);
        fetchHierarchy();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create classroom');
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        title="Academic Hierarchy & Structure"
        subtitle="Departments, degree programs, classrooms, courses, and syllabus curriculum"
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Institutional Curriculum Tree</h2>
            <p className="text-xs text-slate-500">College &rarr; Department &rarr; Program &rarr; Classroom &rarr; Course Subject</p>
          </div>

          <button
            onClick={() => setShowClassModal(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Classroom</span>
          </button>
        </div>

        {/* Tree Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Classrooms */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-brand-600" />
                Active Classrooms ({data?.classrooms?.length || 0})
              </h3>

              <div className="space-y-3">
                {data?.classrooms?.map(c => (
                  <div key={c._id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{c.program?.name || 'B.Tech Program'}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Branch: <strong>{c.branch}</strong> · Semester: <strong>Sem {c.semester}</strong> · Section: <strong>{c.section}</strong>
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {c.academicYear}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subjects and Syllabus */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Course Catalog & Syllabi ({data?.subjects?.length || 0})
              </h3>

              <div className="space-y-3">
                {data?.subjects?.map(s => (
                  <div key={s._id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-brand-600">{s.code}</span>
                      <span className="text-[11px] text-slate-400">Credits: {s.credits}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">{s.name}</h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {s.syllabus?.map((topicItem, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                          {topicItem.topic}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create Classroom Modal */}
        {showClassModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">Add New Classroom Offering</h3>
                <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClassroom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Academic Program</label>
                  <select
                    value={progId}
                    onChange={e => setProgId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                  >
                    {data?.programs?.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Branch</label>
                    <input
                      type="text"
                      required
                      value={branch}
                      onChange={e => setBranch(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Semester</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      required
                      value={semester}
                      onChange={e => setSemester(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section</label>
                    <input
                      type="text"
                      required
                      value={section}
                      onChange={e => setSection(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Academic Year</label>
                    <input
                      type="text"
                      required
                      value={academicYear}
                      onChange={e => setAcademicYear(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClassModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold"
                  >
                    Save Classroom
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
