@echo off
echo === Android Push (FCM) setup for Garancije.rs ===
echo.
echo 1. Create Firebase project at https://console.firebase.google.com
echo 2. Add Android app with package: rs.garancije.app
echo 3. Download google-services.json (optional for Expo managed workflow)
echo 4. In Firebase: Project Settings ^> Service accounts ^> Generate new private key (FCM V1)
echo 5. Run: eas credentials -p android
echo    Choose: Push Notifications ^> Upload a Google Service Account Key
echo 6. Rebuild APK: eas build -p android --profile preview
echo.
echo === Supabase send-reminders ===
echo 1. Apply migration: supabase db push
echo 2. Deploy: supabase functions deploy send-reminders
echo 3. Set secret: supabase secrets set CRON_SECRET=your-random-secret
echo 4. Run SQL from supabase/cron/send-reminders.sql in Supabase SQL Editor
echo.
pause
