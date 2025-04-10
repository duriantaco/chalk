// src/components/calendar/WeekCalendar.js
import React from 'react';

const WeekCalendar = ({
  weekData,
  getTasksForDate,
  onSelectDate,
  selectedDate,
  onTaskClick
}) => {
  const { days } = weekData;
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
        {days.map((day, i) => (
          <div key={i} className={`py-2 text-center ${day.isToday ? 'bg-indigo-900/30' : ''}`}>
            <div className="text-sm font-medium text-gray-400">
              {weekDays[i]}
            </div>
            <div className={`text-lg font-medium ${day.isToday ? 'text-indigo-400' : 'text-white'}`}>
              {day.dayOfMonth}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 min-h-[500px]">
        {days.map((day, i) => (
          <div 
            key={i}
            className={`border-r border-gray-700 p-2 ${
              day.isToday ? 'bg-indigo-900/10' : 'bg-gray-800'
            } ${
              selectedDate && isSameDay(selectedDate, day.date) ? 'bg-indigo-900/30' : ''
            }`}
            onClick={() => onSelectDate(day.date)}
          >
            <div className="space-y-2 h-full overflow-y-auto">
              {getTasksForDate(day.dateString).map((task, idx) => (
                <div 
                  key={idx}
                  className={`p-2 rounded border-l-2 cursor-pointer ${getPriorityClasses(task.priority)} text-white bg-gray-750`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(task.id);
                  }}
                >
                  <div className="text-sm font-medium truncate">{task.content}</div>
                  <div className="text-xs text-gray-400 mt-1">{task.columnName}</div>
                  
                  {task.labels && task.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.labels.slice(0, 2).map((label, labelIdx) => (
                        <span key={labelIdx} className="px-1.5 py-0.5 bg-indigo-900/50 text-indigo-300 rounded text-xs">
                          {label}
                        </span>
                      ))}
                      {task.labels.length > 2 && (
                        <span className="px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                          +{task.labels.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(WeekCalendar);