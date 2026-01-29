'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface InitStatus {
  status: 'checking' | 'initializing' | 'success' | 'error';
  message: string;
  details?: string;
}

export function DatabaseInitializer() {
  const [initStatus, setInitStatus] = useState<InitStatus>({
    status: 'checking',
    message: 'Checking database status...',
  });

  useEffect(() => {
    const initializeDB = async () => {
      try {
        // First check system status
        setInitStatus({ status: 'checking', message: 'Checking system status...' });
        const statusResponse = await fetch('/api/system/status');
        const statusData = await statusResponse.json();

        if (!statusData.initialized) {
          // Initialize database
          setInitStatus({ status: 'initializing', message: 'Initializing database...' });
          
          const initResponse = await fetch('/api/install/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!initResponse.ok) {
            throw new Error('Failed to initialize database');
          }

          const initData = await initResponse.json();
          
          if (!initData.success) {
            throw new Error(initData.error || 'Initialization failed');
          }

          setInitStatus({
            status: 'success',
            message: 'Database initialized successfully',
            details: `Created ${initData.tablesCreated} tables, Admin user created`,
          });
        } else {
          setInitStatus({
            status: 'success',
            message: 'Database is ready',
            details: `Admin exists: ${statusData.adminExists}, Users: ${statusData.userCount}`,
          });
        }
      } catch (error) {
        console.error('[v0] Database initialization error:', error);
        setInitStatus({
          status: 'error',
          message: 'Database initialization failed',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    };

    initializeDB();
  }, []);

  if (initStatus.status === 'success') {
    return (
      <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm max-w-md">
        <div className="flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">{initStatus.message}</h3>
            {initStatus.details && (
              <p className="text-sm text-green-700 mt-1">{initStatus.details}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (initStatus.status === 'error') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm max-w-md">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">{initStatus.message}</h3>
            {initStatus.details && (
              <p className="text-sm text-red-700 mt-1">{initStatus.details}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm max-w-md">
      <div className="flex gap-3">
        <Loader className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-blue-900">{initStatus.message}</h3>
          {initStatus.details && (
            <p className="text-sm text-blue-700 mt-1">{initStatus.details}</p>
          )}
        </div>
      </div>
    </div>
  );
}
