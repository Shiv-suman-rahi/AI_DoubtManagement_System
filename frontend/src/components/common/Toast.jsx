import React from 'react';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { Bell, X } from 'lucide-react';

export function Toast() {
  const { activeToast, clearToast } = useNotifications();
  if (!activeToast) return null;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-white border border-slate-200 rounded-xl shadow-xl p-4 flex items-start space-x-3 transition-all duration-300 transform translate-y-0">
      <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
        <Bell className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900">{activeToast.title}</h4>
        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{activeToast.message}</p>
      </div>
      <button
        onClick={clearToast}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
