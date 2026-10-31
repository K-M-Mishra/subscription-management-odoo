import app from './app.js';
import { config } from './config.js';
import { seed } from './seed.js';
import { runBilling } from './domain.js';
import { db } from './db.js';
await seed();
const server = app.listen(config.port, () =>
  console.log(`Brightloop API: http://localhost:${config.port}/api/v1`),
);
const bill = () => {
  try {
    const r = runBilling();
    if (r.created) console.log(r.message);
  } catch (e) {
    console.error('Billing failed:', e.message);
  }
};
if (process.env.DISABLE_SCHEDULER !== '1') {
  bill();
  const timer = setInterval(bill, 60000);
  timer.unref();
}
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
