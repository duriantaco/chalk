import React, { useState, useRef, useEffect } from 'react';
import { debounce } from 'lodash';

const EMPTY_FILTERS = Object.freeze({});

const SearchAndFilterBar = ({ 
  onSearch, 
  onFilter,
  availableLabels = [],
  filterValues, 
  showAdvancedFilters = false
}) => {
  const [searchText, setSearchText] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [filters, setFilters] = useState({
    priority: 'all',   // all, high, medium, low
    completed: 'all',  // all, completed, active
    dueDate: 'any',    // any, overdue, today, week, month
    labels: [],        // array of selected labels
    ...(filterValues ?? EMPTY_FILTERS), 
  });

  useEffect(() => {
    setFilters((prev) => ({ ...prev, ...filterValues }));
  }, [filterValues]);
  
  useEffect(() => {
    if (!filterValues) 
      return;

    setFilters(prev => {
      const next = { ...prev, ...filterValues };
      for (const k in next) {
        if (next[k] !== prev[k]) 
          return next;
      }

      return prev;
    });
  }, [filterValues]);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const debouncedNotify = useRef(
    debounce(({ term, filters }) => {
      onSearch?.((term ?? '').toString());
      onFilter?.(filters);
    }, 250)
  ).current;
  
  useEffect(() => () => debouncedNotify.cancel(), [debouncedNotify]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAdvancedOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedNotify({ term: value, filters });
  };
  
  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...filters,
      [filterType]: value
    };
    setFilters(newFilters);
    debouncedNotify({ term: searchText, filters: newFilters });
  };
  
  const handleLabelToggle = (label) => {
    const newLabels = filters.labels.includes(label)
      ? filters.labels.filter(l => l !== label)
      : [...filters.labels, label];
    
    handleFilterChange('labels', newLabels);
  };
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  const handleClearFilters = () => {
    const resetFilters = {priority: 'all', completed: 'all', dueDate: 'any', labels: [] };
    setFilters(resetFilters);
    debouncedNotify.cancel();
    onFilter?.(resetFilters);
    onSearch?.(''); 
  };
  
  return (
    <div className="w-full flex flex-col space-y-2">
      <div className="w-full flex items-center relative">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            ref={searchInputRef}
            className="block w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 z-20"
            placeholder="Search tasks... (Ctrl+K)"
            value={searchText}
            onChange={handleSearchChange}
          />
          {searchText && (
            <button 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
              onClick={() => {
                setSearchText('');
                debouncedNotify.cancel();
                onSearch?.('');
                onFilter?.(filters);
              }}
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        
        {showAdvancedFilters && (
          <div className="relative ml-2" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`flex items-center justify-center p-2 rounded-md ${
                Object.values(filters).some(v => 
                  Array.isArray(v) ? v.length > 0 : v !== 'all' && v !== 'any'
                )
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
            </button>
            
            {isAdvancedOpen && (
              <div className="absolute right-0 mt-2 z-10 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
                <div className="p-3">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-medium">Filters</h3>
                    <button 
                      className="text-xs text-gray-400 hover:text-white"
                      onClick={handleClearFilters}
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-gray-400 text-sm mb-1">Priority</label>
                    <div className="flex space-x-1">
                      <button
                        className={`px-2 py-1 text-xs rounded-md ${
                          filters.priority === 'all' 
                            ? 'bg-gray-700 text-white' 
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                        onClick={() => handleFilterChange('priority', 'all')}
                      >
                        All
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded-md ${
                          filters.priority === 'high' 
                            ? 'bg-red-900 text-white' 
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                        onClick={() => handleFilterChange('priority', 'high')}
                      >
                        High
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded-md ${
                          filters.priority === 'medium' 
                            ? 'bg-amber-900 text-white' 
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                        onClick={() => handleFilterChange('priority', 'medium')}
                      >
                        Medium
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded-md ${
                          filters.priority === 'low' 
                            ? 'bg-emerald-900 text-white' 
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                        onClick={() => handleFilterChange('priority', 'low')}
                      >
                        Low
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-gray-400 text-sm mb-1">Status</label>
                    <div className="flex space-x-1">
                      <button
                        className={`px-2 py-1 text-xs rounded-md ${
                          filters.completed === 'all' 
                            ? 'bg-gray-700 text-white' 
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                        onClick={() => handleFilterChange('completed', 'all')}
                      >
                        All
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded-md ${
                          filters.completed === 'active' 
                            ? 'bg-indigo-800 text-white' 
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                        onClick={() => handleFilterChange('completed', 'active')}
                      >
                        Active
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded-md ${
                          filters.completed === 'completed' 
                            ? 'bg-emerald-800 text-white' 
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                        onClick={() => handleFilterChange('completed', 'completed')}
                      >
                        Completed
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-gray-400 text-sm mb-1">Due Date</label>
                    <div className="flex flex-wrap gap-1">
                      <button
                        className={`px-2 py-1 text-xs rounded-md ${
                          filters.dueDate === 'any' 
                            ? 'bg-gray-700 text-white' 
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                        onClick={() => handleFilterChange('dueDate', 'any')}
                      >
                        Any
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded-md ${
                          filters.dueDate === 'overdue' 
                            ? 'bg-red-900 text-white' 
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                        onClick={() => handleFilterChange('dueDate', 'overdue')}
                      >
                        Overdue
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded-md ${
                          filters.dueDate === 'today' 
                            ? 'bg-blue-900 text-white' 
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                        onClick={() => handleFilterChange('dueDate', 'today')}
                      >
                        Today
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded-md ${
                          filters.dueDate === 'week' 
                            ? 'bg-purple-900 text-white' 
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                        onClick={() => handleFilterChange('dueDate', 'week')}
                      >
                        This Week
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded-md ${
                          filters.dueDate === 'month' 
                            ? 'bg-teal-900 text-white' 
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                        onClick={() => handleFilterChange('dueDate', 'month')}
                      >
                        This Month
                      </button>
                    </div>
                  </div>
                  
                  {availableLabels.length > 0 && (
                    <div className="mb-3">
                      <label className="block text-gray-400 text-sm mb-1">Labels</label>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {availableLabels.map((label, index) => (
                          <button
                            key={index}
                            className={`px-2 py-1 text-xs rounded-md ${
                              filters.labels.includes(label) 
                                ? 'bg-indigo-800 text-white' 
                                : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                            }`}
                            onClick={() => handleLabelToggle(label)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {showAdvancedFilters && (
        <div className="flex flex-wrap gap-1 items-center text-xs">
          {filters.priority !== 'all' && (
            <div className="bg-gray-800 text-gray-300 rounded-full px-2 py-1 flex items-center">
              <span>Priority: {filters.priority}</span>
              <button 
                className="ml-1 text-gray-500 hover:text-white"
                onClick={() => handleFilterChange('priority', 'all')}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {filters.completed !== 'all' && (
            <div className="bg-gray-800 text-gray-300 rounded-full px-2 py-1 flex items-center">
              <span>Status: {filters.completed}</span>
              <button 
                className="ml-1 text-gray-500 hover:text-white"
                onClick={() => handleFilterChange('completed', 'all')}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {filters.dueDate !== 'any' && (
            <div className="bg-gray-800 text-gray-300 rounded-full px-2 py-1 flex items-center">
              <span>Due: {filters.dueDate}</span>
              <button 
                className="ml-1 text-gray-500 hover:text-white"
                onClick={() => handleFilterChange('dueDate', 'any')}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {filters.labels.length > 0 && filters.labels.map((label, index) => (
            <div key={index} className="bg-gray-800 text-gray-300 rounded-full px-2 py-1 flex items-center">
              <span>{label}</span>
              <button 
                className="ml-1 text-gray-500 hover:text-white"
                onClick={() => handleLabelToggle(label)}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
          
          {(filters.priority !== 'all' || 
           filters.completed !== 'all' || 
           filters.dueDate !== 'any' || 
           filters.labels.length > 0) && (
             <button 
               className="text-indigo-400 hover:text-indigo-300 text-xs"
               onClick={handleClearFilters}
             >
               Clear all
             </button>
           )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilterBar;