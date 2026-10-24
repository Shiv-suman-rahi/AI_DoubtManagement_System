import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Navbar } from '../../components/common/Navbar.jsx';

export function StudentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classroomId, setClassroomId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/student/profile');
        if (!res.data.success) throw new Error('Unable to load student profile');
        setProfile(res.data.profile);
        if (res.data.profile.academicProfileStatus === 'pending') {
          const options = await api.get('/student/profile/class-options');
          setClassrooms(options.data.classrooms || []);
        } else {
          const enrolledSubjects = await api.get('/student/subjects');
          setSubjects(enrolledSubjects.data.subjects || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Unable to load student profile');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const submitClassroom = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!classroomId) {
      setError('Select a classroom to continue.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/student/profile/initial-selection', { classroomId });
      setProfile(res.data.profile);
      const enrolledSubjects = await api.get('/student/subjects');
      setSubjects(enrolledSubjects.data.subjects || []);
      setSuccess('Your academic selection is saved. Contact an administrator for any later changes.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your class selection.');
    } finally {
      setSaving(false);
    }
  };

  const classroom = profile?.currentClassroom;
  const isPending = profile?.academicProfileStatus === 'pending';

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar title="Academic Profile" subtitle="Your account and current academic enrollment" />
      <main className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-5">
        {loading ? (
          <div className="h-56 rounded-2xl bg-slate-200 animate-pulse" />
        ) : (
          <>
            {error && <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>}
            {success && <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{success}</div>}
            {profile && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <ProfileField label="Student ID" value={profile.studentId} />
                  <ProfileField label="Roll number" value={profile.rollNumber} />
                  <ProfileField label="Department" value={profile.department?.name} />
                  <ProfileField label="Course / Degree" value={profile.programRef?.name || profile.program} />
                  <ProfileField label="Branch" value={profile.branch} />
                  <ProfileField label="Admission year" value={profile.admissionYear} />
                  <ProfileField label="Academic year" value={profile.academicYear} />
                  <ProfileField label="Year of study" value={profile.studyYear} />
                  <ProfileField label="Semester" value={profile.semester} />
                  <ProfileField label="Section" value={profile.section} />
                  <ProfileField label="Classroom" value={classroom?._id ? `${classroom.branch} · Sem ${classroom.semester} · Section ${classroom.section}` : null} />
                  <ProfileField label="Profile status" value={isPending ? 'Initial class selection required' : 'Complete'} />
                </div>
              </section>
            )}
            {!isPending && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="font-bold text-slate-900">Current assigned subjects</h2>
                {subjects.length ? (
                  <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {subjects.map(subject => (
                      <li key={subject.classSubjectId} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                        <span className="font-bold text-brand-700">{subject.code}</span>
                        <span className="ml-2 text-slate-700">{subject.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-2 text-sm text-slate-500">No active subjects for this classroom.</p>}
              </section>
            )}
            {isPending && (
              <section className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 space-y-3">
                <div>
                  <h2 className="font-bold text-slate-900">Complete your initial class selection</h2>
                  <p className="text-sm text-slate-500 mt-1">You can submit this selection once. Later changes must be made by an administrator.</p>
                </div>
                <form onSubmit={submitClassroom} className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={classroomId}
                    onChange={event => setClassroomId(event.target.value)}
                    required
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
                  >
                    <option value="">Select eligible classroom</option>
                    {classrooms.map(option => (
                      <option key={option._id} value={option._id}>
                        {option.program?.name} · {option.branch} · Sem {option.semester} · Section {option.section} · {option.academicYear}
                      </option>
                    ))}
                  </select>
                  <button type="submit" disabled={saving || !classrooms.length} className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm disabled:opacity-50">
                    {saving ? 'Saving...' : 'Confirm class'}
                  </button>
                </form>
                {!classrooms.length && <p className="text-sm text-amber-700">No eligible active classrooms are available. Please contact an administrator.</p>}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">{label}</p>
      <p className="mt-1 text-slate-800 font-medium">{value || 'Not provided'}</p>
    </div>
  );
}
