import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { initRuntimeApiConfig } from './shared/api/runtimeApiConfig';
import { ensureFreshTelegramWebAppBuild } from './shared/lib/telegramBuildRefresh';
import { clearStaleTelegramLaunchParams } from './shared/lib/telegramEnv';
import { initAnalytics } from './shared/analytics/analyticsAdapter';
import { initSentryBrowser } from './shared/lib/sentry';
import './app/styles/index.css';

initSentryBrowser();
initAnalytics();
clearStaleTelegramLaunchParams();
ensureFreshTelegramWebAppBuild(__SLOTTY_BUILD_ID__);

async function bootstrap() {
  await initRuntimeApiConfig();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
