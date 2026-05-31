/*
  Closed testers (Play Console email list) and push targeting for app update announcements.
*/

CREATE TABLE IF NOT EXISTS closed_testers (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT closed_testers_email_format CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$')
);

ALTER TABLE closed_testers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS app_update_push_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_version text NOT NULL,
  build_number text NOT NULL,
  store_url text NOT NULL,
  tokens_sent int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_version, build_number)
);

ALTER TABLE app_update_push_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_closed_tester_push_tokens()
RETURNS TABLE (expo_push_token text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT pt.expo_push_token
  FROM push_tokens pt
  INNER JOIN auth.users u ON u.id = pt.user_id
  INNER JOIN closed_testers ct ON lower(trim(ct.email)) = lower(trim(u.email));
$$;

REVOKE ALL ON FUNCTION get_closed_tester_push_tokens() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_closed_tester_push_tokens() TO service_role;
