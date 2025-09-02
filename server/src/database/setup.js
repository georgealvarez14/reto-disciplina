require('dotenv').config();
const { query } = require('./connection');

const createTables = async () => {
  try {
    console.log('🔧 Configurando base de datos...');

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

    // Create limits table
    await query(`
      CREATE TABLE IF NOT EXISTS limits (
        id SERIAL PRIMARY KEY,
        bankroll_id INTEGER REFERENCES bankrolls(id) ON DELETE CASCADE,
        daily_max_bets INTEGER DEFAULT 10,
        max_odds_allowed DECIMAL(5,2) DEFAULT 5.00,
        cooldown_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        picks_count INTEGER DEFAULT 0,
        pnl_cop DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create alerts table
    await query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        level VARCHAR(20) DEFAULT 'info',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        acknowledged_at TIMESTAMP
      )
    `);

    // Create simulations table
    await query(`
      CREATE TABLE IF NOT EXISTS simulations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        params_json JSONB NOT NULL,
        result_json JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_wagers_bankroll_id ON wagers(bankroll_id);
      CREATE INDEX IF NOT EXISTS idx_wagers_placed_at ON wagers(placed_at);
      CREATE INDEX IF NOT EXISTS idx_wagers_status ON wagers(status);
      CREATE INDEX IF NOT EXISTS idx_bankrolls_user_id ON bankrolls(user_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    `);

    // Create function to update updated_at timestamp
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for updated_at
    await query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_bankrolls_updated_at ON bankrolls;
      CREATE TRIGGER update_bankrolls_updated_at
        BEFORE UPDATE ON bankrolls
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_wagers_updated_at ON wagers;
      CREATE TRIGGER update_wagers_updated_at
        BEFORE UPDATE ON wagers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_limits_updated_at ON limits;
      CREATE TRIGGER update_limits_updated_at
        BEFORE UPDATE ON limits
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Base de datos configurada exitosamente');
    console.log('📊 Tablas creadas: users, bankrolls, wagers, limits, sessions, alerts, simulations');
    console.log('🔍 Índices creados para optimizar consultas');
    console.log('⏰ Triggers configurados para updated_at');

  } catch (error) {
    console.error('❌ Error configurando base de datos:', error);
    throw error;
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('🎉 Configuración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en configuración:', error);
      process.exit(1);
    });
}

module.exports = { createTables };
