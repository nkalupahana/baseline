import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Nextcloud OAuth Configuration
export interface NextcloudConfig {
    serverUrl: string;  // User's Nextcloud server URL (for self-hosting)
    clientId: string;
    clientSecret?: string;
}

// Default Nextcloud instance for users without self-hosting
export const DEFAULT_NEXTCLOUD_SERVER = 'https://nextcloud.com';

// Nextcloud OAuth endpoints
export const getNextcloudAuthUrl = (config: NextcloudConfig, redirectUri: string, state: string): string => {
    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email files',
        state: state
    });
    
    return `${config.serverUrl}/apps/oauth2/authorize?${params.toString()}`;
};

// Nextcloud token response
export interface NextcloudToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    user_id: string;
    server_url: string;
}

// Store Nextcloud credentials
export const storeNextcloudToken = async (token: NextcloudToken): Promise<void> => {
    await Preferences.set({
        key: 'nextcloud_token',
        value: JSON.stringify(token)
    });
};

// Get stored Nextcloud credentials
export const getNextcloudToken = async (): Promise<NextcloudToken | null> => {
    try {
        const { value } = await Preferences.get({ key: 'nextcloud_token' });
        return value ? JSON.parse(value) : null;
    } catch {
        // Fallback to localStorage for web platform
        const value = localStorage.getItem('nextcloud_token');
        return value ? JSON.parse(value) : null;
    }
};

// Clear Nextcloud credentials
export const clearNextcloudToken = async (): Promise<void> => {
    await Preferences.remove({ key: 'nextcloud_token' });
};

// Exchange authorization code for access token
export const exchangeNextcloudCode = async (
    config: NextcloudConfig,
    code: string,
    redirectUri: string
): Promise<NextcloudToken> => {
    const response = await fetch(`${config.serverUrl}/apps/oauth2/api/v1/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            client_id: config.clientId,
            ...(config.clientSecret && { client_secret: config.clientSecret })
        }).toString()
    });

    if (!response.ok) {
        throw new Error(`Failed to exchange Nextcloud code: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        user_id: data.user_id,
        server_url: config.serverUrl
    };
};

// Refresh Nextcloud access token
export const refreshNextcloudToken = async (
    config: NextcloudConfig,
    refreshToken: string
): Promise<NextcloudToken> => {
    const response = await fetch(`${config.serverUrl}/apps/oauth2/api/v1/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: config.clientId,
            ...(config.clientSecret && { client_secret: config.clientSecret })
        }).toString()
    });

    if (!response.ok) {
        throw new Error(`Failed to refresh Nextcloud token: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        user_id: data.user_id,
        server_url: config.serverUrl
    };
};

// Get Nextcloud user info
export const getNextcloudUserInfo = async (token: NextcloudToken): Promise<{
    id: string;
    displayName: string;
    email: string;
}> => {
    const response = await fetch(`${token.server_url}/ocs/v2.php/cloud/user`, {
        headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'OCS-APIRequest': 'true'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to get Nextcloud user info: ${response.statusText}`);
    }

    const data = await response.json();
    return {
        id: data.ocs.data.id,
        displayName: data.ocs.data.displayname,
        email: data.ocs.data.email
    };
};

// Nextcloud WebDAV operations for data storage
export class NextcloudStorage {
    private serverUrl: string;
    private accessToken: string;

    constructor(token: NextcloudToken) {
        this.serverUrl = token.server_url;
        this.accessToken = token.access_token;
    }

    // Create directory in Nextcloud
    async createDirectory(path: string): Promise<void> {
        const response = await fetch(
            `${this.serverUrl}/remote.php/dav/files/${path}`,
            {
                method: 'MKCOL',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );

        if (!response.ok && response.status !== 405) { // 405 = directory already exists
            throw new Error(`Failed to create directory: ${response.statusText}`);
        }
    }

    // Upload file to Nextcloud
    async uploadFile(path: string, content: string | ArrayBuffer): Promise<void> {
        const response = await fetch(
            `${this.serverUrl}/remote.php/dav/files/${path}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: content
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to upload file: ${response.statusText}`);
        }
    }

    // Download file from Nextcloud
    async downloadFile(path: string): Promise<string | ArrayBuffer> {
        const response = await fetch(
            `${this.serverUrl}/remote.php/dav/files/${path}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }

        return response.text();
    }

    // Delete file from Nextcloud
    async deleteFile(path: string): Promise<void> {
        const response = await fetch(
            `${this.serverUrl}/remote.php/dav/files/${path}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to delete file: ${response.statusText}`);
        }
    }

    // List files in Nextcloud directory
    async listFiles(path: string): Promise<string[]> {
        const response = await fetch(
            `${this.serverUrl}/remote.php/dav/files/${path}`,
            {
                method: 'PROPFIND',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Depth': '1'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to list files: ${response.statusText}`);
        }

        // Parse WebDAV XML response
        const text = await response.text();
        // Simple extraction of filenames from response
        const matches = text.match(/<d:href>([^<]+)<\/d:href>/g);
        return matches ? matches.map(m => m.replace(/<d:href>|<\/d:href>/g, '')) : [];
    }
}

// Baseline data path in Nextcloud
export const BASELINE_DATA_PATH = 'baseline';

// Sync journal entries to Nextcloud
export const syncToNextcloud = async (
    storage: NextcloudStorage,
    data: {
        journals: any[];
        mood: any[];
        settings: any;
    }
): Promise<void> => {
    // Create baseline directory structure
    await storage.createDirectory(BASELINE_DATA_PATH);
    await storage.createDirectory(`${BASELINE_DATA_PATH}/journals`);
    await storage.createDirectory(`${BASELINE_DATA_PATH}/mood`);
    
    // Sync journals
    for (const journal of data.journals) {
        const filename = `journal_${journal.timestamp}.json`;
        await storage.uploadFile(
            `${BASELINE_DATA_PATH}/journals/${filename}`,
            JSON.stringify(journal)
        );
    }
    
    // Sync mood data
    await storage.uploadFile(
        `${BASELINE_DATA_PATH}/mood/mood_data.json`,
        JSON.stringify(data.mood)
    );
    
    // Sync settings
    await storage.uploadFile(
        `${BASELINE_DATA_PATH}/settings.json`,
        JSON.stringify(data.settings)
    );
};

// Load data from Nextcloud
export const loadFromNextcloud = async (
    storage: NextcloudStorage
): Promise<{
    journals: any[];
    mood: any[];
    settings: any;
} | null> => {
    try {
        // Load settings
        const settingsData = await storage.downloadFile(`${BASELINE_DATA_PATH}/settings.json`);
        const settings = JSON.parse(settingsData as string);
        
        // Load mood data
        const moodData = await storage.downloadFile(`${BASELINE_DATA_PATH}/mood/mood_data.json`);
        const mood = JSON.parse(moodData as string);
        
        // Load journals
        const journalFiles = await storage.listFiles(`${BASELINE_DATA_PATH}/journals`);
        const journals: any[] = [];
        
        for (const file of journalFiles) {
            if (file.endsWith('.json')) {
                const journalData = await storage.downloadFile(file);
                journals.push(JSON.parse(journalData as string));
            }
        }
        
        return { journals, mood, settings };
    } catch (e) {
        console.error('Failed to load from Nextcloud:', e);
        return null;
    }
};