import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  // Do not log secrets (DATABASE_URL, JWT_SECRET, TELEGRAM_BOT_TOKEN).
  console.log(`slotty-backend listening on port ${env.PORT}`);
});
