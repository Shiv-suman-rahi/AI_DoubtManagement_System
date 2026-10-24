import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Navbar } from '../../components/common/Navbar.jsx';

export function FacultyProfilePage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/faculty/assignments')
      .then(res => setAssignments(res.data.assignments || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load faculty assignments'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar title="Faculty Profile & Assignments" subtitle="Your account details and currently authorized teaching allocations" />
      <main className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-5">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <Summary label="Faculty ID" value={user?.profile?.employeeId} />
            <Summary label="Department" value={user?.profile?.department?.name} />
            <Summary label="Designation" value={user?.profile?.designation} />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Current class-subject assignments</h3>
            <p className="text-sm text-slate-500 mt-1">These active assignments determine which doubt queues and academic rooms you can access.</p>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading assignments...</div>
          ) : error ? (
            <div role="alert" className="p-6 text-sm text-rose-700">{error}</div>
          ) : assignments.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No active class-subject assignments. Contact your administrator.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
              {assignments.map(assignment => {
                const course = assignment.classSubject?.classroom?.program;
                const classroom = assignment.classSubject?.classroom;
                const subject = assignment.classSubject?.subject;
                return (
                  <article key={assignment._id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900">{subject?.code} · {subject?.name}</h4>
                        <p className="text-sm text-slate-600 mt-1">{course?.name} · {classroom?.branch}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">{assignment.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                      <Summary label="Class" value={classroom?._id ? `${classroom.branch} · Section ${classroom.section}` : ''} />
                      <Summary label="Academic year" value={classroom?.academicYear} />
                      <Summary label="Year / semester" value={classroom?.semester ? `${Math.ceil(classroom.semester / 2)} / ${classroom.semester}` : ''} />
                      <Summary label="Assignment role" value={assignment.role} />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value || 'Not provided'}</p>
    </div>
  );
}
