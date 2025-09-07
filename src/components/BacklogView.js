import React, { useState, useEffect } from 'react';
import SearchAndFilterBar from './SearchAndFilterBar';
import { parseDate } from '../utils/dateUtils';
import TaskCardMeta from './TaskCardMeta';

const BacklogView = ({ 
  groups, 
  getBoards, 
  getColumns, 
  getTasks,
  onMoveTask,
  onBack,
  onSelectTask,
  onUpdateTask,
  createColumn
}) => {
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [staleTasks, setSTaleTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    priority: 'all',
    completed: 'all',
    dueDate: 'any',
    labels: []
  });
  const [availableLabels, setAvailableLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('backlog');

  useEffect(() => {
    collectTasks();
  }, [groups]);

  const collectTasks = () => {
    setIsLoading(true);
    
    const allLabels = new Set();
    const backlogItems = [];
    const staleItems = [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const today0 = new Date(); today0.setHours(0,0,0,0)

    const lastActivityDate = (task) => {
      const candidates = [];
      if (Array.isArray(task.movementHistory) && task.movementHistory.length) {
        const lastMove = task.movementHistory[task.movementHistory.length - 1];
        const mv = parseDate(lastMove?.timestamp);
        if (mv) candidates.push(mv);
      }

      const upd = parseDate(task.updatedAt);
      const crt = parseDate(task.createdAt);
      if (upd) candidates.push(upd);
      if (crt) candidates.push(crt);
      if (!candidates.length) 
        return null;

      return new Date(Math.max(...candidates.map(d => d.getTime())));
    };
    
    groups.forEach(group => {
      const boards = getBoards(group.id);
      
      boards.forEach(board => {
        const columns = getColumns(board.id);
        
        columns.forEach(column => {

          const isBacklogColumn =
            column?.meta?.isBacklog === true ||
            /(back\s*log|backlog|ice[-\s]*box|icebox|parking\s*lot|archive|later|someday)/i
            .test(column.name || '');

          const tasks = getTasks(column.id);
          
          tasks.forEach(task => {
            if (task.labels && Array.isArray(task.labels)) {
              task.labels.forEach(label => allLabels.add(label));
            }
            
            const lastTouch = lastActivityDate(task);
            const due = parseDate(task.dueDate);
            const isOverdueByDate = !!due && (new Date(due.setHours(0,0,0,0)) < today0);
            const isOverdueForced = task.forceOverdue === true;
            const isOverdue = isOverdueByDate || isOverdueForced;
            const isInactive = !!lastTouch && lastTouch < oneWeekAgo;
            const isStale = !task.completed && !isBacklogColumn && (isInactive || isOverdue);
            
            const enrichedTask = {
              ...task,
              groupId: group.id,
              groupName: group.name,
              boardId: board.id,
              boardName: board.name,
              columnId: column.id,
              columnName: column.name,
              isInBacklog: isBacklogColumn,
              isStale: isStale
            };
            
            if (isBacklogColumn) {
              backlogItems.push(enrichedTask);
            } else if 
            (isStale) {
              staleItems.push(enrichedTask);
            }
          });
        });
      });
    });
    
    setBacklogTasks(backlogItems);
    setSTaleTasks(staleItems);
    setAvailableLabels(Array.from(allLabels));
    setIsLoading(false);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  const toggleCompleted = (task) => {
  const next = !task.completed;
  onUpdateTask?.(task.id, {
    completed: next,
    percentComplete: next ? 100 : (task.percentComplete ?? 0),
  });
  setTimeout(collectTasks, 150);
};


  const applySearchAndFilters = (task) => {
    if (searchTerm) {
      const lowerCaseTerm = String(searchTerm).toLowerCase();
      const hay = `${task.content ?? ''} ${task.description ?? ''}`.toLowerCase();
      if (!hay.includes(lowerCaseTerm)) {
        return false;
      }
    }
    
    if (filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }
    
    if (filters.completed === 'completed' && !task.completed) {
      return false;
    } else if (filters.completed === 'active' && task.completed) {
      return false;
    }
    
    if (filters.dueDate !== 'any' && task.dueDate) {
      const today = new Date(); today.setHours(0,0,0,0);
      const dueParsed = parseDate(task.dueDate);
      if (!dueParsed) return false;
      const dueDate = new Date(dueParsed); dueDate.setHours(0,0,0,0);
      
      if (filters.dueDate === 'overdue') {
        return dueDate < today && !task.completed;
      }
      
      if (filters.dueDate === 'today') {
        return dueDate.getTime() === today.getTime();
      }
      
      if (filters.dueDate === 'week') {
        const weekFromNow = new Date();
        weekFromNow.setDate(today.getDate() + 7);
        return dueDate >= today && dueDate <= weekFromNow;
      }
      
      if (filters.dueDate === 'month') {
        const monthFromNow = new Date();
        monthFromNow.setMonth(today.getMonth() + 1);
        return dueDate >= today && dueDate <= monthFromNow;
      }
    } else if (
      filters.dueDate !== 'any' && !task.dueDate) {
      return false;
    }
    
    if (Array.isArray(filters.labels) && filters.labels.length > 0) {
      if (!task.labels || !Array.isArray(task.labels)) {
        return false;
      }
      
      const hasMatchingLabel = filters.labels.some(label => 
        task.labels.includes(label)
      );
      
      if (!hasMatchingLabel) {
        return false;
      }
    }
    return true;
  };

  const filteredBacklogTasks = backlogTasks.filter(applySearchAndFilters);
  const filteredStaleTasks = staleTasks.filter(applySearchAndFilters);

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

  const BACKLOG_REGEX = /(back\s*log|backlog|ice[-\s]*box|icebox|parking\s*lot|archive|later|someday)/i;

  const moveFromBacklog = (task) => {
    const columns = getColumns(task.boardId);

    let target = columns.find(c => {
      const n = (c.name || '').toLowerCase();
      return n === 'to do' || n === 'todo';
    });

    if (!target) {
      target = columns.find(c => !(c?.meta?.isBacklog || BACKLOG_REGEX.test(c.name || '')));
    }

    if (!target) target = columns[0];
    if (!target || target.id === task.columnId) 
      return;

    const sourceTasks = getTasks(task.columnId);
    const sourceIndex = sourceTasks.findIndex(t => t.id === task.id);
    const targetTasks = getTasks(target.id);

    onMoveTask(task.id, task.columnId, target.id, sourceIndex, targetTasks.length);
    setTimeout(collectTasks, 300);
  };


  const moveToBacklog = async (task) => {
    const board = getBoards(task.groupId).find(b => b.id === task.boardId);
    const columns = getColumns(board.id);

    let backlogColumn = columns.find(col =>
      /(back\s*log|backlog|ice[-\s]*box|icebox|parking\s*lot|archive|later|someday)/i
        .test(col.name || '')
    );

    if (!backlogColumn && typeof createColumn === 'function') {
      const newId = createColumn(board.id, 'Backlog');
      backlogColumn = { id: newId, name: 'Backlog', boardId: board.id, taskIds: [] };
    }

    if (!backlogColumn) {
      console.warn('No backlog column found or creatable on this board.');
      return;
    }

    const targetColumnId = backlogColumn.id;

    if (targetColumnId === task.columnId) {
      return;
    }

    const sourceTasks = getTasks(task.columnId);
    const sourceIndex = sourceTasks.findIndex(t => t.id === task.id);
    const targetTasks = getTasks(targetColumnId);

    onMoveTask(
      task.id,
      task.columnId,
      targetColumnId,
      sourceIndex,
      targetTasks.length
    );

    setTimeout(collectTasks, 300);
  };

  const moveAllStaleToBacklog = () => {
    if (!window.confirm(`Move all ${filteredStaleTasks.length} stale tasks to backlog?`)) {
      return;
    }
    
    Promise.all(filteredStaleTasks.map(task => moveToBacklog(task)))
      .then(() => {
        collectTasks();
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
        <h2 className="text-xl font-bold text-white">Backlog Management</h2>
      </div>
      
      <div className="mb-6">
        <SearchAndFilterBar 
          onSearch={handleSearch}
          onFilter={handleFilter}
          availableLabels={availableLabels}
          showAdvancedFilters={true}
        />
      </div>
      
      <div className="flex mb-4 border-b border-gray-700">
        <button
          className={`py-2 px-4 font-medium focus:outline-none ${
            activeTab === 'backlog' 
              ? 'text-indigo-400 border-b-2 border-indigo-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('backlog')}
        >
          Backlog ({filteredBacklogTasks.length})
        </button>
        <button
          className={`py-2 px-4 font-medium focus:outline-none ${
            activeTab === 'stale' 
              ? 'text-indigo-400 border-b-2 border-indigo-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('stale')}
        >
          Stale Tasks ({filteredStaleTasks.length})
        </button>
      </div>
      
      {activeTab === 'stale' && filteredStaleTasks.length > 0 && (
        <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-white font-medium">Stale Tasks</h3>
              <p className="text-sm text-gray-400">Tasks that haven't been updated in over a week</p>
            </div>
            <button
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md focus:outline-none transition-colors text-sm"
              onClick={moveAllStaleToBacklog}
            >
              Move All to Backlog
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-white font-medium">
            {activeTab === 'backlog' ? 'Backlog Tasks' : 'Stale Tasks'}
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
            {(activeTab === 'backlog' ? filteredBacklogTasks : filteredStaleTasks).length === 0 ? (
              <li className="p-6 text-center text-gray-500">
                <p>No tasks found</p>
                {searchTerm || filters.priority !== 'all' || filters.completed !== 'all' || 
                 filters.dueDate !== 'any' || filters.labels.length > 0 ? (
                  <button 
                    className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm"
                    onClick={() => {
                      setSearchTerm('');
                      handleSearch('');
                      handleFilter({
                        priority: 'all',
                        completed: 'all',
                        dueDate: 'any',
                        labels: []
                      });
                    }}
                  >
                    Clear all filters
                  </button>
                ) : null}
              </li>
            ) : (
              (activeTab === 'backlog' ? filteredBacklogTasks : filteredStaleTasks).map((task, index) => (
                <li 
                  key={task.id} 
                  className={`p-4 bg-gray-800 hover:bg-gray-750 cursor-pointer border-l-4 ${getPriorityClasses(task.priority)}`}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleCompleted(task); }}
                          aria-pressed={task.completed}
                          aria-label={task.completed ? 'Mark as not completed' : 'Mark as completed'}
                          className={`w-4 h-4 mr-2 rounded border flex-shrink-0
                                      ${task.completed ? 'bg-emerald-600 border-emerald-600' : 'border-gray-600'}
                                      focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        >
                          {task.completed && (
                            <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none">
                              <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                        <h4 
                          className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}
                          onClick={() => onSelectTask(task)}
                        >
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
                    
                    <div className="pl-3">
                      {activeTab === 'stale' ? (
                        <button
                          className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md focus:outline-none transition-colors"
                          onClick={() => moveToBacklog(task)}
                          title="Move to Backlog"
                        >
                          → Backlog
                        </button>
                      ) : (
                        <button
                          className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md focus:outline-none transition-colors"
                          onClick={() => moveFromBacklog(task)}
                          title="Move to Active Tasks"
                        >
                          → Todo
                        </button>
                      )}
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

export default BacklogView;