// src/data/store.js
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { v4 as uuidv4 } from 'uuid';

const ydoc = new Y.Doc();

export const safeLocalStorage = {
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn(`localStorage full, couldn't save ${key}`);
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k.startsWith('chalk-backup-')) {
              localStorage.removeItem(k);
            }
          }
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.error(`Still can't save ${key} after cleanup`);
          return false;
        }
      }
      return false;
    }
  },
  
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`Couldn't read ${key} from localStorage`);
      return null;
    }
  }
};

class RobustStorage {
  constructor() {
    this.indexedDBWorking = false;
    this.lastBackupTime = 0;
    this.backupInterval = 30000;
    this._timer = null;
  }

  _writeBackupObject(obj) {
    const json = JSON.stringify(obj);
    const saved = safeLocalStorage.setItem('chalk-emergency-backup', json);
    const ts = Date.now();
    safeLocalStorage.setItem(`chalk-backup-${ts}`, json);
    this.cleanOldBackups();
    this.lastBackupTime = ts;
    return saved;
  }

  async createBackup() {
    try {
      const full = {
        groups: Array.from(groupsMap.entries()),
        boards: Array.from(boardsMap.entries()),
        columns: Array.from(columnsMap.entries()),
        tasks: Array.from(tasksMap.entries()),
        workspaceItems: Array.from(workspaceItemsMap.entries()),
        timestamp: new Date().toISOString()
      };

      if (!this._writeBackupObject(full)) {
        const smaller = {
          groups: Array.from(groupsMap.entries()),
          boards: Array.from(boardsMap.entries()),
          columns: Array.from(columnsMap.entries()),
          tasks: Array.from(tasksMap.entries()).slice(-100),
          timestamp: new Date().toISOString()
        };
        this._writeBackupObject(smaller);
      }
    } catch (error) {
      console.error('Backup failed:', error);
    }
  }

  cleanOldBackups() {
    try {
      const backupKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chalk-backup-')) {
          backupKeys.push({ key, timestamp: parseInt(key.replace('chalk-backup-', '')) });
        }
      }
      backupKeys.sort((a, b) => b.timestamp - a.timestamp);
      for (let i = 3; i < backupKeys.length; i++) {
        localStorage.removeItem(backupKeys[i].key);
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  async attemptRecovery() {
    try {
      const emergencyBackup = localStorage.getItem('chalk-emergency-backup');
      if (emergencyBackup) return this.restoreFromBackup(emergencyBackup);

      const backupKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chalk-backup-')) {
          backupKeys.push({ key, timestamp: parseInt(key.replace('chalk-backup-', '')) });
        }
      }
      if (backupKeys.length > 0) {
        backupKeys.sort((a, b) => b.timestamp - a.timestamp);
        const latestBackup = localStorage.getItem(backupKeys[0].key);
        return this.restoreFromBackup(latestBackup);
      }
      return false;
    } catch (error) {
      console.error('Recovery failed:', error);
      return false;
    }
  }

  restoreFromBackup(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      ydoc.transact(() => {
        groupsMap.clear();
        boardsMap.clear();
        columnsMap.clear();
        tasksMap.clear();
        workspaceItemsMap.clear();

        if (data.groups) data.groups.forEach(([k, v]) => groupsMap.set(k, v));
        if (data.boards) data.boards.forEach(([k, v]) => boardsMap.set(k, v));
        if (data.columns) data.columns.forEach(([k, v]) => columnsMap.set(k, v));
        if (data.tasks) data.tasks.forEach(([k, v]) => tasksMap.set(k, v));
        if (data.workspaceItems) data.workspaceItems.forEach(([k, v]) => workspaceItemsMap.set(k, v));
      });
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }

  startAutoBackup() {
    if (this._timer) return;
    this._timer = setInterval(() => {
      const now = Date.now();
      if (now - this.lastBackupTime >= this.backupInterval) {
        this.createBackup();
      }
    }, 10000);
  }

  stopAutoBackup() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
}

const robustStorage = new RobustStorage();

let persistence;

try {
  persistence = new IndexeddbPersistence('chalk-db', ydoc);
} catch (error) {
  console.warn('IndexedDB not available, will run in memory mode');
  persistence = null;
}

const groupsMap = ydoc.getMap('groups');
const boardsMap = ydoc.getMap('boards');
const columnsMap = ydoc.getMap('columns');
const tasksMap = ydoc.getMap('tasks');
const workspaceItemsMap = ydoc.getMap('workspaceItems');

const cacheConfig = {
  ttl: 2000, 
  boardsCache: new Map(),
  columnsCache: new Map(),
  clearCaches: () => {
    cacheConfig.boardsCache.clear();
    cacheConfig.columnsCache.clear();
  }
};

const warnIfMemoryMode = () => {
  if (isMemoryMode && !localStorage.getItem('memory-mode-warned')) {
    console.warn('Running in temporary mode - changes will not be saved');
    localStorage.setItem('memory-mode-warned', 'true');
  }
};

