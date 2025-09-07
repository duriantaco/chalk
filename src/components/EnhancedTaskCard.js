import React from 'react';

const EnhancedTaskCard = ({ task, provided, snapshot, onClick, getPriorityClasses, formatDate, isOverdue, onAddAttachments }) => {
  const priorityClasses = getPriorityClasses(task.priority);
  const percentComplete = task.percentComplete || 0;
  
  const handleCardClick = (e) => {
    if (onClick && !snapshot.isDragging) {
      onClick(e);
    }
  };

  const subTotal = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
  const subDone = subTotal ? task.subtasks.filter(s => s.done).length : 0;

  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;

  const startOfDay = (d) => { const t = new Date(d); t.setHours(0,0,0,0); 
    return t; };

  const today0 = startOfDay(new Date());
  const daysDiff = dueDateObj ? Math.ceil((startOfDay(dueDateObj) - today0) / (1000 * 60 * 60 * 24)) : null;

  const dueLabel =
    daysDiff === null ? '' :
    daysDiff === 0 ? 'today' :
    daysDiff > 0 ? `in ${daysDiff}d` :
    `${Math.abs(daysDiff)}d`;

  const isDueSoon = daysDiff !== null && daysDiff >= 0 && daysDiff <= 2 && !task.completed;

  const hasSubs = Array.isArray(task.subtasks) && task.subtasks.length > 0;
  const subPct = hasSubs ? Math.round((subDone / subTotal) * 100) : 0;
  const displayPct = hasSubs ? subPct : percentComplete;

  const onDragOverFile = (e) => {
    if (e.dataTransfer?.types?.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onDropFiles = async (e) => {

    if (!e.dataTransfer?.files?.length) 
      return;

    e.preventDefault();
    e.stopPropagation();
    const paths = Array.from(e.dataTransfer.files).map(f => f.path).filter(Boolean);

    if (!paths.length) 
      return;

    const copied = await window.api.invoke('attachments:copyPaths', paths);
    if (typeof onAddAttachments === 'function') {
      onAddAttachments(task.id, copied);
    }
  };
  
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="task-card-wrapper"
      data-task-id={task.id}
      onDragOverCapture={onDragOverFile}
      onDropCapture={onDropFiles}
    >
      <div 
        className={`bg-gray-900 rounded-md border-l-4 ${priorityClasses} ${
          task.completed ? 'opacity-60' : ''
        } ${snapshot.isDragging ? 'shadow-lg' : ''} transition-all duration-300 cursor-pointer task-card px-3 py-3`}
        onClick={handleCardClick}
      >
        <div className="flex">
          <div className="flex-1">
            <div className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
              {task.content}
            </div>
            
            {Array.isArray(task.attachments) && task.attachments.length > 0 && (
              <div className="mt-2 border border-gray-800 rounded overflow-hidden">
                <img
                  src={(task.attachments[0].url) || (`file://${(task.attachments[0].path || '').replace(/\\/g,'/')}`)}
                  alt=""
                  className="w-full h-24 object-cover"
                  draggable={false}
                />
              </div>
            )}

            {displayPct > 0 && (
              <div className="mt-2">
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      displayPct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${displayPct}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1 flex items-center justify-between">
                  <span className="min-w-[60px]">{hasSubs ? `${subDone}/${subTotal} done` : ''}</span>
                  <span>{displayPct}%</span>
                </div>
              </div>
            )}

            {task.labels && task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.labels.slice(0, 3).map((label, index) => (
                  <span key={index} className="text-xs px-2 py-0.5 rounded-full bg-indigo-900 bg-opacity-40 text-indigo-300">
                    {label}
                  </span>
                ))}
                {task.labels.length > 3 && 
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                    +{task.labels.length - 3}
                  </span>
                }
              </div>
            )}
            
            <div className="flex items-center text-xs text-gray-500 mt-2 gap-2">
              {task.dueDate && (
                <div className={`flex items-center gap-1 ${isOverdue(task.dueDate) && !task.completed ? 'text-red-400' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{formatDate(task.dueDate)}</span>
                </div>
              )}
              
              {task.dueDate && !task.completed && isOverdue(task.dueDate) && (
                <span title={`Due ${dueLabel}`} className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-700/40">
                  Overdue {dueLabel}
                </span>
              )}
              {task.dueDate && !task.completed && !isOverdue(task.dueDate) && isDueSoon && (
                <span title={`Due ${dueLabel}`} className="px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-700/30">
                  Due {dueLabel}
                </span>
              )}

              {subTotal > 0 && (
                <span className={`px-1.5 py-0.5 rounded border ${
                  subDone === subTotal ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40'
                                       : 'bg-indigo-900/40 text-indigo-300 border-indigo-700/40'
                }`}>
                  {subDone}/{subTotal}
                </span>
              )}

              {task.assignedTo && (
                <div className="flex items-center">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-semibold">
                    {task.assignedTo.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {task.completed && (
                <div className="ml-auto flex items-center text-emerald-500">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="ml-1">Done</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center pl-2 text-gray-600 hover:text-gray-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 9H16M8 15H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTaskCard;