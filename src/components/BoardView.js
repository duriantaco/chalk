import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import TaskDetailView from './TaskDetailView';
import SearchAndFilterBar from './SearchAndFilterBar';
import EnhancedTaskCard from './EnhancedTaskCard';

const BoardView = ({ 
  board, 
  columns, 
  getTasks, 
  onCreateColumn, 
  onCreateTask, 
  onMoveTask,
  onUpdateTask,
  onDeleteTask,
  onBack 
}) => {
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newTaskContents, setNewTaskContents] = useState({});
  const [expandedTaskInputs, setExpandedTaskInputs] = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    priority: 'all',
    completed: 'all',
    dueDate: 'any',
    labels: []
  });
  const newColumnInputRef = useRef(null);
  
  const availableLabels = useMemo(() => {
    const labelsSet = new Set();
    
    columns.forEach(column => {
      const tasks = getTasks(column.id);
      tasks.forEach(task => {
        if (task.labels && Array.isArray(task.labels)) {
          task.labels.forEach(label => labelsSet.add(label));
        }
      });
    });
    
    return Array.from(labelsSet);
  }, [columns, getTasks]);
  
  useEffect(() => {
    if (isAddingColumn && newColumnInputRef.current) {
      newColumnInputRef.current.focus();
    }
  }, [isAddingColumn]);
  
  const handleCreateColumn = () => {
    if (newColumnName.trim()) {
      onCreateColumn(newColumnName.trim());
      setNewColumnName('');
      setIsAddingColumn(false);
    }
  };
  
  const handleCreateTask = (columnId) => {
    const content = newTaskContents[columnId];
    if (content && content.trim()) {
      onCreateTask(columnId, content.trim());
      setNewTaskContents({
        ...newTaskContents,
        [columnId]: ''
      });
      setExpandedTaskInputs({
        ...expandedTaskInputs,
        [columnId]: false
      });
    }
  };
  
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    onMoveTask(draggableId, source.droppableId, destination.droppableId, source.index, destination.index);
  };

  const toggleTaskInput = (columnId) => {
    setExpandedTaskInputs({
      ...expandedTaskInputs,
      [columnId]: !expandedTaskInputs[columnId]
    });
    
    if (!newTaskContents[columnId]) {
      setNewTaskContents({
        ...newTaskContents,
        [columnId]: ''
      });
    }
  };
  
  const handleKeyDown = (e, columnId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateTask(columnId);
    } else if (e.key === 'Escape') {
      setNewTaskContents({
        ...newTaskContents,
        [columnId]: ''
      });
      setExpandedTaskInputs({
        ...expandedTaskInputs,
        [columnId]: false
      });
    }
  };
  
  const handleColumnKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCreateColumn();
    } else if (e.key === 'Escape') {
      setIsAddingColumn(false);
      setNewColumnName('');
    }
  };
  
  const handleSearch = (term) => {
    setSearchTerm(term);
  };
  
  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };
  
  const getFilteredTasks = (columnId) => {
    let tasks = getTasks(columnId);
    
    if (!searchTerm && filters.priority === 'all' && filters.completed === 'all' && 
        filters.dueDate === 'any' && filters.labels.length === 0) {
      return tasks;
    }
    
    if (searchTerm) {
      const lowerCaseTerm = searchTerm.toLowerCase();
      tasks = tasks.filter(task => 
        task.content.toLowerCase().includes(lowerCaseTerm) || 
        (task.description && task.description.toLowerCase().includes(lowerCaseTerm))
      );
    }
    
    if (filters.priority !== 'all') {
      tasks = tasks.filter(task => task.priority === filters.priority);
    }
    
    if (filters.completed === 'completed') {
      tasks = tasks.filter(task => task.completed);
    } else if (filters.completed === 'active') {
      tasks = tasks.filter(task => !task.completed);
    }
    
    if (filters.dueDate !== 'any') {
      tasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        if (filters.dueDate === 'overdue') {
          return dueDate < today;
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
        
        return true;
      });
    }
    
    if (filters.labels.length > 0) {
      tasks = tasks.filter(task => {
        if (!task.labels || !Array.isArray(task.labels)) return false;
        return filters.labels.some(label => task.labels.includes(label));
      });
    }
    
    return tasks;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };
  
  const getPriorityClasses = (priority) => {
    switch(priority) {
      case 'high': return 'border-red-500 neon-border-high neon-pulse';
      case 'medium': return 'border-amber-500 neon-border-medium';
      case 'low': return 'border-emerald-500 neon-border-low';
      default: return 'border-transparent';
    }
  };
  
  const hasActiveFilters = 
    searchTerm.trim() !== '' || 
    filters.priority !== 'all' || 
    filters.completed !== 'all' || 
    filters.dueDate !== 'any' || 
    filters.labels.length > 0;
    
  const totalTasks = columns.reduce((count, column) => {
    return count + getTasks(column.id).length;
  }, 0);
  
  const filteredTasksCount = columns.reduce((count, column) => {
    return count + getFilteredTasks(column.id).length;
  }, 0);
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center px-6 py-4 border-b border-gray-800">
        <button 
          className="p-2 mr-4 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors focus:outline-none"
          onClick={onBack}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="text-xl font-bold text-white">{board.name}</h2>
      </div>
      
      {board.description && (
        <div className="px-6 py-2 text-gray-400 text-sm">
          <p>{board.description}</p>
        </div>
      )}
      
      <div className="px-6 py-3 border-b border-gray-800">
        <SearchAndFilterBar 
          onSearch={handleSearch} 
          onFilter={handleFilter}
          availableLabels={availableLabels}
          showAdvancedFilters={true}
        />
        
        {hasActiveFilters && (
          <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
            <span>
              Showing {filteredTasksCount} of {totalTasks} tasks
            </span>
            
            <button 
              className="text-indigo-400 hover:text-indigo-300"
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  priority: 'all',
                  completed: 'all',
                  dueDate: 'any',
                  labels: []
                });
                handleSearch('');
                handleFilter({
                  priority: 'all',
                  completed: 'all',
                  dueDate: 'any',
                  labels: []
                });
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex h-full">
            {columns.map(column => {
              const tasks = hasActiveFilters ? getFilteredTasks(column.id) : getTasks(column.id);
              const isTaskInputExpanded = expandedTaskInputs[column.id];
              
              return (
                <div key={column.id} className="flex flex-col w-80 min-w-80 mr-4 bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{column.name}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                        {tasks.length}
                      </span>
                    </div>
                    <div className="text-gray-500">
                    </div>
                  </div>
                  
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        className={`flex-1 overflow-y-auto p-2 ${snapshot.isDraggingOver ? 'bg-gray-700 bg-opacity-30' : ''} transition-colors duration-200`}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {tasks.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex items-center justify-center h-24 border border-dashed border-gray-700 rounded-md m-1">
                            <p className="text-gray-500 text-sm">{
                              hasActiveFilters ? 'No matching tasks' : 'No tasks yet'
                            }</p>
                          </div>
                        )}
                        
                        {tasks.map((task, index) => (
                          <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => {
                            const priorityClasses = getPriorityClasses(task.priority);
                            
                            return (
                              <EnhancedTaskCard
                                task={task}
                                index={index}
                                provided={provided}
                                snapshot={snapshot}
                                onClick={(e) => {
                                  if (!e.defaultPrevented) {
                                    setSelectedTaskId(task.id);
                                  }
                                }}
                                getPriorityClasses={getPriorityClasses}
                                formatDate={formatDate}
                                isOverdue={isOverdue}
                              />
                            );
                          }}
                        </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  
                  {/* Add Task Section */}
                  <div className="p-3 border-t border-gray-700">
                    {!isTaskInputExpanded ? (
                      <button 
                      className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white py-2 px-3 bg-gray-700 bg-opacity-50 hover:bg-opacity-70 rounded-md transition-colors btn-neon"
                      onClick={() => toggleTaskInput(column.id)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Add task</span>
                    </button>
                    ) : (
                      <div className="p-3 bg-gray-900 rounded-md border border-gray-700">
                        <textarea
                          value={newTaskContents[column.id] || ''}
                          onChange={(e) => setNewTaskContents({
                            ...newTaskContents,
                            [column.id]: e.target.value
                          })}
                          placeholder="What needs to be done?"
                          onKeyDown={(e) => handleKeyDown(e, column.id)}
                          rows="3"
                          className="w-full mb-3 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                        <button
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors btn-neon btn-neon-primary"
                            onClick={() => handleCreateTask(column.id)}
                            disabled={!newTaskContents[column.id] || !newTaskContents[column.id].trim()}
                          >
                            Add
                          </button>
                          <button
                            className="px-3 py-1 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                            onClick={() => toggleTaskInput(column.id)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {!isAddingColumn ? (
              <div className="w-80 min-w-80">
                <button 
                  className="w-full h-12 flex items-center justify-center gap-2 text-gray-400 hover:text-white bg-gray-800 bg-opacity-30 hover:bg-opacity-50 border border-gray-700 border-dashed rounded-lg transition-colors"
                  onClick={() => setIsAddingColumn(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Add Column</span>
                </button>
              </div>
            ) : (
              <div className="w-80 min-w-80 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Column name"
                  onKeyDown={handleColumnKeyDown}
                  ref={newColumnInputRef}
                  className="w-full mb-3 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="flex justify-end gap-2">
                  <button 
                    className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleCreateColumn}
                    disabled={!newColumnName.trim()}
                  >
                    Add
                  </button>
                  <button 
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                    onClick={() => {
                      setIsAddingColumn(false);
                      setNewColumnName('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DragDropContext>
      
      {selectedTaskId && (
        <TaskDetailView
          task={columns.reduce((foundTask, column) => {
            if (foundTask) return foundTask;
            const columnTasks = getTasks(column.id);
            return columnTasks.find(t => t.id === selectedTaskId) || null;
          }, null)}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
        />
      )}
    </div>
  );
};

export default BoardView;