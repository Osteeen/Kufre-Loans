require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createSchema() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ------------------------------------------------------------------
    // 1. tenants
    // ------------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(255) NOT NULL,
        logo_url      TEXT,
        primary_color VARCHAR(7)   DEFAULT '#1B4332',
        domain        VARCHAR(255),
        status        VARCHAR(20)  DEFAULT 'active',
        created_at    TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    // ------------------------------------------------------------------
    // 2. users
    // ------------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        tenant_id     INTEGER      REFERENCES tenants(id) DEFAULT 1,
        first_name    VARCHAR(100) NOT NULL,
        last_name     VARCHAR(100) NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT         NOT NULL,
        phone         VARCHAR(20),
        bvn           VARCHAR(11),
        role          VARCHAR(20)  DEFAULT 'customer'
                        CHECK (role IN ('super_admin','approver','viewer','customer')),
        account_number VARCHAR(20),
        bank_name     VARCHAR(100),
        tier          INTEGER      DEFAULT 1,
        is_verified   BOOLEAN      DEFAULT false,
        created_at    TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    // ------------------------------------------------------------------
    // 3. tenant_settings
    // ------------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_settings (
        id                  SERIAL PRIMARY KEY,
        tenant_id           INTEGER      REFERENCES tenants(id) DEFAULT 1,
        interest_rate       NUMERIC(5,2) DEFAULT 5.00,
        tier1_max_amount    BIGINT       DEFAULT 50000000,
        tier2_max_amount    BIGINT       DEFAULT 150000000,
        tier3_max_amount    BIGINT       DEFAULT 500000000,
        platform_name       VARCHAR(255) DEFAULT 'Kufre Loans',
        support_email       VARCHAR(255) DEFAULT 'support@kufre.com'
      );
    `);

    // ------------------------------------------------------------------
    // 4. loan_products
    // ------------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS loan_products (
        id                SERIAL PRIMARY KEY,
        tenant_id         INTEGER  REFERENCES tenants(id) DEFAULT 1,
        name              VARCHAR(255) NOT NULL,
        description       TEXT,
        min_amount        BIGINT   NOT NULL,
        max_amount        BIGINT   NOT NULL,
        min_tenor_months  INTEGER  NOT NULL,
        max_tenor_months  INTEGER  NOT NULL,
        is_active         BOOLEAN  DEFAULT true,
        created_at        TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ------------------------------------------------------------------
    // 5. loan_applications
    // ------------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS loan_applications (
        id                         SERIAL PRIMARY KEY,
        tenant_id                  INTEGER      REFERENCES tenants(id) DEFAULT 1,
        user_id                    INTEGER      REFERENCES users(id),
        product_id                 INTEGER      REFERENCES loan_products(id),
        amount_requested           BIGINT       NOT NULL,
        amount_approved            BIGINT,
        interest_rate_at_approval  NUMERIC(5,2),
        tenor_months               INTEGER      NOT NULL,
        status                     VARCHAR(20)  DEFAULT 'pending'
                                     CHECK (status IN ('pending','under_review','approved','declined','disbursed','completed')),
        purpose                    TEXT,
        monthly_repayment          BIGINT,
        total_repayable            BIGINT,
        decline_reason             TEXT,
        disbursed_at               TIMESTAMPTZ,
        created_at                 TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    // ------------------------------------------------------------------
    // 6. repayment_schedule
    // ------------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS repayment_schedule (
        id                SERIAL PRIMARY KEY,
        loan_id           INTEGER REFERENCES loan_applications(id),
        month_number      INTEGER NOT NULL,
        due_date          DATE    NOT NULL,
        principal_amount  BIGINT  NOT NULL,
        interest_amount   BIGINT  NOT NULL,
        total_amount      BIGINT  NOT NULL,
        status            VARCHAR(10) DEFAULT 'pending'
                            CHECK (status IN ('pending','paid','failed','overdue')),
        paid_at           TIMESTAMPTZ
      );
    `);

    // ------------------------------------------------------------------
    // 7. documents
    // ------------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id             SERIAL PRIMARY KEY,
        tenant_id      INTEGER     REFERENCES tenants(id) DEFAULT 1,
        loan_id        INTEGER     REFERENCES loan_applications(id),
        user_id        INTEGER     REFERENCES users(id),
        document_type  VARCHAR(100),
        file_url       TEXT,
        uploaded_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ------------------------------------------------------------------
    // 8. messages
    // ------------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id           SERIAL PRIMARY KEY,
        tenant_id    INTEGER  REFERENCES tenants(id) DEFAULT 1,
        loan_id      INTEGER  REFERENCES loan_applications(id),
        sender_id    INTEGER  REFERENCES users(id),
        sender_role  VARCHAR(20),
        content      TEXT     NOT NULL,
        is_read      BOOLEAN  DEFAULT false,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ------------------------------------------------------------------
    // 9. notifications
    // ------------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          SERIAL PRIMARY KEY,
        tenant_id   INTEGER  REFERENCES tenants(id) DEFAULT 1,
        user_id     INTEGER  REFERENCES users(id),
        title       VARCHAR(255),
        message     TEXT,
        is_read     BOOLEAN  DEFAULT false,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ------------------------------------------------------------------
    // 10. audit_logs
    // ------------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id           SERIAL PRIMARY KEY,
        tenant_id    INTEGER      REFERENCES tenants(id) DEFAULT 1,
        actor_id     INTEGER      REFERENCES users(id),
        action       VARCHAR(255) NOT NULL,
        target_type  VARCHAR(100),
        target_id    INTEGER,
        meta         JSONB,
        created_at   TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    // ------------------------------------------------------------------
    // 11. loan_revenue_log
    // ------------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS loan_revenue_log (
        id                SERIAL PRIMARY KEY,
        tenant_id         INTEGER      REFERENCES tenants(id) DEFAULT 1,
        loan_id           INTEGER      REFERENCES loan_applications(id),
        disbursed_amount  BIGINT,
        commission_rate   NUMERIC(5,4),
        commission_amount BIGINT,
        logged_at         TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    // ------------------------------------------------------------------
    // 12. password_reset_tokens
    //     Used by authController forgotPassword / resetPassword.
    //     NOTE: In the current implementation a short-lived in-memory Map
    //     is used for tokens (see authController.js). This table is created
    //     for future Redis / persistent-token migration.
    // ------------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER     REFERENCES users(id) ON DELETE CASCADE,
        token_hash  TEXT        NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        used        BOOLEAN     DEFAULT false,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('Schema created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Schema creation failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

createSchema().catch((err) => {
  console.error(err);
  process.exit(1);
});
