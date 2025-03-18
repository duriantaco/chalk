import React, { useMemo } from 'react';

const TaskAnalytics = ({ task, getTaskAnalytics }) => {
  const analytics = useMemo(() => {
    return getTaskAnalytics(task.id);
  }, [task.id, getTaskAnalytics]);
  
  if (!analytics) {
    return <div className="text-gray-500 text-sm">No analytics available for this task.</div>;
  }
  
  const formatTime = (ms) => {
    if (ms < 60 * 1000) {
      return 'Less than a minute';
    }
    
    if (ms < 60 * 60 * 1000) {
      const minutes = Math.floor(ms / (60 * 1000));
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    if (ms < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(ms / (60 * 60 * 1000));
      const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
  };
  
  const getTotalTimeSpent = () => {
    return Object.values(analytics.columnTimes).reduce((sum, time) => sum + time, 0);
  };
  
  const getColumnPercentage = (columnTime) => {
    const totalTime = getTotalTimeSpent();
    return totalTime > 0 ? (columnTime / totalTime) * 100 : 0;
  };
  
  const getPriorityColor = () => {
    switch(analytics.priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-emerald-500';
      default: return 'text-gray-400';
    }
  };

  const percentComplete = task.percentComplete || 0;
  
  return (
    <div className="bg-gray-850 rounded-lg border border-gray-700 p-4">
      <h3 className="text-white font-medium mb-4">Task Analytics</h3>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-gray-400 text-sm">Status:</div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${analytics.completed ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
            <span className="text-white">{analytics.completed ? 'Completed' : analytics.currentStatus}</span>
          </div>
        </div>

        {(task.columnStatus === 'in-progress' || percentComplete > 0) && (
          <div className="bg-gray-800 rounded-md p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="text-gray-400 text-xs">Progress</div>
              <div className="text-white text-lg font-medium">
                {percentComplete}%
              </div>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  percentComplete === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${percentComplete}%` }}
              ></div>
            </div>
            {task.columnStatus === 'in-progress' && (
              <div className="text-xs text-gray-400 mt-2">
                Task is in progress. You can update the completion percentage in the task details.
              </div>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-md p-3">
            <div className="text-gray-400 text-xs mb-1">Total Time</div>
            <div className="text-white text-lg font-medium">{formatTime(analytics.totalTimeMs)}</div>
          </div>
          
          <div className="bg-gray-800 rounded-md p-3">
            <div className="text-gray-400 text-xs mb-1">Cycle Time</div>
            <div className="text-white text-lg font-medium">{formatTime(analytics.cycleTimeMs)}</div>
          </div>
          
          <div className="bg-gray-800 rounded-md p-3">
            <div className="text-gray-400 text-xs mb-1">Priority</div>
            <div className={`text-lg font-medium ${getPriorityColor()}`}>
              {analytics.priority.charAt(0).toUpperCase() + analytics.priority.slice(1)}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-md p-3">
            <div className="text-gray-400 text-xs mb-1">Column Changes</div>
            <div className="text-white text-lg font-medium">{analytics.transitions}</div>
          </div>
        </div>
        
        {Object.keys(analytics.columnTimes).length > 0 && (
          <div>
            <div className="text-gray-400 text-sm mb-3">Time Spent in Columns</div>
            <div className="space-y-2">
              {Object.entries(analytics.columnTimes).map(([column, time], index) => (
                <div key={column} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white">{column}</span>
                    <span className="text-gray-400">{formatTime(time)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        index % 3 === 0 ? 'bg-indigo-500' : 
                        index % 3 === 1 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${getColumnPercentage(time)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {task.movementHistory && task.movementHistory.length > 0 && (
          <div>
            <div className="text-gray-400 text-sm mb-3">Movement History</div>
            <div className="max-h-40 overflow-y-auto bg-gray-800 rounded-md border border-gray-700">
              {task.movementHistory.map((move, index) => (
                <div key={index} className="border-b border-gray-700 last:border-0 p-2 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-indigo-400">
                      {move.from} → {move.to}
                    </span>
                    <span className="text-gray-500">
                      {new Date(move.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {move.notes && (
                    <div className="text-gray-400 mt-1 italic">"{move.notes}"</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {analytics.completed && (
          <div className="bg-gray-800 rounded-md p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="text-gray-400 text-xs">Efficiency Score</div>
              <div className="text-white text-lg font-medium">
                {calculateEfficiencyScore(analytics)}%
              </div>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${getEfficiencyColor(calculateEfficiencyScore(analytics))}`}
                style={{ width: `${calculateEfficiencyScore(analytics)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const calculateEfficiencyScore = (analytics) => {

  // in real app,compare against averages, expected times, etc. now just placeholder
  const averageCycleTime = 7 * 24 * 60 * 60 * 1000; 
  
  if (analytics.cycleTimeMs <= 0) return 100;
  
  const ratio = Math.min(averageCycleTime / analytics.cycleTimeMs, 2);
  const score = Math.round(ratio * 100 / 2); 
  
  return Math.min(Math.max(score, 0), 100); 
};

const getEfficiencyColor = (score) => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-lime-500';
  if (score >= 40) return 'bg-amber-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

export default TaskAnalytics;