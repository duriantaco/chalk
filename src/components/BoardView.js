import React, { useState, useEffect, useRef, memo } from 'react';
import { SortableContext, useSortable, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, DragOverlay, useSensors, useSensor, PointerSensor, KeyboardSensor, useDroppable, pointerWithin } from '@dnd-kit/core';

const TaskCard = memo(({ task, onClick, isDragging = false }) => {
  const priorityColors = {
    high: 'border-red-500',
    medium: 'border-amber-500',
    low: 'border-emerald-500',
    normal: 'border-transparent'
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
    return dueDate < today && !task.completed;
  };

  const priorityColor = priorityColors[task.priority || 'normal'];
  const percentComplete = task.percentComplete || 0;

  return (
    <div
      className={`bg-gray-900 rounded-md border-l-4 ${priorityColor} ${
        task.completed ? 'opacity-60' : ''} ${
        isDragging ? 'shadow-lg scale-105' : ''} transition-all duration-200 cursor-grab px-3 py-3 w-full`}
      onClick={onClick}
      data-task-id={task.id}
    >
      <div className="flex flex-col">
        <div className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
          {task.content}
        </div>

        {task.columnStatus === 'in-progress' && percentComplete > 0 && (
          <div className="mt-2">
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${percentComplete === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${percentComplete}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-400 mt-1 text-right">
              {percentComplete}%
            </div>
          </div>
        )}

        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.labels.slice(0, 3).map((label, index) => (
              <span key={index} className="text-xs px-2 py-0.5 rounded-full bg-indigo-900 bg-opacity-40 text-indigo-300">
                {label}
              </span>
            ))}
            {task.labels.length > 3 &&
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                +{task.labels.length - 3}
              </span>
            }
          </div>
        )}

        <div className="flex items-center text-xs text-gray-500 mt-2 gap-2">
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${isOverdue(task.dueDate) ? 'text-red-400' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}

          {task.assignedTo && (
            <div className="flex items-center">
              <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-semibold">
                {task.assignedTo.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {task.completed && (
            <div className="ml-auto flex items-center text-emerald-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="ml-1">Done</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const SortableTaskCard = memo(({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    display: 'block',
    marginBottom: '12px',
    position: 'relative'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="touch-none w-full"
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  );
});

const Column = memo(({ column, tasks, onTaskClick, onAddTask }) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const inputRef = useRef(null);

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column
    }
  });

  useEffect(() => {
    if (isAddingTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTask]);

  const handleAddClick = () => {
    setIsAddingTask(true);
  };

  const handleCreateTask = () => {
    if (newTaskContent.trim()) {
      onAddTask(column.id, newTaskContent);
      setNewTaskContent('');
      setIsAddingTask(false);
    }
  };

  const handleCancel = () => {
    setNewTaskContent('');
    setIsAddingTask(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateTask();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const taskIds = tasks.map(t => t.id);

  return (
    <div
      ref={setDroppableNodeRef}
      className="flex flex-col min-w-[300px] w-[300px] flex-shrink-0 bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden h-full"
      data-column-id={column.id}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-white">{column.name}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <SortableContext
          id={column.id}
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAddingTask && (
          <div className="flex items-center justify-center h-24 border border-dashed border-gray-700 rounded-md m-1">
            <p className="text-gray-500 text-sm">Drop tasks here</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-700 flex-shrink-0">
        {!isAddingTask ? (
          <button
            className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white py-2 px-3 bg-gray-700 bg-opacity-50 hover:bg-opacity-70 rounded-md transition-colors"
            onClick={handleAddClick}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Add task</span>
          </button>
        ) : (
          <div className="p-3 bg-gray-900 rounded-md border border-gray-700">
            <textarea
              ref={inputRef}
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
              placeholder="What needs to be done?"
              onKeyDown={handleKeyDown}
              rows="3"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md focus:outline-none transition-colors"
                onClick={handleCreateTask}
                disabled={!newTaskContent.trim()}
              >
                Add
              </button>
              <button
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md focus:outline-none transition-colors"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const TaskDetailModal = ({ task, onClose, onUpdate, onDelete }) => {
  const [editedTask, setEditedTask] = useState({ ...task });

  useEffect(() => {
    setEditedTask({ ...task });
  }, [task]);

  const handleChange = (field, value) => {
    setEditedTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onUpdate(editedTask);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      onDelete(task.id);
      onClose();
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Task Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
            <textarea
              value={editedTask.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows="2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea
              value={editedTask.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows="3"
              placeholder="Add a more detailed description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
            <select
              value={editedTask.priority || 'normal'}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Due Date</label>
            <input
              type="date"
              value={editedTask.dueDate || ''}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {editedTask.columnStatus === 'in-progress' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Progress ({editedTask.percentComplete || 0}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={editedTask.percentComplete || 0}
                onChange={(e) => handleChange('percentComplete', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          )}

          <div className="flex items-center">
            <label className="flex items-center text-sm font-medium text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={editedTask.completed || false}
                onChange={(e) => handleChange('completed', e.target.checked)}
                className="mr-2 h-4 w-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-gray-700 cursor-pointer"
              />
              Mark as completed
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Assigned To</label>
            <input
              type="text"
              value={editedTask.assignedTo || ''}
              onChange={(e) => handleChange('assignedTo', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Labels (comma-separated)</label>
            <input
              type="text"
              value={editedTask.labels?.join(', ') || ''}
              onChange={(e) => handleChange('labels', e.target.value.split(',').map(l => l.trim()).filter(l => l))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Frontend, Bug"
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-700">
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md focus:outline-none transition-colors"
            >
              Delete Task
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md focus:outline-none transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md focus:outline-none transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddColumn = ({ onAddColumn }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [columnName, setColumnName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddClick = () => {
    setIsAdding(true);
  };

  const handleSave = () => {
    if (columnName.trim()) {
      onAddColumn(columnName);
      setColumnName('');
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setColumnName('');
    setIsAdding(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="min-w-[300px] w-[300px] flex-shrink-0 h-full flex flex-col">
      {!isAdding ? (
        <button
          className="w-full h-12 flex items-center justify-center gap-2 text-gray-400 hover:text-white bg-gray-800 bg-opacity-30 hover:bg-opacity-50 border border-gray-700 border-dashed rounded-lg transition-colors mt-0"
          onClick={handleAddClick}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Add Column</span>
        </button>
      ) : (
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
          <input
            ref={inputRef}
            type="text"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            placeholder="Column name"
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
          />
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md focus:outline-none transition-colors"
              onClick={handleSave}
              disabled={!columnName.trim()}
            >
              Add
            </button>
            <button
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md focus:outline-none transition-colors"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="flex-grow"></div>
    </div>
  );
};

const KanbanBoard = () => {
  const [columns, setColumns] = useState([
    { id: 'todo', name: 'To Do' },
    { id: 'in-progress', name: 'In Progress' },
    { id: 'done', name: 'Done' }
  ]);

  const [tasks, setTasks] = useState({
    'todo': [
      {
        id: 'task-1',
        content: 'Research competing products',
        priority: 'high',
        columnStatus: 'todo',
        dueDate: '2025-04-15',
        labels: ['Research'],
        description: 'Analyze features, pricing, and UX of top 3 competitors.'
      },
      {
        id: 'task-2',
        content: 'Create initial mockups',
        priority: 'medium',
        columnStatus: 'todo',
        labels: ['Design', 'UX'],
        assignedTo: 'Alex'
      }
    ],
    'in-progress': [
      {
        id: 'task-3',
        content: 'Implement drag and drop functionality',
        priority: 'medium',
        columnStatus: 'in-progress',
        percentComplete: 65,
        labels: ['Frontend', 'React'],
        assignedTo: 'Mike',
        description: 'Use dnd-kit library for core functionality.'
      }
    ],
    'done': [
      {
        id: 'task-4',
        content: 'Set up project repository',
        priority: 'low',
        columnStatus: 'done',
        completed: true,
        labels: ['Setup'],
        dueDate: '2024-07-01'
      }
    ]
  });

  const [activeTaskId, setActiveTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTaskById = (taskId) => {
    for (const columnId in tasks) {
      const task = tasks[columnId]?.find(t => t.id === taskId);
      if (task) return task;
    }
    return null;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTaskId(active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTaskId(null);
    
    if (!over || !active) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    let sourceColumnId = null;
    let sourceTask = null;
    
    for (const colId in tasks) {
      const task = tasks[colId]?.find(t => t.id === activeId);
      if (task) {
        sourceColumnId = colId;
        sourceTask = task;
        break;
      }
    }
    
    if (!sourceColumnId || !sourceTask) return;
    
    let targetColumnId = null;
    
    if (columns.some(col => col.id === overId)) {
      targetColumnId = overId;
    } else {
      for (const colId in tasks) {
        if (tasks[colId]?.some(t => t.id === overId)) {
          targetColumnId = colId;
          break;
        }
      }
    }
    
    if (!targetColumnId) return;
    
    setTasks(prevTasks => {
      const newTasks = { ...prevTasks };
      
      newTasks[sourceColumnId] = prevTasks[sourceColumnId].filter(t => t.id !== activeId);
      
      const updatedTask = {
        ...sourceTask,
        columnStatus: targetColumnId,
        completed: targetColumnId === 'done'
      };
      
      if (!newTasks[targetColumnId]) {
        newTasks[targetColumnId] = [];
      }
      
      if (overId !== targetColumnId) {
        const overTaskIndex = newTasks[targetColumnId].findIndex(t => t.id === overId);
        if (overTaskIndex !== -1) {
          const newColumnTasks = [...newTasks[targetColumnId]];
          newColumnTasks.splice(overTaskIndex, 0, updatedTask);
          newTasks[targetColumnId] = newColumnTasks;
        } else {
          newTasks[targetColumnId] = [...newTasks[targetColumnId], updatedTask];
        }
      } else {
        newTasks[targetColumnId] = [...newTasks[targetColumnId], updatedTask];
      }
      
      return newTasks;
    });
  };

  const handleAddTask = (columnId, content) => {
    setTasks(prev => {
      const newTask = {
        id: `task-${Date.now()}`,
        content,
        priority: 'normal',
        columnStatus: columnId,
        completed: columnId === 'done',
        labels: [],
        description: '',
        dueDate: null,
        assignedTo: null,
        percentComplete: 0,
      };

      const columnTasks = prev[columnId] ? [...prev[columnId]] : [];
      return {
        ...prev,
        [columnId]: [...columnTasks, newTask]
      };
    });
  };

  const handleAddColumn = (name) => {
    const newId = `column-${Date.now()}`;

    setColumns(prev => [...prev, { id: newId, name }]);
    setTasks(prev => ({
      ...prev,
      [newId]: []
    }));
  };

  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
  };

  const handleUpdateTask = (updatedTask) => {
    setTasks(prev => {
      const result = { ...prev };
      let currentColumnId = null;
      let taskIndex = -1;
      let originalTask = null;

      for (const colId in result) {
         if (Array.isArray(result[colId])) {
             const idx = result[colId].findIndex(t => t.id === updatedTask.id);
             if (idx !== -1) {
                 currentColumnId = colId;
                 taskIndex = idx;
                 originalTask = result[colId][idx];
                 break;
             }
         }
      }

      if (!currentColumnId || !originalTask) {
           return prev;
      }

      const finalTask = { ...originalTask, ...updatedTask };
      const targetColStatus = finalTask.columnStatus || currentColumnId;

      if (currentColumnId !== targetColStatus) {
        result[currentColumnId].splice(taskIndex, 1);
        finalTask.columnStatus = targetColStatus;
        finalTask.completed = targetColStatus === 'done' ? true : finalTask.completed;

        if (!result[targetColStatus]) {
          result[targetColStatus] = [];
        }
        if (!Array.isArray(result[targetColStatus])) {
            result[targetColStatus] = [];
        }
        result[targetColStatus].push(finalTask);
      } else {
        finalTask.columnStatus = currentColumnId;
        finalTask.completed = currentColumnId === 'done' ? true : finalTask.completed;
        if (Array.isArray(result[currentColumnId])) {
            result[currentColumnId][taskIndex] = finalTask;
        }
      }

      return result;
    });
  };

  const handleDeleteTask = (taskId) => {
    setTasks(prev => {
      const result = { ...prev };
      for (const columnId in result) {
         if (Array.isArray(result[columnId])) {
             result[columnId] = result[columnId].filter(t => t.id !== taskId);
         }
      }
      return result;
    });
  };

  const activeTask = activeTaskId ? getTaskById(activeTaskId) : null;
  const selectedTask = selectedTaskId ? getTaskById(selectedTaskId) : null;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      <header className="px-6 py-4 border-b border-gray-800 flex-shrink-0">
        <h1 className="text-xl font-bold">Project Tasks</h1>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex h-full space-x-4">
              {columns.map(column => (
                <Column
                  key={column.id}
                  column={column}
                  tasks={tasks[column.id] || []}
                  onTaskClick={handleTaskClick}
                  onAddTask={handleAddTask}
                />
              ))}

              <AddColumn onAddColumn={handleAddColumn} />

              <DragOverlay>
                {activeTask && (
                  <div
                    className="w-[300px]"
                    style={{
                      pointerEvents: 'none',
                      transform: 'rotate(2deg)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    }}
                  >
                    <TaskCard task={activeTask} isDragging={true} />
                  </div>
                )}
              </DragOverlay>
            </div>
          </DndContext>
        </div>
      )}

      {selectedTaskId && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(79, 70, 229, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(79, 70, 229, 0.7);
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #6366f1;
          cursor: pointer;
          border-radius: 50%;
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #6366f1;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
         .flex-1.overflow-x-auto.overflow-y-hidden {
            padding-bottom: 16px;
         }
         .flex.h-full.space-x-4 {
             height: calc(100% - 16px);
         }
         [data-task-id] {
             transform-origin: 50% 50%;
         }
      `}</style>
    </div>
  );
};

export default KanbanBoard;