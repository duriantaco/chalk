// src/components/TaskModal.jsx
import React, { useEffect, useMemo, useState } from 'react';

function Chip({ children }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{children}</span>
  );
}

function Field({ label, children, right }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-gray-400 text-sm w-32 shrink-0">{label}</div>
      <div className="flex-1">{children}</div>
      {right}
    </div>
  );
}

function TaskViewPanel({ task, onClose, onEdit, onDelete }) {
  if (!task) 
    return null;

  const isOverdue = (() => {
    if (!task.dueDate || task.completed) 
        return false;
    
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(task.dueDate); due.setHours(0,0,0,0);
    return due < today;
  })();

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-gray-850 border border-gray-700 rounded-2xl w-[720px] max-w-[95vw] max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 sticky top-0 bg-gray-850/90 backdrop-blur">
          <div className="text-lg font-semibold text-white">Task</div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white" onClick={onEdit}>Edit</button>
            <button className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-md text-white" onClick={() => onDelete(task.id)}>Delete</button>
            <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className={`text-xl font-bold ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>{task.content}</div>
            {task.labels?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">{task.labels.map((l, i) => <Chip key={i}>{l}</Chip>)}</div>
            )}
          </div>

          {task.attachments?.length > 0 && (
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

          <Field label="Status">
            <div className="flex items-center gap-2">
              <Chip>{task.columnStatus || '—'}</Chip>
              {typeof task.percentComplete === 'number' && task.columnStatus === 'in-progress' && (
                <div className="flex items-center gap-2">
                  <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${task.percentComplete === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${task.percentComplete}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{task.percentComplete}%</span>
                </div>
              )}
            </div>
          </Field>

          <Field label="Priority"><Chip>{task.priority ?? 'normal'}</Chip></Field>

          <Field label="Due date">
            {task.dueDate ? (
              <span className={`${isOverdue ? 'text-red-400' : 'text-gray-200'}`}>
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            ) : <span className="text-gray-500">—</span>}
          </Field>

          <Field label="Assigned to"><span className="text-gray-200">{task.assignedTo || '—'}</span></Field>

          <Field label="Description">
            <div className="prose prose-invert max-w-none text-gray-200 whitespace-pre-wrap">
              {task.description || '—'}
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

function TaskEditorPanel({ mode, task, columnId, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => ({
    content: task?.content || '',
    description: task?.description || '',
    priority: task?.priority || 'normal',
    dueDate: task?.dueDate || '',
    assignedTo: task?.assignedTo || '',
    labels: Array.isArray(task?.labels) ? task.labels : [],
    percentComplete: task?.percentComplete || 0,
    completed: task?.completed || false,
    attachments: Array.isArray(task?.attachments) ? task.attachments : [],
  }));

  useEffect(() => {
    if (task) {
      setDraft(d => ({
        ...d,
        content: task.content || '',
        description: task.description || '',
        priority: task.priority || 'normal',
        dueDate: task.dueDate || '',
        assignedTo: task.assignedTo || '',
        labels: Array.isArray(task.labels) ? task.labels : [],
        percentComplete: task.percentComplete || 0,
        completed: task.completed || false,
        attachments: Array.isArray(task.attachments) ? task.attachments : [],
      }));
    }
  }, [task]);

  const canSave = draft.content.trim().length > 0 && (mode !== 'create' || !!columnId);

  const set = (key, val) => setDraft(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!canSave) 
        return;

    const payload = {
      content: draft.content.trim(),
      details: {
        description: draft.description,
        priority: draft.priority,
        dueDate: draft.dueDate || null,
        assignedTo: draft.assignedTo || null,
        labels: draft.labels,
        percentComplete: draft.percentComplete,
        completed: draft.completed,
        attachments: draft.attachments
      }
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-gray-850 border border-gray-700 rounded-2xl w-[720px] max-w-[95vw] max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 sticky top-0 bg-gray-850/90 backdrop-blur">
          <div className="text-lg font-semibold text-white">
            {mode === 'create' ? 'New Task' : 'Edit Task'}
          </div>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1.5 rounded-md ${canSave ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
              onClick={handleSave}
              disabled={!canSave}
            >
              Save
            </button>
            <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              value={draft.content}
              onChange={e => set('content', e.target.value)}
              placeholder="What needs to be done?"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              value={draft.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Add details…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Priority</label>
              <select
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                value={draft.priority}
                onChange={e => set('priority', e.target.value)}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Due date</label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                value={draft.dueDate || ''}
                onChange={e => set('dueDate', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Assigned to</label>
            <input
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              value={draft.assignedTo || ''}
              onChange={e => set('assignedTo', e.target.value)}
              placeholder="Enter name"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Labels (comma separated)</label>
            <input
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              value={draft.labels.join(', ')}
              onChange={e =>
                set('labels', e.target.value.split(',').map(s => s.trim()).filter(Boolean))
              }
              placeholder="e.g., Frontend, Bug"
            />
          </div>

          {task?.columnStatus === 'in-progress' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Progress ({draft.percentComplete}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                className="w-full h-2 bg-gray-700 rounded-lg accent-indigo-500"
                value={draft.percentComplete}
                onChange={e => set('percentComplete', parseInt(e.target.value))}
              />
            </div>
          )}

          <label className="flex items-center text-sm text-gray-400 gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!draft.completed}
              onChange={e => set('completed', e.target.checked)}
            />
            Mark as completed
          </label>
        </div>
      </div>
    </div>
  );
}

export default function TaskModal({
  mode,
  task,
  columnId,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onSwitchToView,
}) {
  if (mode === 'view') {
    return (
      <TaskViewPanel
        task={task}
        onClose={onClose}
        onEdit={() => onSwitchToView && onSwitchToView('edit')}
        onDelete={onDelete}
      />
    );
  }

  const saveHandler = async ({ content, details }) => {
    if (mode === 'create') {
      const newId = await onCreate(columnId, { content, details });
      onSwitchToView && onSwitchToView('view', newId);
    } else {
      await onUpdate(task.id, { ...details, content });
      onSwitchToView && onSwitchToView('view', task.id);
    }
  };

  return (
    <TaskEditorPanel
      mode={mode}
      task={task}
      columnId={columnId}
      onSave={saveHandler}
      onCancel={onClose}
    />
  );
}
