import React, { useState, useEffect } from 'react';
import { 
  initializeStore, 
  getGroups, 
  getBoards, 
  getColumns, 
  getTasks,
  createGroup,
  createBoard,
  createColumn,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  subscribeToChanges,
  deleteGroup,
  getWorkspaceItems,
  createWorkspaceItem,
  updateWorkspaceItem,
  deleteWorkspaceItem
} from './data/store';
import NeonLoader from './components/NeonLoader';
import PageTransition from './components/PageTransition';
import EnhancedGroupsView from './components/EnhancedGroupsView';
import BoardsView from './components/BoardsView';
import BoardView from './components/BoardView';
import DashboardView from './components/DashboardView';
import AchievementsView from './components/AchievementsView';
import SearchTasksView from './components/SearchTasksView';
import GraphView from './components/GraphView'; 
import NotificationSystem from './components/NotificationSystem';
import Sidebar from './components/Sidebar';
import SettingsView from './components/SettingsView';
import PasswordDialog from './components/PasswordDialog';
import { isAppUnlocked } from './utils/passwordManager';
import { initializeTheme, applyTheme, THEMES, setupThemeObserver } from './utils/themeManager';
import BacklogView from './components/BacklogView';
import { setupStaleTaskScheduler } from './utils/backlogManager';

