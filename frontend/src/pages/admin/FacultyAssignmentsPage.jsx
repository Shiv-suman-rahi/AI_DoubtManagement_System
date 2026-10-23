import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import { UserCheck, RefreshCw, X, AlertCircle } from 'lucide-react';

export function FacultyAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reassignment Modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [fromFaculty, setFromFaculty] = useState('');
  const [toFaculty, setToFaculty] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/hierarchy');
      if (res.data.success) {
        setAssignments(res.data.assignments || []);
      }
      const usersRes = await api.get('/admin/users?role=faculty');
      if (usersRes.data.success) {
        setFacultyUsers(usersRes.data.users || []);
        if (usersRes.data.users.length > 1) {
          setFromFaculty(usersRes.data.users[0]._id);
          setToFaculty(usersRes.data.users[1]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleReassignDoubts = async e => {
    e.preventDefault();
    if (fromFaculty === toFaculty) {
      alert('Source and target faculty must be different');
      return;
    }

    setReassigning(true);
    try {
      const res = await api.post('/admin/reassign-doubts', {
        fromFacultyId: fromFaculty,
        toFacultyId: toFaculty
      });
      if (res.data.success) {
        alert(res.data.message);
        setShowReassignModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reassign doubts');
    } finally {
      setReassigning(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        title="Faculty Assignments & Workload Routing"
        subtitle="Map faculty instructors to multi-class course offerings and reassign queues"
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Teaching Allocations</h2>
            <p className="text-xs text-slate-500">Each assignment connects an instructor to a specific class-subject period</p>
          </div>

          <button
            onClick={() => setShowReassignModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reassign Pending Doubts</span>
          </button>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 space-y-3 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-slate-100 rounded-xl"></div>
                ))}
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No active faculty assignments found.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-5">Assigned Faculty</th>
                    <th className="py-3 px-4">Subject Offering</th>
                    <th className="py-3 px-4">Classroom & Section</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map(a => (
                    <tr key={a._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{a.faculty?.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{a.faculty?.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{a.classSubject?.subject?.code}</span>
                        <span className="text-slate-500 ml-1.5">- {a.classSubject?.subject?.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {a.classSubject?.classroom?.program?.code} (Sem {a.classSubject?.classroom?.semester}{a.classSubject?.classroom?.section})
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {a.classSubject?.academicPeriod || '2025-2026 Sem 5'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Reassign Pending Doubts Modal */}
        {showReassignModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Reassign Unresolved Doubts</h3>
                  <p className="text-xs text-slate-500">Transfer pending queues between faculty instructors</p>
                </div>
                <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleReassignDoubts} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">From Faculty (Source)</label>
                  <select
                    value={fromFaculty}
                    onChange={e => setFromFaculty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                  >
                    {facultyUsers.map(f => (
                      <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">To Faculty (Target)</label>
                  <select
                    value={toFaculty}
                    onChange={e => setToFaculty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                  >
                    {facultyUsers.map(f => (
                      <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    All pending, under review, and assigned doubts currently assigned to the source faculty will be migrated to the target faculty. An institutional audit log entry will be created.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReassignModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reassigning}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {reassigning ? 'Transferring...' : 'Execute Reassignment'}
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
