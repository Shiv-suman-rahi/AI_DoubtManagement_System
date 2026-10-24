import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ThemeToggle } from '../../components/common/ThemeToggle.jsx';
import {
  Sparkles,
  Lock,
  Mail,
  GraduationCap,
  Users,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'faculty') navigate('/faculty');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
  };

  return (
    <div className="login-page min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-500/25">
          A
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          AIDMS Portal
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          AI Doubt Management System · Apex Institute of Technology
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="login-panel bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="student.aarav@apex.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Campus Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="pt-4 border-t border-slate-700/60 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              One-Click Demo Credentials
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('student.aarav@apex.edu', 'Student@123')}
                className="p-2 bg-slate-900/80 hover:bg-slate-700/70 border border-slate-700 rounded-xl text-left transition-all group"
              >
                <GraduationCap className="w-3.5 h-3.5 text-brand-400 mb-1" />
                <p className="text-[11px] font-bold text-slate-200">Student</p>
                <p className="text-[9px] text-slate-400 truncate">Aarav (CSE 3A)</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('prof.sharma@apex.edu', 'Faculty@123')}
                className="p-2 bg-slate-900/80 hover:bg-slate-700/70 border border-slate-700 rounded-xl text-left transition-all group"
              >
                <Users className="w-3.5 h-3.5 text-purple-400 mb-1" />
                <p className="text-[11px] font-bold text-slate-200">Faculty</p>
                <p className="text-[9px] text-slate-400 truncate">Prof. Sharma</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@apex.edu', 'Admin@123')}
                className="p-2 bg-slate-900/80 hover:bg-slate-700/70 border border-slate-700 rounded-xl text-left transition-all group"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 mb-1" />
                <p className="text-[11px] font-bold text-slate-200">Admin</p>
                <p className="text-[9px] text-slate-400 truncate">Dr. Mehta</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
