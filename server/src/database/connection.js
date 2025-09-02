const { Pool } = require('pg');

// Configuración de la base de datos usando DATABASE_URL
let pool;

if (process.env.DATABASE_URL) {
  // Usar DATABASE_URL para Supabase/Producción
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Necesario para Supabase
    },
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} else {
  // Fallback para desarrollo local
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'reto_disciplina',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

// Test the connection
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el cliente PostgreSQL', err);
  process.exit(-1);
});

// Helper function to run queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query ejecutada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Error en query:', { text, error: error.message });
    throw error;
  }
};

// Helper function to get a single row
const getRow = async (text, params) => {
  const result = await query(text, params);
  return result.rows[0];
};

// Helper function to get multiple rows
const getRows = async (text, params) => {
  const result = await query(text, params);
  return result.rows;
};

module.exports = {
  query,
  getRow,
  getRows,
  pool
};
