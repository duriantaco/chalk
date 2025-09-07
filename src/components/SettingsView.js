// src/components/SettingsView.js
import React, { useState, useEffect } from 'react';
import { downloadExportFile, readImportFile, importData } from '../data/export-import';
import { getStorageStatus, clearDatabase, getPersistence, ydoc } from '../data/store';

const SettingsView = ({ 
  onBack, 
  onThemeChange, 
  isDarkMode, 
  onResetApp, 
  backlogSchedulerActive,
  setBacklogSchedulerActive}) => {

  const [importStatus, setImportStatus] = useState(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [betaFeedbackEmail, setBetaFeedbackEmail] = useState('');
  const [currentTheme, setCurrentTheme] = useState(isDarkMode ? 'dark' : 'light');
  
  const [storageStatus, setStorageStatus] = useState({ isMemoryMode: false, hasPersistence: true });
  const [isClearingStorage, setIsClearingStorage] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 0, percentage: 0 });

useEffect(() => {

  const savedTheme = localStorage.getItem('chalk_theme');
  if (savedTheme) {
    setCurrentTheme(savedTheme);
  }
  
  setStorageStatus(getStorageStatus());
  checkStorageQuota();
}, []);
  
  const handleImportFile = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) 
        return;
      
      const jsonData = await readImportFile(file);
      const result = await importData(jsonData);
      
      setImportStatus(result);
      
      if (result.success) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setImportStatus({ success: false, message: error.message });
    }
  };
  
  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    window.open(`mailto:aaronoh2015@gmail.com?subject=Chalk Beta Feedback&body=Email: ${betaFeedbackEmail}%0A%0AFeedback:%0A%0A`, '_blank');
    setBetaFeedbackEmail('');
  };

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('chalk_theme', theme);
    onThemeChange(theme);
  };
  
  const handleClearStorage = async () => {
    if (confirm('This will clear all data and restart the app. Are you sure?')) {
      setIsClearingStorage(true);
      await clearDatabase();
    }
  };

  const checkStorageQuota = async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (used / quota) * 100 : 0;
        
        setStorageUsage({
          used: (used / 1024 / 1024).toFixed(1),
          quota: (quota / 1024 / 1024).toFixed(1),
          percentage: percentage.toFixed(1)
        });
      }
    } catch (error) {
      console.error('Storage quota check failed:', error);
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
        <h2 className="text-xl font-bold text-white">Settings</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
          <h3 className="text-white text-lg font-medium mb-4">Display Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 block mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  className={`flex flex-col items-center p-3 rounded-lg transition-colors border ${
                    currentTheme === 'dark' 
                      ? 'border-indigo-500 bg-gray-700' 
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                  }`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <div className="w-full h-12 bg-gray-900 rounded-md mb-2 overflow-hidden">
                    <div className="w-8 h-2 bg-gray-700 rounded-full mt-2 ml-2"></div>
                    <div className="w-6 h-2 bg-gray-700 rounded-full mt-1 ml-2"></div>
                    <div className="w-10 h-2 bg-gray-700 rounded-full mt-1 ml-2"></div>
                  </div>
                  <span className="text-sm font-medium text-white">Dark</span>
                </button>
                
                <button 
                  className={`flex flex-col items-center p-3 rounded-lg transition-colors border ${
                    currentTheme === 'light' 
                      ? 'border-indigo-500 bg-gray-700' 
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                  }`}
                  onClick={() => handleThemeChange('light')}
                >
                  <div className="w-full h-12 bg-white rounded-md mb-2 overflow-hidden">
                    <div className="w-8 h-2 bg-gray-200 rounded-full mt-2 ml-2"></div>
                    <div className="w-6 h-2 bg-gray-200 rounded-full mt-1 ml-2"></div>
                    <div className="w-10 h-2 bg-gray-200 rounded-full mt-1 ml-2"></div>
                  </div>
                  <span className="text-sm font-medium text-white">Light</span>
                </button>
                
                <button 
                  className={`flex flex-col items-center p-3 rounded-lg transition-colors border ${
                    currentTheme === 'neon' 
                      ? 'border-indigo-500 bg-gray-700' 
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                  }`}
                  onClick={() => handleThemeChange('neon')}
                >
                  <div className="w-full h-12 bg-blue-900 rounded-md mb-2 overflow-hidden relative">
                    <div className="w-8 h-2 bg-pink-500 rounded-full mt-2 ml-2 shadow-lg shadow-pink-500/50"></div>
                    <div className="w-6 h-2 bg-blue-500 rounded-full mt-1 ml-2 shadow-lg shadow-blue-500/50"></div>
                    <div className="w-10 h-2 bg-purple-500 rounded-full mt-1 ml-2 shadow-lg shadow-purple-500/50"></div>
                  </div>
                  <span className="text-sm font-medium text-white">Neon</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
          <h3 className="text-white text-lg font-medium mb-4">Beta Settings</h3>
          
          <div className="mb-4">
            <p className="text-gray-300 text-sm">
              You are using <span className="text-indigo-400 font-medium">Chalk Beta v1.0.0</span>
            </p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-white font-medium mb-2">Submit Feedback</h4>
            <form onSubmit={handleSubmitFeedback} className="space-y-3">
              <div>
                <input
                  type="email"
                  placeholder="Your email (optional)"
                  value={betaFeedbackEmail}
                  onChange={(e) => setBetaFeedbackEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
              >
                Submit Feedback
              </button>
            </form>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
          <h3 className="text-white text-lg font-medium mb-4">Data Management</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-medium mb-2">Backup Data</h4>
              <p className="text-gray-400 text-sm mb-2">
                Export all your boards, tasks, and settings to a backup file.
              </p>
              <button
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                onClick={downloadExportFile}
              >
                Export Data
              </button>
            </div>

            <div>
              <h4 className="text-white font-medium mb-2">Storage Status</h4>
              <div className="space-y-3">
                <div className={`p-3 rounded-md text-sm ${
                  storageStatus.isMemoryMode 
                    ? 'bg-orange-900/30 border border-orange-800 text-orange-300'
                    : 'bg-green-900/30 border border-green-800 text-green-300'
                }`}>
                  {storageStatus.isMemoryMode ? (
                    <>⚠️ Running in temporary mode - changes won't be saved</>
                  ) : (
                    <>✅ Data is being saved locally</>
                  )}
                </div>
                
                {storageUsage.quota > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Storage Used</span>
                      <span>{storageUsage.used} MB / {storageUsage.quota} MB</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          storageUsage.percentage > 90 ? 'bg-red-500' :
                          storageUsage.percentage > 75 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400">
                      {storageUsage.percentage}% used
                      {storageUsage.percentage > 90 && ' - Storage almost full!'}
                    </p>
                  </div>
                )}
                
                <p className="text-gray-400 text-sm">
                  Database: {storageStatus.hasPersistence ? 'Connected' : 'Not Available'}
                </p>
                
                {(storageStatus.isMemoryMode || storageUsage.percentage > 90) && (
                  <button
                    onClick={handleClearStorage}
                    disabled={isClearingStorage}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-md transition-colors"
                  >
                    {isClearingStorage ? 'Fixing...' : 'Fix Storage Issues'}
                  </button>
                )}
                
                <div className="flex space-x-2">
                <button
                  onClick={checkStorageQuota}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
                >
                  Refresh Usage
                </button>
                
                <button
                  onClick={async () => {
                    if (confirm('This will clear ALL your data and restart the app. This cannot be undone!')) {
                      setIsClearingStorage(true);
                      await clearDatabase();
                    }
                  }}
                  disabled={isClearingStorage}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-md transition-colors"
                >
                  {isClearingStorage ? 'Clearing...' : 'Clear All Storage'}
                </button>
              </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-2">Restore Data</h4>
              <p className="text-gray-400 text-sm mb-2">
                Import your boards and tasks from a backup file.
              </p>
              <div className="flex flex-col space-y-2">
                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-pointer text-center transition-colors">
                  Import Data
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportFile}
                  />
                </label>
                
                {importStatus && (
                  <div className={`text-sm mt-2 p-2 rounded ${
                    importStatus.success ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'
                  }`}>
                    {importStatus.message}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-2">Task Management</h4>
              <p className="text-gray-400 text-sm mb-2">
                Configure automatic task organization features.
              </p>
              
              <div className="form-group"> 
                <label className="flex items-center cursor-pointer"> 
                  <input 
                    type="checkbox" 
                    checked={backlogSchedulerActive} 
                    onChange={(e) => setBacklogSchedulerActive(e.target.checked)} 
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mr-2" 
                  /> 
                  <span className="text-white">Auto-detect stale tasks and move to backlog</span> 
                </label> 
                <p className="text-gray-400 text-sm mt-1 ml-6"> 
                  Tasks not updated for a week will be automatically moved to backlog
                </p> 
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-2">Reset Application</h4>
              <p className="text-gray-400 text-sm mb-2">
                Clear all data and reset Chalk to its default state.
              </p>
              
              {!isConfirmingReset ? (
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  onClick={() => setIsConfirmingReset(true)}
                >
                  Reset Application
                </button>
              ) : (
                <div className="bg-gray-750 p-3 rounded-md border border-red-600">
                  <p className="text-white text-sm mb-3">
                    Are you sure? This will permanently delete all your data!
                  </p>
                  <div className="flex space-x-3">
                    <button
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
                      onClick={onResetApp}
                    >
                      Yes, Reset Everything
                    </button>
                    <button
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
                      onClick={() => setIsConfirmingReset(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
          <h3 className="text-white text-lg font-medium mb-4">About Chalk</h3>
          
          <div className="space-y-3">
            <p className="text-gray-300">
              <span className="text-white font-medium">Version:</span> 1.0.0-beta
            </p>
            <p className="text-gray-300">
              Chalk is a local-first productivity application designed to help you organize tasks and projects with a beautiful, intuitive interface.
            </p>
            <p className="text-gray-300">
              <span className="text-white font-medium">Local-first:</span> Your data stays on your computer and is stored locally.
            </p>
            <div className="pt-3 border-t border-gray-700 mt-3">
              <p className="text-gray-400 text-sm">
                © 2025 Chalk. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;