import { useState, useEffect } from 'react';
import TaskAnalytics from './TaskAnalytics';
import { getTaskAnalytics } from '../data/store';

const TaskDetailView = ({ task, onClose, onUpdate, onDelete }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const [editedTask, setEditedTask] = useState({
    content: task.content,
    description: task.description || '',
    dueDate: task.dueDate || '',
    priority: task.priority || 'medium',
    labels: task.labels || [],
    assignedTo: task.assignedTo || '',
    estimatedTime: task.estimatedTime || '',
    completed: task.completed || false,
    percentComplete: task.percentComplete || 0,
    subtasks: task.subtasks || [],
    forceOverdue: task.forceOverdue || false,
  });
    const [attachments, setAttachments] = useState(task.attachments || []);
    const [newLabel, setNewLabel] = useState('');
    const [activeTab, setActiveTab] = useState('details');
    const [newSubtask, setNewSubtask] = useState('');

    const makeId = () =>
    (globalThis.crypto?.randomUUID?.() ?? `sub_${Date.now()}_${Math.random().toString(16).slice(2)}`);

    const recomputePercentFromSubs = (subs) => {
      if (!subs?.length) 
        return editedTask.percentComplete;

      const done = subs.filter(s => s.done).length;
      return Math.round((done / subs.length) * 100);
    };

    const addSubtask = () => {
      const t = (newSubtask || '').trim();
      if (!t) 
        return;

      const next = [ ...(editedTask.subtasks || []), { id: makeId(), content: t, done: false } ];
      const pct = recomputePercentFromSubs(next);
      setEditedTask(et => ({
        ...et,
        subtasks: next,
        percentComplete: pct,
        completed: pct === 100 ? true : et.completed
      }));
      setNewSubtask('');
    };

    const toggleSubtask = (id) => {
      const next = (editedTask.subtasks || []).map(s => s.id === id ? ({ ...s, done: !s.done }) : s);
      const pct = recomputePercentFromSubs(next);
      setEditedTask(et => ({
        ...et,
        subtasks: next,
        percentComplete: pct,
        completed: pct === 100 ? true : et.completed
      }));
    };

    const removeSubtask = (id) => {
      const next = (editedTask.subtasks || []).filter(s => s.id !== id);
      const pct = recomputePercentFromSubs(next);
      setEditedTask(et => ({
        ...et,
        subtasks: next,
        percentComplete: pct,
        completed: pct === 100 ? true : et.completed
      }));
    };
  
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscapeKey, true); 
    return () => document.removeEventListener('keydown', handleEscapeKey, true);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'percentComplete') {
      setEditedTask({
        ...editedTask,
        percentComplete: parseInt(value, 10),
        completed: parseInt(value, 10) === 100 ? true : editedTask.completed
      });
    } else if (type === 'checkbox' && name === 'completed') {
      setEditedTask({
        ...editedTask,
        [name]: checked,
        percentComplete: checked ? 100 : editedTask.percentComplete
      });
    } else {
      setEditedTask({
        ...editedTask,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  const handleAddLabel = () => {
    if (newLabel.trim() && !editedTask.labels.includes(newLabel.trim())) {
      setEditedTask({
        ...editedTask,
        labels: [...editedTask.labels, newLabel.trim()]
      });
      setNewLabel('');
    }
  };
  
  const handleRemoveLabel = (labelToRemove) => {
    setEditedTask({
      ...editedTask,
      labels: editedTask.labels.filter(label => label !== labelToRemove)
    });
  };

  const handleAddAttachments = async () => {
    try {
      const files = await window.api.invoke('attachments:chooseAndCopy');
      if (Array.isArray(files) && files.length) {
        setAttachments(prev => [...prev, ...files]);
      }
    } catch (err) {
      console.error('attach failed', err);
    }
  };

  const handleRemoveAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(task.id, { ...editedTask, attachments });
    onClose();
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': 
        return { bg: 'bg-red-600/20', border: 'border-red-500', text: 'text-red-400' };

      case 'medium': 
        return { bg: 'bg-amber-600/20', border: 'border-amber-500', text: 'text-amber-400' };

      case 'low': 
        return { bg: 'bg-emerald-600/20', border: 'border-emerald-500', text: 'text-emerald-400' };

      default: 
        return { bg: 'bg-emerald-600/20', border: 'border-emerald-500', text: 'text-emerald-400' };
    }
  };

  const priorityColors = getPriorityColor(editedTask.priority);
  
  const renderTabContent = () => {
    switch(activeTab) {
      case 'details':
        return (
          <div className="space-y-4">
            {task.columnStatus === 'in-progress' && (
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Progress ({editedTask.percentComplete}%)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    id="percentComplete"
                    name="percentComplete"
                    value={editedTask.percentComplete}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="5"
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-white font-medium min-w-[3rem] text-center">
                    {editedTask.percentComplete}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${editedTask.percentComplete}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={editedTask.description}
                onChange={handleChange}
                rows="4"
                placeholder="Add a more detailed description..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">

              <div className="form-group mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-400">Attachments</label>
                  <button
                    type="button"
                    onClick={handleAddAttachments}
                    className="px-2.5 py-1 text-xs rounded bg-sky-700 hover:bg-sky-600 text-white"
                  >
                    Add images…
                  </button>
                </div>

                {attachments.length === 0 ? (
                  <div className="text-xs text-gray-500 bg-gray-900/50 border border-dashed border-gray-700 rounded-md p-3">
                    No attachments yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {attachments.map(att => (
                      <div key={att.id} className="relative group border border-gray-700 rounded overflow-hidden bg-gray-900">
                        <img
                          src={att.url || `file://${att.path}`}
                          alt=""
                          className="w-full h-24 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
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

              <div className="form-group mt-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Checklist
              </label>

              {(editedTask.subtasks?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${editedTask.percentComplete}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                    <span>{editedTask.subtasks.filter(s => s.done).length}/{editedTask.subtasks.length} done</span>
                    <span>{editedTask.percentComplete}%</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {(editedTask.subtasks || []).map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!s.done}
                      onChange={() => toggleSubtask(s.id)}
                      className="accent-indigo-600"
                    />
                    <div className={`flex-1 text-sm ${s.done ? 'line-through opacity-60' : 'text-gray-200'}`}>
                      {s.content}
                    </div>
                    <button
                      type="button"
                      className="text-xs text-red-500 hover:text-red-300"
                      onClick={() => removeSubtask(s.id)}
                    >
                      remove
                    </button>
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                    placeholder="Add a subtask…"
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    onClick={addSubtask}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-400 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={editedTask.dueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />

                <div className="mt-2 flex items-center gap-3">
                  <label className="flex items-center text-sm text-gray-300">
                    <input
                      type="checkbox"
                      name="forceOverdue"
                      checked={!!editedTask.forceOverdue}
                      onChange={handleChange}
                      className="mr-2 accent-red-600"
                    />
                    Force overdue (ignore date)
                  </label>
                  <button
                    type="button"
                    className="px-2 py-1 text-xs bg-amber-700 hover:bg-amber-600 text-white rounded"
                    onClick={() => {
                      const y = new Date(Date.now() - 86400000).toISOString().slice(0,10);
                      setEditedTask(et => ({ ...et, dueDate: et.dueDate || y }));
                    }}
                  >
                    Set due to yesterday
                  </button>
                </div>

              </div>
              
              <div className="form-group">
                <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-400 mb-1">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  id="estimatedTime"
                  name="estimatedTime"
                  value={editedTask.estimatedTime}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  placeholder="0"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );
      
      case 'labels':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Task Labels
              </label>
              
              <div className="flex items-center mb-3">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Add a new label"
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-l-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLabel();
                    }
                  }}
                />
                <button 
                  type="button" 
                  className="px-3 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={handleAddLabel}
                >
                  Add
                </button>
              </div>
              
              {editedTask.labels.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {editedTask.labels.map((label, index) => (
                    <div key={index} className="flex items-center bg-indigo-900/50 text-indigo-300 px-3 py-1.5 rounded-full">
                      <span className="text-sm">{label}</span>
                      <button 
                        type="button" 
                        className="ml-2 text-indigo-300 hover:text-white focus:outline-none"
                        onClick={() => handleRemoveLabel(label)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-900/50 border border-dashed border-gray-700 rounded-md">
                  <p className="text-gray-500 text-sm">No labels added yet</p>
                  <p className="text-gray-400 text-xs mt-1">Labels help you categorize and filter tasks</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="py-2">
            <TaskAnalytics task={task} getTaskAnalytics={getTaskAnalytics} />
          </div>
        );
      
      default:
        return null;
    }
  };
  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-gray-850 w-full max-w-xl rounded-lg shadow-2xl border border-gray-700 max-h-[90vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <label className="relative flex items-center mr-3">
                <input
                  type="checkbox"
                  name="completed"
                  checked={editedTask.completed}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className={`w-5 h-5 rounded border ${editedTask.completed ? 'bg-emerald-600 border-emerald-500' : 'border-gray-600'} flex items-center justify-center`}>
                  {editedTask.completed && (
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              </label>
              
              <select
                id="priority"
                name="priority"
                value={editedTask.priority}
                onChange={handleChange}
                className={`${priorityColors.bg} ${priorityColors.text} ${priorityColors.border} text-sm font-medium rounded-md border py-1 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            
            <button 
              type="button" 
              className="text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="px-5 py-4">
            <input
              type="text"
              id="content"
              name="content"
              value={editedTask.content}
              onChange={handleChange}
              placeholder="Task title"
              required
              className="w-full px-0 py-2 bg-transparent border-0 border-b border-gray-700 text-xl font-medium text-white focus:outline-none focus:ring-0 focus:border-indigo-500"
            />
            
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <div className="flex items-center mr-4">
                <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
              
              {task.updatedAt && task.updatedAt !== task.createdAt && (
                <div className="flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-5 mb-4">
            <div className="flex border-b border-gray-700">
              <button 
                type="button"
                className={`py-2 px-4 text-sm font-medium focus:outline-none ${
                  activeTab === 'details' 
                    ? 'text-indigo-400 border-b-2 border-indigo-400' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button 
                type="button"
                className={`py-2 px-4 text-sm font-medium focus:outline-none ${
                  activeTab === 'labels' 
                    ? 'text-indigo-400 border-b-2 border-indigo-400' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('labels')}
              >
                Labels ({editedTask.labels.length})
              </button>
              <button 
                type="button"
                className={`py-2 px-4 text-sm font-medium focus:outline-none ${
                  activeTab === 'analytics' 
                    ? 'text-indigo-400 border-b-2 border-indigo-400' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </button>
            </div>
          </div>
          
          <div className="px-5 flex-1 overflow-y-auto">
            {renderTabContent()}
            
            {activeTab === 'details' && (
              <div className="mb-4 mt-4">
                <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-400 mb-1">
                  Assigned To
                </label>
                <input
                  type="text"
                  id="assignedTo"
                  name="assignedTo"
                  value={editedTask.assignedTo}
                  onChange={handleChange}
                  placeholder="Assign to someone..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
          
          <div className="px-5 py-4 border-t border-gray-700 flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors"
              >
                Save Changes
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
            
            <button 
              type="button" 
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  onDelete(task.id);
                  onClose();
                }
              }}
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDetailView;