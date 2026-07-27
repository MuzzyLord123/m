-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption function for PII data
CREATE OR REPLACE FUNCTION public.encrypt_pii(p_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Use a consistent key derived from the database name (or use a secret)
  -- In production, this should come from a vault/secret, but for now we use a derived key
  encryption_key := encode(digest(current_database() || 'quooro_pii_key_2024', 'sha256'), 'hex');
  
  -- Return encrypted value with prefix for identification
  RETURN 'ENC:' || encode(
    pgp_sym_encrypt(p_value, encryption_key),
    'base64'
  );
END;
$$;

-- Create decryption function for PII data
CREATE OR REPLACE FUNCTION public.decrypt_pii(p_encrypted_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
  encrypted_data text;
BEGIN
  -- Check if value is encrypted
  IF p_encrypted_value IS NULL OR NOT p_encrypted_value LIKE 'ENC:%' THEN
    RETURN p_encrypted_value;
  END IF;
  
  -- Extract the encrypted portion (after 'ENC:')
  encrypted_data := substring(p_encrypted_value from 5);
  
  -- Use the same key as encryption
  encryption_key := encode(digest(current_database() || 'quooro_pii_key_2024', 'sha256'), 'hex');
  
  -- Decrypt and return
  RETURN pgp_sym_decrypt(
    decode(encrypted_data, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails, return the original value
    RETURN p_encrypted_value;
END;
$$;