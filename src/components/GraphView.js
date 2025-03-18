// src/components/GraphView.js
import React, { useState } from 'react';
import ProjectGraphVisualization from './ProjectGraphVisualization';

const GraphView = ({ 
  groups, 
  getBoards, 
  getColumns, 
  getTasks,
  onSelectTask,
  onSelectBoard,
  onBack 
}) => {
  const [focusedTaskId, setFocusedTaskId] = useState(null);
  const [visualizationType, setVisualizationType] = useState('full');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const handleSearch = (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    const lowerCaseTerm = term.toLowerCase();
    const results = [];
    
    groups.forEach(group => {
      const boards = getBoards(group.id);
      
      boards.forEach(board => {
        const columns = getColumns(board.id);
        
        columns.forEach(column => {
          const tasks = getTasks(column.id);
          
          tasks.forEach(task => {
            if (
              task.content.toLowerCase().includes(lowerCaseTerm) ||
              (task.description && task.description.toLowerCase().includes(lowerCaseTerm))
            ) {
              results.push({
                id: task.id,
                content: task.content,
                groupName: group.name,
                boardName: board.name,
                columnName: column.name,
                priority: task.priority,
                completed: task.completed
              });
            }
          });
        });
      });
    });
    
    setSearchResults(results);
  };
  
  const handleTaskSelect = (taskId) => {
    setFocusedTaskId(taskId);
    if (onSelectTask) {
      onSelectTask({
        id: taskId,
        boardId: null, 
        columnId: null  
      });
    }
  };
  
  const getPriorityColor = (priority, completed) => {
    if (completed) return 'bg-emerald-600';
    switch(priority) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-amber-600';
      case 'low': return 'bg-cyan-600';
      default: return 'bg-gray-600';
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-6 py-4 border-b border-gray-800">
        <button 
          className="p-2 mr-4 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors focus:outline-none"
          onClick={onBack}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="text-xl font-bold text-white">Project Graph</h2>
      </div>
      
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search for tasks..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-400">View Mode:</label>
            <select
              value={visualizationType}
              onChange={(e) => setVisualizationType(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="full">Full Graph</option>
              <option value="hierarchy">Hierarchy</option>
              <option value="dependency">Dependencies</option>
            </select>
          </div>
        </div>
        
        {searchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Search Results:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {searchResults.slice(0, 6).map(result => (
                <div 
                  key={result.id}
                  className="flex items-center p-2 bg-gray-750 rounded-md cursor-pointer hover:bg-gray-700"
                  onClick={() => handleTaskSelect(result.id)}
                >
                  <div className={`w-3 h-3 rounded-full mr-2 ${getPriorityColor(result.priority, result.completed)}`}></div>
                  <div className="flex-1 truncate">
                    <div className={`text-sm ${result.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {result.content}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {result.boardName} / {result.columnName}
                    </div>
                  </div>
                </div>
              ))}
              
              {searchResults.length > 6 && (
                <div className="p-2 bg-gray-750 rounded-md text-center">
                  <span className="text-sm text-indigo-400">
                    +{searchResults.length - 6} more results
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ProjectGraphVisualization
          groups={groups}
          getBoards={getBoards}
          getColumns={getColumns}
          getTasks={getTasks}
          onSelectTask={handleTaskSelect}
          onSelectBoard={onSelectBoard}
          focusedTaskId={focusedTaskId}
          visualizationType={visualizationType}
        />
      </div>
      
      <div className="p-3 bg-gray-800 border-t border-gray-700">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-400">
            {groups.length} workspaces • 
            {groups.reduce((count, group) => count + getBoards(group.id).length, 0)} boards • 
            {groups.reduce((count, group) => {
              const boards = getBoards(group.id);
              return count + boards.reduce((boardCount, board) => {
                return boardCount + getColumns(board.id).length;
              }, 0);
            }, 0)} columns • 
            {groups.reduce((count, group) => {
              const boards = getBoards(group.id);
              return count + boards.reduce((boardCount, board) => {
                const columns = getColumns(board.id);
                return boardCount + columns.reduce((columnCount, column) => {
                  return columnCount + getTasks(column.id).length;
                }, 0);
              }, 0);
            }, 0)} tasks
          </div>
          
          <div>
            <button 
              className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
              onClick={() => window.print()}
            >
              Export Graph
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphView;