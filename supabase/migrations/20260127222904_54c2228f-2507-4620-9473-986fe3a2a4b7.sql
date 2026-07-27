-- Enable pgcrypto extension in public schema (required for encrypt_pii function)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;