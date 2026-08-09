-- Two tables the app has always queried but which did not exist in this
-- database. They were lost in the migration off Lovable. The consequences
-- were live and user-visible: the Designer's model picker silently fell
-- back to gemini-3-flash-preview and toasted "Failed to save model
-- preference" on every change, and the template marketplace's Saved
-- section was permanently empty because the read errored out.
--
-- They were also the entire TypeScript error budget: 18 errors, every one
-- of them in the two hooks below, because the generated types could not
-- name a table that was not there.
--
-- Column shapes are taken from the two hooks that consume them
-- (src/hooks/useSavedTemplates.ts, src/hooks/useAIModelSettings.ts), not
-- invented: NOT NULL wherever the TypeScript interface promises a
-- non-optional value, defaults wherever the insert omits the column.
--
-- No foreign key to auth.users: nothing else in this schema has one, and
-- RLS is what actually scopes these rows.

CREATE TABLE IF NOT EXISTS public.saved_templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  name        text        NOT NULL,
  -- SavedTemplate.description is `string`, and the hook coalesces a null
  -- away on read; a default keeps both ends honest.
  description text        NOT NULL DEFAULT '',
  category    text        NOT NULL DEFAULT 'Custom',
  thumbnail   text,
  elements    jsonb       NOT NULL DEFAULT '[]'::jsonb,
  pages       jsonb,
  -- Not yet surfaced anywhere. The column exists because the interface
  -- declares it; there is deliberately NO public-read policy to match it,
  -- because the only screen listing these rows renders a delete button on
  -- every one of them.
  is_public   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_templates_user_created_idx
  ON public.saved_templates (user_id, created_at DESC);

ALTER TABLE public.saved_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own saved templates" ON public.saved_templates;
CREATE POLICY "Users manage own saved templates"
  ON public.saved_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS public.ai_model_settings (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- UNIQUE is load-bearing, not decoration: the hook upserts with
  -- onConflict: 'user_id', which errors without a matching constraint.
  user_id      uuid        NOT NULL UNIQUE,
  active_model text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_model_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own AI model settings" ON public.ai_model_settings;
CREATE POLICY "Users manage own AI model settings"
  ON public.ai_model_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