const App = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [groups, setGroups] = useState([]);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [currentBoardId, setCurrentBoardId] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(THEMES.DARK); 
  const [currentView, setCurrentView] = useState('groups');
  const [notifications, setNotifications] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [appLocked, setAppLocked] = useState(!isAppUnlocked());
  const [backlogSchedulerActive, setBacklogSchedulerActive] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoaded(false);
        
        const initTimeout = setTimeout(() => {
          console.error('Store initialization timed out');
          setIsLoaded(true);
          addNotification({
            type: 'error',
            title: 'Initialization Error',
            message: 'Failed to initialize app data. Please refresh the page.',
            duration: 0 
          });
        }, 15000);
        
        await initializeStore();
        clearTimeout(initTimeout);
        console.log('Store initialized');
        
        const savedTheme = initializeTheme();
        setCurrentTheme(savedTheme);
        
        const observer = setupThemeObserver();

        refreshGroups();
  
        try {
          const savedAchievements = localStorage.getItem('chalk-achievements');
          if (savedAchievements) {
            setAchievements(JSON.parse(savedAchievements));
          }
        } catch (achievementsError) {
          console.error('Error loading achievements:', achievementsError);
        }
        
        const unsubscribe = subscribeToChanges(() => {
          console.log('Store updated');
          refreshGroups();
          checkForNewAchievements();
        });
        
        let cancelScheduler = () => {}; 
        
        if (backlogSchedulerActive) {
          cancelScheduler = setupStaleTaskScheduler(
            24 * 60 * 60 * 1000,
            (stats) => {
              if (stats.tasksMovedToBacklog > 0) {
                addNotification({
                  type: 'info',
                  title: 'Backlog Updated',
                  message: `${stats.tasksMovedToBacklog} stale tasks moved to backlog`,
                  duration: 5000
                });
              }
            }
          );
        }
        
        setIsLoaded(true);
        
        return () => {
          unsubscribe();
          cancelScheduler();
          observer.disconnect();
        };
      } catch (error) {
        console.error('Error initializing store:', error);
        setIsLoaded(true);
        addNotification({
          type: 'error',
          title: 'Initialization Error',
          message: 'Failed to initialize app data: ' + error.message,
          duration: 0 
        });
      }
    };
    
    init();
  }, [backlogSchedulerActive]);

  useEffect(() => {
    if (isLoaded && currentTheme) {
      applyTheme(currentTheme);
    }
  }, [isLoaded, currentTheme]);

  useEffect(() => {
    if (isLoaded) {
      setTimeout(() => {
        console.log("Applying global theme fix...");
        
        document.querySelectorAll('.bg-gray-800, .bg-gray-850, .bg-gray-900, .workspace-card, .card-metallic')
          .forEach(el => {
            el.classList.add('theme-card');
          });
          
        document.querySelectorAll('.w-10.h-screen, .w-12.h-screen')
          .forEach(el => {
            el.classList.add('theme-sidebar');
          });
          
        document.querySelectorAll('input, textarea, select')
          .forEach(el => {
            el.classList.add('theme-input');
          });
          
        document.querySelectorAll('.bg-indigo-600')
          .forEach(el => {
            el.classList.add('theme-button-primary');
          });
          
        document.querySelectorAll('.text-white, .text-gray-300')
          .forEach(el => {
            el.classList.add('theme-text-primary');
          });
          
        document.querySelectorAll('.text-gray-400, .text-gray-500')
          .forEach(el => {
            el.classList.add('theme-text-secondary');
          });
      }, 100); 
    }
  }, [isLoaded, currentTheme]);

  useEffect(() => {
    if (achievements.length > 0) {
      localStorage.setItem('chalk-achievements', JSON.stringify(achievements));
    }
  }, [achievements]);

  const handleThemeChange = (theme) => {
    document.documentElement.classList.add('theme-transitioning');

    setCurrentTheme(theme);
    applyTheme(theme);
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);
  };

  const handleUnlock = () => {
    setAppLocked(false);
  };

  const refreshGroups = () => {
    setGroups(getGroups());
  };

  const handleShowSettings = () => {
    setCurrentView('settings');
  };

  const handleResetApp = () => {
    localStorage.clear();
    
    setGroups([]);
    setCurrentGroupId(null);
    setCurrentBoardId(null);
    setCurrentView('groups');
    setNotifications([]);
    setAchievements([]);
    
    addNotification({
      type: 'info',
      title: 'App Reset',
      message: 'All data has been cleared. Refreshing app...',
      duration: 3000
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };


  const handleCreateGroup = (name, description = '') => {
    createGroup(name, description);
  };

  const handleCreateBoard = (name, description = '') => {
    if (currentGroupId) {
      createBoard(currentGroupId, name, description);
    }
  };

  const handleCreateColumn = (name) => {
    if (currentBoardId) {
      createColumn(currentBoardId, name);
    }
  };

  const handleUpdateTask = (taskId, updates) => {
    updateTask(taskId, updates);
    
    if (updates.completed) {
      setTimeout(() => checkForNewAchievements(), 500);
    }
  };
  
  const handleDeleteTask = (taskId) => {
    deleteTask(taskId);
  };

  const handleDeleteGroup = (groupId) => {
    deleteGroup(groupId);
    refreshGroups();
    
    if (currentGroupId === groupId) {
      setCurrentGroupId(null);
      setCurrentBoardId(null);
      setCurrentView('groups');
    }
  };

  const handleCreateTask = (columnId, content) => {
    createTask(columnId, content);
    
    setTimeout(() => checkForNewAchievements(), 500);
  };

  const handleMoveTask = (taskId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex) => {
    moveTask(taskId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex);
  };

  const handleCreateWorkspaceItem = (boardId, type, content, metadata = {}) => {
    createWorkspaceItem(boardId, type, content, metadata);
    
    addNotification({
      type: 'success',
      title: 'Item Added',
      message: `New ${type} added to workspace`,
      icon: type === 'note' ? '📝' : type === 'link' ? '🔗' : '✅',
      duration: 3000
    });
  };
  
  const handleUpdateWorkspaceItem = (itemId, updates) => {
    updateWorkspaceItem(itemId, updates);
  };
  
  const handleDeleteWorkspaceItem = (itemId) => {
    deleteWorkspaceItem(itemId);
  };

  const getCurrentGroup = () => {
    return groups.find(group => group.id === currentGroupId);
  };

  const getCurrentBoards = () => {
    return currentGroupId ? getBoards(currentGroupId) : [];
  };

  const getCurrentBoard = () => {
    const boards = getCurrentBoards();
    return boards.find(board => board.id === currentBoardId);
  };

  const getCurrentColumns = () => {
    return currentBoardId ? getColumns(currentBoardId) : [];
  };

  const getCurrentWorkspaceItems = () => {
    return currentBoardId ? getWorkspaceItems(currentBoardId) : [];
  };

  const handleSelectGroup = (groupId) => {
    setCurrentGroupId(groupId);
    setCurrentBoardId(null);
    setCurrentView('boards');
  };

  const handleSelectBoard = (boardId) => {
    setCurrentBoardId(boardId);
    setCurrentView('board');
  };

  const handleShowDashboard = () => {
    setCurrentView('dashboard');
  };
  
  const handleShowAchievements = () => {
    setCurrentView('achievements');
  };
  
  const handleShowSearch = () => {
    setCurrentView('search');
  };
  
  const handleShowGraph = () => {
    setCurrentView('graph');
  };
  
  const handleTaskClick = (task) => {
    setCurrentGroupId(task.groupId);
    setCurrentBoardId(task.boardId);
    setCurrentView('board');
  };

  const handleBackToGroups = () => {
    setCurrentGroupId(null);
    setCurrentBoardId(null);
    setCurrentView('groups');
  };

  const handleShowBacklog = () => {
    setCurrentView('backlog');
  };  

  const handleBackToBoards = () => {
    setCurrentBoardId(null);
    setCurrentView('boards');
  };

  const checkForNewAchievements = () => {
    let tasksCreated = 0;
    let tasksCompleted = 0;
    let boardsCreated = 0;
    
    groups.forEach(group => {
      const boards = getBoards(group.id);
      boardsCreated += boards.length;
      
      boards.forEach(board => {
        const columns = getColumns(board.id);
        
        columns.forEach(column => {
          const tasks = getTasks(column.id);
          tasksCreated += tasks.length;
          
          tasks.forEach(task => {
            if (task.completed) {
              tasksCompleted++;
            }
          });
        });
      });
    });
    
    const possibleAchievements = [
      {
        id: 'first-task',
        title: 'First Steps',
        icon: '🌱',
        message: 'You created your first task',
        condition: tasksCreated >= 1
      },
      {
        id: 'first-completion',
        title: 'Mission Accomplished',
        icon: '✅',
        message: 'You completed your first task',
        condition: tasksCompleted >= 1
      },
      {
        id: 'task-master',
        title: 'Task Master',
        icon: '📝',
        message: 'You created 10 tasks',
        condition: tasksCreated >= 10
      },
      {
        id: 'getting-things-done',
        title: 'Getting Things Done',
        icon: '🚀',
        message: 'You completed 25 tasks',
        condition: tasksCompleted >= 25
      },
      {
        id: 'organizer',
        title: 'Organizer',
        icon: '📊',
        message: 'You created 3 boards',
        condition: boardsCreated >= 3
      }
    ];
    
    const achievementIds = achievements.map(a => a.id);
    const newAchievements = possibleAchievements.filter(
      achievement => achievement.condition && !achievementIds.includes(achievement.id)
    );
    
    if (newAchievements.length > 0) {
      setAchievements([...achievements, ...newAchievements]);
      
      newAchievements.forEach(achievement => {
        addNotification({
          id: `achievement-${achievement.id}`,
          type: 'achievement',
          title: achievement.title,
          message: achievement.message,
          icon: achievement.icon,
          duration: 7000
        });
      });
    }
  };
  
  const addNotification = (notification) => {
    const id = notification.id || `notification-${Date.now()}`;
    setNotifications(prevNotifications => [
      ...prevNotifications,
      { ...notification, id }
    ]);
  };
  
  const removeNotification = (id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex justify-center items-center w-full">
          <NeonLoader text="Initializing Chalk..." />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen flex app-container ${currentTheme}`}
    >
      {appLocked ? (
        <PasswordDialog onSuccess={handleUnlock} />
      ) : (
        <>
          <Sidebar 
            groups={groups}
            currentGroupId={currentGroupId}
            onSelectGroup={handleSelectGroup}
            onCreateGroup={handleCreateGroup}
            onDeleteGroup={handleDeleteGroup}
            currentTheme={currentTheme}  
            onThemeChange={handleThemeChange} 
            onShowDashboard={handleShowDashboard}
            onShowAchievements={handleShowAchievements}
            onShowSearch={handleShowSearch}
            onShowGraph={handleShowGraph}
            onShowSettings={handleShowSettings}
            onShowBacklog={handleShowBacklog}
          />
          
          <div className="flex-1 overflow-hidden flex flex-col">
            {currentView === 'groups' && (
              <PageTransition transitionKey="groups">
                <EnhancedGroupsView 
                  groups={groups} 
                  onSelectGroup={handleSelectGroup} 
                  onCreateGroup={handleCreateGroup}
                  onDeleteGroup={handleDeleteGroup}
                  getBoards={getBoards}
                  getColumns={getColumns}
                  getTasks={getTasks}
                />
              </PageTransition>
            )}
            {currentView === 'boards' && (
              <BoardsView 
                group={getCurrentGroup()} 
                boards={getCurrentBoards()} 
                onSelectBoard={handleSelectBoard} 
                onCreateBoard={handleCreateBoard} 
                onBack={handleBackToGroups}
              />
            )}
            
            {currentView === 'board' && (
              <BoardView 
                board={getCurrentBoard()} 
                columns={getCurrentColumns()} 
                getTasks={getTasks} 
                onCreateColumn={handleCreateColumn} 
                onCreateTask={handleCreateTask} 
                onMoveTask={handleMoveTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onBack={handleBackToBoards}
                workspaceItems={getCurrentWorkspaceItems()}
                onCreateWorkspaceItem={(type, content, metadata) => handleCreateWorkspaceItem(currentBoardId, type, content, metadata)}
                onUpdateWorkspaceItem={handleUpdateWorkspaceItem}
                onDeleteWorkspaceItem={handleDeleteWorkspaceItem}
              />
            )}
  
            {currentView === 'dashboard' && (
              <DashboardView
                groups={groups}
                getBoards={getBoards}
                getColumns={getColumns}
                getTasks={getTasks}
                currentGroupId={currentGroupId}
                onSelectBoard={handleSelectBoard}
                onBack={handleBackToGroups}
              />
            )}
            
            {currentView === 'achievements' && (
              <AchievementsView
                groups={groups}
                getBoards={getBoards}
                getColumns={getColumns}
                getTasks={getTasks}
                onBack={handleBackToGroups}
                earnedAchievements={achievements}
              />
            )}
            
            {currentView === 'settings' && (
              <SettingsView
                onBack={handleBackToGroups}
                onThemeChange={handleThemeChange}
                isDarkMode={currentTheme === THEMES.DARK}
                onResetApp={handleResetApp}
              />
            )}
  
            {currentView === 'search' && (
              <SearchTasksView
                groups={groups}
                getBoards={getBoards}
                getColumns={getColumns}
                getTasks={getTasks}
                onBack={handleBackToGroups}
                onTaskClick={handleTaskClick}
              />
            )}

            {currentView === 'backlog' && (
              <BacklogView 
                groups={groups}
                getBoards={getBoards}
                getColumns={getColumns}
                getTasks={getTasks}
                onMoveTask={handleMoveTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onBack={handleBackToGroups}
                onSelectTask={handleTaskClick}
              />
            )}
            
            {currentView === 'graph' && (
              <GraphView
                groups={groups}
                getBoards={getBoards}
                getColumns={getColumns}
                getTasks={getTasks}
                onSelectTask={handleTaskClick}
                onSelectBoard={handleSelectBoard}
                onBack={handleBackToGroups}
              />
            )}
          </div>
          <NotificationSystem 
            notifications={notifications}
            onDismiss={removeNotification}
          />
        </>
      )}
    </div>
  );
};

export default App;