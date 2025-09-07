import React, { useState, useEffect } from 'react';
import { getStorageStatus, clearDatabase } from '../data/store';

const StorageWarning = () => {
  const [status, setStatus] = useState({ isMemoryMode: false });

  useEffect(() => {
    const checkStatus = () => setStatus(getStorageStatus());
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!status.isMemoryMode) 
    return null;

  return (
    <div className="bg-orange-100 border-l-4 border-orange-400 p-4 mb-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-orange-700 font-medium">Temporary Mode</p>
          <p className="text-orange-600 text-sm">Changes won't be saved. Storage issue detected.</p>
        </div>
        <button
          onClick={async () => {
            if (confirm('Clear all data and restart? This cannot be undone.')) {
              await clearDatabase();
            }
          }}
          className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
        >
          Fix Storage
        </button>
      </div>
    </div>
  );
};

export default StorageWarning; 