# baseline
[![DeepScan grade](https://deepscan.io/api/teams/15815/projects/20905/branches/583898/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=15815&pid=20905&bid=583898)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/nkalupahana/baseline.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/nkalupahana/baseline/context:javascript)
[![CodeFactor](https://www.codefactor.io/repository/github/nkalupahana/baseline/badge)](https://www.codefactor.io/repository/github/nkalupahana/baseline)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fnkalupahana%2Fmoody.svg?type=small)](https://app.fossa.com/projects/git%2Bgithub.com%2Fnkalupahana%2Fmoody?ref=badge_small)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=baseline&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=baseline)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)

A better, universal, journaling and mood tracking platform.

## Contribute

```
npm install
npm install -g @ionic/cli
ionic serve # Web development server
ionic cap sync # Sync changes for iOS/Android
ionic cap open [ios|android] # Open iOS/Android project for development
```

### Project Overview
- `android/` - Android project for baseline (open in Android Studio)
- `cypress/` - Cypress E2E and Component test suite (run with npm test commands in `package.json`)
- `docs/` - Jekyll site for `getbaseline.app` (run with `bundle exec jekyll serve`)
- `empty/` - Empty directory for `link.getbaseline.app` to deploy off of
- `functions/` - Source for Google Cloud Functions (deploy with `firebase deploy --only functions`)
- `helpers/` - Helper scripts for baseline development
- `ios/` - iOS project for baseline (open in Xcode)
- `public/` - static files for baseline React app
- `src/` - baseline React app source 