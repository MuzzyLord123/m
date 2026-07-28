-- The PII key was sha256(current_database() || 'quooro_pii_key_2024'). Both
-- halves are non-secret and the literal sits in the function body, so anyone who
-- could read the catalog or a dump could derive it and decrypt every protected
-- value. AES-256 over a derivable key is no better than AES-128 over one.
--
-- The key now lives in Supabase Vault, which encrypts it with a root key held
-- outside the database. These functions are SECURITY DEFINER owned by postgres,
-- so they can read the secret while callers cannot.
--
-- Provisioned once, out of band, with:
--   SELECT vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),
--                              'pii_encryption_key', '...');

CREATE OR REPLACE FUNCTION public.pii_key()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'vault'
AS $function$
DECLARE k text;
BEGIN
  SELECT decrypted_secret INTO k
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key'
  LIMIT 1;

  IF k IS NULL OR k = '' THEN
    RAISE EXCEPTION 'PII encryption key missing from Vault (secret "pii_encryption_key")';
  END IF;
  RETURN k;
END;
$function$;

REVOKE ALL ON FUNCTION public.pii_key() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.encrypt_pii(p_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF p_value IS NULL OR p_value = '' THEN RETURN p_value; END IF;
  IF p_value LIKE 'ENC:%' THEN RETURN p_value; END IF;

  -- Fails closed: if the Vault secret is absent this raises rather than
  -- silently falling back to the old derivable key.
  RETURN 'ENC:' || encode(
    extensions.pgp_sym_encrypt(p_value, public.pii_key(), 'cipher-algo=aes256'),
    'base64'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_pii(p_encrypted_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  payload bytea;
  legacy_key text;
BEGIN
  IF p_encrypted_value IS NULL OR p_encrypted_value NOT LIKE 'ENC:%' THEN
    RETURN p_encrypted_value;
  END IF;

  payload := decode(substring(p_encrypted_value from 5), 'base64');

  BEGIN
    RETURN extensions.pgp_sym_decrypt(payload, public.pii_key());
  EXCEPTION WHEN OTHERS THEN
    -- Anything written before the rotation (e.g. rows imported from the old
    -- project) still reads via the retired derived key.
    legacy_key := encode(extensions.digest(current_database() || 'quooro_pii_key_2024', 'sha256'), 'hex');
    BEGIN
      RETURN extensions.pgp_sym_decrypt(payload, legacy_key);
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  END;
END;
$function$;

REVOKE ALL ON FUNCTION public.encrypt_pii(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.decrypt_pii(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.encrypt_pii(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_pii(text) TO authenticated, service_role;
