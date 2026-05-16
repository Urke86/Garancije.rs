/*
  # Create Receipt Wallet Schema

  1. New Tables
    - `receipts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `store_name` (text) - name of the store
      - `purchase_date` (date) - date of purchase
      - `total_amount` (numeric) - total amount on receipt
      - `pib` (text) - store tax ID (PIB)
      - `receipt_number` (text) - fiscal receipt number
      - `image_url` (text) - URL to stored receipt image
      - `raw_ocr_text` (text) - raw OCR output for reference
      - `notes` (text) - user notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `receipt_items`
      - `id` (uuid, primary key)
      - `receipt_id` (uuid, references receipts)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - product name
      - `category` (text) - product category (electronics, appliances, footwear, furniture, other)
      - `price` (numeric) - item price
      - `quantity` (integer) - quantity purchased
      - `warranty_months` (integer) - warranty duration in months
      - `warranty_expires_at` (date) - calculated warranty expiration date
      - `created_at` (timestamptz)

    - `reminders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `receipt_item_id` (uuid, references receipt_items)
      - `remind_at` (timestamptz) - when to send reminder
      - `type` (text) - reminder type (warranty_expiring, service_due)
      - `message` (text) - reminder message
      - `is_sent` (boolean) - whether reminder was sent
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  store_name text NOT NULL DEFAULT '',
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  total_amount numeric NOT NULL DEFAULT 0,
  pib text DEFAULT '',
  receipt_number text DEFAULT '',
  image_url text DEFAULT '',
  raw_ocr_text text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts"
  ON receipts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts"
  ON receipts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own receipts"
  ON receipts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Receipt items table
CREATE TABLE IF NOT EXISTS receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'other',
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  warranty_months integer NOT NULL DEFAULT 24,
  warranty_expires_at date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receipt items"
  ON receipt_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipt items"
  ON receipt_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipt items"
  ON receipt_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own receipt items"
  ON receipt_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  receipt_item_id uuid NOT NULL REFERENCES receipt_items(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  type text NOT NULL DEFAULT 'warranty_expiring',
  message text NOT NULL DEFAULT '',
  is_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_purchase_date ON receipts(user_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_warranty ON receipt_items(user_id, warranty_expires_at);
CREATE INDEX IF NOT EXISTS idx_reminders_user_remind ON reminders(user_id, remind_at) WHERE is_sent = false;