let isMemoryMode = false;

const initializeMemoryMode = () => {
  isMemoryMode = true;
    if (groupsMap.size === 0) {
    const skipDefaults = localStorage.getItem('chalk-skip-defaults');
    if (skipDefaults) {
      localStorage.removeItem('chalk-skip-defaults');
      return;
    }
    
    const defaultGroupId = uuidv4();
    const defaultGroup = {
      id: defaultGroupId,
      name: 'Personal',
      description: 'My personal tasks',
      createdAt: new Date().toISOString(),
      boardIds: []
    };
    
    const defaultBoardId = uuidv4();
    const defaultBoard = {
      id: defaultBoardId,
      name: 'My Tasks',
      description: 'Daily tasks tracker',
      groupId: defaultGroupId,
      createdAt: new Date().toISOString(),
      columnIds: []
    };
    
    const todoColumnId = uuidv4();
    const todoColumn = {
      id: todoColumnId,
      name: 'To Do',
      boardId: defaultBoardId,
      taskIds: [],
      order: 0
    };
    
    const inProgressColumnId = uuidv4();
    const inProgressColumn = {
      id: inProgressColumnId,
      name: 'In Progress',
      boardId: defaultBoardId,
      taskIds: [],
      order: 1
    };
    
    const doneColumnId = uuidv4();
    const doneColumn = {
      id: doneColumnId,
      name: 'Done',
      boardId: defaultBoardId,
      taskIds: [],
      order: 2
    };
    
    defaultGroup.boardIds = [defaultBoardId];
    defaultBoard.columnIds = [todoColumnId, inProgressColumnId, doneColumnId];
    
    const sampleTaskId = uuidv4();
    const sampleTask = {
      id: sampleTaskId,
      content: 'Welcome to Chalk! Drag this task to another column.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      columnId: todoColumnId
    };
    
    tasksMap.set(sampleTaskId, sampleTask);
    
    todoColumn.taskIds = [sampleTaskId];

    ydoc.transact(() => {
      groupsMap.set(defaultGroupId, defaultGroup);
      boardsMap.set(defaultBoardId, defaultBoard);
      columnsMap.set(todoColumnId, todoColumn);
      columnsMap.set(inProgressColumnId, inProgressColumn);
      columnsMap.set(doneColumnId, doneColumn);
      tasksMap.set(sampleTaskId, sampleTask);
    });

    columnsMap.set(todoColumnId, todoColumn);
  } else {

  }
  runDataIntegrityCheck();
};

export const initializeStore = async () => {
  
  const hadDataBefore = localStorage.getItem('chalk-had-data') === 'true';
  const hasDataNow = localStorage.getItem('chalk-emergency-backup') !== null;
  
  if (hadDataBefore && !hasDataNow && groupsMap.size === 0) {
    console.warn('Potential data loss detected!');
    const recovered = await robustStorage.attemptRecovery();
    if (recovered) {
      localStorage.setItem('chalk-had-data', 'true');
      robustStorage.startAutoBackup();
      runDataIntegrityCheck();
      return;
    }
  }

  if (!persistence) {
    console.warn('IndexedDB not available, using localStorage backup');
    
    const recovered = await robustStorage.attemptRecovery();
    if (!recovered) {
      initializeMemoryMode();
    }
    
    robustStorage.startAutoBackup();
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 2;
    
    const tryInitialize = () => {
      attempts++;
      const timeoutId = setTimeout(async () => {
        console.warn(`Database sync attempt ${attempts} timed out`);
        if (attempts >= maxAttempts) {
          console.warn(' IndexedDB failed, trying backup recovery...');
          const recovered = await robustStorage.attemptRecovery();
          if (!recovered) {
            initializeMemoryMode();
          }
          robustStorage.startAutoBackup();
          resolve();
        } else {
          tryInitialize();
        }
      }, attempts === 1 ? 10000 : 5000);
      
      const cleanup = () => clearTimeout(timeoutId);
      
      persistence.once('synced', async () => {
        cleanup();
        robustStorage.indexedDBWorking = true;
        
        try {
          if (groupsMap.size === 0) {
            const skipDefaults = localStorage.getItem('chalk-skip-defaults');
            if (skipDefaults) {
              localStorage.removeItem('chalk-skip-defaults');
              resolve();
              return;
            }
            
            const recovered = await robustStorage.attemptRecovery();
            if (!recovered) {
              createDefaultData();
            }
          } else {
          }
          
          localStorage.setItem('chalk-had-data', 'true');
          
          await robustStorage.createBackup();
          robustStorage.startAutoBackup();
          
          runDataIntegrityCheck();
          resolve();
        } catch (error) {
          console.error('Error setting up initial data:', error);
          const recovered = await robustStorage.attemptRecovery();
          if (!recovered) {
            initializeMemoryMode();
          }
          robustStorage.startAutoBackup();
          resolve();
        }
      });
      
      persistence.once('error', async (error) => {
        cleanup();
        if (attempts >= maxAttempts) {
          const recovered = await robustStorage.attemptRecovery();
          if (!recovered) {
            initializeMemoryMode();
          }
          robustStorage.startAutoBackup();
          resolve();
        } else {
          setTimeout(tryInitialize, 1000);
        }
      });
    };
    
    tryInitialize();
  });
};

