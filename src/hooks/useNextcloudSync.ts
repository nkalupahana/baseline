import { useState, useEffect, useCallback } from 'react';
import { 
    NextcloudToken,
    getNextcloudToken, 
    NextcloudStorage, 
    syncToNextcloud, 
    loadFromNextcloud
} from '../nextcloud';
import ldb from '../db';

interface UseNextcloudSyncOptions {
    autoSync?: boolean;
    syncInterval?: number; // in milliseconds
}

interface NextcloudSyncStatus {
    isConfigured: boolean;
    isSyncing: boolean;
    lastSyncTime: Date | null;
    error: string | null;
}

export function useNextcloudSync(options: UseNextcloudSyncOptions = {}) {
    const { autoSync = true, syncInterval = 5 * 60 * 1000 } = options; // default 5 minutes

    const [status, setStatus] = useState<NextcloudSyncStatus>({
        isConfigured: false,
        isSyncing: false,
        lastSyncTime: null,
        error: null
    });

    const [token, setToken] = useState<NextcloudToken | null>(null);

    // Check if Nextcloud is configured on mount
    useEffect(() => {
        const checkConfig = async () => {
            const savedToken = await getNextcloudToken();
            if (savedToken) {
                setToken(savedToken);
                setStatus(prev => ({
                    ...prev,
                    isConfigured: true,
                    lastSyncTime: localStorage.getItem('nextcloud_last_sync') 
                        ? new Date(localStorage.getItem('nextcloud_last_sync')!)
                        : null
                }));
            }
        };
        checkConfig();
    }, []);

    // Sync data to Nextcloud
    const sync = useCallback(async (): Promise<void> => {
        if (!token || status.isSyncing) return;

        setStatus(prev => ({ ...prev, isSyncing: true, error: null }));

        try {
            const storage = new NextcloudStorage(token);

            // Get all local data
            const logs = await ldb.logs.toArray();
            const settings = localStorage.getItem('settings');
            const keys = localStorage.getItem('keys');

            // Sync to Nextcloud
            await syncToNextcloud(storage, {
                journals: logs,
                mood: logs.filter(log => log.mood).map(log => ({
                    timestamp: log.timestamp,
                    mood: log.mood,
                    date: log.time
                })),
                settings: settings ? JSON.parse(settings) : {}
            });

            // Save last sync time
            const now = new Date();
            localStorage.setItem('nextcloud_last_sync', now.toISOString());
            setStatus(prev => ({
                ...prev,
                isSyncing: false,
                lastSyncTime: now
            }));

            console.log('Nextcloud sync completed successfully');
        } catch (error: any) {
            console.error('Nextcloud sync failed:', error);
            setStatus(prev => ({
                ...prev,
                isSyncing: false,
                error: error.message || 'Sync failed'
            }));
        }
    }, [token, status.isSyncing]);

    // Load data from Nextcloud
    const loadFromCloud = useCallback(async (): Promise<{
        journals: any[];
        mood: any[];
        settings: any;
    } | null> => {
        if (!token) return null;

        try {
            const storage = new NextcloudStorage(token);
            const data = await loadFromNextcloud(storage);
            
            if (data) {
                // Import journals to local DB
                if (data.journals && data.journals.length > 0) {
                    await ldb.logs.bulkPut(data.journals);
                }

                // Import settings
                if (data.settings) {
                    localStorage.setItem('settings', JSON.stringify(data.settings));
                }

                console.log('Data loaded from Nextcloud successfully');
            }

            return data;
        } catch (error: any) {
            console.error('Failed to load from Nextcloud:', error);
            setStatus(prev => ({
                ...prev,
                error: error.message || 'Failed to load data'
            }));
            return null;
        }
    }, [token]);

    // Auto-sync on interval
    useEffect(() => {
        if (!autoSync || !token) return;

        const interval = setInterval(sync, syncInterval);
        return () => clearInterval(interval);
    }, [autoSync, token, syncInterval, sync]);

    // Sync on page unload
    useEffect(() => {
        if (!token) return;

        const handleBeforeUnload = () => {
            // Use navigator.sendBeacon for reliable sync on page close
            // This is a best-effort sync
            if (navigator.sendBeacon && token) {
                // In a real implementation, you'd serialize the sync data
                // and send it to a sync endpoint
                console.log('Attempting sync before page unload');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [token]);

    return {
        ...status,
        sync,
        loadFromCloud,
        isNextcloudUser: !!token
    };
}

// Export as default for convenience
export default useNextcloudSync;