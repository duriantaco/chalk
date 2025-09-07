// src/components/BoardsView.js
import React, { useState } from 'react';

const BoardsView = ({ group, boards, onSelectBoard, onCreateBoard, onBack }) => {
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      onCreateBoard(newBoardName.trim(), newBoardDescription.trim());
      setNewBoardName('');
      setNewBoardDescription('');
      setIsCreating(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateBoard();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewBoardName('');
      setNewBoardDescription('');
    }
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
        <h2 className="text-xl font-bold text-white">{group.name}</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.map(board => (
          <div
            key={board.id}
            className="bg-gray-800 rounded-lg border border-gray-700 hover:border-indigo-500 p-5 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            onClick={() => onSelectBoard(board.id)}
          >
            <h3 className="text-lg font-semibold text-white mb-2">{board.name}</h3>
            
            {board.description && (
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{board.description}</p>
            )}
            
            <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pt-3 border-t border-gray-700">
              <span className="flex items-center">
                <svg className="w-3.5 h-3.5 mr-1 opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {new Date(board.createdAt).toLocaleDateString()}
              </span>
              
              <span className="flex items-center bg-gray-700 px-2 py-1 rounded-full">
                <svg className="w-3.5 h-3.5 mr-1 opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6h16M4 12h16M4 18h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {board.columnIds.length} columns
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
            <span className="text-gray-400 font-medium">New Board</span>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-5 shadow-lg">
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Board name"
              onKeyDown={handleKeyDown}
              className="w-full mb-3 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            
            <textarea
              value={newBoardDescription}
              onChange={(e) => setNewBoardDescription(e.target.value)}
              placeholder="Description (optional)"
              rows="2"
              className="w-full mb-4 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                onClick={handleCreateBoard}
              >
                Create
              </button>
              
              <button 
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                onClick={() => {
                  setIsCreating(false);
                  setNewBoardName('');
                  setNewBoardDescription('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardsView;