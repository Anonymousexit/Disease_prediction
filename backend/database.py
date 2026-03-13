"""
Database layer - MySQL setup and schema creation.
No seed data: doctors and patients register via the frontend.

Environment variables:
- MYSQL_URL or DATABASE_URL (recommended for managed databases)
  Example: mysql://user:password@host:3306/medidiag
- Or discrete values:
  MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
- Optional:
  MYSQL_AUTO_CREATE_DB=true|false (default true for localhost, false otherwise)
  MYSQL_SSL_DISABLED=true|false  (default true for localhost, false otherwise)
  MYSQL_SSL_CA=/path/to/ca.pem
"""
import os
from urllib.parse import unquote, urlparse

import mysql.connector


def _as_bool(value: str | None, *, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _mysql_config_from_env() -> dict:
    mysql_url = os.getenv("MYSQL_URL") or os.getenv("DATABASE_URL")

    if mysql_url:
        parsed = urlparse(mysql_url)
        if not parsed.scheme.startswith("mysql"):
            raise ValueError("MYSQL_URL/DATABASE_URL must start with mysql://")

        database_name = parsed.path.lstrip("/")
        if not database_name:
            raise ValueError("MYSQL_URL/DATABASE_URL must include a database name")

        config = {
            "host": parsed.hostname or "localhost",
            "port": parsed.port or 3306,
            "user": unquote(parsed.username or ""),
            "password": unquote(parsed.password or ""),
            "database": database_name,
        }
    else:
        config = {
            "host": os.getenv("MYSQL_HOST", "localhost"),
            "port": int(os.getenv("MYSQL_PORT", "3306")),
            "user": os.getenv("MYSQL_USER", "root"),
            "password": os.getenv("MYSQL_PASSWORD", "root1234"),
            "database": os.getenv("MYSQL_DATABASE", "medidiag"),
        }

    host = str(config.get("host", "")).lower()
    ssl_disabled_default = host in {"localhost", "127.0.0.1"}
    config["ssl_disabled"] = _as_bool(
        os.getenv("MYSQL_SSL_DISABLED"),
        default=ssl_disabled_default,
    )

    ssl_ca = os.getenv("MYSQL_SSL_CA")
    if ssl_ca:
        config["ssl_ca"] = ssl_ca

    return config


# ── MySQL connection config ──────────────────────────────────────────
MYSQL_CONFIG = _mysql_config_from_env()
MYSQL_AUTO_CREATE_DB = _as_bool(
    os.getenv("MYSQL_AUTO_CREATE_DB"),
    default=str(MYSQL_CONFIG.get("host", "")).lower() in {"localhost", "127.0.0.1"},
)


def _create_database_if_not_exists():
    """Connect to MySQL server (without database) and create the DB."""
    if not MYSQL_AUTO_CREATE_DB:
        return

    server_config = {k: v for k, v in MYSQL_CONFIG.items() if k != "database"}
    conn = mysql.connector.connect(**server_config)
    cursor = conn.cursor()
    safe_db_name = str(MYSQL_CONFIG["database"]).replace("`", "")
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{safe_db_name}`")
    cursor.close()
    conn.close()


def get_db():
    """Return a new MySQL connection with dictionary cursor support."""
    conn = mysql.connector.connect(**MYSQL_CONFIG)
    return conn


def init_db():
    """Create the database and tables if they don't exist."""
    _create_database_if_not_exists()
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            full_name   VARCHAR(255) NOT NULL,
            age         INT          NOT NULL,
            gender      VARCHAR(20)  NOT NULL,
            email       VARCHAR(255),
            phone       VARCHAR(50),
            created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            name            VARCHAR(255) NOT NULL,
            email           VARCHAR(255) NOT NULL UNIQUE,
            password        VARCHAR(255) NOT NULL,
            specialization  VARCHAR(255) DEFAULT 'General Practice',
            created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS diagnoses (
            id                INT AUTO_INCREMENT PRIMARY KEY,
            patient_id        INT          NOT NULL,
            symptoms          JSON         NOT NULL,
            predicted_disease VARCHAR(255) NOT NULL,
            confidence        DOUBLE       NOT NULL,
            probabilities     JSON         NOT NULL,
            medicine          TEXT,
            requires_referral TINYINT      DEFAULT 0,
            created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS referrals (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            diagnosis_id  INT          NOT NULL,
            patient_id    INT          NOT NULL,
            doctor_id     INT, 
            status        VARCHAR(50)  DEFAULT 'Pending',
            doctor_notes  TEXT,
            created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
            updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(id),
            FOREIGN KEY (patient_id)   REFERENCES patients(id),
            FOREIGN KEY (doctor_id)    REFERENCES doctors(id)
        )
    """)

    # Reset AUTO_INCREMENT to 1 for any empty tables
    # so that IDs start from 1 after all rows are deleted
    for table in ["referrals", "diagnoses", "patients", "doctors"]:
        cursor.execute(f"SELECT COUNT(*) AS c FROM {table}")
        row = cursor.fetchone()
        if isinstance(row, dict):
            count_value = row.get("c", 0)
        elif row is None:
            count_value = 0
        else:
            count_value = row[0]

        count = str(count_value).strip()
        if count == "0":
            cursor.execute(f"ALTER TABLE {table} AUTO_INCREMENT = 1")

    conn.commit()
    cursor.close()
    conn.close()
    print(f"MySQL database '{MYSQL_CONFIG['database']}' initialized")
