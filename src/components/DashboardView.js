// Updated src/components/DashboardView.js with HabitTracker
import React, { useState, useEffect } from 'react';
import HabitTracker from './HabitTracker';

const DashboardView = ({ 
  groups, 
  getBoards, 
  getColumns, 
  getTasks, 
  currentGroupId,
  onSelectBoard,
  onBack 
}) => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    highPriorityTasks: 0,
    tasksByBoard: [],
    recentActivity: []
  });
  
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState(currentGroupId || 'all');
  const [habitTimeRange, setHabitTimeRange] = useState('year'); 
  
  useEffect(() => {
    calculateStats();
  }, [groups, selectedTimeRange, selectedGroup]);
  
  const calculateStats = () => {
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    let highPriorityTasks = 0;
    const tasksByBoard = [];
    const allTasks = [];
    
    const filteredGroups = selectedGroup === 'all' 
      ? groups 
      : groups.filter(group => group.id === selectedGroup);
    
    filteredGroups.forEach(group => {
      const boards = getBoards(group.id);
      
      boards.forEach(board => {
        const columns = getColumns(board.id);
        let boardTotalTasks = 0;
        let boardCompletedTasks = 0;
        
        columns.forEach(column => {
          const tasks = getTasks(column.id);
          
          tasks.forEach(task => {
            if (shouldIncludeTaskByDate(task)) {
              allTasks.push({
                ...task,
                boardName: board.name,
                columnName: column.name,
                groupName: group.name
              });
              
              boardTotalTasks++;
              totalTasks++;
              
              if (task.completed) {
                completedTasks++;
                boardCompletedTasks++;
              }
              
              if (isOverdue(task.dueDate) && !task.completed) {
                overdueTasks++;
              }
              
              if (task.priority === 'high') {
                highPriorityTasks++;
              }
            }
          });
        });
        
        // Add board stats
        if (boardTotalTasks > 0) {
          tasksByBoard.push({
            boardId: board.id,
            boardName: board.name,
            groupName: group.name,
            totalTasks: boardTotalTasks,
            completedTasks: boardCompletedTasks,
            completionRate: Math.round((boardCompletedTasks / boardTotalTasks) * 100)
          });
        }
      });
    });
    
    const recentActivity = [...allTasks]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
    
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;
    
    setStats({
      totalTasks,
      completedTasks,
      overdueTasks,
      highPriorityTasks,
      completionRate,
      tasksByBoard: tasksByBoard.sort((a, b) => b.totalTasks - a.totalTasks),
      recentActivity
    });
  };
  
  const shouldIncludeTaskByDate = (task) => {
    if (selectedTimeRange === 'all') return true;
    
    const today = new Date();
    const taskDate = new Date(task.updatedAt || task.createdAt);
    
    switch(selectedTimeRange) {
      case 'today':
        return taskDate.toDateString() === today.toDateString();
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        return taskDate >= weekAgo;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        return taskDate >= monthAgo;
      default:
        return true;
    }
  };
  
  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };
  
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
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
      </div>
      
      {/* filters for d/w/m */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <label className="mr-2 text-gray-400 text-sm">Time Range:</label>
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md text-gray-300 text-sm px-3 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <label className="mr-2 text-gray-400 text-sm">Workspace:</label>
          <select 
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md text-gray-300 text-sm px-3 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Workspaces</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-gray-400 text-sm mb-1">Total Tasks</h3>
          <div className="flex items-end">
            <span className="text-3xl font-bold text-white">{stats.totalTasks}</span>
            <span className="ml-2 text-sm text-gray-400">tasks</span>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-gray-400 text-sm mb-1">Completion Rate</h3>
          <div className="flex items-end">
            <span className="text-3xl font-bold text-white">{stats.completionRate}%</span>
            <span className="ml-2 text-sm text-gray-400">{stats.completedTasks} completed</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${stats.completionRate}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-gray-400 text-sm mb-1">Overdue Tasks</h3>
          <div className="flex items-end">
            <span className="text-3xl font-bold text-red-400">{stats.overdueTasks}</span>
            <span className="ml-2 text-sm text-gray-400">tasks</span>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-gray-400 text-sm mb-1">High Priority</h3>
          <div className="flex items-end">
            <span className="text-3xl font-bold text-amber-400">{stats.highPriorityTasks}</span>
            <span className="ml-2 text-sm text-gray-400">tasks</span>
          </div>
        </div>
      </div>
      
      {/* Habit Tracker */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-white">Habit Tracker</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Time Period:</span>
            <select
              value={habitTimeRange}
              onChange={(e) => setHabitTimeRange(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md text-gray-300 text-sm px-3 py-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="year">Past Year</option>
              <option value="month6">Past 6 Months</option>
              <option value="month3">Past 3 Months</option>
              <option value="month">Past Month</option>
            </select>
          </div>
        </div>
        
        <HabitTracker 
          groups={groups} 
          getBoards={getBoards} 
          getColumns={getColumns} 
          getTasks={getTasks}
          selectedTimeRange={habitTimeRange}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-white font-medium mb-4">Tasks by Board</h3>
          
          {stats.tasksByBoard.length > 0 ? (
            <div className="space-y-4">
              {stats.tasksByBoard.map(board => (
                <div key={board.boardId} className="border-b border-gray-700 pb-3 last:border-0">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span 
                        className="text-white font-medium hover:text-indigo-400 cursor-pointer"
                        onClick={() => onSelectBoard(board.boardId)}
                      >
                        {board.boardName}
                      </span>
                      <span className="text-gray-500 text-xs ml-2">{board.groupName}</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {board.completedTasks}/{board.totalTasks} tasks
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${board.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No tasks found for the selected filters
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-white font-medium mb-4">Recent Activity</h3>
          
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((task, index) => (
                <div key={index} className="flex items-start p-2 rounded-md hover:bg-gray-700">
                  <div className={`w-2 h-2 mt-2 rounded-full mr-3 ${task.completed ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium mb-1">{task.content}</div>
                    <div className="flex items-center text-xs text-gray-400">
                      <span>{task.boardName}</span>
                      <span className="mx-1">•</span>
                      <span>{formatDate(task.updatedAt)}</span>
                      {task.completed && <span className="ml-2 px-1.5 py-0.5 bg-emerald-900 text-emerald-300 rounded text-xs">Completed</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;