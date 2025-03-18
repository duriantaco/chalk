// src/components/WorkspacePanel.js
import React, { useState } from 'react';

const WorkspacePanel = ({ 
  board, 
  workspaceItems, 
  onCreateItem, 
  onUpdateItem, 
  onDeleteItem 
}) => {
  const [newItemType, setNewItemType] = useState('note');
  const [newItemContent, setNewItemContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  
  const handleCreateItem = () => {
    if (newItemContent.trim()) {
      let metadata = {};
      
      if (newItemType === 'link') {
        try {
          const url = new URL(newItemContent);
          metadata.domain = url.hostname;
        } catch (e) {
        }
      }
      
      onCreateItem(newItemType, newItemContent, metadata);
      setNewItemContent('');
      setIsCreating(false);
    }
  };
  
  const handleEditItem = (id, content) => {
    onUpdateItem(id, { content });
    setEditingItemId(null);
  };
  
  const renderItemContent = (item) => {
    if (editingItemId === item.id) {
      return (
        <div className="mt-2">
          <textarea
            value={item.content}
            onChange={(e) => onUpdateItem(item.id, { content: e.target.value })}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows="4"
          />
          <div className="flex justify-end mt-2 space-x-2">
            <button
              className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
              onClick={() => setEditingItemId(null)}
            >
              Save
            </button>
            <button
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md"
              onClick={() => setEditingItemId(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
    
    switch (item.type) {
      case 'note':
        return (
          <div className="mt-2 text-gray-300 whitespace-pre-wrap">
            {item.content}
          </div>
        );
      
      case 'link':
        try {
          const url = new URL(item.content);
          return (
            <div className="mt-2">
              <a 
                href={item.content} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline break-all"
              >
                {item.content}
              </a>
              {item.metadata?.domain && (
                <div className="text-xs text-gray-500 mt-1">
                  {item.metadata.domain}
                </div>
              )}
            </div>
          );
        } catch (e) {
          return (
            <div className="mt-2 text-gray-300">
              {item.content}
            </div>
          );
        }
      
      case 'checklist':
        try {
          const checklistItems = JSON.parse(item.content);
          return (
            <div className="mt-2 space-y-1">
              {checklistItems.map((checkItem, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={checkItem.checked}
                    onChange={() => {
                      const updatedItems = [...checklistItems];
                      updatedItems[index].checked = !updatedItems[index].checked;
                      onUpdateItem(item.id, { content: JSON.stringify(updatedItems) });
                    }}
                    className="mr-2"
                  />
                  <span className={`text-sm ${checkItem.checked ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                    {checkItem.text}
                  </span>
                </div>
              ))}
            </div>
          );
        } catch (e) {
          return (
            <div className="mt-2 text-gray-300">
              {item.content}
            </div>
          );
        }
      
      default:
        return (
          <div className="mt-2 text-gray-300">
            {item.content}
          </div>
        );
    }
  };
  
  const getItemIcon = (type) => {
    switch (type) {
      case 'note':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'link':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'checklist':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 2v7h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };
  
  const getItemTitle = (type) => {
    switch (type) {
      case 'note': return 'Note';
      case 'link': return 'Link';
      case 'checklist': return 'Checklist';
      default: return 'Item';
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-850 border-l border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-medium text-white">Workspace</h2>
        <p className="text-sm text-gray-400 mt-1">
          Store notes, links, and resources related to this board
        </p>
      </div>
      
      <div className="p-4 border-b border-gray-700">
        {!isCreating ? (
          <button
            className="w-full py-2 px-3 flex items-center justify-center gap-2 text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
            onClick={() => setIsCreating(true)}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Add Item</span>
          </button>
        ) : (
          <div className="bg-gray-800 rounded-md p-3 border border-gray-700">
            <div className="flex border-b border-gray-700 mb-3">
              <button
                className={`py-2 px-3 text-sm ${newItemType === 'note' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}
                onClick={() => setNewItemType('note')}
              >
                Note
              </button>
              <button
                className={`py-2 px-3 text-sm ${newItemType === 'link' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}
                onClick={() => setNewItemType('link')}
              >
                Link
              </button>
              <button
                className={`py-2 px-3 text-sm ${newItemType === 'checklist' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}
                onClick={() => setNewItemType('checklist')}
              >
                Checklist
              </button>
            </div>
            
            {newItemType === 'link' ? (
              <input
                type="text"
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                placeholder="Paste URL or link..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            ) : newItemType === 'checklist' ? (
              <textarea
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                placeholder="Enter items (one per line)..."
                rows="3"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            ) : (
              <textarea
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                placeholder="Type your note here..."
                rows="3"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            )}
            
            <div className="flex justify-end mt-3 space-x-2">
              <button
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md"
                onClick={handleCreateItem}
              >
                Add {getItemTitle(newItemType)}
              </button>
              <button
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-md"
                onClick={() => {
                  setIsCreating(false);
                  setNewItemContent('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {workspaceItems.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No items yet</p>
            <p className="text-sm mt-1">Add notes, links, and other resources</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workspaceItems.map(item => (
              <div key={item.id} className="bg-gray-800 rounded-md p-3 border border-gray-700">
                <div className="flex justify-between items-start">
                  <div className="flex items-center text-indigo-400">
                    {getItemIcon(item.type)}
                    <span className="ml-2 font-medium">{getItemTitle(item.type)}</span>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      className="p-1 text-gray-500 hover:text-white rounded-md"
                      onClick={() => setEditingItemId(item.id)}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      className="p-1 text-gray-500 hover:text-red-400 rounded-md"
                      onClick={() => onDeleteItem(item.id)}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                {renderItemContent(item)}
                
                <div className="text-xs text-gray-500 mt-3">
                  Updated {new Date(item.updatedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspacePanel;