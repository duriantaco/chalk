import React, { useState, useEffect, useRef, memo } from 'react';
import { SortableContext, useSortable, sortableKeyboardCoordinates, 
  verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, DragOverlay, useSensors, 
  useSensor, PointerSensor, KeyboardSensor, 
  useDroppable, pointerWithin } from '@dnd-kit/core';
import TaskModal from './TaskModal';

const TaskCard = memo(({ task, onClick, isDragging = false  }) => {
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
      className={`bg-gray-750 rounded-md border-l-4 ${priorityColor} ${
        task.completed ? 'opacity-60' : ''} ${
        isDragging ? 'shadow-lg scale-105' : ''}
        transition-all duration-200 cursor-grab px-3 py-3 w-full
        hover:bg-gray-700 hover:-translate-y-0.5 
        shadow-md shadow-black/50 hover:shadow-lg
        border border-gray-600 border-l-4
        `}
      onClick={onClick}
      data-task-id={task.id}
    >
      <div className="flex flex-col">
        <div className={`flex items-center gap-2 font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
          <span>{task.content}</span>
            {!task.completed && task.forceOverdue && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-700/40 uppercase tracking-wide">
                overdue
              </span>
            )}
          </div>


        {Array.isArray(task.attachments) && task.attachments.length > 0 && (
          <div className="mt-2 border border-gray-800 rounded overflow-hidden">
            <img
              src={task.attachments[0].url || `file://${(task.attachments[0].path || '').replace(/\\/g,'/')}`}
              alt=""
              className="w-full h-24 object-cover"
              draggable={false}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          </div>
        )}

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
      data-task-id={task.id}

      onDragOverCapture={(e) => {
        if (e.dataTransfer?.types?.includes('Files')) 
          e.preventDefault();
        if (e.dataTransfer?.types?.includes('Files'))
          e.stopPropagation();
      }}

    >
      <TaskCard
        task={task}
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  );
});

const Column = memo(({ column, tasks, onTaskClick, onOpenCreate }) => {

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column
    }
  });

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

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 border border-dashed border-gray-700 rounded-md m-1">
            <p className="text-gray-500 text-sm">Drop tasks here</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-700 flex-shrink-0">
        <button
          className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white py-2 px-3 bg-gray-700 bg-opacity-50 hover:bg-opacity-70 rounded-md transition-colors"
          onClick={() => onOpenCreate(column.id)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Add task</span>
        </button>
      </div>
    </div>
  );
});

const TaskEditModal = ({ mode, task, columnId, onClose, onCreate, onUpdate, onDelete }) => {
  const [editedTask, setEditedTask] = useState(() => ({
    ...(task || {}),
    content: task?.content || '',
    description: task?.description || '',
    priority: task?.priority || 'normal',
    dueDate: task?.dueDate || '',
    assignedTo: task?.assignedTo || '',
    labels: Array.isArray(task?.labels) ? task.labels : [],
    percentComplete: task?.percentComplete || 0,
    completed: task?.completed || false,
  }));
  const [attachments, setAttachments] = useState(Array.isArray(task?.attachments) ? task.attachments : []);
  const [attaching, setAttaching] = useState(false);

  useEffect(() => {
    if (task) {
      setEditedTask({
        ...task,
        content: task.content || '',
        description: task.description || '',
        priority: task.priority || 'normal',
        dueDate: task.dueDate || '',
        assignedTo: task.assignedTo || '',
        labels: Array.isArray(task.labels) ? task.labels : [],
        percentComplete: task.percentComplete || 0,
        completed: task.completed || false,
      });
      setAttachments(Array.isArray(task.attachments) ? task.attachments : []);
    } else if (mode === 'create') {
      setEditedTask({
        content: '',
        description: '',
        priority: 'normal',
        dueDate: '',
        assignedTo: '',
        labels: [],
        percentComplete: 0,
        completed: false,
      });
      setAttachments([]);
    }
  }, [task, mode]);

  const addByPicker = async () => {
    try {
      setAttaching(true);
      const picked = await window.api.invoke('attachments:chooseAndCopy');
      if (Array.isArray(picked) && picked.length) setAttachments(prev => [...prev, ...picked]);
    } catch (e) {
      console.error('chooseAndCopy failed', e);
    } finally {
      setAttaching(false);
    }
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleChange = (field, value) => {
    setEditedTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    const { id, content, ...rest } = editedTask;
    const details = {
      ...rest,
      attachments,
      labels: Array.isArray(editedTask.labels) ? editedTask.labels : [],
    };

    if (mode === 'create') {
      if (!content.trim() || !columnId) 
        return;

      const newId = await onCreate(columnId, { content, details });
      if (newId) onClose(); 
    } else {
      await onUpdate(id, { ...details, content });
      onClose();
    }
  };

  const handleDelete = async () => {
    if (mode === 'edit' && task?.id) {
      if (window.confirm("Are you sure you want to delete this task?")) {
        await onDelete(task.id);
        onClose();
      }
    }
  };

  const titleText = mode === 'create' ? 'New Task' : 'Edit Task';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">{titleText}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
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
              placeholder="What needs to be done?"
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

          <div className="mt-2 rounded-md border border-gray-700">
            <div className="flex items-center justify-between p-2">
              <label className="text-sm font-medium text-gray-400">Attachments</label>
              <div className="flex items-center gap-2">
                {attaching && (
                  <span className="text-xs text-gray-300 flex items-center gap-1">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Attaching…
                  </span>
                )}
                <button
                  type="button"
                  onClick={addByPicker}
                  className="px-2.5 py-1 text-xs rounded bg-sky-700 hover:bg-sky-600 text-white"
                >
                  Add images…
                </button>
              </div>
            </div>

            {attachments.length === 0 ? (
              <div className="text-xs text-gray-500 bg-gray-900/50 border-t border-dashed border-gray-700 rounded-b-md p-3">
                Drop images here or click “Add images…”
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 p-2">
                {attachments.map(att => (
                  <div key={att.id} className="relative group border border-gray-700 rounded overflow-hidden bg-gray-900">
                    <img
                      src={att.url || `file://${(att.path || '').replace(/\\/g,'/')}`}
                      alt=""
                      className="w-full h-24 object-cover"
                      draggable={false}
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1.5 py-0.5 rounded bg-red-700/80 text-white"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              value={Array.isArray(editedTask.labels) ? editedTask.labels.join(', ') : ''}
              onChange={(e) => handleChange('labels', e.target.value.split(',').map(l => l.trim()).filter(Boolean))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Frontend, Bug"
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-700">
            {mode === 'edit' ? (
              <button onClick={handleDelete} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md focus:outline-none transition-colors">
                Delete Task
              </button>
            ) : <span />}

            <div className="flex gap-2">
              <button onClick={onClose} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md focus:outline-none transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md focus:outline-none transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const TaskViewModal = ({ task, onClose, onEdit }) => {
  if (!task) 
    return null;

  const isOverdue = (() => {
    if (!task.dueDate || task.completed) 
      return false;

    const t = new Date(); t.setHours(0,0,0,0);
    const d = new Date(task.dueDate); d.setHours(0,0,0,0);
    return d < t;
  })();

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-gray-850 border border-gray-700 rounded-2xl w-[720px] max-w-[95vw] max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 sticky top-0 bg-gray-850/90">
          <div className="text-lg font-semibold text-white">Task</div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white" onClick={onEdit}>Edit</button>
            <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className={`text-xl font-bold ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>
              {task.content}
            </div>
            {task.labels?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {task.labels.map((l, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{l}</span>
                ))}
              </div>
            )}
          </div>

          {Array.isArray(task.attachments) && task.attachments.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {task.attachments.map(att => (
                <div key={att.id} className="border border-gray-700 rounded overflow-hidden bg-gray-900">
                  <img
                    src={att.url || `file://${(att.path || '').replace(/\\/g,'/')}`}
                    alt=""
                    className="w-full h-28 object-cover"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="text-gray-400 text-sm w-32 shrink-0">Status</div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                {task.columnStatus || '—'}
              </span>
              {task.columnStatus === 'in-progress' && typeof task.percentComplete === 'number' && (
                <>
                  <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${task.percentComplete === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${task.percentComplete}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{task.percentComplete}%</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="text-gray-400 text-sm w-32 shrink-0">Priority</div>
            <div className="text-gray-200">{task.priority ?? 'normal'}</div>
          </div>

          <div className="flex items-start gap-4">
            <div className="text-gray-400 text-sm w-32 shrink-0">Due date</div>
            <div className={`${isOverdue ? 'text-red-400' : 'text-gray-200'}`}>
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="text-gray-400 text-sm w-32 shrink-0">Assigned to</div>
            <div className="text-gray-200">{task.assignedTo || '—'}</div>
          </div>

          <div className="flex items-start gap-4">
            <div className="text-gray-400 text-sm w-32 shrink-0">Description</div>
            <div className="prose prose-invert max-w-none text-gray-200 whitespace-pre-wrap">
              {task.description || '—'}
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

const BoardView = ({ 
  board, 
  columns,
  getTasks,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
  onCreateColumn,
  onBack,
  autoFocusTask,
  onConsumedFocus 
}) => {
  const [activeTaskId, setActiveTaskId] = useState(null);
  // const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [modal, setModal] = useState({ open: false, mode: null, taskId: null, columnId: null });

  useEffect(() => {
    if (!autoFocusTask?.taskId) 
      return;

    let tries = 0;
    const focusIt = () => {
      const sel = `[data-task-id="${autoFocusTask.taskId}"]`;
      const el = document.querySelector(sel);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        el.classList.add('ring-2', 'ring-indigo-500', 'animate-pulse');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-indigo-500', 'animate-pulse');
        }, 1400);

        if (autoFocusTask.openModal) {
          setModal({ open: true, mode: 'view', taskId: autoFocusTask.taskId, columnId: null });
        }
        onConsumedFocus?.();
      } else if (tries < 12) {
        tries += 1;
        requestAnimationFrame(focusIt);
      }
    };

    focusIt();
  }, [autoFocusTask]);

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
  for (const column of columns) {
    const t = getTasks(column.id).find(t => t.id === taskId);
    if (t) 
      return t;
  }
  return null;
};

  const handleTaskClick = (taskId) => {
    setModal({ open: true, mode: 'view', taskId, columnId: null });
  };

  const handleOpenCreate = (columnId) => {
    setModal({ open: true, mode: 'create', taskId: null, columnId });
  };

  const closeModal = () => setModal({ open: false, mode: null, taskId: null, columnId: null });

  const switchModal = (nextMode, idMaybe) => {
    if (nextMode === 'edit') {
      setModal(m => ({ ...m, mode: 'edit' }));
    } else {
      const tid = idMaybe ?? modal.taskId;
      setModal({ open: true, mode: 'view', taskId: tid, columnId: null });
    }
  };

  const createTaskWithDetails = async (columnId, { content, details }) => {
    const id = await onCreateTask(columnId, content);
    if (id) await onUpdateTask(id, details);
    return id;
  };

  const deleteAndClose = async (taskId) => {
    await onDeleteTask(taskId);
    closeModal();
  };


  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTaskId(active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTaskId(null);
    
    if (!over || !active) 
      return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) 
      return;
    
    let sourceColumnId = null;
    let sourceTask = null;
    
    for (const column of columns) {
      const tasks = getTasks(column.id);
      const task = tasks.find(t => t.id === activeId);
      if (task) {
        sourceColumnId = column.id;
        sourceTask = task;
        break;
      }
    }
    
    if (!sourceColumnId || !sourceTask) 
      return;
    
    let targetColumnId = null;
    
    if (columns.some(col => col.id === overId)) {
      targetColumnId = overId;
    } else {
      for (const column of columns) {
        const tasks = getTasks(column.id);
        if (tasks.some(t => t.id === overId)) {
          targetColumnId = column.id;
          break;
        }
      }
    }
    
    if (!targetColumnId) 
      return;
    
    const sourceTasks = getTasks(sourceColumnId);
    const sourceIndex = sourceTasks.findIndex(t => t.id === activeId);
    
    const targetTasks = getTasks(targetColumnId);
    let destinationIndex = targetTasks.length;
    
    if (overId !== targetColumnId) {
      const overTaskIndex = targetTasks.findIndex(t => t.id === overId);
      if (overTaskIndex !== -1) {
        destinationIndex = overTaskIndex;
      }
    }
    
    onMoveTask(activeId, sourceColumnId, targetColumnId, sourceIndex, destinationIndex);
  };

  const handleCreateTask = (columnId, content) => {
    const column = columns.find(c => c.id === columnId);
    
    if (!column) {
      console.error('Column not found in BoardView');
      return;
    }
    
    if (!column.boardId) {
      console.error('Column missing boardId:', column);
      return;
    }
    
    try {
      const result = onCreateTask(columnId, content);
      return result;
    } catch (error) {
      console.error('Error in BoardView handleCreateTask:', error);
    }
  };

  const activeTask = activeTaskId ? getTaskById(activeTaskId) : null;
  // const selectedTask = selectedTaskId ? getTaskById(selectedTaskId) : null;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      <header className="px-6 py-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center">
          <button 
            className="flex items-center mr-4 px-3 py-1.5 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold">{board.name}</h1>
          {board.description && (
            <span className="ml-4 text-gray-400 text-sm">- {board.description}</span>
          )}
        </div>
      </header>

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
                tasks={getTasks(column.id)}
                onTaskClick={handleTaskClick}
                onOpenCreate={handleOpenCreate}
              />
            ))}

            <AddColumn onAddColumn={onCreateColumn} />

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

      {/* {selectedTaskId && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
        />
      )} */}

      {modal.open && modal.mode === 'view' && (
        <TaskViewModal
          task={modal.taskId ? getTaskById(modal.taskId) : null}
          onClose={closeModal}
          onEdit={() => switchModal('edit')}
        />
      )}

      {modal.open && (modal.mode === 'edit' || modal.mode === 'create') && (
        <TaskEditModal
          mode={modal.mode}
          task={modal.taskId ? getTaskById(modal.taskId) : null}
          columnId={modal.columnId}
          onClose={closeModal}
          onCreate={createTaskWithDetails}
          onUpdate={onUpdateTask}
          onDelete={deleteAndClose}
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

export default BoardView;