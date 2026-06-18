-- Supabase Cron setup for send-reminders edge function
-- Prerequisites:
--   1. Enable extensions: pg_cron, pg_net (Dashboard > Database > Extensions)
--   2. Deploy function: supabase functions deploy send-reminders
--   3. Set secrets: supabase secrets set CRON_SECRET=your-random-secret
--   4. Replace YOUR_CRON_SECRET below (never commit the real secret)

-- SELECT cron.unschedule('send-reminders-every-15-min'); -- run first if re-scheduling

SELECT cron.schedule(
  'send-reminders-every-15-min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fgpvqcqflppvxagbdcig.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'c78e2a631b81df1d4946a86574a7604721276fed186da228448f45b2d0ebf31d'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
