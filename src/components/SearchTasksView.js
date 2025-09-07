// src/components/SearchTasksView.js
import React, { useState, useEffect } from 'react';
import SearchAndFilterBar from './SearchAndFilterBar';
import TaskCardMeta from './TaskCardMeta';

const SearchTasksView = ({ 
  groups, 
  getBoards, 
  getColumns, 
  getTasks,
  onBack,
  onTaskClick
}) => {
  const [searchResults, setSearchResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    priority: 'all',
    completed: 'all',
    dueDate: 'any',
    labels: []
  });
  const [availableLabels, setAvailableLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    collectTasksAndLabels();
  }, [groups]);
  
  const collectTasksAndLabels = () => {
    setIsLoading(true);
    
    const allTasks = [];
    const labelsSet = new Set();
    
    groups.forEach(group => {
      const boards = getBoards(group.id);
      
      boards.forEach(board => {
        const columns = getColumns(board.id);
        
        columns.forEach(column => {
          const tasks = getTasks(column.id);
          
          tasks.forEach(task => {
            if (task.labels && Array.isArray(task.labels)) {
              task.labels.forEach(label => labelsSet.add(label));
            }
            
            allTasks.push({
              ...task,
              groupId: group.id,
              groupName: group.name,
              boardId: board.id,
              boardName: board.name,
              columnId: column.id,
              columnName: column.name
            });
          });
        });
      });
    });
    
    setSearchResults(allTasks);
    setFilteredResults(allTasks);
    setAvailableLabels(Array.from(labelsSet));
    setIsLoading(false);
  };
    
  const handleSearch = (arg) => {
    const term = typeof arg === 'string' ? arg : arg?.target?.value ?? '';
    setSearchTerm(term);
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  useEffect(() => {
    const tasks = searchResults; 

    const q = (searchTerm || '').toString().trim().toLowerCase();
    const f = filters || {};

    const today = new Date(); today.setHours(0,0,0,0);

    const results = tasks.filter(t => {
      const content = (t.content ?? '').toString();
      const description = (t.description ?? '').toString();
      const hay = `${content} ${description}`.toLowerCase();

      const matchesSearch = !q || hay.includes(q);

      const priority = (t.priority ?? 'normal');
      const matchesPriority = (f.priority === 'all') || (priority === f.priority);

      const isCompleted = Boolean(t.completed);
      const matchesCompleted =
        f.completed === 'all' ||
        (f.completed === 'completed' && isCompleted) ||
        (f.completed === 'active' && !isCompleted);

      const due = t.dueDate ? new Date(t.dueDate) : null;
      const daysDiff = due ? (Math.floor((due - today) / 86400000)) : null;

      const matchesDue =
        f.dueDate === 'any' ||
        (f.dueDate === 'overdue' && due && due < today) ||
        (f.dueDate === 'today' && due && due.toDateString() === today.toDateString()) ||
        (f.dueDate === 'week' && daysDiff !== null && daysDiff <= 7 && daysDiff >= 0) ||
        (f.dueDate === 'month' && daysDiff !== null && daysDiff <= 31 && daysDiff >= 0);

      const sel = Array.isArray(f.labels) ? f.labels : [];
      const matchesLabels =
        sel.length === 0 ||
        (Array.isArray(t.labels) && sel.every(l => t.labels.includes(l)));

      return matchesSearch && matchesPriority && matchesCompleted && matchesDue && matchesLabels;
    });

    setFilteredResults(results);
  }, [searchTerm, filters, searchResults]);
  
  const getPriorityClasses = (priority) => {
    switch(priority) {
      case 'high': 
        return 'border-red-500';

      case 'medium': 
        return 'border-amber-500';

      case 'low': 
        return 'border-emerald-500';

      default: 
        return 'border-transparent';
    }
  };
  
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center mb-6 pb-4 border-b border-gray-800">
        <button 
          className="flex items-center mr-4 px-3 py-1.5 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
          onClick={onBack}
        >
          <svg className="w-4 h-4 mr-1 z-20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <h2 className="text-xl font-bold text-white">Search Tasks</h2>
      </div>
      
      <div className="mb-6">
        <SearchAndFilterBar 
          onSearch={handleSearch}
          onFilter={handleFilter}
          availableLabels={availableLabels}
          showAdvancedFilters={true}
        />
      </div>
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-white font-medium">
            {isLoading ? 'Loading tasks...' : `${filteredResults.length} tasks found`}
          </h3>
          
          <div className="text-xs text-gray-400">
            {searchTerm ? `Searching for "${searchTerm}"` : 'All tasks'}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-2 border-t-indigo-500 border-gray-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-700">
            {filteredResults.length === 0 ? (
              <li className="p-6 text-center text-gray-500">
                <p>No tasks found matching your search criteria</p>
                <button 
                  className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ priority: 'all', completed: 'all', dueDate: 'any', labels: [] });
                  }}
                >
                  Clear all filters
                </button>
              </li>
            ) : (
              filteredResults.map(task => (
                <li 
                  key={task.id} 
                  className={`p-4 bg-gray-800 hover:bg-gray-750 cursor-pointer border-l-4 ${getPriorityClasses(task.priority)}`}
                  onClick={() => onTaskClick({ boardId: task.boardId, columnId: task.columnId, taskId: task.id })}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 mr-2 rounded border border-gray-600 flex-shrink-0 ${
                          task.completed ? 'bg-emerald-600 border-emerald-600' : ''
                        }`}>
                          {task.completed && (
                            <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <h4 className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                          <span>{task.content}</span>
                            {!task.completed && task.forceOverdue && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-700/40 uppercase tracking-wide">
                                overdue
                          </span>
                          )}
                        </h4>

                      </div>
                      
                      <div className="mt-2 text-xs text-gray-400 pl-6">
                        <TaskCardMeta task={task} />

                        {task.labels && task.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.labels.map((label, index) => (
                              <span key={index} className="px-2 py-0.5 bg-indigo-900 bg-opacity-40 text-indigo-300 rounded-full">
                                {label}
                              </span>
                            ))}
                          </div>
                        )}

                        {task.description && (
                          <div className="mt-2 text-gray-500 line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchTasksView;