# baseline
[![DeepScan grade](https://deepscan.io/api/teams/15815/projects/20905/branches/583898/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=15815&pid=20905&bid=583898)
[![CodeFactor](https://www.codefactor.io/repository/github/nkalupahana/baseline/badge)](https://www.codefactor.io/repository/github/nkalupahana/baseline)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=baseline&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=baseline)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)

A better, universal, journaling and mood tracking platform.

## Features

- **Multiple Sign-In Options**: Apple, Google, and Nextcloud authentication
- **Nextcloud Integration**: Sync your data to your own Nextcloud server for complete privacy control
- **Self-Hosting**: Users can self-host their data on their own infrastructure
- **Cross-Platform**: Works on web, iOS, and Android
- **End-to-End Encryption**: Your data is encrypted before it leaves your device

## Nextcloud Integration

baseline now supports Nextcloud integration, allowing users to:

1. **Sign in with Nextcloud**: Use your Nextcloud account as an authentication provider
2. **Self-host your data**: Store all your journals and mood data on your own Nextcloud server
3. **Privacy first**: Complete control over where your data is stored

See [docs/NEXTCLOUD_INTEGRATION.md](docs/NEXTCLOUD_INTEGRATION.md) for detailed setup instructions.

## Contribute

```
npm install
npm install -g @ionic/cli
npm start  # Web development server
ionic cap sync # Sync changes for iOS/Android
ionic cap open [ios|android] # Open iOS/Android project for development
```

### Project Overview
- `android/` - Android project for baseline (open in Android Studio)
- `cypress/` - Cypress E2E and Component test suite (run with npm test commands in `package.json`)
- `docs/` - Jekyll site for `getbaseline.app` (run with `bundle exec jekyll serve`) and documentation
- `empty/` - Empty directory for `link.getbaseline.app` to deploy off of
- `backend/` - Source for baseline backend API
- `scheduled-services/` - Source for baseline internal services (scheduled or asynchronous from other services)
- `helpers/` - Helper scripts for baseline development
- `ios/` - iOS project for baseline (open in Xcode)
- `public/` - static files for baseline React app
- `src/` - baseline React app source
- `patches/` - Patches for baseline dependencies
