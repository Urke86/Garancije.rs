/*
  Allow users to delete notification preferences and cascade-delete receipts when auth user is removed.
*/

CREATE POLICY "Users can delete own notification preferences"
  ON notification_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE receipts
  DROP CONSTRAINT IF EXISTS receipts_user_id_fkey;

ALTER TABLE receipts
  ADD CONSTRAINT receipts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE receipt_items
  DROP CONSTRAINT IF EXISTS receipt_items_user_id_fkey;

ALTER TABLE receipt_items
  ADD CONSTRAINT receipt_items_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE reminders
  DROP CONSTRAINT IF EXISTS reminders_user_id_fkey;

ALTER TABLE reminders
  ADD CONSTRAINT reminders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
