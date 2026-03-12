"""
Database layer — MySQL setup and schema creation.
No seed data: doctors and patients register via the frontend.
"""
import mysql.connector
from mysql.connector import Error

# ── MySQL connection config ──────────────────────────────────────────
MYSQL_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "root1234",
    "database": "medidiag",
}


def _create_database_if_not_exists():
    """Connect to MySQL server (without database) and create the DB."""
    conn = mysql.connector.connect(
        host=MYSQL_CONFIG["host"],
        port=MYSQL_CONFIG["port"],
        user=MYSQL_CONFIG["user"],
        password=MYSQL_CONFIG["password"],
    )
    cursor = conn.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS medidiag")
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
        count = cursor.fetchone()[0]
        if count == 0:
            cursor.execute(f"ALTER TABLE {table} AUTO_INCREMENT = 1")

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ MySQL database 'medidiag' initialised")
