// src/data/store.js
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { v4 as uuidv4 } from 'uuid';

const ydoc = new Y.Doc();

const persistence = new IndexeddbPersistence('chalk-db', ydoc);

const groupsMap = ydoc.getMap('groups');
const boardsMap = ydoc.getMap('boards');
const columnsMap = ydoc.getMap('columns');
const tasksMap = ydoc.getMap('tasks');
const workspaceItemsMap = ydoc.getMap('workspaceItems');


export const initializeStore = () => {
  return new Promise((resolve) => {
    persistence.on('synced', () => {
      console.log('Data synced with IndexedDB');
      
      if (groupsMap.size === 0) {
        console.log('Creating default data');
        
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
        
        groupsMap.set(defaultGroupId, defaultGroup);
        boardsMap.set(defaultBoardId, defaultBoard);
        columnsMap.set(todoColumnId, todoColumn);
        columnsMap.set(inProgressColumnId, inProgressColumn);
        columnsMap.set(doneColumnId, doneColumn);
        
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
        columnsMap.set(todoColumnId, todoColumn);
      } else {
        console.log('Using existing data');
      }
      
      resolve();
    });
  });
};


const WorkspaceItemTypes = {
  NOTE: 'note',
  LINK: 'link',
  CHECKLIST: 'checklist',
  FILE_REFERENCE: 'file'
};

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
  
  boardsMap.set(id, board);
  columnsMap.set(todoColumnId, todoColumn);
  columnsMap.set(inProgressColumnId, inProgressColumn);
  columnsMap.set(doneColumnId, doneColumn);
  
  const updatedGroup = { ...group };
  if (!updatedGroup.boardIds) {
    updatedGroup.boardIds = [];
  }
  updatedGroup.boardIds.push(id);
  groupsMap.set(groupId, updatedGroup);
  
  return id;
};

export const getBoards = (groupId) => {
  return Array.from(boardsMap.values())
    .filter(board => board.groupId === groupId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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
  
  return id;
};

export const getColumns = (boardId) => {
  return Array.from(columnsMap.values())
    .filter(column => column.boardId === boardId)
    .sort((a, b) => a.order - b.order);
};

export const getColumn = (id) => {
  return columnsMap.get(id);
};

export const updateColumn = (id, updates) => {
  const column = columnsMap.get(id);
  if (!column) return false;
  
  const updatedColumn = { ...column, ...updates };
  columnsMap.set(id, updatedColumn);
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
  return true;
};

/**
 * Task CRUD operations
 */
export const createTask = (columnId, content, details = {}) => {
  const column = columnsMap.get(columnId);
  if (!column) return null;
  
  const id = uuidv4();
  const columnName = column ? column.name.trim().toLowerCase() : '';
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

  const task = {
    id,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    columnId,
    columnStatus,  
    dueDate: details.dueDate || null,
    priority: details.priority || 'medium', // low, medium, high
    labels: details.labels || [],
    assignedTo: details.assignedTo || null,
    description: details.description || '',
    attachments: details.attachments || [],
    completed: initialCompleted,
    percentComplete: initialPercentComplete,
    estimatedTime: details.estimatedTime || null,
    actualTime: details.actualTime || null,
    comments: [],
    movementHistory: [], 
    timeInColumns: {},
    lastColumnChange: new Date().toISOString(), 
  };
  
  tasksMap.set(id, task);
  
  const updatedColumn = { ...column };
  if (!updatedColumn.taskIds) {
    updatedColumn.taskIds = [];
  }
  updatedColumn.taskIds.push(id);
  columnsMap.set(columnId, updatedColumn);
  
  return id;
};

export const getTasks = (columnId) => {
  const column = columnsMap.get(columnId);
  if (!column || !column.taskIds || !Array.isArray(column.taskIds)) return [];
  
  return column.taskIds.map(taskId => tasksMap.get(taskId)).filter(Boolean);
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
  return true;
};

export const deleteTask = (id) => {
  const task = tasksMap.get(id);
  if (!task) return false;
  
  const column = columnsMap.get(task.columnId);
  if (column && column.taskIds && Array.isArray(column.taskIds)) {
    const updatedColumn = { ...column };
    updatedColumn.taskIds = updatedColumn.taskIds.filter(taskId => taskId !== id);
    columnsMap.set(task.columnId, updatedColumn);
  }
  
  tasksMap.delete(id);
  return true;
};


export const moveTask = (taskId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex) => {
  const task = tasksMap.get(taskId);
  const sourceColumn = columnsMap.get(sourceColumnId);
  const destinationColumn = columnsMap.get(destinationColumnId);
  
  if (!task || !sourceColumn || !destinationColumn) return false;
  
  if (!sourceColumn.taskIds) sourceColumn.taskIds = [];
  if (!destinationColumn.taskIds) destinationColumn.taskIds = [];
  
  const updatedSourceColumn = { ...sourceColumn };
  const updatedDestinationColumn = { ...destinationColumn };
  
  updatedSourceColumn.taskIds = updatedSourceColumn.taskIds.filter(id => id !== taskId);
  updatedDestinationColumn.taskIds = [...updatedDestinationColumn.taskIds];
  updatedDestinationColumn.taskIds.splice(destinationIndex, 0, taskId);
  
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
    const timeSpentMs = new Date(now) - lastColumnChange;
    
    timeInColumns[sourceColumnId] = (timeInColumns[sourceColumnId] || 0) + timeSpentMs;
    updatedTask.timeInColumns = timeInColumns;
    updatedTask.lastColumnChange = now;
  }
  
  columnsMap.set(sourceColumnId, updatedSourceColumn);
  columnsMap.set(destinationColumnId, updatedDestinationColumn);
  tasksMap.set(taskId, updatedTask);
  
  console.log(`Task ${taskId} moved to "${destinationColumn.name}", completed = ${updatedTask.completed}, percentComplete = ${updatedTask.percentComplete}`);
  
  return true;
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
  
  return {
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

/**
 * Subscribe to Y.js changes
 */
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

export { ydoc, persistence };