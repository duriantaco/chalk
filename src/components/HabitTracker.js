import React, { useState, useEffect } from 'react';

const HabitTracker = ({ 
  groups, 
  getBoards, 
  getColumns, 
  getTasks,
  selectedTimeRange = 'year',
  onEarnStreak = () => {},
  avatarXp = 0,
  onAddXp = () => {}
}) => {
  const [activityData, setActivityData] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [stats, setStats] = useState({
    totalDays: 0,
    activeDays: 0,
    longestStreak: 0,
    currentStreak: 0,
    mostProductiveDay: null,
    mostProductiveCount: 0
  });

  const [weeks, setWeeks] = useState([]);
  const [monthLabels, setMonthLabels] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streakMessage, setStreakMessage] = useState('');
  const [lastSeenStreak, setLastSeenStreak] = useState(0);
  
  useEffect(() => {
    calculateActivityData();
  }, [groups, selectedTimeRange]);

  useEffect(() => {
    if (stats.currentStreak > 0 && stats.currentStreak > lastSeenStreak) {
      if (stats.currentStreak === 3) {
        celebrate("3-day streak! Keep it up! 🔥");
        onAddXp(5);
        onEarnStreak(3);
      } else if (stats.currentStreak === 7) {
        celebrate("Amazing! 7-day streak! 🌟");
        onAddXp(15);
        onEarnStreak(7);
      } else if (stats.currentStreak === 14) {
        celebrate("Two weeks strong! Incredible! 💪");
        onAddXp(30);
        onEarnStreak(14);
      } else if (stats.currentStreak === 30) {
        celebrate("A FULL MONTH STREAK! LEGENDARY! 🏆");
        onAddXp(100);
        onEarnStreak(30);
      } else if (stats.currentStreak % 10 === 0) {
        celebrate(`${stats.currentStreak}-day streak! Fantastic!`);
        onAddXp(20);
        onEarnStreak(stats.currentStreak);
      }
      
      setLastSeenStreak(stats.currentStreak);
    }
  }, [stats.currentStreak, lastSeenStreak]);

  const celebrate = (message) => {
    setStreakMessage(message);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setStreakMessage('');
    }, 5000);
  };

  const calculateActivityData = () => {
    const allTasks = [];
    
    groups.forEach(group => {
      const boards = getBoards(group.id);
      boards.forEach(board => {
        const columns = getColumns(board.id);
        columns.forEach(column => {
          const tasks = getTasks(column.id);
          tasks.forEach(task => {
            if (task.completed && task.updatedAt) {
              allTasks.push({
                ...task,
                completedDate: new Date(task.updatedAt),
                boardName: board.name,
                columnName: column.name
              });
            }
          });
        });
      });
    });

    const now = new Date();
    let startDate;
    
    if (selectedTimeRange === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    } else if (selectedTimeRange === 'month6') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
    } else if (selectedTimeRange === 'month3') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
    } else if (selectedTimeRange === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    }

    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    const dateMap = {};
    
    const tempDate = new Date(startDate);
    while (tempDate <= now) {
      const dateKey = tempDate.toISOString().split('T')[0];
      dateMap[dateKey] = {
        date: new Date(tempDate),
        count: 0,
        tasks: []
      };
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    allTasks.forEach(task => {
      const dateKey = task.completedDate.toISOString().split('T')[0];
      if (dateMap[dateKey]) {
        dateMap[dateKey].count += 1;
        dateMap[dateKey].tasks.push(task);
      }
    });
    
    const weeksData = [];
    let currentWeek = [];
    let currentMonth = -1;
    const months = [];
    let weekCount = 0;
    
    const iterDate = new Date(startDate);
    
    while (iterDate <= now) {
      if (iterDate.getDay() === 0) {
        if (currentWeek.length > 0) {
          weeksData.push(currentWeek);
          currentWeek = [];
          weekCount++;
        }
      }
      
      if (iterDate.getMonth() !== currentMonth) {
        currentMonth = iterDate.getMonth();
        months.push({
          name: iterDate.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex: weekCount
        });
      }
      
      const dateKey = iterDate.toISOString().split('T')[0];
      currentWeek.push(dateMap[dateKey] || {
        date: new Date(iterDate),
        count: 0,
        tasks: []
      });
      
      iterDate.setDate(iterDate.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        const lastDate = new Date(currentWeek[currentWeek.length - 1].date);
        lastDate.setDate(lastDate.getDate() + 1);
        currentWeek.push({
          date: lastDate,
          count: 0,
          tasks: []
        });
      }
      weeksData.push(currentWeek);
    }
    
    const allDays = Object.values(dateMap);
    const activeDays = allDays.filter(day => day.count > 0).length;
    const totalDays = allDays.length;
    
    let currentStreak = 0;
    for (let i = allDays.length - 1; i >= 0; i--) {
      if (allDays[i].count > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    let longestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < allDays.length; i++) {
      if (allDays[i].count > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }
    
    const dayOfWeekCounts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
    allDays.forEach(day => {
      if (day.count > 0) {
        const dayOfWeek = day.date.getDay();
        dayOfWeekCounts[dayOfWeek] += day.count;
      }
    });
    
    const mostProductiveDayNum = Object.keys(dayOfWeekCounts).reduce(
      (a, b) => dayOfWeekCounts[a] > dayOfWeekCounts[b] ? a : b
    );
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostProductiveDayName = dayNames[mostProductiveDayNum];
    const mostProductiveCount = dayOfWeekCounts[mostProductiveDayNum];
    
    setWeeks(weeksData);
    setMonthLabels(months);
    setActivityData(allDays);
    setStats({
      totalDays,
      activeDays,
      longestStreak,
      currentStreak,
      mostProductiveDay: mostProductiveDayName,
      mostProductiveCount
    });
  };

  const getActivityColor = (count) => {
    if (count === 0) return 'bg-gray-800'; 
    if (count >= 10) return 'bg-green-700 animate-pulse-slow'; 
    if (count >= 5) return 'bg-green-600'; 
    if (count >= 3) return 'bg-green-500'; 
    return 'bg-green-400';                
  };
  
  const getStreakClass = (streak) => {
    if (streak === 0) return 'text-gray-500';
    if (streak < 3) return 'text-emerald-400';
    if (streak < 7) return 'text-emerald-500';
    if (streak < 14) return 'text-emerald-300 font-bold';
    return 'text-emerald-300 font-bold animate-fire'; 
  };

  const getDayRows = () => {
    const rows = [[], [], [], [], [], [], []];
    
    weeks.forEach(week => {
      week.forEach((day, index) => {
        rows[index].push(day);
      });
    });
    
    return rows;
  };

  const Confetti = () => (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {Array.from({ length: 100 }).map((_, i) => {
        const size = Math.random() * 8 + 5;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 3 + 2;
        const delay = Math.random() * 0.5;
        
        return (
          <div 
            key={i} 
            className="absolute top-0 rounded-sm"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
              animation: `fall ${animationDuration}s ease-in ${delay}s forwards`
            }}
          />
        );
      })}
    </div>
  );

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  const dayRows = getDayRows();

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 habit-tracker-container">
      {showConfetti && <Confetti />}
      
      {streakMessage && (
        <div className="mb-4 p-3 text-center bg-indigo-900/50 border border-indigo-500/50 rounded-lg animate-bounce-slow">
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-indigo-300 text-transparent bg-clip-text">
            {streakMessage}
          </span>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-medium">Task Completion Tracker</h3>
      </div>
      
      <div className="w-full overflow-hidden">
        <div className="github-grid-container bg-gray-850 border border-gray-700 p-4 rounded-md overflow-x-auto">
          <div className="relative ml-10" style={{height: '20px'}}>
            {monthLabels.map((month, index) => (
              <div 
                key={index} 
                className="absolute text-xs text-gray-400"
                style={{left: `${month.weekIndex * 16}px`}}
              >
                {month.name}
              </div>
            ))}
          </div>
          
          <div className="flex mt-2">
            <div className="flex flex-col justify-around mr-2 h-[104px]">
              {dayLabels.map((day, index) => (
                <div key={index} className="text-xs text-gray-400 h-[13px] flex items-center">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="flex-grow" style={{minWidth: '816px'}}> 
              <div className="flex">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col" style={{width: '15px', marginRight: '1px'}}>
                    {week.map((day, dayIndex) => {
                      const isToday = new Date(day.date).toDateString() === new Date().toDateString();
                      const isHovered = hoveredDay && new Date(hoveredDay.date).toDateString() === new Date(day.date).toDateString();
                      const isStreak = day.count > 0 && weekIndex > 0 && weeks[weekIndex-1][dayIndex].count > 0;

                      return (
                        <div 
                          key={dayIndex} 
                          className={`
                            ${getActivityColor(day.count)} 
                            ${isHovered ? 'ring-1 ring-indigo-400 scale-125 z-10' : ''} 
                            ${isToday ? 'ring-1 ring-white' : ''} 
                            ${isStreak ? 'streak-glow' : ''}
                            w-[13px] h-[13px] mb-[1px] rounded-sm border border-gray-700/50
                            transition-all duration-300 ease-in-out hover:scale-110
                          `}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          title={`${new Date(day.date).toLocaleDateString()}: ${day.count} tasks completed`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end items-center mt-2 text-xs text-gray-400">
            <span>Less</span>
            <div className="flex mx-2">
              <div className="w-[13px] h-[13px] mr-[1px] bg-gray-800 border border-gray-700/50 rounded-sm"></div>
              <div className="w-[13px] h-[13px] mr-[1px] bg-green-400 border border-gray-700/50 rounded-sm"></div>
              <div className="w-[13px] h-[13px] mr-[1px] bg-green-500 border border-gray-700/50 rounded-sm"></div>
              <div className="w-[13px] h-[13px] mr-[1px] bg-green-600 border border-gray-700/50 rounded-sm"></div>
              <div className="w-[13px] h-[13px] bg-green-700 border border-gray-700/50 rounded-sm animate-pulse-slow"></div>
            </div>
            <span>More</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:bg-gray-750 transition-colors">
            <div className="text-gray-400 text-xs">Active Days</div>
            <div className="text-white font-medium">
              {stats.activeDays} of {stats.totalDays} days
              <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                  style={{width: `${(stats.activeDays / stats.totalDays) * 100}%`}}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:bg-gray-750 transition-colors">
            <div className="text-gray-400 text-xs">Current Streak</div>
            <div className={`font-medium ${getStreakClass(stats.currentStreak)}`}>
              {stats.currentStreak} {stats.currentStreak !== 1 ? 'days' : 'day'}
              {stats.currentStreak >= 7 && (
                <span className="ml-2">🔥</span>
              )}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:bg-gray-750 transition-colors">
            <div className="text-gray-400 text-xs">Longest Streak</div>
            <div className={`font-medium ${getStreakClass(stats.longestStreak)}`}>
              {stats.longestStreak} {stats.longestStreak !== 1 ? 'days' : 'day'}
              {stats.longestStreak >= 14 && (
                <span className="ml-2">🏆</span>
              )}
            </div>
          </div>
          
          {stats.mostProductiveDay && (
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:bg-gray-750 transition-colors">
              <div className="text-gray-400 text-xs">Most Productive Day</div>
              <div className="text-white font-medium">
                {stats.mostProductiveDay} ({stats.mostProductiveCount} tasks)
              </div>
            </div>
          )}
        </div>
        
        {hoveredDay && (
          <div className="bg-gray-800 rounded-lg p-3 mt-4 border border-gray-700 transform transition-all duration-300 animate-fade-in">
            <div className="text-white text-sm mb-2 font-medium">
              {new Date(hoveredDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            
            {hoveredDay.count > 0 ? (
              <>
                <div className="text-emerald-400 font-medium mb-2">
                  {hoveredDay.count} {hoveredDay.count === 1 ? 'task' : 'tasks'} completed
                </div>
                
                <div className="max-h-32 overflow-y-auto">
                  {hoveredDay.tasks.slice(0, 5).map((task, i) => (
                    <div key={i} className="text-xs text-gray-300 truncate mb-1 animate-slide-in" style={{ animationDelay: `${i * 0.1}s` }}>
                      • {task.content}
                    </div>
                  ))}
                  {hoveredDay.tasks.length > 5 && (
                    <div className="text-xs text-gray-400">
                      +{hoveredDay.tasks.length - 5} more tasks
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm">No tasks completed on this day</div>
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes fire {
          0% { color: #fbbf24; text-shadow: 0 0 5px #f97316; }
          25% { color: #f97316; text-shadow: 0 0 10px #ef4444; }
          50% { color: #ef4444; text-shadow: 0 0 15px #f97316; }
          75% { color: #f97316; text-shadow: 0 0 10px #fbbf24; }
          100% { color: #fbbf24; text-shadow: 0 0 5px #f97316; }
        }
        
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); }
          100% { transform: translateY(100vh) rotate(720deg); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fire {
          animation: fire 1.5s infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
          animation-fill-mode: both;
        }
        
        .streak-glow {
          box-shadow: 0 0 5px 1px rgba(16, 185, 129, 0.7);
        }
        
        .habit-tracker-container {
          transition: all 0.3s;
        }
        
        .habit-tracker-container:hover {
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
        }
      `}</style>
    </div>
  );
};

export default HabitTracker;