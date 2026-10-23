import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import {
  LayoutDashboard,
  HelpCircle,
  PlusCircle,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Library,
  Users,
  Layers,
  UserCheck,
  FileText,
  LogOut,
  Bell,
  Sparkles
} from 'lucide-react';

export function Sidebar() {
  const { user, role, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentLinks = [
    { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { name: 'My Doubts', path: '/student/doubts', icon: HelpCircle },
    { name: 'Ask Doubt', path: '/student/ask', icon: PlusCircle, highlight: true },
    { name: 'My Classes', path: '/student/classes', icon: GraduationCap },
    { name: 'Browse Subjects', path: '/student/subjects', icon: BookOpen },
    { name: 'Live Chat', path: '/chat', icon: MessageSquare },
    { name: 'Knowledge Base', path: '/knowledge-base', icon: Library }
  ];

  const facultyLinks = [
    { name: 'Faculty Dashboard', path: '/faculty', icon: LayoutDashboard },
    { name: 'Doubt Queue', path: '/faculty/queue', icon: HelpCircle },
    { name: 'AI Doubt Groups', path: '/faculty/groups', icon: Sparkles, highlight: true },
    { name: 'Live Chat', path: '/chat', icon: MessageSquare },
    { name: 'Knowledge Base', path: '/knowledge-base', icon: Library }
  ];

  const adminLinks = [
    { name: 'Institutional Analytics', path: '/admin', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Academic Hierarchy', path: '/admin/hierarchy', icon: Layers },
    { name: 'Faculty Assignments', path: '/admin/assignments', icon: UserCheck },
    { name: 'System Audit Logs', path: '/admin/audit-logs', icon: FileText },
    { name: 'Live Chat Moderation', path: '/chat', icon: MessageSquare }
  ];

  let links = studentLinks;
  if (role === 'faculty') links = facultyLinks;
  if (role === 'admin') links = adminLinks;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      {/* Top Branding */}
      <div>
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/20">
            A
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
              AIDMS
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-semibold uppercase">
                AI 2.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Apex Institute of Tech</p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 text-brand-300 font-semibold flex items-center justify-center text-sm border border-slate-600">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <span className="inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-semibold bg-brand-600/30 text-brand-300 uppercase tracking-wider">
              {role}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1">
          {links.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/student' || item.path === '/faculty' || item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : item.highlight
                      ? 'text-brand-300 hover:bg-slate-800/80 hover:text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5" />
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
              {unreadCount}
            </span>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
