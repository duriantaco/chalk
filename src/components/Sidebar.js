// src/components/Sidebar.js
import React, { useState } from 'react';

const Sidebar = ({ 
  groups, 
  currentGroupId, 
  onSelectGroup, 
  onCreateGroup,
  onDeleteGroup,
  isDarkMode,
  onToggleDarkMode,
  onShowDashboard,
  onShowAchievements,
  onShowSearch,
  onShowGraph
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  
  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim());
      setNewGroupName('');
      setIsCreating(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCreateGroup();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewGroupName('');
    }
  };
  
  const toggleGroups = () => {
    setExpandedGroups(!expandedGroups);
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
  
  return (
    <div className="flex h-full relative z-10">
        {/* Icon Sidebar */}
      <div className="w-12 h-full bg-gray-900 border-r border-gray-800 flex flex-col items-center py-3">
        {/* App Logo */}
        <div className="mb-6 text-xl font-bold">
          <span className="bg-gradient-to-r from-purple-400 to-indigo-500 text-transparent bg-clip-text">C</span>
        </div>
        
        {/* Main Navigation Icons */}
        <div className="flex flex-col items-center space-y-4">
        <button 
            onClick={onShowDashboard}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-indigo-800/30 hover:bg-indigo-800 text-indigo-400 hover:text-white transition-colors neon-icon"
            title="Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
          </button>
          
          <button 
            onClick={onShowSearch}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Search Tasks"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* New Graph View Button */}
          <button 
            onClick={onShowGraph}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Project Graph"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </button>
          
          <button 
            onClick={onShowAchievements}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Achievements"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="mt-2 w-6 h-[1px] bg-gray-800"></div>
          
          {/* Workspace Toggle */}
          <button
            onClick={toggleGroups}
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
              expandedGroups 
                ? 'bg-gray-800 text-white'
                : 'text-gray-500 hover:text-white hover:bg-gray-800'
            }`}
            title="Workspaces"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
          </button>
        </div>
        
        <div className="mt-auto">
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            onClick={onToggleDarkMode}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          
          <button 
            className="mt-2 w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Expandable Groups Panel */}
      {expandedGroups && (
        <div className="w-52 h-full bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800">
            <span className="text-xs font-semibold text-gray-500 tracking-wider">WORKSPACES</span>
            <button 
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
              onClick={() => setIsCreating(true)}
              title="Create new workspace"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {isCreating && (
            <div className="mx-3 my-2 p-2 bg-gray-800 rounded-md border border-gray-700">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="New workspace name..."
                onKeyDown={handleKeyDown}
                className="w-full bg-gray-800 text-gray-200 text-sm border-0 focus:ring-0 py-1 px-0.5 focus:outline-none"
                autoFocus
              />
              <div className="flex justify-end mt-2 space-x-1">
                <button 
                  className="p-1 rounded text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  onClick={handleCreateGroup}
                  title="Create"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  className="p-1 rounded text-xs bg-red-600 text-white hover:bg-red-700 transition-colors"
                  onClick={() => {
                    setIsCreating(false);
                    setNewGroupName('');
                  }}
                  title="Cancel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto">
            <div className="mt-1 px-2">
              {groups.map(group => (
                <div 
                  key={group.id}
                  className={`flex items-center px-2 py-1.5 rounded-md mb-1 cursor-pointer transition-colors ${
                    currentGroupId === group.id 
                      ? 'bg-indigo-900/30 text-indigo-300' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                  onClick={() => onSelectGroup(group.id)}
                >
                  <span className="mr-2 opacity-70">📁</span>
                  <span className="flex-1 truncate text-sm">{group.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400 mr-2">
                    {group.boardIds?.length || 0}
                  </span>
                  
                  {/* Add delete button */}
                  <button
                    className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-colors focus:outline-none"
                    onClick={(e) => handleDeleteClick(e, group)}
                    title="Delete workspace"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-gray-850 w-full max-w-md rounded-lg shadow-2xl border border-gray-700 p-6">
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
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
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

export default Sidebar;