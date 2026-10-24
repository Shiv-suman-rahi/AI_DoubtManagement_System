import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Upload,
  CheckCircle,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('ApexUser@2026');
  const [role, setRole] = useState('student');
  const [profileData, setProfileData] = useState({});
  const [hierarchy, setHierarchy] = useState({ departments: [], programs: [], classrooms: [] });
  const [editingUser, setEditingUser] = useState(null);

  // Bulk Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState(`[
  {
    "name": "Kavya Nair",
    "email": "kavya.nair@apex.edu",
    "studentId": "STU-2023-0104",
    "rollNumber": "23CSE090",
    "branch": "CSE",
    "program": "B.Tech CSE",
    "semester": 5,
    "section": "A"
  },
  {
    "name": "Dev Patel",
    "email": "dev.patel@apex.edu",
    "studentId": "STU-2023-0105",
    "rollNumber": "23CSE091",
    "branch": "CSE",
    "program": "B.Tech CSE",
    "semester": 5,
    "section": "A"
  }
]`);
  const [importing, setImporting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    api.get('/admin/hierarchy')
      .then(res => {
        if (res.data.success) {
          setHierarchy({
            departments: res.data.departments || [],
            programs: res.data.programs || [],
            classrooms: res.data.classrooms || []
          });
        }
      })
      .catch(err => console.error('Failed to load academic options:', err));
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('ApexUser@2026');
    setRole('student');
    setProfileData({});
    setShowCreateModal(true);
  };

  const openEditModal = user => {
    setEditingUser(user);
    setName(user.name || '');
    setEmail(user.email || '');
    setRole(user.role);
    const profile = user.profile || {};
    setProfileData(user.role === 'student' ? {
      studentId: profile.studentId || '',
      rollNumber: profile.rollNumber || '',
      admissionYear: profile.admissionYear || '',
      departmentId: profile.department?._id || '',
      programId: profile.programRef?._id || '',
      classroomId: profile.currentClassroom?._id || ''
    } : user.role === 'faculty' ? {
      employeeId: profile.employeeId || '',
      departmentId: profile.department?._id || '',
      designation: profile.designation || '',
      academicTitle: profile.academicTitle || '',
      officeLocation: profile.officeLocation || ''
    } : {});
    setShowCreateModal(true);
  };

  const handleCreateUser = async e => {
    e.preventDefault();
    try {
      const submittedProfileData = { ...profileData };
      if (role === 'student' && editingUser?.profile?.currentClassroom && !submittedProfileData.classroomId) {
        submittedProfileData.clearClassroom = true;
      }
      const payload = { name, email, role, profileData: submittedProfileData };
      const res = editingUser
        ? await api.patch(`/admin/users/${editingUser._id}`, payload)
        : await api.post('/admin/users', { ...payload, password });
      if (res.data.success) {
        alert(editingUser ? 'User profile updated successfully' : 'User created successfully');
        setShowCreateModal(false);
        setName('');
        setEmail('');
        setProfileData({});
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      if (res.data.success) {
        setUsers(prev => prev.map(u => (u._id === userId ? { ...u, status: newStatus } : u)));
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleBulkImport = async () => {
    try {
      setImporting(true);
      const parsed = JSON.parse(importJson);
      const res = await api.post('/admin/students/import', { students: parsed });
      if (res.data.success) {
        alert(res.data.message);
        setShowImportModal(false);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid JSON format or import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        title="Institutional User Directory"
        subtitle="Manage student, faculty, and administrative accounts with role-based policies"
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Actions & Filters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchUsers()}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Administrator</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Roster</span>
            </button>

            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 space-y-3 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-14 bg-slate-100 rounded-xl"></div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No users found.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-5">Name & Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                        {u.profile?.studentId && <div className="text-[10px] text-slate-400">ID: {u.profile.studentId} · Roll: {u.profile.rollNumber}</div>}
                        {u.profile?.employeeId && <div className="text-[10px] text-slate-400">Faculty ID: {u.profile.employeeId}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-rose-100 text-rose-800'
                            : u.role === 'faculty'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never logged in'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="px-3 py-1 mr-2 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100"
                          >
                            Edit Profile
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u._id, u.status)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            u.status === 'active'
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">{editingUser ? 'Edit Institutional Profile' : 'Add New Institutional User'}</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Dr. Jane Doe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">College Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. jane.doe@apex.edu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Institutional Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    disabled={!!editingUser}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {role === 'student' && (
                  <div className="space-y-3 border-t border-slate-100 pt-3">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Student academic profile</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input required maxLength={40} value={profileData.studentId || ''} onChange={e => setProfileData(p => ({ ...p, studentId: e.target.value }))} placeholder="Student ID" className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
                      <input required maxLength={40} value={profileData.rollNumber || ''} onChange={e => setProfileData(p => ({ ...p, rollNumber: e.target.value }))} placeholder="Roll number" className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
                      <input type="number" min="1900" max="2200" value={profileData.admissionYear || ''} onChange={e => setProfileData(p => ({ ...p, admissionYear: e.target.value }))} placeholder="Admission year" className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
                      <select
                        value={profileData.departmentId || ''}
                        onChange={e => setProfileData(p => ({ ...p, departmentId: e.target.value, programId: '', classroomId: '' }))}
                        className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      >
                        <option value="">Any department</option>
                        {hierarchy.departments.map(department => <option key={department._id} value={department._id}>{department.name}</option>)}
                      </select>
                      <select
                        value={profileData.programId || ''}
                        onChange={e => setProfileData(p => ({ ...p, programId: e.target.value, classroomId: '' }))}
                        className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      >
                        <option value="">Choose course / degree (optional)</option>
                        {hierarchy.programs.filter(program => !profileData.departmentId || program.department?._id === profileData.departmentId).map(program => <option key={program._id} value={program._id}>{program.name}</option>)}
                      </select>
                      <select
                        value={profileData.classroomId || ''}
                        onChange={e => setProfileData(p => ({ ...p, classroomId: e.target.value }))}
                        className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      >
                        <option value="">Leave class selection pending</option>
                        {hierarchy.classrooms.filter(classroom => classroom.status === 'active' && (!profileData.programId || classroom.program?._id === profileData.programId) && (!profileData.departmentId || classroom.program?.department?._id === profileData.departmentId)).map(classroom => (
                          <option key={classroom._id} value={classroom._id}>
                            {classroom.program?.name} · {classroom.branch} · Sem {classroom.semester} · Section {classroom.section} · {classroom.academicYear}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-500">Class, section, semester, branch, and academic year come from the selected classroom. If left pending, the student may choose an eligible active classroom once.</p>
                  </div>
                )}

                {role === 'faculty' && (
                  <div className="space-y-3 border-t border-slate-100 pt-3">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Faculty profile</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input required maxLength={40} value={profileData.employeeId || ''} onChange={e => setProfileData(p => ({ ...p, employeeId: e.target.value }))} placeholder="Faculty / Employee ID" className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
                      <select required value={profileData.departmentId || ''} onChange={e => setProfileData(p => ({ ...p, departmentId: e.target.value }))} className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs">
                        <option value="">Select department</option>
                        {hierarchy.departments.map(department => <option key={department._id} value={department._id}>{department.name}</option>)}
                      </select>
                      <input required maxLength={80} value={profileData.designation || ''} onChange={e => setProfileData(p => ({ ...p, designation: e.target.value }))} placeholder="Designation" className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
                      <input maxLength={80} value={profileData.academicTitle || ''} onChange={e => setProfileData(p => ({ ...p, academicTitle: e.target.value }))} placeholder="Academic title (optional)" className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
                      <input maxLength={80} value={profileData.officeLocation || ''} onChange={e => setProfileData(p => ({ ...p, officeLocation: e.target.value }))} placeholder="Office location (optional)" className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold"
                  >
                    {editingUser ? 'Save Changes' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Bulk Import Student Roster</h3>
                  <p className="text-xs text-slate-500">Paste JSON array with student profiles</p>
                </div>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <textarea
                rows={10}
                value={importJson}
                onChange={e => setImportJson(e.target.value)}
                className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 outline-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={importing}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {importing ? 'Importing Records...' : 'Execute Import'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
