const app = require('./app');
const env = require('./config/env');

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`🏔️  BlizzInt API server is running on port ${PORT}`);
  console.log(`📍 Environment: ${env.nodeEnv}`);
  console.log(`🗄️  Database: ${env.database.name}@${env.database.host}:${env.database.port}`);
});
