import React, { useState, useEffect } from 'react';

const AchievementsView = ({ 
  groups, 
  getBoards, 
  getColumns, 
  getTasks,
  onBack,
  earnedAchievements = [],
  avatarLevel = 1,
  streakData = {
    currentStreak: 0,
    longestStreak: 0
  }
}) => {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({
    tasksCreated: 0,
    tasksCompleted: 0,
    streakDays: streakData.currentStreak || 0,
    longestStreak: streakData.longestStreak || 0,
    boardsCreated: 0,
    mostProductiveDay: null,
    totalMoves: 0,
    weekendWarrior: 0,
    perfectWeeks: 0
  });
  
  useEffect(() => {
    calculateStats();
  }, [groups, streakData]);
  
  const calculateStats = () => {
    let tasksCreated = 0;
    let tasksCompleted = 0;
    let boardsCreated = 0;
    const completionDates = [];
    const allTasks = [];
    const weekendCompletions = [];
    
    groups.forEach(group => {
      const boards = getBoards(group.id);
      boardsCreated += boards.length;
      
      boards.forEach(board => {
        const columns = getColumns(board.id);
        
        columns.forEach(column => {
          const tasks = getTasks(column.id);
          tasksCreated += tasks.length;
          
          tasks.forEach(task => {
            allTasks.push(task);
            
            if (task.completed) {
              tasksCompleted++;
              if (task.updatedAt) {
                const completionDate = new Date(task.updatedAt);
                const dateString = completionDate.toDateString();
                
                if (!completionDates.includes(dateString)) {
                  completionDates.push(dateString);
                  
                  const day = completionDate.getDay();
                  if (day === 0 || day === 6) { // 0 is Sunday, 6 is Saturday
                    weekendCompletions.push(dateString);
                  }
                }
              }
            }
          });
        });
      });
    });
    
    const perfectWeeks = calculatePerfectWeeks(completionDates);
    
    const streakDays = streakData.currentStreak || 0;
    const longestStreak = streakData.longestStreak || 0;
    
    const completionsByDay = {};
    allTasks.forEach(task => {
      if (task.completed && task.updatedAt) {
        const dayOfWeek = new Date(task.updatedAt).toLocaleDateString('en-US', { weekday: 'long' });
        completionsByDay[dayOfWeek] = (completionsByDay[dayOfWeek] || 0) + 1;
      }
    });
    
    const mostProductiveDay = Object.entries(completionsByDay).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    
    const totalMoves = Math.floor(tasksCreated * 1.5);
    
    setStats({
      tasksCreated,
      tasksCompleted,
      streakDays,
      longestStreak,
      boardsCreated,
      mostProductiveDay,
      totalMoves,
      weekendWarrior: weekendCompletions.length,
      perfectWeeks,
      level: calculateLevel(tasksCompleted)
    });
    
    generateAchievements(
      tasksCreated, 
      tasksCompleted, 
      streakDays, 
      longestStreak,
      boardsCreated, 
      totalMoves, 
      weekendCompletions.length,
      perfectWeeks
    );
  };
  
  const calculatePerfectWeeks = (dates) => {
    // kiv,  need to group dates by week and count
    if (dates.length === 0) return 0;
    
    const sortedDates = dates.map(d => new Date(d)).sort((a, b) => a - b);
    
    // Group by week
    const weekMap = {};
    sortedDates.forEach(date => {
      // Get week number (simplified approach)
      const year = date.getFullYear();
      const weekNum = Math.floor((date - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
      const weekKey = `${year}-${weekNum}`;
      
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = new Set();
      }
      weekMap[weekKey].add(date.getDay());
    });
    
    return Object.values(weekMap).filter(daySet => daySet.size >= 5).length;
  };
  
  const calculateLevel = (tasksCompleted) => {
    return Math.floor(tasksCompleted / 10) + 1;
  };
  
  const generateAchievements = (
    tasksCreated, 
    tasksCompleted, 
    streakDays, 
    longestStreak,
    boardsCreated, 
    totalMoves, 
    weekendCompletions,
    perfectWeeks
  ) => {
    const earnedAchievementsMap = {};
    earnedAchievements.forEach(achievement => {
      earnedAchievementsMap[achievement.id] = true;
    });
    
    const newAchievements = [
      {
        id: 'first-task',
        title: 'First Steps',
        description: 'Create your first task',
        icon: '🌱',
        category: 'tasks',
        progress: Math.min(tasksCreated, 1),
        maxProgress: 1,
        unlocked: tasksCreated >= 1 || earnedAchievementsMap['first-task']
      },
      {
        id: 'task-master',
        title: 'Task Master',
        description: 'Create 10 tasks',
        icon: '📝',
        category: 'tasks',
        progress: Math.min(tasksCreated, 10),
        maxProgress: 10,
        unlocked: tasksCreated >= 10 || earnedAchievementsMap['task-master']
      },
      {
        id: 'task-wizard',
        title: 'Task Wizard',
        description: 'Create 50 tasks',
        icon: '🧙‍♂️',
        category: 'tasks',
        progress: Math.min(tasksCreated, 50),
        maxProgress: 50,
        unlocked: tasksCreated >= 50 || earnedAchievementsMap['task-wizard']
      },
      
      {
        id: 'first-completion',
        title: 'Mission Accomplished',
        description: 'Complete your first task',
        icon: '✅',
        category: 'completion',
        progress: Math.min(tasksCompleted, 1),
        maxProgress: 1,
        unlocked: tasksCompleted >= 1 || earnedAchievementsMap['first-completion']
      },
      {
        id: 'getting-things-done',
        title: 'Getting Things Done',
        description: 'Complete 25 tasks',
        icon: '🚀',
        category: 'completion',
        progress: Math.min(tasksCompleted, 25),
        maxProgress: 25,
        unlocked: tasksCompleted >= 25 || earnedAchievementsMap['getting-things-done']
      },
      {
        id: 'productivity-guru',
        title: 'Productivity Guru',
        description: 'Complete 100 tasks',
        icon: '🏆',
        category: 'completion',
        progress: Math.min(tasksCompleted, 100),
        maxProgress: 100,
        unlocked: tasksCompleted >= 100 || earnedAchievementsMap['productivity-guru']
      },
      
      {
        id: 'consistency',
        title: 'Consistency is Key',
        description: 'Complete tasks on 3 consecutive days',
        icon: '📅',
        category: 'streaks',
        progress: Math.min(streakDays, 3),
        maxProgress: 3,
        unlocked: streakDays >= 3 || earnedAchievementsMap['consistency']
      },
      {
        id: 'habit-former',
        title: 'Habit Former',
        description: 'Complete tasks on 7 consecutive days',
        icon: '⚡',
        category: 'streaks',
        progress: Math.min(streakDays, 7),
        maxProgress: 7,
        unlocked: streakDays >= 7 || earnedAchievementsMap['habit-former']
      },
      {
        id: 'streak-master',
        title: 'Streak Master',
        description: 'Complete tasks on 14 consecutive days',
        icon: '🔥',
        category: 'streaks',
        progress: Math.min(streakDays, 14),
        maxProgress: 14,
        unlocked: streakDays >= 14 || earnedAchievementsMap['streak-master']
      },
      {
        id: 'streak-legend',
        title: 'Streak Legend',
        description: 'Complete tasks on 30 consecutive days',
        icon: '👑',
        category: 'streaks',
        progress: Math.min(streakDays, 30),
        maxProgress: 30,
        unlocked: streakDays >= 30 || earnedAchievementsMap['streak-legend']
      },
      {
        id: 'longest-streak-14',
        title: 'Unstoppable',
        description: 'Achieve a 14-day streak at any point',
        icon: '⏱️',
        category: 'streaks',
        progress: Math.min(longestStreak, 14),
        maxProgress: 14,
        unlocked: longestStreak >= 14 || earnedAchievementsMap['longest-streak-14']
      },
      
      // Weekend Achievements
      {
        id: 'weekend-warrior',
        title: 'Weekend Warrior',
        description: 'Complete tasks on 5 different weekends',
        icon: '🏄‍♂️',
        category: 'consistency',
        progress: Math.min(weekendCompletions, 5),
        maxProgress: 5,
        unlocked: weekendCompletions >= 5 || earnedAchievementsMap['weekend-warrior']
      },
      {
        id: 'weekender',
        title: 'Dedicated Weekender',
        description: 'Complete tasks on 15 different weekends',
        icon: '🌞',
        category: 'consistency',
        progress: Math.min(weekendCompletions, 15),
        maxProgress: 15,
        unlocked: weekendCompletions >= 15 || earnedAchievementsMap['weekender']
      },
      
      {
        id: 'perfect-week',
        title: 'Perfect Week',
        description: 'Complete tasks on 5+ days in a single week',
        icon: '📊',
        category: 'consistency',
        progress: Math.min(perfectWeeks, 1),
        maxProgress: 1,
        unlocked: perfectWeeks >= 1 || earnedAchievementsMap['perfect-week']
      },
      {
        id: 'perfect-month',
        title: 'Perfect Month',
        description: 'Achieve 4 perfect weeks',
        icon: '📈',
        category: 'consistency',
        progress: Math.min(perfectWeeks, 4),
        maxProgress: 4,
        unlocked: perfectWeeks >= 4 || earnedAchievementsMap['perfect-month']
      },
      
      {
        id: 'organizer',
        title: 'Organizer',
        description: 'Create 3 boards',
        icon: '📊',
        category: 'organization',
        progress: Math.min(boardsCreated, 3),
        maxProgress: 3,
        unlocked: boardsCreated >= 3 || earnedAchievementsMap['organizer']
      },
      {
        id: 'board-master',
        title: 'Board Master',
        description: 'Create 10 boards',
        icon: '📋',
        category: 'organization',
        progress: Math.min(boardsCreated, 10),
        maxProgress: 10,
        unlocked: boardsCreated >= 10 || earnedAchievementsMap['board-master']
      },
      
      {
        id: 'task-juggler',
        title: 'Task Juggler',
        description: 'Move tasks between columns 10 times',
        icon: '🤹',
        category: 'management',
        progress: Math.min(totalMoves, 10),
        maxProgress: 10,
        unlocked: totalMoves >= 10 || earnedAchievementsMap['task-juggler']
      },
      {
        id: 'workflow-master',
        title: 'Workflow Master',
        description: 'Move tasks between columns 50 times',
        icon: '⏩',
        category: 'management',
        progress: Math.min(totalMoves, 50),
        maxProgress: 50,
        unlocked: totalMoves >= 50 || earnedAchievementsMap['workflow-master']
      }
    ];
    
    setAchievements(newAchievements);
  };
  
  const calculateProgress = (current, max) => {
    return Math.min(100, Math.floor((current / max) * 100));
  };
  
  const calculateXP = (tasksCompleted) => {
    const currentLevel = calculateLevel(tasksCompleted);
    const xpForCurrentLevel = (currentLevel - 1) * 10;
    const xpToNextLevel = 10; 
    const currentXP = tasksCompleted - xpForCurrentLevel;
    
    return {
      current: currentXP,
      needed: xpToNextLevel,
      percentage: Math.floor((currentXP / xpToNextLevel) * 100)
    };
  };
  
  const groupedAchievements = () => {
    const groups = {};
    
    achievements.forEach(achievement => {
      if (!groups[achievement.category]) {
        groups[achievement.category] = [];
      }
      groups[achievement.category].push(achievement);
    });
    
    return groups;
  };
  
  const levelData = calculateXP(stats.tasksCompleted);
  
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center mb-6 pb-4 border-b border-gray-800">
        <button 
          className="flex items-center mr-4 px-3 py-1.5 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
          onClick={onBack}
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <h2 className="text-xl font-bold text-white">Achievements</h2>
      </div>
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
            {stats.level}
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-white">Productivity Level {stats.level}</h3>
            <p className="text-gray-400 text-sm">Keep completing tasks to level up!</p>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Progress to Level {stats.level + 1}</span>
            <span className="text-gray-300">{levelData.current}/{levelData.needed} XP</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full" 
              style={{ width: `${levelData.percentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-3xl font-bold text-indigo-400 mb-1">{stats.tasksCompleted}</div>
            <div className="text-gray-400 text-sm">Tasks Completed</div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-3xl font-bold text-indigo-400 mb-1">{stats.streakDays}</div>
            <div className="text-gray-400 text-sm">Day Streak</div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-3xl font-bold text-indigo-400 mb-1">{stats.longestStreak}</div>
            <div className="text-gray-400 text-sm">Longest Streak</div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-3xl font-bold text-indigo-400 mb-1">{stats.perfectWeeks}</div>
            <div className="text-gray-400 text-sm">Perfect Weeks</div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
        <h3 className="text-white font-medium mb-3">Your Productivity Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 flex items-center">
            <span className="text-3xl mr-3">🔥</span>
            <div>
              <div className="text-gray-300">Most Productive Day</div>
              <div className="text-white font-medium">{stats.mostProductiveDay || "Not enough data"}</div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 flex items-center">
            <span className="text-3xl mr-3">🌞</span>
            <div>
              <div className="text-gray-300">Weekend Warrior</div>
              <div className="text-white font-medium">
                {stats.weekendWarrior} weekend tasks completed
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-8">
        {Object.entries(groupedAchievements()).map(([category, categoryAchievements]) => (
          <div key={category} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-white font-medium capitalize mb-4">{category} Achievements</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAchievements.map(achievement => (
                <div 
                  key={achievement.id} 
                  className={`relative rounded-lg p-4 border ${
                    achievement.unlocked 
                      ? 'bg-gray-700 border-indigo-500 achievement-glow' 
                      : 'bg-gray-850 border-gray-700 opacity-70'
                  }`}
                >
                  <div className="flex items-start mb-3">
                    <div className={`text-3xl mr-3 ${achievement.unlocked ? 'achievement-icon-animate' : ''}`}>
                      {achievement.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{achievement.title}</h4>
                      <p className="text-gray-400 text-sm">{achievement.description}</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-300">{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          achievement.unlocked ? 'bg-emerald-500 achievement-progress-pulse' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${calculateProgress(achievement.progress, achievement.maxProgress)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {achievement.unlocked && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes icon-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.3); }
          50% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.6); }
        }
        
        @keyframes progress-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .achievement-icon-animate {
          animation: icon-bounce 2s infinite;
        }
        
        .achievement-glow {
          animation: glow-pulse 3s infinite;
        }
        
        .achievement-progress-pulse {
          animation: progress-pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default AchievementsView;