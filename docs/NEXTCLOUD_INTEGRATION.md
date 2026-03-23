# Nextcloud Integration

This document describes the Nextcloud integration feature for baseline.

## Overview

Nextcloud integration allows users to:
1. Sign in with their Nextcloud account
2. Sync journal entries, mood data, and settings to their own Nextcloud server
3. Self-host their data for complete privacy control

## Features

### 1. Nextcloud Authentication

Users can sign in using their Nextcloud account as an alternative to Google and Apple sign-in. This supports:
- Self-hosted Nextcloud servers
- Nextcloud.com accounts
- OAuth2 authentication flow

### 2. Data Synchronization

All baseline data is synchronized to the user's Nextcloud server:
- Journal entries → `/baseline/journals/`
- Mood data → `/baseline/mood/`
- Settings → `/baseline/settings.json`

### 3. Self-Hosting

Users can host their own Nextcloud server for complete control over their data. No data is stored on baseline's servers for Nextcloud users (except for minimal authentication metadata).

## Setup Instructions

### For Users

#### Using a Public Nextcloud Instance

1. Create an account at [Nextcloud.com](https://nextcloud.com/signup/) or any public Nextcloud instance
2. In baseline, click "Sign in with Nextcloud"
3. Enter the Nextcloud server URL (e.g., `https://cloud.nextcloud.com`)
4. Authorize the application
5. Start journaling!

#### Using a Self-Hosted Nextcloud Server

1. Set up your own Nextcloud server (see [Nextcloud installation guide](https://docs.nextcloud.com/server/latest/admin_manual/installation/))
2. Install the OAuth2 app on your Nextcloud server:
   - Go to Apps → Security & setup → OAuth 2.0
   - Click "Enable"
3. Create an OAuth2 client:
   - Go to Settings → Security → OAuth 2.0
   - Click "Add client"
   - Name: `baseline`
   - Redirect URI: `https://your-baseline-app.com/auth/nextcloud/callback`
   - Note the Client ID
4. In baseline, click "Sign in with Nextcloud"
5. Enter your Nextcloud server URL
6. Optionally enter the Client ID if you created one
7. Authorize and start using!

### For Developers

#### Backend Configuration

To enable Nextcloud authentication in your baseline instance:

1. Configure Firebase Custom Authentication:
   ```javascript
   // In Firebase Console, enable custom authentication
   // Create a service account for token signing
   ```

2. Set up environment variables:
   ```bash
   export NEXTCLOUD_OAUTH_CLIENT_ID="your-client-id"
   export NEXTCLOUD_OAUTH_CLIENT_SECRET="your-client-secret" # optional
   ```

3. The backend will handle Nextcloud OAuth token exchange automatically

#### OAuth Callback Setup

The OAuth callback URL must be accessible:
- Development: `http://localhost:3000/auth/nextcloud/callback`
- Production: `https://your-domain.com/auth/nextcloud/callback`

This callback file is located at `public/auth/nextcloud/callback.html`.

## Data Storage Architecture

### For Non-Nextcloud Users
- Google users: Data stored in Google Drive appDataFolder
- Apple users: Data stored in iCloud via CloudKit
- Anonymous users: Data stored locally only (lost on sign out)

### For Nextcloud Users
- Data stored in user's Nextcloud instance via WebDAV
- Minimal metadata in Firebase (for authentication)
- Full user control over data location and retention

### Data Structure in Nextcloud

```
/baseline/
├── journals/
│   ├── journal_1234567890.json
│   ├── journal_1234567891.json
│   └── ...
├── mood/
│   └── mood_data.json
└── settings.json
```

## Security Considerations

1. **End-to-End Encryption**: All data is encrypted before being sent to Nextcloud
2. **OAuth Tokens**: Access tokens are stored securely using Capacitor Preferences
3. **State Verification**: OAuth flow includes state parameter to prevent CSRF attacks
4. **Self-Hosting**: Users have full control over their data location

## Troubleshooting

### "Popup blocked" error
- Allow popups for the baseline app domain
- Or use the redirect-based authentication (automatically falls back)

### "Invalid state returned" error
- Clear browser cache and cookies
- Ensure the Nextcloud server's clock is synchronized

### "OAuth2 client not found" error
- Verify the Client ID is correct
- Ensure the OAuth2 app is enabled on Nextcloud
- Check that the redirect URI matches exactly

### Data not syncing
- Check Nextcloud server logs
- Verify user has sufficient storage quota
- Ensure WebDAV is enabled on Nextcloud

## API Reference

### NextcloudService

```typescript
import { 
    getNextcloudAuthUrl,
    exchangeNextcloudCode,
    NextcloudStorage,
    syncToNextcloud,
    loadFromNextcloud
} from './nextcloud';

// Get OAuth authorization URL
const authUrl = getNextcloudAuthUrl(config, redirectUri, state);

// Exchange code for token
const token = await exchangeNextcloudCode(config, code, redirectUri);

// Create storage instance
const storage = new NextcloudStorage(token);

// Sync data
await syncToNextcloud(storage, {
    journals: [...],
    mood: [...],
    settings: {...}
});

// Load data
const data = await loadFromNextcloud(storage);
```

## Future Improvements

1. **Two-way sync**: Real-time synchronization between devices
2. **Offline support**: Queue changes when offline, sync when connected
3. **Selective sync**: Choose which data to sync
4. **Backup/restore**: Export all data from Nextcloud
5. **Sharing**: Share journal entries with other Nextcloud users

## Contributing

To contribute to Nextcloud integration:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for more details.

## License

This integration is part of baseline and is licensed under AGPL-3.0.