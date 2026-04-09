"""
Database layer — PostgreSQL setup and schema creation.
Uses psycopg2 to connect to Render's managed PostgreSQL database.

Render automatically provides a DATABASE_URL environment variable
when you link a PostgreSQL database to your web service.
"""
import psycopg2
import psycopg2.extras
import os

# Render provides DATABASE_URL automatically.
# For local dev, set DATABASE_URL in your .env file or use the
# individual DB_* variables below as a fallback.
DATABASE_URL = os.environ.get("DATABASE_URL", "")

# Individual fallback params (used only if DATABASE_URL is not set)
_host     = os.environ.get("DB_HOST",     "localhost")
_port     = int(os.environ.get("DB_PORT", 5432))
_user     = os.environ.get("DB_USER",     "postgres")
_password = os.environ.get("DB_PASSWORD", "")
_database = os.environ.get("DB_NAME",     "medidiag")


def get_db():
    """Return a new PostgreSQL connection."""
    if DATABASE_URL:
        # Render's DATABASE_URL uses 'postgres://' — psycopg2 requires 'postgresql://'
        url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        return psycopg2.connect(url)
    return psycopg2.connect(
        host=_host, port=_port, user=_user,
        password=_password, dbname=_database,
    )


def init_db():
    """Create all tables if they do not already exist. Safe to run on every startup."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id         SERIAL PRIMARY KEY,
            full_name  VARCHAR(255) NOT NULL,
            age        INT          NOT NULL,
            gender     VARCHAR(20)  NOT NULL,
            email      VARCHAR(255),
            phone      VARCHAR(50),
            password   VARCHAR(255) NOT NULL DEFAULT '',
            created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            id             SERIAL PRIMARY KEY,
            name           VARCHAR(255) NOT NULL,
            email          VARCHAR(255) NOT NULL UNIQUE,
            password       VARCHAR(255) NOT NULL,
            specialization VARCHAR(255) DEFAULT 'General Practice',
            created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS diagnoses (
            id                SERIAL PRIMARY KEY,
            patient_id        INT              NOT NULL REFERENCES patients(id),
            symptoms          JSONB            NOT NULL,
            predicted_disease VARCHAR(255)     NOT NULL,
            confidence        DOUBLE PRECISION NOT NULL,
            probabilities     JSONB            NOT NULL,
            medicine          TEXT,
            requires_referral SMALLINT         DEFAULT 0,
            created_at        TIMESTAMP        DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS referrals (
            id           SERIAL PRIMARY KEY,
            diagnosis_id INT         NOT NULL REFERENCES diagnoses(id),
            patient_id   INT         NOT NULL REFERENCES patients(id),
            doctor_id    INT         REFERENCES doctors(id),
            status       VARCHAR(50) DEFAULT 'Pending',
            doctor_notes TEXT,
            created_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
            updated_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id          SERIAL PRIMARY KEY,
            patient_id  INT          NOT NULL REFERENCES patients(id),
            referral_id INT          NOT NULL REFERENCES referrals(id),
            doctor_name VARCHAR(255),
            disease     VARCHAR(255),
            message     TEXT         NOT NULL,
            is_read     BOOLEAN      DEFAULT FALSE,
            created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()

    # ── Migrations (safe to re-run) ──────────────────────────────────────
    # Add password column to patients if it doesn't exist yet (for existing DBs)
    cursor = conn.cursor()
    cursor.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'patients' AND column_name = 'password'
            ) THEN
                ALTER TABLE patients ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '';
            END IF;
        END $$;
    """)
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ PostgreSQL tables initialised")
