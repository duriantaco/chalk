// src/components/calendar/DayCalendar.js
import React from 'react';

const DayCalendar = ({
  dayData,
  getTasksForDate,
  formatCalendarDate,
  onTaskClick
}) => {
  const getPriorityClasses = (priority) => {
    switch(priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-amber-500';
      case 'low': return 'border-emerald-500';
      default: return 'border-gray-600';
    }
  };

  return (
    <div className="bg-gray-850 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 border-b border-gray-700 p-4 text-center">
        <div className={`text-lg font-medium ${dayData.isToday ? 'text-indigo-400' : 'text-white'}`}>
          {dayData.dayOfMonth}
        </div>
        <div className="text-sm text-gray-400">
          {formatCalendarDate(dayData.date, 'day')}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-white font-medium mb-3">Tasks for this day</h3>
        
        {getTasksForDate(dayData.dateString).length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-800 rounded-md border border-gray-700">
            No tasks scheduled for this day
          </div>
        ) : (
          <div className="space-y-3">
            {getTasksForDate(dayData.dateString).map((task, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded border-l-2 cursor-pointer ${getPriorityClasses(task.priority)} ${
                  task.completed ? 'line-through text-gray-500 bg-gray-800/50' : 'text-white bg-gray-750'
                }`}
                onClick={() => onTaskClick(task.id)}
              >
                <div className="text-sm font-medium">{task.content}</div>
                
                {task.description && (
                  <div className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</div>
                )}
                
                <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                  <div>{task.columnName}</div>
                  
                  <div className="flex items-center space-x-2">
                    {task.priority && (
                      <span className={`px-2 py-0.5 rounded-full ${
                        task.priority === 'high' ? 'bg-red-900/50 text-red-300' :
                        task.priority === 'medium' ? 'bg-amber-900/50 text-amber-300' :
                        'bg-emerald-900/50 text-emerald-300'
                      }`}>
                        {task.priority}
                      </span>
                    )}
                    
                    {task.completed && (
                      <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-300 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                </div>
                
                {task.labels && task.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.labels.map((label, labelIdx) => (
                      <span key={labelIdx} className="px-1.5 py-0.5 bg-indigo-900/50 text-indigo-300 rounded text-xs">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DayCalendar);