// src/data/export-import.js
import { ydoc, persistence } from './store';
import { safeLocalStorage } from './store';

export const exportData = async () => {
  try {
    await new Promise((resolve, reject) => {
      if (persistence.synced) {
        resolve();
      } else {
        const timeoutId = setTimeout(() => {
          reject(new Error('Timed out waiting for data to sync'));
        }, 10000);
        
        persistence.once('synced', () => {
          clearTimeout(timeoutId);
          resolve();
        });
      }
    });
    
    const data = {
      groups: Array.from(ydoc.getMap('groups').entries()),
      boards: Array.from(ydoc.getMap('boards').entries()),
      columns: Array.from(ydoc.getMap('columns').entries()),
      tasks: Array.from(ydoc.getMap('tasks').entries()),
      workspaceItems: Array.from(ydoc.getMap('workspaceItems').entries()),
      version: '1.0.0-beta',
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Export error:', error);
    throw new Error('Failed to export data: ' + error.message);
  }
};

export const importData = async (jsonData) => {
  try {
    if (!jsonData || typeof jsonData !== 'string') {
      throw new Error('Invalid input: Expected JSON string');
    }
    
    const data = JSON.parse(jsonData);
    
    if (!data.groups || !Array.isArray(data.groups) || 
        !data.boards || !Array.isArray(data.boards) || 
        !data.columns || !Array.isArray(data.columns) || 
        !data.tasks || !Array.isArray(data.tasks)) {
      throw new Error('Invalid data format: Missing required collections');
    }
    
    const backupData = await exportData();
      safeLocalStorage.setItem('chalk-import-backup', backupData);
    
    try {
      ydoc.getMap('groups').clear();
      ydoc.getMap('boards').clear();
      ydoc.getMap('columns').clear();
      ydoc.getMap('tasks').clear();
      ydoc.getMap('workspaceItems').clear();
      
      data.groups.forEach(([key, value]) => ydoc.getMap('groups').set(key, value));
      data.boards.forEach(([key, value]) => ydoc.getMap('boards').set(key, value));
      data.columns.forEach(([key, value]) => ydoc.getMap('columns').set(key, value));
      data.tasks.forEach(([key, value]) => ydoc.getMap('tasks').set(key, value));
      
      if (data.workspaceItems) {
        data.workspaceItems.forEach(([key, value]) => ydoc.getMap('workspaceItems').set(key, value));
      }
      
      return { success: true, message: 'Data imported successfully' };
    } catch (importError) {
      console.error('Import failure, restoring from backup:', importError);
      
      const backupString = localStorage.getItem('chalk-import-backup');
      if (backupString) {
        const backupData = JSON.parse(backupString);
        
        ydoc.getMap('groups').clear();
        ydoc.getMap('boards').clear();
        ydoc.getMap('columns').clear();
        ydoc.getMap('tasks').clear();
        ydoc.getMap('workspaceItems').clear();
        
        backupData.groups.forEach(([key, value]) => ydoc.getMap('groups').set(key, value));
        backupData.boards.forEach(([key, value]) => ydoc.getMap('boards').set(key, value));
        backupData.columns.forEach(([key, value]) => ydoc.getMap('columns').set(key, value));
        backupData.tasks.forEach(([key, value]) => ydoc.getMap('tasks').set(key, value));
        
        if (backupData.workspaceItems) {
          backupData.workspaceItems.forEach(([key, value]) => ydoc.getMap('workspaceItems').set(key, value));
        }
      }
      
      throw new Error('Import failed and data was restored from backup: ' + importError.message);
    }
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: error.message };
  }
};

export const downloadExportFile = async () => {
  try {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `chalk-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Download error:', error);
    return { success: false, message: error.message };
  }
};

export const readImportFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      reject(new Error('Invalid file type. Please provide a JSON file.'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(new Error('Failed to read file: ' + error.message));
    reader.readAsText(file);
  });
};