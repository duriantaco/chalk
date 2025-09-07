// src/components/NotificationSystem.js
import React, { useState, useEffect } from 'react';

const NotificationSystem = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm">
      {notifications.map(notification => (
        <Notification 
          key={notification.id} 
          notification={notification} 
          onDismiss={() => onDismiss(notification.id)} 
        />
      ))}
    </div>
  );
};

const Notification = ({ notification, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onDismiss();
      }, 300);
    }, notification.duration || 5000);

    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  let bgColor = 'bg-gray-800';
  let borderColor = 'border-gray-600';
  let iconBg = 'bg-gray-700';
  
  switch (notification.type) {
    case 'achievement':
      bgColor = 'bg-amber-900/90';
      borderColor = 'border-amber-600';
      iconBg = 'bg-amber-700';
      break;
      
    case 'success':
      bgColor = 'bg-emerald-900/90';
      borderColor = 'border-emerald-600';
      iconBg = 'bg-emerald-700';
      break;

    case 'error':
      bgColor = 'bg-red-900/90';
      borderColor = 'border-red-600';
      iconBg = 'bg-red-700';
      break;

    case 'info':
      bgColor = 'bg-indigo-900/90';
      borderColor = 'border-indigo-600';
      iconBg = 'bg-indigo-700';
      break;

    default:
      break;
  }
  
  return (
    <div 
      className={`${bgColor} border ${borderColor} rounded-lg shadow-lg p-4 transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className="flex items-start">
        {notification.icon && (
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${iconBg} flex items-center justify-center mr-3`}>
            <span className="text-xl">{notification.icon}</span>
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="text-white font-medium">{notification.title}</h3>
          <p className="text-gray-300 text-sm">{notification.message}</p>
          
          {notification.type === 'achievement' && (
            <div className="mt-2 text-amber-300 text-xs font-medium uppercase tracking-wider">
              New Achievement Unlocked!
            </div>
          )}
        </div>
        
        <button 
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => {
              onDismiss();
            }, 300);
          }}
          className="ml-4 text-gray-400 hover:text-white"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NotificationSystem;