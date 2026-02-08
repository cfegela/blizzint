const app = require('./app');
const env = require('./config/env');
const db = require('./config/database');

const PORT = env.port;

// Run migrations on startup in production
async function runMigrations() {
  if (env.nodeEnv === 'production') {
    try {
      console.log('🔄 Running database migrations...');
      await db.migrate.latest();
      console.log('✅ Migrations completed successfully');

      // Enable PostGIS extension
      await db.raw('CREATE EXTENSION IF NOT EXISTS postgis;');
      console.log('✅ PostGIS extension enabled');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }
}

// Start server
async function startServer() {
  try {
    await runMigrations();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🏔️  BlizzInt API server is running on port ${PORT}`);
      console.log(`📍 Environment: ${env.nodeEnv}`);
      console.log(`🗄️  Database: ${env.database.name}@${env.database.host}:${env.database.port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
