import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: "https://ba3d301819cc4156a04140fafa457db3@o4504179120472064.ingest.sentry.io/4504348686286848",
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
  release: "development",
  environment: "development"
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);