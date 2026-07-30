-- Owners can raise a team comms group from Manage admins, and seed it
-- with members in the same action. Mirror of the applied migration
-- owner_create_comm_group.

CREATE OR REPLACE FUNCTION public.owner_create_comm_group(
  _name text,
  _description text DEFAULT NULL,
  _member_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
  v_slug text;
  v_member uuid;
BEGIN
  IF NOT public.is_platform_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF btrim(COALESCE(_name, '')) = '' THEN
    RAISE EXCEPTION 'A group needs a name';
  END IF;

  v_slug := trim(both '-' from regexp_replace(lower(btrim(_name)), '[^a-z0-9]+', '-', 'g'));
  IF v_slug = '' THEN v_slug := 'group'; END IF;
  IF EXISTS (SELECT 1 FROM public.comm_channels WHERE slug = v_slug) THEN
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 5);
  END IF;

  INSERT INTO public.comm_channels (name, slug, description, channel_type, created_by)
  VALUES (btrim(_name), v_slug, NULLIF(btrim(COALESCE(_description, '')), ''), 'public', auth.uid())
  RETURNING id INTO v_id;

  INSERT INTO public.comm_channel_members (channel_id, user_id, role)
  VALUES (v_id, auth.uid(), 'owner')
  ON CONFLICT DO NOTHING;

  FOREACH v_member IN ARRAY COALESCE(_member_ids, '{}'::uuid[]) LOOP
    IF v_member <> auth.uid() THEN
      INSERT INTO public.comm_channel_members (channel_id, user_id, role)
      VALUES (v_id, v_member, 'member')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.owner_create_comm_group(text, text, uuid[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
