-- encrypt_pii used pgp_sym_encrypt(value, key) with no options. pgcrypto's
-- default cipher is AES-128, confirmed empirically: the cipher-algorithm byte
-- in the produced packet was 7 (AES-128), not 9 (AES-256).
--
-- Adding cipher-algo=aes256 is backward compatible: a PGP packet self-describes
-- its algorithm, so pgp_sym_decrypt still reads anything written previously.
-- Verified after applying: cipher byte is now 9 (AES-256) and the
-- encrypt -> decrypt round trip still returns the original value.
CREATE OR REPLACE FUNCTION public.encrypt_pii(p_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  encryption_key text;
BEGIN
  IF p_value IS NULL OR p_value = '' THEN
    RETURN p_value;
  END IF;

  -- Already encrypted - do not double-encrypt.
  IF p_value LIKE 'ENC:%' THEN
    RETURN p_value;
  END IF;

  -- NOTE: this key is still derived from the database name plus a literal in
  -- this function body. Both are readable by anyone who can read the catalog,
  -- so the cipher upgrade does NOT make the key secret. Moving this to a real
  -- secret is tracked separately; it needs a re-encryption pass over existing
  -- data and so must be a deliberate, scheduled change.
  encryption_key := encode(extensions.digest(current_database() || 'quooro_pii_key_2024', 'sha256'), 'hex');

  RETURN 'ENC:' || encode(
    extensions.pgp_sym_encrypt(p_value, encryption_key, 'cipher-algo=aes256'),
    'base64'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.encrypt_pii(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.encrypt_pii(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.encrypt_pii(text) TO authenticated, service_role;
