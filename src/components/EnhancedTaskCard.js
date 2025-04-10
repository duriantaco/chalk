import React from 'react';

const EnhancedTaskCard = ({ task, index, provided, snapshot, onClick, getPriorityClasses, formatDate, isOverdue }) => {
  const priorityClasses = getPriorityClasses(task.priority);
  const percentComplete = task.percentComplete || 0;
  
  const handleCardClick = (e) => {
    if (onClick && !snapshot.isDragging) {
      onClick(e);
    }
  };
  
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="task-card-wrapper"
      data-task-id={task.id}
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
            
            {task.columnStatus === 'in-progress' && percentComplete > 0 && (
              <div className="mt-2">
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      percentComplete === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${percentComplete}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {percentComplete}%
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