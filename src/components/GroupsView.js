// src/components/GroupsView.js
import React, { useState } from 'react';

const GroupsView = ({ groups, onSelectGroup, onCreateGroup, onDeleteGroup }) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim(), newGroupDescription.trim());
      setNewGroupName('');
      setNewGroupDescription('');
      setIsCreating(false);
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
  
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center mb-6 pb-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">Workspaces</h2>
      </div>
      
      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Workspace Cards */}
        {groups.map(group => (
          <div
            key={group.id}
            className="bg-gray-800 rounded-lg border border-gray-700 hover:border-indigo-500 p-5 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 relative group task-card"
            onClick={() => onSelectGroup(group.id)}
          >
            {/* Add Delete Button */}
            <button
              className="absolute top-2 right-2 p-1 rounded-full bg-gray-700 hover:bg-red-600 text-gray-400 hover:text-white transition-colors"
              onClick={(e) => handleDeleteClick(e, group)}
              title="Delete workspace"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>

            <h3 className="text-lg font-semibold text-white mb-2">{group.name}</h3>
            
            {group.description && (
              <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">{group.description}</p>
            )}
            
            <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pt-3 border-t border-gray-700">
              <span className="flex items-center">
                <svg className="w-3.5 h-3.5 mr-1 opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {new Date(group.createdAt).toLocaleDateString()}
              </span>
              
              <span className="flex items-center bg-gray-700 px-2 py-1 rounded-full">
                <svg className="w-3.5 h-3.5 mr-1 opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {group.boardIds?.length || 0} boards
              </span>
            </div>
          </div>
        ))}
        
        {!isCreating ? (
          <div
            className="bg-gray-800 bg-opacity-40 rounded-lg border border-gray-700 border-dashed p-5 flex flex-col items-center justify-center cursor-pointer min-h-[160px] hover:bg-opacity-60 hover:border-indigo-500 transition-all duration-200"
            onClick={() => setIsCreating(true)}
          >
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-gray-400 font-medium">New Workspace</span>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-5 shadow-lg">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Workspace name"
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-2"
              autoFocus
            />
            
            <textarea
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              placeholder="Description (optional)"
              rows="2"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
            />
            
            <div className="flex justify-end gap-2">
              <button 
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors btn-neon btn-neon-primary"
                onClick={handleCreateGroup}
              >
                Create
              </button>
              
              <button 
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors text-sm"
                onClick={() => {
                  setIsCreating(false);
                  setNewGroupName('');
                  setNewGroupDescription('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

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

export default GroupsView;