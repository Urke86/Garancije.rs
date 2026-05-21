-- Ensure receipt_items can only be inserted for receipts owned by the same user.

DROP POLICY IF EXISTS "Users can insert own receipt items" ON receipt_items;

CREATE POLICY "Users can insert own receipt items"
  ON receipt_items FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM receipts
      WHERE receipts.id = receipt_items.receipt_id
        AND receipts.user_id = auth.uid()
    )
  );
