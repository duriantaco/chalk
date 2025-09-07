// src/components/calendar/CalendarView.js
import React, { useState, useMemo } from 'react';
import MonthCalendar from './MonthCalendar';
import WeekCalendar from './WeekCalendar';
import DayCalendar from './DayCalendar';

const CalendarView = ({
  columns,
  getTasks,
  searchTerm,
  filters,
  applySearchAndFilters,
  onCreateTask,
  onTaskClick
}) => {
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateTaskMap, setDateTaskMap] = useState({});
  const [quickAddDate, setQuickAddDate] = useState(null);
  const [quickAddContent, setQuickAddContent] = useState('');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  
  React.useEffect(() => {
    const allTasks = [];
    columns.forEach(column => {
      const tasks = getTasks(column.id).filter(task => 
        applySearchAndFilters(task, searchTerm, filters) && !task.completed
      );
      
      tasks.forEach(task => {
        allTasks.push({
          ...task,
          columnName: column.name
        });
      });
    });
    
    groupTasksByDate(allTasks);
  }, [columns, getTasks, searchTerm, filters]);
  
  const groupTasksByDate = React.useCallback((taskList) => {
    const map = {};
    
    taskList.forEach(task => {
      if (task.dueDate) {
        const dateKey = new Date(task.dueDate).toISOString().split('T')[0];
        if (!map[dateKey]) {
          map[dateKey] = [];
        }
        map[dateKey].push(task);
      }
    });
    
    setDateTaskMap(map);
  }, []);
  
  const handleCalendarPrevious = () => {
    const newDate = new Date(currentDate);
    
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (calendarView === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    
    setCurrentDate(newDate);
  };
  
  const handleCalendarNext = () => {
    const newDate = new Date(currentDate);
    
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (calendarView === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    
    setCurrentDate(newDate);
  };
  
  const handleCalendarToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleSelectDate = (date) => {
    setSelectedDate(date);
  };
  
  const handleQuickAddTask = (date) => {
    setQuickAddDate(date);
    setQuickAddContent('');
    setShowQuickAddModal(true);
  };
  
  const handleCreateQuickTask = () => {
    if (quickAddContent.trim() && quickAddDate && columns.length > 0) {
      const firstColumnId = columns[0].id;
      
      const dateString = quickAddDate.toISOString().split('T')[0];
      onCreateTask(firstColumnId, quickAddContent.trim(), {
        dueDate: dateString
      });
      
      setShowQuickAddModal(false);
      setQuickAddContent('');
      setQuickAddDate(null);
    }
  };
  
  const getTasksForDate = (dateString) => {
    return dateTaskMap[dateString] || [];
  };
  
  const formatCalendarDate = (date, format = 'long') => {
    if (format === 'long') {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric'
      });
    } else if (format === 'week') {
      const weekData = getWeekData();
      const start = weekData.days[0].date;
      const end = weekData.days[6].date;
      
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()} - ${end.toLocaleDateString('en-US', { month: 'short' })} ${end.getDate()}, ${end.getFullYear()}`;
      }
    } else if (format === 'day') {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
    
    return date.toLocaleDateString();
  };
  
  const getMonthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 is Sunday
    
    const lastDay = new Date(year, month + 1, 0);
    const lastDate = lastDay.getDate();
    
    const daysNeededBefore = firstDayOfWeek;
    const totalDaysInMonth = lastDate;
    const totalCells = daysNeededBefore + totalDaysInMonth;
    const rows = Math.ceil(totalCells / 7);
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const days = [];
    
    for (let i = daysNeededBefore - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const date = new Date(year, month - 1, dayNum);
      days.push({
        date,
        dayOfMonth: dayNum,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        dateString: date.toISOString().split('T')[0]
      });
    }
    
    for (let i = 1; i <= lastDate; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        dayOfMonth: i,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        dateString: date.toISOString().split('T')[0]
      });
    }
    
    const remainingCells = rows * 7 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        dayOfMonth: i,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        dateString: date.toISOString().split('T')[0]
      });
    }
    
    return { days, rows };
  }, [currentDate]);
  
  const getWeekData = useMemo(() => {
    const date = new Date(currentDate);
    const day = date.getDay(); // 0 is Sunday
    
    date.setDate(date.getDate() - day);
    
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(date);
      days.push({
        date: currentDay,
        dayOfMonth: currentDay.getDate(),
        isCurrentMonth: currentDay.getMonth() === currentDate.getMonth(),
        isToday: isSameDay(currentDay, new Date()),
        dateString: currentDay.toISOString().split('T')[0]
      });
      date.setDate(date.getDate() + 1);
    }
    
    return { days };
  }, [currentDate]);
  
  const getDayData = useMemo(() => {
    const date = new Date(currentDate);
    return {
      date,
      dayOfMonth: date.getDate(),
      isCurrentMonth: true,
      isToday: isSameDay(date, new Date()),
      dateString: date.toISOString().split('T')[0]
    };
  }, [currentDate]);
  
  function isSameDay(date1, date2) {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }
  
  const getTasksWithoutDueDates = () => {
    const tasksWithoutDates = [];
    
    columns.forEach(column => {
      const tasks = getTasks(column.id).filter(task => 
        !task.dueDate && 
        applySearchAndFilters(task, searchTerm, filters) && 
        !task.completed 
      );
      
      tasks.forEach(task => {
        tasksWithoutDates.push({
          ...task,
          columnName: column.name
        });
      });
    });
    
    return tasksWithoutDates;
  };
  
  const renderCalendarContent = () => {
    if (calendarView === 'month') {
      return (
        <MonthCalendar 
          monthData={getMonthData}
          getTasksForDate={getTasksForDate}
          onSelectDate={handleSelectDate}
          selectedDate={selectedDate}
          onQuickAddTask={handleQuickAddTask}
          onTaskClick={onTaskClick}
        />
      );
    } else if (calendarView === 'week') {
      return (
        <WeekCalendar 
          weekData={getWeekData}
          getTasksForDate={getTasksForDate}
          onSelectDate={handleSelectDate}
          selectedDate={selectedDate}
          onTaskClick={onTaskClick}
        />
      );
    } else if (calendarView === 'day') {
      return (
        <DayCalendar 
          dayData={getDayData}
          getTasksForDate={getTasksForDate}
          formatCalendarDate={formatCalendarDate}
          onTaskClick={onTaskClick}
        />
      );
    }
    
    return null;
  };
  
  return (
    <div className="flex-1 overflow-x-auto p-4">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <button 
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
              onClick={handleCalendarPrevious}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <button 
              className="px-3 py-1.5 text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-900/20 hover:bg-indigo-900/30 rounded-md transition-colors"
              onClick={handleCalendarToday}
            >
              Today
            </button>
            
            <button 
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
              onClick={handleCalendarNext}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <h3 className="text-lg font-medium text-white ml-2">
              {calendarView === 'month' && formatCalendarDate(currentDate, 'long')}
              {calendarView === 'week' && formatCalendarDate(currentDate, 'week')}
              {calendarView === 'day' && formatCalendarDate(currentDate, 'day')}
            </h3>
          </div>
          
          <div className="flex bg-gray-800 rounded-md p-1">
            <button 
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                calendarView === 'month' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setCalendarView('month')}
            >
              Month
            </button>
            <button 
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                calendarView === 'week' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setCalendarView('week')}
            >
              Week
            </button>
            <button 
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                calendarView === 'day' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setCalendarView('day')}
            >
              Day
            </button>
          </div>
        </div>
        
        {renderCalendarContent()}
        
        <div className="mt-6">
          <h3 className="text-white font-medium mb-3">Tasks without due dates</h3>
          
          <div className="bg-gray-850 rounded-lg border border-gray-700 overflow-hidden">
            {getTasksWithoutDueDates().length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No tasks without due dates
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {getTasksWithoutDueDates().slice(0, 5).map((task, idx) => (
                  <div 
                    key={idx}
                    className="p-2 rounded border-l-2 cursor-pointer text-white bg-gray-750"
                    onClick={() => onTaskClick(task.id)}
                  >
                    <div className="text-sm font-medium">{task.content}</div>
                    <div className="text-xs text-gray-400 mt-1">{task.columnName}</div>
                  </div>
                ))}
                
                {getTasksWithoutDueDates().length > 5 && (
                  <div className="text-center py-2 text-indigo-400 text-sm">
                    + {getTasksWithoutDueDates().length - 5} more tasks without due dates
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showQuickAddModal && quickAddDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-gray-850 w-full max-w-md rounded-lg shadow-2xl border border-gray-700 p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-medium">
                Add Task for {quickAddDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h3>
              <button 
                className="text-gray-400 hover:text-white"
                onClick={() => setShowQuickAddModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <textarea
              value={quickAddContent}
              onChange={(e) => setQuickAddContent(e.target.value)}
              placeholder="What needs to be done?"
              rows="3"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-3"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateQuickTask();
                }
              }}
            />
            
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md focus:outline-none transition-colors"
                onClick={() => setShowQuickAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors"
                onClick={handleCreateQuickTask}
                disabled={!quickAddContent.trim()}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CalendarView);