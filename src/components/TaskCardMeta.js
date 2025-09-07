import React from 'react'; 
import { formatShort, isOverdue } from '../utils/dateUtils';

const Pill = ({ className, children }) => (
  <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide border ${className}`}>
    {children}
  </span>
);

export default function TaskCardMeta({ task, showBoardPath = true }) {
  const overdue = !task?.completed && (task?.forceOverdue || isOverdue(task?.dueDate));
  const inBacklog = !!task?.isInBacklog ||
    /(back\s*log|backlog|ice[-\s]*box|icebox|parking\s*lot|archive|later|someday)/i.test(task?.columnName || '');
  const stale = !!task?.isStale;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showBoardPath && (
        <span className="bg-gray-700 px-2 py-0.5 rounded">
          {task.boardName} / {task.columnName}
        </span>
      )}

      {inBacklog && (
        <Pill className="text-indigo-300 bg-indigo-900/30 border-indigo-700/30">Backlog</Pill>
      )}

      {overdue && (
        <Pill className="text-red-300 bg-red-900/30 border-red-700/40">Overdue</Pill>
      )}

      {stale && !inBacklog && (
        <Pill className="text-amber-300 bg-amber-900/30 border-amber-700/40">Stale</Pill>
      )}

      {task.dueDate && (
        <span className={`flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-gray-400'}`}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{formatShort(task.dueDate)}</span>
        </span>
      )}

      <div className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${
          task.priority === 'high' ? 'bg-red-500' :
          task.priority === 'medium' ? 'bg-amber-500' :
          'bg-emerald-500'
        }`} />
        <span className="capitalize">{task.priority || 'medium'}</span>
      </div>
    </div>
  );
}
