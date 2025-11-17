import { buildApp } from "./index.js";

async function startServer() {
    const app = await buildApp();
try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
startServer();