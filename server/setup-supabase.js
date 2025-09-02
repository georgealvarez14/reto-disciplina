require('dotenv').config();
const { query } = require('./src/database/connection');

const setupSupabase = async () => {
  try {
    console.log('🔧 Configurando base de datos en Supabase...');
    
    // Test connection first
    const testResult = await query('SELECT NOW() as current_time');
    console.log('✅ Conexión exitosa a Supabase:', testResult.rows[0].current_time);

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        currency VARCHAR(10) DEFAULT 'COP',
        risk_profile VARCHAR(20) DEFAULT 'balanceado',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create bankrolls table
    await query(`
      CREATE TABLE IF NOT EXISTS bankrolls (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        start_amount DECIMAL(15,2) NOT NULL,
        current_amount DECIMAL(15,2) NOT NULL,
        unit_size_pct DECIMAL(5,4) DEFAULT 0.02,
        strategy VARCHAR(20) DEFAULT 'flat',
        stoploss_daily DECIMAL(15,2),
        stopwin_daily DECIMAL(15,2),
        stoploss_weekly DECIMAL(15,2),
        stopwin_weekly DECIMAL(15,2),
        max_daily_bets INTEGER DEFAULT 10,
        max_odds_allowed DECIMAL(5,2) DEFAULT 5.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create wagers table
    await query(`
      CREATE TABLE IF NOT EXISTS wagers (
        id SERIAL PRIMARY KEY,
        bankroll_id INTEGER REFERENCES bankrolls(id) ON DELETE CASCADE,
        sport VARCHAR(50),
        league VARCHAR(100),
        event VARCHAR(200),
        market VARCHAR(100),
        selection VARCHAR(200),
        odds_decimal DECIMAL(8,2) NOT NULL,
        stake_cop DECIMAL(15,2) NOT NULL,
        stake_units DECIMAL(8,2) NOT NULL,
        book VARCHAR(100),
        placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pendiente',
        result VARCHAR(20),
        payout_cop DECIMAL(15,2),
        notes TEXT,
        is_live BOOLEAN DEFAULT FALSE,
        closing_odds DECIMAL(8,2),
        implied_prob DECIMAL(8,6),
        ev_expected DECIMAL(8,6),
        tag_list TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tablas creadas exitosamente en Supabase');
    console.log('📊 Tablas: users, bankrolls, wagers');

  } catch (error) {
    console.error('❌ Error configurando Supabase:', error);
    throw error;
  }
};

// Run setup
setupSupabase()
  .then(() => {
    console.log('🎉 Configuración de Supabase completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en configuración:', error);
    process.exit(1);
  });
