-- email_accounts stored Gmail/Outlook OAuth access_token and refresh_token, plus
-- imap_password, in PLAINTEXT. Those are the highest-value secrets in the
-- platform: a database dump would hand an attacker full read and send access to
-- every connected customer mailbox - worse than the PII the schema already
-- bothered to encrypt.
--
-- Encrypted at rest with the same AES-256 + Vault-held key as the rest of the
-- PII. encrypt_pii is idempotent (it returns any 'ENC:' value untouched), so
-- the trigger is safe to re-run and safe on partial updates.

CREATE OR REPLACE FUNCTION public.encrypt_email_account_secrets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NEW.access_token   IS NOT NULL THEN NEW.access_token   := public.encrypt_pii(NEW.access_token);   END IF;
  IF NEW.refresh_token  IS NOT NULL THEN NEW.refresh_token  := public.encrypt_pii(NEW.refresh_token);  END IF;
  IF NEW.imap_password  IS NOT NULL THEN NEW.imap_password  := public.encrypt_pii(NEW.imap_password);  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.encrypt_email_account_secrets() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS encrypt_email_account_secrets_trg ON public.email_accounts;
CREATE TRIGGER encrypt_email_account_secrets_trg
BEFORE INSERT OR UPDATE OF access_token, refresh_token, imap_password
ON public.email_accounts
FOR EACH ROW EXECUTE FUNCTION public.encrypt_email_account_secrets();

-- Read side for the sync worker. Restricted to service_role: the edge function
-- runs with the service key, while a logged-in user must never be able to pull
-- back a decrypted mailbox token - not even their own, since it is only ever
-- needed server-side.
CREATE OR REPLACE FUNCTION public.get_email_account_secrets(p_account_id uuid)
RETURNS TABLE (access_token text, refresh_token text, imap_password text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT public.decrypt_pii(a.access_token),
         public.decrypt_pii(a.refresh_token),
         public.decrypt_pii(a.imap_password)
  FROM public.email_accounts a
  WHERE a.id = p_account_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_email_account_secrets(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_account_secrets(uuid) TO service_role;
