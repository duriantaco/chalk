import React, { useState, useEffect } from 'react';

const EnhancedGroupsView = ({ 
  groups, 
  onSelectGroup, 
  onCreateGroup, 
  onDeleteGroup,
  getBoards, 
  getColumns,
  getTasks 
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [totalTasks, setTotalTasks] = useState(0);
  const [workspaceStats, setWorkspaceStats] = useState([]);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (getBoards && getColumns && getTasks) {
      const stats = groups.map(group => {
        let tasksTotal = 0;
        let tasksCompleted = 0;
        let latestActivity = null;
        const boards = getBoards(group.id);
    
        boards.forEach(board => {
          const columns = getColumns(board.id);
          columns.forEach(column => {
            const tasks = getTasks(column.id);
            tasks.forEach(task => {
              tasksTotal++;
              if (task.completed) {
                tasksCompleted++;
              }
              if (task.updatedAt) {
                const taskDate = new Date(task.updatedAt);
                if (!latestActivity || taskDate > latestActivity) {
                  latestActivity = taskDate;
                }
              }
            });
          });
        });
    
        return {
          id: group.id,
          name: group.name,
          tasksTotal: tasksTotal,
          tasksCompleted: tasksCompleted,
          boardCount: boards.length,
          lastActive: latestActivity || new Date(group.createdAt)
        };
      });
    
      setWorkspaceStats(stats);
      setTotalTasks(stats.reduce((sum, stat) => sum + stat.tasksTotal, 0));
    }
  }, [groups, getBoards, getColumns, getTasks]);
  
  const handleCreateGroup = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    setNameError('');
    
    if (!newGroupName.trim()) {
      setNameError('Workspace name is required');
      return;
    }
    
    try {
      if (typeof onCreateGroup === 'function') {
        onCreateGroup(newGroupName.trim(), newGroupDescription.trim());
        setNewGroupName('');
        setNewGroupDescription('');
        setIsCreating(false);
      } else {
        console.error('onCreateGroup is not a function');
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateGroup();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setNameError('');
    }
  };

  const handleDeleteClick = (e, group) => {
    e.stopPropagation();
    setGroupToDelete(group);
    setShowDeleteConfirmation(true);
  };
  
  const confirmDelete = () => {
    if (groupToDelete) {
      onDeleteGroup(groupToDelete.id);
      setShowDeleteConfirmation(false);
      setGroupToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setGroupToDelete(null);
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const getSimplifiedStats = (group) => {
    return {
      boardCount: group.boardIds?.length || 0,
      lastActive: new Date(group.createdAt)
    };
  };
  
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="relative header-welcome rounded-lg mb-8 p-6 overflow-hidden header-metallic neon-border-effect theme-card">
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-2xl font-bold title-neon title-text theme-highlight" data-text="Welcome to Chalk">Welcome to Chalk</h1>
            <p className="subtitle-text mt-2">Organize your tasks and boost your productivity</p>
            <div className="mt-4 flex items-center space-x-4">
              <div className="text-center">
                <div className="counter-neon" data-count={groups.length}>{groups.length}</div>
                <div className="text-xs text-gray-400">Workspaces</div>
              </div>
              <div className="h-8 w-px bg-gray-700 theme-border"></div>
              <div className="text-center">
                <div className="counter-neon" data-count={totalTasks}>{totalTasks}</div>
                <div className="text-xs text-gray-400">Total Tasks</div>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <button 
              className="btn-metallic px-4 py-2 rounded-md text-white flex items-center space-x-2 theme-button-primary"
              onClick={() => {
                setIsCreating(true);
                setNameError('');
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>New Workspace</span>
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px accent-line"></div>
      </div>
      
      <div className="relative flex items-center mb-8 pb-3">
        <h2 className="text-xl font-bold text-white theme-highlight">Your Workspaces</h2>
        <div className="absolute bottom-0 left-0 w-32 h-0.5 bg-gradient-to-r from-indigo-500 to-transparent"></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 grid-neon">
        {groups.map(group => {
          const stats = workspaceStats.find(s => s.id === group.id) || getSimplifiedStats(group);
          
          const completionRate = stats.tasksTotal > 0 
            ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) 
            : 0;
            
          return (
            <div
              key={group.id}
              className="workspace-card rounded-lg p-5 cursor-pointer relative group task-card theme-card"
              onClick={() => onSelectGroup(group.id)}
            >
              <button
                className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-700 hover:bg-red-600 text-gray-400 hover:text-white transition-colors z-10 opacity-0 group-hover:opacity-100"
                onClick={(e) => handleDeleteClick(e, group)}
                title="Delete workspace"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg mr-3">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-white">{group.name}</h3>
              </div>
              
              {group.description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">{group.description}</p>
              )}
              
              {getBoards && stats.tasksTotal > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Completion</span>
                    <span className="text-gray-300">{completionRate}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden theme-border">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pt-3 border-t border-gray-700 theme-border">
                <span className="flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1 opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {formatDate(stats.lastActive)}
                </span>
                
                <div className="flex space-x-3">
                <span className="flex items-center px-2 py-1 rounded-full theme-badge">
                <svg className="w-3.5 h-3.5 mr-1 opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                    {stats.boardCount}
                  </span>
                  
                  {getBoards && (
                    <span className="flex items-center bg-gray-800 px-2 py-1 rounded-full theme-card">
                      <svg className="w-3.5 h-3.5 mr-1 opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {stats.tasksTotal || 0}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {!isCreating ? (
          <div
            className="empty-workspace-card rounded-lg border border-dashed p-5 flex flex-col items-center justify-center cursor-pointer min-h-[220px] transition-all duration-200 theme-card theme-border"
            onClick={() => {
              setIsCreating(true);
              setNameError('');
            }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-gray-300 font-medium text-lg">New Workspace</span>
            <p className="text-gray-500 text-sm text-center mt-2">Create a new workspace for your projects</p>
          </div>
        ) : (
          <div className="card-metallic rounded-lg border border-gray-700 p-5 shadow-lg theme-card theme-border">
            <h3 className="text-lg font-semibold text-white mb-4">Create Workspace</h3>
            
            <div className="mb-3">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => {
                  setNewGroupName(e.target.value);
                  if (e.target.value.trim()) {
                    setNameError('');
                  }
                }}
                placeholder="Workspace name"
                onKeyDown={handleKeyDown}
                className={`w-full px-3 py-2 bg-gray-800 border ${nameError ? 'border-red-500' : 'border-gray-600'} rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent theme-input`}
                autoFocus
              />
              {nameError && (
                <p className="mt-1 text-sm text-red-500">{nameError}</p>
              )}
            </div>
            
            <textarea
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              placeholder="Description (optional)"
              rows="3"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4 theme-input"
            />
            
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                className="btn-metallic px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 theme-button-primary"
                onClick={() => {
                  console.log('Create button clicked');
                  if (newGroupName.trim()) {
                    onCreateGroup(newGroupName.trim(), newGroupDescription.trim());
                    setNewGroupName('');
                    setNewGroupDescription('');
                    setIsCreating(false);
                  } else {
                    setNameError('Workspace name is required');
                  }
                }}
              >
                Create
              </button>
              
              <button 
                type="button"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md focus:outline-none transition-colors"
                onClick={() => {
                  setIsCreating(false);
                  setNewGroupName('');
                  setNewGroupDescription('');
                  setNameError('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirmation && groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-gray-850 w-full max-w-md rounded-lg shadow-2xl border border-gray-700 p-6 modal-neon theme-card theme-border">
            <h3 className="text-white font-medium text-lg mb-3">Delete Workspace</h3>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{groupToDelete.name}</span>? 
              This will also delete all boards and tasks within this workspace.
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              
              <button 
                className="btn-metallic px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
                onClick={confirmDelete}
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedGroupsView;