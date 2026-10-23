import React from 'react';

export function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Pending', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
    ai_processed: { label: 'AI Processed', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    assigned: { label: 'Assigned to Faculty', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
    under_review: { label: 'Under Review', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
    answered: { label: 'Answered', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    resolved: { label: 'Resolved', bg: 'bg-teal-100 text-teal-800 border-teal-300' },
    reopened: { label: 'Reopened', bg: 'bg-orange-100 text-orange-800 border-orange-300' },
    escalated: { label: 'Escalated', bg: 'bg-rose-100 text-rose-800 border-rose-300' }
  };

  const current = map[status] || { label: status || 'Unknown', bg: 'bg-slate-100 text-slate-700 border-slate-300' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg}`}>
      {current.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    low: 'bg-slate-100 text-slate-700 border-slate-300',
    normal: 'bg-blue-50 text-blue-700 border-blue-200',
    high: 'bg-amber-50 text-amber-700 border-amber-300',
    urgent: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${map[priority] || map.normal}`}>
      {priority ? priority.toUpperCase() : 'NORMAL'}
    </span>
  );
}
