// src/components/NeonLoader.js
import React from 'react';

const NeonLoader = ({ text = "Loading..." }) => {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-90 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-t-indigo-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
          
          <div className="absolute inset-0 w-16 h-16 border-4 border-t-indigo-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin blur-md opacity-70"></div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-indigo-500 rounded-full animate-pulse opacity-50"></div>
          </div>
        </div>
        
        <div className="mt-6 text-gray-300 font-medium relative">
          <span className="relative z-10">{text}</span>
          <span className="absolute inset-0 blur-sm text-indigo-400 z-0">{text}</span>
        </div>
        
        <div className="w-48 h-1 bg-gray-800 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-loadingBar"></div>
        </div>
      </div>
    </div>
  );
};

const loadingStyles = `
@keyframes loadingBar {
  0% { width: 0%; transform: translateX(-100%); }
  50% { width: 70%; }
  100% { width: 100%; transform: translateX(100%); }
}

.animate-loadingBar {
  animation: loadingBar 2s ease-in-out infinite;
}
`;

if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = loadingStyles;
  document.head.appendChild(styleElement);
}

export default NeonLoader;