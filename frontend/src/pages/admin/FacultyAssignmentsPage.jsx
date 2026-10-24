import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import { UserCheck, RefreshCw, X, AlertCircle } from 'lucide-react';

export function FacultyAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ departmentId: '', programId: '', branch: '', semester: '', section: '', academicYear: '', subjectId: '' });
  const [newFacultyId, setNewFacultyId] = useState('');
  const [newClassSubjectId, setNewClassSubjectId] = useState('');
  const [newRole, setNewRole] = useState('primary');
  const [reassignmentSelections, setReassignmentSelections] = useState({});
  const [assignmentOfferingSelections, setAssignmentOfferingSelections] = useState({});
  const [assignmentRoleSelections, setAssignmentRoleSelections] = useState({});

  // Reassignment Modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [fromFaculty, setFromFaculty] = useState('');
  const [toFaculty, setToFaculty] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const [hierarchyRes, usersRes, assignmentsRes] = await Promise.all([
        api.get('/admin/hierarchy'),
        api.get('/admin/users?role=faculty&status=active'),
        api.get('/admin/faculty-assignments?status=active')
      ]);
      setClassSubjects(hierarchyRes.data.classSubjects || []);
      setFacultyUsers(usersRes.data.users || []);
      setAssignments(assignmentsRes.data.assignments || []);
      setAssignmentOfferingSelections(Object.fromEntries(
        (assignmentsRes.data.assignments || []).map(assignment => [assignment._id, assignment.classSubject?._id || ''])
      ));
      setAssignmentRoleSelections(Object.fromEntries(
        (assignmentsRes.data.assignments || []).map(assignment => [assignment._id, assignment.role || 'primary'])
      ));
      setFromFaculty(usersRes.data.users?.[0]?._id || '');
      setToFaculty(usersRes.data.users?.[1]?._id || '');
      setNewFacultyId(usersRes.data.users?.[0]?._id || '');
      setNewClassSubjectId(hierarchyRes.data.classSubjects?.[0]?._id || '');
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleAssign = async event => {
    event.preventDefault();
    try {
      const res = await api.post('/admin/assign-faculty', {
        facultyId: newFacultyId,
        classSubjectId: newClassSubjectId,
        role: newRole
      });
      if (res.data.success) {
        await fetchAssignments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleReassign = async assignment => {
    const facultyId = reassignmentSelections[assignment._id] || assignment.faculty?._id;
    const classSubjectId = assignmentOfferingSelections[assignment._id] || assignment.classSubject?._id;
    const role = assignmentRoleSelections[assignment._id] || assignment.role;
    if (!facultyId || (facultyId === assignment.faculty?._id && classSubjectId === assignment.classSubject?._id && role === assignment.role)) return;
    try {
      const res = await api.patch(`/admin/faculty-assignments/${assignment._id}`, { facultyId, classSubjectId, role });
      if (res.data.success) await fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reassign faculty');
    }
  };

  const handleDeactivate = async assignment => {
    if (!confirm('Deactivate this assignment? Current unresolved doubts will be routed to another active faculty member if available.')) return;
    try {
      await api.delete(`/admin/faculty-assignments/${assignment._id}`);
      await fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate assignment');
    }
  };

  const visibleAssignments = assignments.filter(assignment => {
    const classSubject = assignment.classSubject;
    const classroom = classSubject?.classroom;
    const program = classroom?.program;
    const subject = classSubject?.subject;
    if (filters.departmentId && program?.department?._id !== filters.departmentId) return false;
    if (filters.programId && program?._id !== filters.programId) return false;
    if (filters.branch && classroom?.branch !== filters.branch) return false;
    if (filters.semester && String(classroom?.semester) !== filters.semester) return false;
    if (filters.section && classroom?.section !== filters.section) return false;
    if (filters.academicYear && classroom?.academicYear !== filters.academicYear) return false;
    if (filters.subjectId && subject?._id !== filters.subjectId) return false;
    const text = [
      assignment.faculty?.name,
      assignment.faculty?.email,
      assignment.classSubject?.subject?.name,
      assignment.classSubject?.subject?.code,
      assignment.classSubject?.classroom?.program?.name,
      assignment.classSubject?.classroom?.branch,
      assignment.classSubject?.classroom?.section,
      assignment.classSubject?.classroom?.academicYear
    ].join(' ').toLowerCase();
    return text.includes(search.trim().toLowerCase());
  });

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

        <form onSubmit={handleAssign} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Add a class-subject assignment</h3>
            <p className="text-xs text-slate-500 mt-1">A faculty member may have any number of active class-subject assignments.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select required value={newFacultyId} onChange={e => setNewFacultyId(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs">
              <option value="">Select faculty</option>
              {facultyUsers.map(faculty => <option key={faculty._id} value={faculty._id}>{faculty.name} · {faculty.email}</option>)}
            </select>
            <select required value={newClassSubjectId} onChange={e => setNewClassSubjectId(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:col-span-2">
              <option value="">Select class-subject</option>
              {classSubjects.map(classSubject => (
                <option key={classSubject._id} value={classSubject._id}>
                  {classSubject.subject?.code} · {classSubject.subject?.name} — {classSubject.classroom?.program?.name}, {classSubject.classroom?.branch}, Sem {classSubject.classroom?.semester}, Sec {classSubject.classroom?.section}, {classSubject.classroom?.academicYear}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <select value={newRole} onChange={e => setNewRole(e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs">
                <option value="primary">Primary</option>
                <option value="co-faculty">Co-faculty</option>
                <option value="ta">Teaching assistant</option>
              </select>
              <button disabled={!facultyUsers.length || !classSubjects.length} type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold disabled:opacity-50">Assign</button>
            </div>
          </div>
          {!classSubjects.length && <p className="text-xs text-amber-700">Create active class-subject offerings in Academic Hierarchy before assigning faculty.</p>}
        </form>

        {/* Assignments Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search faculty or course..." className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              <select value={filters.departmentId} onChange={e => setFilters(prev => ({ ...prev, departmentId: e.target.value }))} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">All departments</option>
                {[...new Map(classSubjects.map(item => [item.classroom?.program?.department?._id, item.classroom?.program?.department])).values()].filter(Boolean).map(department => <option key={department._id} value={department._id}>{department.name}</option>)}
              </select>
              <select value={filters.subjectId} onChange={e => setFilters(prev => ({ ...prev, subjectId: e.target.value }))} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">All subjects</option>
                {[...new Map(classSubjects.map(item => [item.subject?._id, item.subject])).values()].filter(Boolean).map(subject => <option key={subject._id} value={subject._id}>{subject.code} · {subject.name}</option>)}
              </select>
              <select value={filters.programId} onChange={e => setFilters(prev => ({ ...prev, programId: e.target.value }))} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">All courses</option>
                {[...new Map(classSubjects.map(item => [item.classroom?.program?._id, item.classroom?.program])).values()].filter(program => program && (!filters.departmentId || program.department?._id === filters.departmentId)).map(program => <option key={program._id} value={program._id}>{program.name}</option>)}
              </select>
              <select value={filters.branch} onChange={e => setFilters(prev => ({ ...prev, branch: e.target.value }))} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">All branches</option>
                {[...new Set(classSubjects.filter(item => !filters.programId || item.classroom?.program?._id === filters.programId).map(item => item.classroom?.branch).filter(Boolean))].sort().map(branch => <option key={branch} value={branch}>{branch}</option>)}
              </select>
              <select value={filters.semester} onChange={e => setFilters(prev => ({ ...prev, semester: e.target.value }))} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">All semesters</option>
                {[...new Set(classSubjects.map(item => item.classroom?.semester).filter(Boolean))].sort((a, b) => a - b).map(semester => <option key={semester} value={semester}>Semester {semester}</option>)}
              </select>
              <select value={filters.section} onChange={e => setFilters(prev => ({ ...prev, section: e.target.value }))} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">All sections</option>
                {[...new Set(classSubjects.map(item => item.classroom?.section).filter(Boolean))].sort().map(section => <option key={section} value={section}>Section {section}</option>)}
              </select>
              <select value={filters.academicYear} onChange={e => setFilters(prev => ({ ...prev, academicYear: e.target.value }))} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">All academic years</option>
                {[...new Set(classSubjects.map(item => item.classroom?.academicYear).filter(Boolean))].sort().map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 space-y-3 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-slate-100 rounded-xl"></div>
                ))}
              </div>
            ) : visibleAssignments.length === 0 ? (
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
                  {visibleAssignments.map(a => (
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
                        {a.classSubject?.academicPeriod || `${a.classSubject?.classroom?.academicYear || ''} Sem ${a.classSubject?.classroom?.semester || ''}`}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">{a.status}</span>
                          <select
                            aria-label={`Assignment role for ${a.classSubject?.subject?.name}`}
                            value={assignmentRoleSelections[a._id] || a.role || 'primary'}
                            onChange={e => setAssignmentRoleSelections(prev => ({ ...prev, [a._id]: e.target.value }))}
                            className="px-2 py-1 rounded-lg border border-slate-200 text-[10px]"
                          >
                            <option value="primary">Primary</option>
                            <option value="co-faculty">Co-faculty</option>
                            <option value="ta">TA</option>
                          </select>
                          <select
                            aria-label={`Reassign ${a.classSubject?.subject?.name}`}
                            value={reassignmentSelections[a._id] || a.faculty?._id || ''}
                            onChange={e => setReassignmentSelections(prev => ({ ...prev, [a._id]: e.target.value }))}
                            className="max-w-[160px] px-2 py-1 rounded-lg border border-slate-200 text-[10px]"
                          >
                            {facultyUsers.map(faculty => <option key={faculty._id} value={faculty._id}>{faculty.name}</option>)}
                          </select>
                          <select
                            aria-label={`Change class subject for ${a.classSubject?.subject?.name}`}
                            value={assignmentOfferingSelections[a._id] || a.classSubject?._id || ''}
                            onChange={e => setAssignmentOfferingSelections(prev => ({ ...prev, [a._id]: e.target.value }))}
                            className="max-w-[180px] px-2 py-1 rounded-lg border border-slate-200 text-[10px]"
                          >
                            {classSubjects.map(classSubject => <option key={classSubject._id} value={classSubject._id}>{classSubject.subject?.code} · Sem {classSubject.classroom?.semester} · Sec {classSubject.classroom?.section}</option>)}
                          </select>
                          <button type="button" onClick={() => handleReassign(a)} className="px-2 py-1 rounded-lg bg-brand-50 text-brand-700 text-[10px] font-bold">Save</button>
                          <button type="button" onClick={() => handleDeactivate(a)} className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold">Deactivate</button>
                        </div>
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
