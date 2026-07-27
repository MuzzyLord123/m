-- Ensure pgcrypto extension is enabled (required for digest function)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;