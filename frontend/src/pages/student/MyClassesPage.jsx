import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import { GraduationCap, Users, Calendar, BookOpen } from 'lucide-react';

export function MyClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/student/classes');
        if (res.data.success) {
          setClasses(res.data.classes);
        }
      } catch (err) {
        console.error('Failed to load classes:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar title="My Academic Classes" subtitle="Enrolled classrooms, section cohorts, and academic schedule" />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            <div className="h-44 bg-slate-200 rounded-2xl"></div>
            <div className="h-44 bg-slate-200 rounded-2xl"></div>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
            No active classroom enrollment found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classes.map(cls => (
              <div key={cls._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{cls.program?.name || 'B.Tech CSE'}</h3>
                      <p className="text-xs text-slate-500">Branch: {cls.branch} · Year: {cls.academicYear}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                    Enrolled
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Semester</span>
                    <p className="text-lg font-bold text-slate-800">Sem {cls.semester}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Section</span>
                    <p className="text-lg font-bold text-slate-800">Section {cls.section}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Cohort</span>
                    <p className="text-lg font-bold text-brand-600">Active</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
