// src/components/calendar/MonthCalendar.js
import React from 'react';

const MonthCalendar = ({
  monthData,
  getTasksForDate,
  onSelectDate,
  selectedDate,
  onQuickAddTask,
  onTaskClick
}) => {
  const { days, rows } = monthData;
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

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
      <div className="grid grid-cols-7 bg-gray-800 border-b border-gray-700">
        {weekDays.map((day, i) => (
          <div key={i} className="py-2 text-center text-sm font-medium text-gray-400">
            {day}
          </div>
        ))}
      </div>
      
      <div 
        className="grid grid-cols-7" 
        style={{ gridTemplateRows: `repeat(${rows}, minmax(120px, 1fr))` }}
      >
        {days.map((day, i) => (
          <div 
            key={i}
            className={`min-h-[120px] border-b border-r border-gray-700 p-1 relative group ${
              day.isCurrentMonth ? 'bg-gray-800' : 'bg-gray-900 opacity-60'
            } ${
              day.isToday ? 'ring-1 ring-inset ring-indigo-500' : ''
            } ${
              selectedDate && isSameDay(selectedDate, day.date) ? 'bg-indigo-900/30' : ''
            }`}
            onClick={() => onSelectDate(day.date)}
          >
            <div className="flex justify-between items-start">
              <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-sm ${
                day.isToday 
                  ? 'bg-indigo-600 text-white font-medium' 
                  : day.isCurrentMonth ? 'text-white' : 'text-gray-500'
              }`}>
                {day.dayOfMonth}
              </span>
              
              {getTasksForDate(day.dateString).length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-900 text-indigo-300">
                  {getTasksForDate(day.dateString).length}
                </span>
              )}
            </div>
            
            <div className="mt-1 space-y-1 max-h-[90px] overflow-hidden">
              {getTasksForDate(day.dateString).slice(0, 3).map((task, idx) => (
                <div 
                  key={idx}
                  className={`text-xs p-1 rounded truncate border-l-2 cursor-pointer ${getPriorityClasses(task.priority)} text-white bg-gray-750`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(task.id);
                  }}
                >
                  {task.content}
                </div>
              ))}
              
              {getTasksForDate(day.dateString).length > 3 && (
                <div className="text-xs text-gray-400 pl-1">
                  +{getTasksForDate(day.dateString).length - 3} more
                </div>
              )}
            </div>
            
            {day.isCurrentMonth && (
              <div 
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-indigo-600 
                          flex items-center justify-center cursor-pointer opacity-0 
                          group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAddTask(day.date);
                }}
              >
                <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(MonthCalendar);