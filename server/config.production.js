// Configuración de producción para Railway
module.exports = {
  NODE_ENV: 'production',
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:5S_4pWas%23u278pP@db.tahtygppftvitmxnhnbb.supabase.co:5432/postgres',
  JWT_SECRET: process.env.JWT_SECRET || 'reto-disciplina-jwt-secret-key-2025-production',
  CLIENT_URL: process.env.CLIENT_URL || 'https://reto-disciplina.vercel.app',
  RATE_LIMIT_WINDOW_MS: 900000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  BCRYPT_SALT_ROUNDS: 12,
  LOG_LEVEL: 'info',
  EXPORT_MAX_RECORDS: 10000
};