function createDefaultData() {
  const defaultGroupId = uuidv4();
  const defaultGroup = {
    id: defaultGroupId,
    name: 'Personal',
    description: 'My personal tasks',
    createdAt: new Date().toISOString(),
    boardIds: []
  };
  
  const defaultBoardId = uuidv4();
  const defaultBoard = {
    id: defaultBoardId,
    name: 'My Tasks',
    description: 'Daily tasks tracker',
    groupId: defaultGroupId,
    createdAt: new Date().toISOString(),
    columnIds: []
  };
  
  const todoColumnId = uuidv4();
  const todoColumn = {
    id: todoColumnId,
    name: 'To Do',
    boardId: defaultBoardId,
    taskIds: [],
    order: 0
  };
  
  const inProgressColumnId = uuidv4();
  const inProgressColumn = {
    id: inProgressColumnId,
    name: 'In Progress',
    boardId: defaultBoardId,
    taskIds: [],
    order: 1
  };
  
  const doneColumnId = uuidv4();
  const doneColumn = {
    id: doneColumnId,
    name: 'Done',
    boardId: defaultBoardId,
    taskIds: [],
    order: 2
  };
  
  defaultGroup.boardIds = [defaultBoardId];
  defaultBoard.columnIds = [todoColumnId, inProgressColumnId, doneColumnId];
  
  const sampleTaskId = uuidv4();
  const sampleTask = {
    id: sampleTaskId,
    content: 'Welcome to Chalk! Drag this task to another column.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    columnId: todoColumnId
  };
  
  tasksMap.set(sampleTaskId, sampleTask);
  
  todoColumn.taskIds = [sampleTaskId];

  ydoc.transact(() => {
    groupsMap.set(defaultGroupId, defaultGroup);
    boardsMap.set(defaultBoardId, defaultBoard);
    columnsMap.set(todoColumnId, todoColumn);
    columnsMap.set(inProgressColumnId, inProgressColumn);
    columnsMap.set(doneColumnId, doneColumn);
    tasksMap.set(sampleTaskId, sampleTask);
  });
}

export const createWorkspaceItem = (boardId, type, content, metadata = {}) => {
  const id = uuidv4();
  const item = {
    id,
    type,
    content,
    metadata,
    boardId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  workspaceItemsMap.set(id, item);
  return id;
};

export const getWorkspaceItems = (boardId) => {
  return Array.from(workspaceItemsMap.values())
    .filter(item => item.boardId === boardId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const updateWorkspaceItem = (id, updates) => {
  const item = workspaceItemsMap.get(id);
  if (!item) return false;
  
  const updatedItem = { 
    ...item, 
    ...updates,
    updatedAt: new Date().toISOString()
  };
  workspaceItemsMap.set(id, updatedItem);
  return true;
};

export const deleteWorkspaceItem = (id) => {
  if (!workspaceItemsMap.get(id)) return false;
  workspaceItemsMap.delete(id);
  return true;
};


export const createGroup = (name, description = '') => {
  warnIfMemoryMode();
  const id = uuidv4();
  const group = {
    id,
    name,
    description,
    createdAt: new Date().toISOString(),
    boardIds: []
  };
  
  groupsMap.set(id, group);
  return id;
};

export const getGroups = () => {
  return Array.from(groupsMap.values()).sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );
};

export const getGroup = (id) => {
  return groupsMap.get(id);
};

export const updateGroup = (id, updates) => {
  const group = groupsMap.get(id);
  if (!group) return false;
  
  const updatedGroup = { ...group, ...updates };
  groupsMap.set(id, updatedGroup);
  return true;
};

export const deleteGroup = (id) => {
  const group = groupsMap.get(id);
  if (!group) return false;
  
  if (group.boardIds && Array.isArray(group.boardIds)) {
    group.boardIds.forEach(boardId => {
      deleteBoard(boardId);
    });
  }
  
  groupsMap.delete(id);
  return true;
};


export const createBoard = (groupId, name, description = '') => {
    warnIfMemoryMode();
  const group = groupsMap.get(groupId);
  if (!group) return null;
  
  const id = uuidv4();
  const board = {
    id,
    name,
    description,
    groupId,
    createdAt: new Date().toISOString(),
    columnIds: []
  };
  
  const todoColumnId = uuidv4();
  const todoColumn = {
    id: todoColumnId,
    name: 'To Do',
    boardId: id,
    taskIds: [],
    order: 0
  };
  
  const inProgressColumnId = uuidv4();
  const inProgressColumn = {
    id: inProgressColumnId,
    name: 'In Progress',
    boardId: id,
    taskIds: [],
    order: 1
  };
  
  const doneColumnId = uuidv4();
  const doneColumn = {
    id: doneColumnId,
    name: 'Done',
    boardId: id,
    taskIds: [],
    order: 2
  };
  
  board.columnIds = [todoColumnId, inProgressColumnId, doneColumnId];
  
  ydoc.transact(() => {
    boardsMap.set(id, board);
    columnsMap.set(todoColumnId, todoColumn);
    columnsMap.set(inProgressColumnId, inProgressColumn);
    columnsMap.set(doneColumnId, doneColumn);
    groupsMap.set(groupId, updatedGroup);
  });

  const updatedGroup = { ...group };
  if (!updatedGroup.boardIds) {
    updatedGroup.boardIds = [];
  }
  updatedGroup.boardIds.push(id);
  groupsMap.set(groupId, updatedGroup);
  
  invalidateCache('group', groupId);

  return id;
};

export const getBoards = (groupId) => {
  const cacheKey = `group_${groupId}`;
  const cachedData = cacheConfig.boardsCache.get(cacheKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp < cacheConfig.ttl)) {
    return cachedData.data;
  }
  
  const boards = Array.from(boardsMap.values())
    .filter(board => board.groupId === groupId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  cacheConfig.boardsCache.set(cacheKey, {
    data: boards,
    timestamp: Date.now()
  });
  
  return boards;
};


export const getBoard = (id) => {
  return boardsMap.get(id);
};

export const updateBoard = (id, updates) => {
  const board = boardsMap.get(id);
  if (!board) return false;
  
  const updatedBoard = { ...board, ...updates };
  boardsMap.set(id, updatedBoard);
  return true;
};

export const deleteBoard = (id) => {
  const board = boardsMap.get(id);
  if (!board) return false;
  
  if (board.columnIds && Array.isArray(board.columnIds)) {
    board.columnIds.forEach(columnId => {
      deleteColumn(columnId);
    });
  }
  
  const group = groupsMap.get(board.groupId);
  if (group && group.boardIds && Array.isArray(group.boardIds)) {
    const updatedGroup = { ...group };
    updatedGroup.boardIds = updatedGroup.boardIds.filter(boardId => boardId !== id);
    groupsMap.set(board.groupId, updatedGroup);
  }
  
  boardsMap.delete(id);
  invalidateCache('group', board.groupId);
  invalidateCache('board', id);
  return true;
};


export const createColumn = (boardId, name) => {
  const board = boardsMap.get(boardId);
  if (!board) return null;
  
  const id = uuidv4();
  const column = {
    id,
    name,
    boardId,
    taskIds: [],
    order: board.columnIds ? board.columnIds.length : 0
  };
  
  columnsMap.set(id, column);
  
  const updatedBoard = { ...board };
  if (!updatedBoard.columnIds) {
    updatedBoard.columnIds = [];
  }
  updatedBoard.columnIds.push(id);
  boardsMap.set(boardId, updatedBoard);
  invalidateCache('board', boardId);

  return id;
};

export const getColumns = (boardId) => {
  const cacheKey = `board_${boardId}`;
  const cachedData = cacheConfig.columnsCache.get(cacheKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp < cacheConfig.ttl)) {
    return cachedData.data;
  }
  
  const columns = Array.from(columnsMap.values())
    .filter(column => column.boardId === boardId)
    .sort((a, b) => a.order - b.order);
  
  cacheConfig.columnsCache.set(cacheKey, {
    data: columns,
    timestamp: Date.now()
  });
  
  return columns;
};

const invalidateCache = (type, id) => {
  switch(type) {
    case 'board':
      cacheConfig.columnsCache.delete(`board_${id}`);
      break;
    case 'group':
      cacheConfig.boardsCache.delete(`group_${id}`);
      break;
    case 'all':
      cacheConfig.clearCaches();
      break;
  }
};

export const getColumn = (id) => {
  return columnsMap.get(id);
};

export const updateColumn = (id, updates) => {
  const column = columnsMap.get(id);
  if (!column) return false;
  
  const updatedColumn = { ...column, ...updates };
  columnsMap.set(id, updatedColumn);
  invalidateCache('board', column.boardId);
  return true;
};

export const deleteColumn = (id) => {
  const column = columnsMap.get(id);
  if (!column) return false;
  
  if (column.taskIds && Array.isArray(column.taskIds)) {
    column.taskIds.forEach(taskId => {
      tasksMap.delete(taskId);
    });
  }
  
  const board = boardsMap.get(column.boardId);
  if (board && board.columnIds && Array.isArray(board.columnIds)) {
    const updatedBoard = { ...board };
    updatedBoard.columnIds = updatedBoard.columnIds.filter(columnId => columnId !== id);
    boardsMap.set(column.boardId, updatedBoard);
  }
  
  columnsMap.delete(id);
  if (board) invalidateCache('board', board.id);

  return true;
};

export const createTask = (columnId, content, details = {}) => {
  warnIfMemoryMode();
  if (!columnId) {
    console.error('Create task failed: Missing column ID');
    return null;
  }
  
  if (!content || content.trim() === '') {
    console.error('Create task failed: Empty task content');
    return null;
  }
  
  const column = columnsMap.get(columnId);
  if (!column) {
    console.error('Create task failed: Column not found', columnId);
    return null;
  }
  
  let id = uuidv4();
  while (tasksMap.has(id)) {
    console.warn('UUID collision detected, regenerating ID');
    id = uuidv4();
  }
  
  const columnName = (column.name || '').toString().trim().toLowerCase();
  const isInDone = columnName === 'done' || columnName === 'completed' || columnName === 'finished';
  const isInProgress = columnName === 'in progress' || columnName === 'doing' || columnName === 'working' || columnName === 'started';
  const isInTodo = columnName === 'to do' || columnName === 'todo' || columnName === 'backlog' || columnName === 'planned';
  
  const columnStatus = isInDone ? 'done' : 
                      isInProgress ? 'in-progress' : 
                      isInTodo ? 'todo' : 'other';
  
  let initialPercentComplete = details.percentComplete || 0;
  let initialCompleted = details.completed || false;
  
  if (isInDone) {
    initialPercentComplete = 100;
    initialCompleted = true;
  } else if (isInProgress && initialPercentComplete === 0) {
    initialPercentComplete = 5;
  }

  const safeDetails = {
    dueDate: details.dueDate || null,
    priority: ['low', 'medium', 'high'].includes(details.priority) ? details.priority : 'medium',
    labels: Array.isArray(details.labels) ? details.labels : [],
    assignedTo: details.assignedTo || null,
    description: details.description || '',
    attachments: Array.isArray(details.attachments) ? details.attachments : [],
    estimatedTime: details.estimatedTime || null,
    actualTime: details.actualTime || null,
  };

  const task = {
    id,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    columnId,
    columnStatus,  
    completed: initialCompleted,
    percentComplete: initialPercentComplete,
    comments: [],
    movementHistory: [], 
    timeInColumns: {},
    lastColumnChange: new Date().toISOString(),
    ...safeDetails
  };
  
  try {
    ydoc.transact(() => {
      if (tasksMap.has(id)) {
        throw new Error(`Task with ID ${id} already exists`);
      }
      
      tasksMap.set(id, task);
      
      const updatedColumn = { ...column };
      if (!updatedColumn.taskIds) {
        updatedColumn.taskIds = [];
      }
      
      if (!updatedColumn.taskIds.includes(id)) {
        updatedColumn.taskIds.push(id);
        columnsMap.set(columnId, updatedColumn);
      } else {
        console.error(`Task ID ${id} already exists in column ${columnId}`);
      }
    });
    
    setTimeout(() => robustStorage.createBackup(), 1000);

    return id;
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
};

export const getTasks = (columnId) => {
  const column = columnsMap.get(columnId);
  if (!column || !column.taskIds || !Array.isArray(column.taskIds)) return [];
  
  if (column.taskIds.length === 0) return [];
  
  const uniqueTaskIds = [...new Set(column.taskIds)];
  if (uniqueTaskIds.length !== column.taskIds.length) {
    console.warn(`Column ${columnId} has duplicate task IDs. Auto-fixing...`);
    
    ydoc.transact(() => {
      const updatedColumn = { ...column, taskIds: uniqueTaskIds };
      columnsMap.set(columnId, updatedColumn);
    });
  }
  
  const result = [];
  const foundIds = new Set();
  
  for (const taskId of uniqueTaskIds) {
    const task = tasksMap.get(taskId);
    if (task) {
      if (!foundIds.has(taskId)) {
        result.push(task);
        foundIds.add(taskId);
      }
    } else {
      console.warn(`Task ID ${taskId} referenced in column ${columnId} but not found in tasks map`);
    }
  }
  
  return result;
};

export const getTask = (id) => {
  return tasksMap.get(id);
};

export const updateTask = (id, updates) => {
  const task = tasksMap.get(id);
  if (!task) return false;
  
  const updatedTask = { 
    ...task, 
    ...updates,
    updatedAt: new Date().toISOString()
  };
  tasksMap.set(id, updatedTask);
  
  setTimeout(() => robustStorage.createBackup(), 1000);

  return true;
};

export const deleteTask = (id) => {
  try {
    if (!id) {
      console.error('Delete task failed: Missing task ID');
      return false;
    }
    
    const task = tasksMap.get(id);
    if (!task) {
      console.warn('Delete task failed: Task not found', id);
      return false;
    }
    
    const columnId = task.columnId;
    if (!columnId) {
      console.warn('Task has no column reference', id);
      tasksMap.delete(id);
      return true;
    }
    
    const column = columnsMap.get(columnId);
    
    ydoc.transact(() => {
      if (column && column.taskIds && Array.isArray(column.taskIds)) {
        const updatedColumn = { ...column };
        updatedColumn.taskIds = updatedColumn.taskIds.filter(taskId => taskId !== id);
        columnsMap.set(columnId, updatedColumn);
      } else {
        console.warn(`Column ${columnId} not found or has no task IDs array`);
      }
      
      tasksMap.delete(id);
    });
    
    setTimeout(() => robustStorage.createBackup(), 1000);
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    return false;
  }
};

export const linkTaskToDocument = (taskId, documentId) => {
  const task = tasksMap.get(taskId);
  if (!task) return false;
  
  const updatedTask = { ...task };
  if (!updatedTask.linkedDocuments) {
    updatedTask.linkedDocuments = [];
  }
  
  if (!updatedTask.linkedDocuments.includes(documentId)) {
    updatedTask.linkedDocuments.push(documentId);
    tasksMap.set(taskId, updatedTask);
    return true;
  }
  
  return false;
};

export const getLinkedDocumentsForTask = (taskId) => {
  const task = tasksMap.get(taskId);
  if (!task || !task.linkedDocuments) return [];
  
  return task.linkedDocuments.map(docId => workspaceItemsMap.get(docId))
    .filter(Boolean);
};

export const getDocumentTitle = (documentId) => {
  const doc = workspaceItemsMap.get(documentId);
  if (!doc) return null;
  
  const headingMatch = doc.content.match(/^# (.+)$/m);
  return headingMatch ? headingMatch[1] : 'Untitled Document';
};


export const moveTask = (taskId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex) => {
  try {
    const task = tasksMap.get(taskId);
    const sourceColumn = columnsMap.get(sourceColumnId);
    const destinationColumn = columnsMap.get(destinationColumnId);
    
    if (!task) {
      console.error('Move task failed: Task not found', taskId);
      return false;
    }
    
    if (!sourceColumn) {
      console.error('Move task failed: Source column not found', sourceColumnId);
      return false;
    }
    
    if (!destinationColumn) {
      console.error('Move task failed: Destination column not found', destinationColumnId);
      return false;
    }
    
    if (!sourceColumn.taskIds) sourceColumn.taskIds = [];
    if (!destinationColumn.taskIds) destinationColumn.taskIds = [];
    
    const updatedSourceColumn = { 
      ...sourceColumn,
      taskIds: [...sourceColumn.taskIds]
    };
    
    const updatedDestinationColumn = {
      ...destinationColumn,
      taskIds: [...destinationColumn.taskIds]
    };
    
    updatedSourceColumn.taskIds = updatedSourceColumn.taskIds.filter(id => id !== taskId);
    
    const existingIndex = updatedDestinationColumn.taskIds.indexOf(taskId);
    if (existingIndex !== -1) {
      console.warn(`Task ${taskId} already exists in destination column, removing duplicate reference`);
      updatedDestinationColumn.taskIds.splice(existingIndex, 1);
    }
    
    const safeDestinationIndex = Math.max(0, Math.min(destinationIndex, updatedDestinationColumn.taskIds.length));
    updatedDestinationColumn.taskIds.splice(safeDestinationIndex, 0, taskId);
    
    const now = new Date().toISOString();
    const updatedTask = { 
      ...task, 
      columnId: destinationColumnId,
      updatedAt: now
    };
    
    const destColumnName = destinationColumn.name.trim().toLowerCase();
    const isMovingToDone = destColumnName === 'done' || destColumnName === 'completed' || destColumnName === 'finished';
    const isMovingToInProgress = destColumnName === 'in progress' || destColumnName === 'doing' || destColumnName === 'working' || destColumnName === 'started';
    const isMovingToTodo = destColumnName === 'to do' || destColumnName === 'todo' || destColumnName === 'backlog' || destColumnName === 'planned';
    
    updatedTask.columnStatus = isMovingToDone ? 'done' : 
                              isMovingToInProgress ? 'in-progress' : 
                              isMovingToTodo ? 'todo' : 'other';
    
    if (isMovingToDone) {
      updatedTask.completed = true;
      updatedTask.percentComplete = 100;
    } else if (isMovingToInProgress && (!updatedTask.percentComplete || updatedTask.percentComplete === 0)) {
      updatedTask.percentComplete = 5; 
      updatedTask.completed = false;
    } else if (isMovingToTodo) {
      updatedTask.percentComplete = 0;
      updatedTask.completed = false;
    }
    
    if (sourceColumnId !== destinationColumnId) {
      const timeInColumns = { ...updatedTask.timeInColumns } || {};
      const lastColumnChange = new Date(updatedTask.lastColumnChange || updatedTask.createdAt);
      
      let timeSpentMs;
      try {
        timeSpentMs = new Date(now) - lastColumnChange;
        if (isNaN(timeSpentMs) || timeSpentMs < 0) {
          console.warn('Invalid time calculation, using 0 instead');
          timeSpentMs = 0;
        }
      } catch (err) {
        console.warn('Error calculating time spent in column:', err);
        timeSpentMs = 0;
      }
      
      timeInColumns[sourceColumnId] = (timeInColumns[sourceColumnId] || 0) + timeSpentMs;
      updatedTask.timeInColumns = timeInColumns;
      updatedTask.lastColumnChange = now;
      updatedTask.movementHistory = [
       ...(updatedTask.movementHistory || []),
        { from: sourceColumnId, to: destinationColumnId, timestamp: now }
      ];
    }
    
    try {
      ydoc.transact(() => {
        if (!tasksMap.has(taskId)) {
          throw new Error(`Cannot move task ${taskId} as it no longer exists`);
        }
        
        if (!columnsMap.has(sourceColumnId) || !columnsMap.has(destinationColumnId)) {
          throw new Error('Source or destination column no longer exists');
        }
        
        columnsMap.set(sourceColumnId, updatedSourceColumn);
        columnsMap.set(destinationColumnId, updatedDestinationColumn);
        tasksMap.set(taskId, updatedTask);
      });
      
      setTimeout(() => robustStorage.createBackup(), 1000);

      return true;
    } catch (transactionError) {
      console.error('Transaction failed while moving task:', transactionError);
      return false;
    }
  } catch (error) {
    console.error('Unexpected error while moving task:', error);
    return false;
  }
};


export const getColumnName = (columnId) => {
  const column = columnsMap.get(columnId);
  return column ? column.name : null;
};

export const addTaskComment = (taskId, comment, author) => {
  const task = tasksMap.get(taskId);
  if (!task) return false;
  
  const updatedTask = { ...task };
  
  if (!updatedTask.comments) {
    updatedTask.comments = [];
  }
  
  updatedTask.comments.push({
    id: uuidv4(),
    content: comment,
    author: author,
    createdAt: new Date().toISOString()
  });
  
  updatedTask.updatedAt = new Date().toISOString();
  tasksMap.set(taskId, updatedTask);
  
  return true;
};

export const getTaskAnalytics = (taskId) => {
  const task = tasksMap.get(taskId);
  if (!task) return null;
  
  if (!window._taskAnalyticsCache) {
    window._taskAnalyticsCache = new WeakMap();
  }
  
  if (window._taskAnalyticsCache.has(task)) {
    const cachedData = window._taskAnalyticsCache.get(task);
    if (cachedData.updatedAt === task.updatedAt) {
      return cachedData.analytics;
    }
  }
  
  const totalTimeMs = Object.values(task.timeInColumns || {}).reduce((sum, time) => sum + time, 0);
  
  const startDate = new Date(task.createdAt);
  const endDate = task.completed 
    ? new Date(task.updatedAt)
    : new Date();
  const cycleTimeMs = endDate - startDate;
  
  const columnTimes = {};
  const timeInColumns = task.timeInColumns || {};
  
  Object.entries(timeInColumns).forEach(([columnId, timeMs]) => {
    const columnName = getColumnName(columnId) || columnId;
    columnTimes[columnName] = timeMs;
  });
  
  const currentColumn = columnsMap.get(task.columnId);
  const currentStatus = currentColumn ? currentColumn.name : 'Unknown';
  
  const analytics = {
    totalTimeMs,
    totalTimeDays: totalTimeMs / (1000 * 60 * 60 * 24),
    cycleTimeMs,
    cycleTimeDays: cycleTimeMs / (1000 * 60 * 60 * 24),
    columnTimes,
    transitions: task.movementHistory ? task.movementHistory.length : 0,
    currentStatus,
    completed: task.completed,
    priority: task.priority
  };
  
  window._taskAnalyticsCache.set(task, {
    updatedAt: task.updatedAt,
    analytics
  });
  
  return analytics;
};

export const getBoardAnalytics = (boardId) => {
  const board = boardsMap.get(boardId);
  if (!board) return null;
  
  const columns = board.columnIds
    ? board.columnIds.map(id => columnsMap.get(id)).filter(Boolean)
    : [];
  
  const tasks = [];
  columns.forEach(column => {
    const columnTasks = column.taskIds
      ? column.taskIds.map(id => tasksMap.get(id)).filter(Boolean)
      : [];
    
    tasks.push(...columnTasks.map(task => ({
      ...task,
      columnName: column.name
    })));
  });
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const tasksByPriority = {
    high: tasks.filter(task => task.priority === 'high').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    low: tasks.filter(task => task.priority === 'low').length
  };
  
  const tasksByColumn = {};
  columns.forEach(column => {
    tasksByColumn[column.name] = column.taskIds ? column.taskIds.length : 0;
  });
  
  const tasksWithDueDate = tasks.filter(task => task.dueDate).length;
  const tasksWithoutDueDate = totalTasks - tasksWithDueDate;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;
  
  const completedTasksWithDates = tasks.filter(task => 
    task.completed && task.createdAt && task.updatedAt
  );
  
  let avgCycleTimeMs = 0;
  if (completedTasksWithDates.length > 0) {
    const totalCycleTimeMs = completedTasksWithDates.reduce((sum, task) => {
      const startDate = new Date(task.createdAt);
      const endDate = new Date(task.updatedAt);
      return sum + (endDate - startDate);
    }, 0);
    
    avgCycleTimeMs = totalCycleTimeMs / completedTasksWithDates.length;
  }
  
  return {
    totalTasks,
    completedTasks,
    completionRate,
    tasksByPriority,
    tasksByColumn,
    tasksWithDueDate,
    tasksWithoutDueDate,
    overdueTasks,
    avgCycleTimeMs,
    avgCycleTimeDays: avgCycleTimeMs / (1000 * 60 * 60 * 24)
  };
};

export const runDataIntegrityCheck = () => {
  let fixedIssues = 0;
  
  try {
    const columns = Array.from(columnsMap.values());
    
    ydoc.transact(() => {
      columns.forEach(column => {
        if (!column.taskIds || !Array.isArray(column.taskIds)) {
          console.warn(`Column ${column.id} has no taskIds array, fixing...`);
          const updatedColumn = { ...column, taskIds: [] };
          columnsMap.set(column.id, updatedColumn);
          fixedIssues++;
          return;
        }
        
        const uniqueTaskIds = [...new Set(column.taskIds)];
        if (uniqueTaskIds.length !== column.taskIds.length) {
          console.warn(`Column ${column.id} has duplicate task IDs, fixing...`);
          const updatedColumn = { ...column, taskIds: uniqueTaskIds };
          columnsMap.set(column.id, updatedColumn);
          fixedIssues++;
        }
        
        const orphanedIds = column.taskIds.filter(taskId => !tasksMap.has(taskId));
        if (orphanedIds.length > 0) {
          console.warn(`Column ${column.id} has ${orphanedIds.length} orphaned task IDs, removing...`);
          const updatedTaskIds = column.taskIds.filter(taskId => tasksMap.has(taskId));
          const updatedColumn = { ...column, taskIds: updatedTaskIds };
          columnsMap.set(column.id, updatedColumn);
          fixedIssues++;
        }
      });
      
      const tasks = Array.from(tasksMap.values());
      const columnTaskIds = new Set();
      
      columns.forEach(column => {
        if (column.taskIds && Array.isArray(column.taskIds)) {
          column.taskIds.forEach(taskId => columnTaskIds.add(taskId));
        }
      });
      
      const orphanedTasks = tasks.filter(task => !columnTaskIds.has(task.id));
      if (orphanedTasks.length > 0) {
        console.warn(`Found ${orphanedTasks.length} tasks not associated with any column`);
        orphanedTasks.forEach(task => {
          console.warn(`Removing orphaned task: ${task.id} - ${task.content}`);
          tasksMap.delete(task.id);
          fixedIssues++;
        });
      }
    });
    return fixedIssues;
  } catch (error) {
    console.error("Error during data integrity check:", error);
    return -1;
  }
};

export const getStorageStatus = () => ({
  isMemoryMode,
  hasPersistence: !!persistence
});

export const clearDatabase = async () => {
  try {
 
    localStorage.setItem('chalk-skip-defaults', 'true');
    
    groupsMap.clear();
    boardsMap.clear();
    columnsMap.clear();
    tasksMap.clear();
    workspaceItemsMap.clear();
    
    if (persistence) {
      persistence.destroy();
    }
    
    ydoc.destroy();
    
    await new Promise((resolve) => {
      const deleteReq = indexedDB.deleteDatabase('chalk-db');
      deleteReq.onerror = () => {
        console.error('IndexedDB delete failed:', deleteReq.error);
        resolve();
      };
      deleteReq.onsuccess = () => {
        resolve();
      };
      deleteReq.onblocked = () => {
        console.warn('IndexedDB delete blocked');
        setTimeout(() => resolve(), 2000);
      };
    });
    
    localStorage.clear();
    sessionStorage.clear();
    
    localStorage.setItem('chalk-skip-defaults', 'true');

    await new Promise(resolve => setTimeout(resolve, 3000));
    
    window.location.href = window.location.href;
    
    return true;
  } catch (error) {
    console.error('CLEAR FAILED WITH ERROR:', error);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    window.location.href = window.location.href;
    return false;
  }
};

export const subscribeToChanges = (callback) => {
  const observer = () => {
    callback();
  };

  groupsMap.observe(observer);
  boardsMap.observe(observer);
  columnsMap.observe(observer);
  tasksMap.observe(observer);
  
  return () => {
    groupsMap.unobserve(observer);
    boardsMap.unobserve(observer);
    columnsMap.unobserve(observer);
    tasksMap.unobserve(observer);
  };
};

export const getPersistence = () => persistence;
export { ydoc, persistence };