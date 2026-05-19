import { supabase } from '@/lib/supabase';
import { calculateWarrantyExpiry } from '@/lib/warranty';
import { createRemindersForItem, syncRemindersForItem } from '@/lib/reminders';

export interface ReceiptItemInput {
  id?: string;
  name: string;
  category: string;
  price: string;
  warranty_months: string;
}

export interface ReceiptFormInput {
  store_name: string;
  purchase_date: string;
  total_amount: string;
  pib: string;
  receipt_number: string;
  image_url: string;
  raw_ocr_text?: string;
}

export async function saveNewReceipt(
  userId: string,
  form: ReceiptFormInput,
  items: ReceiptItemInput[],
): Promise<{ receiptId: string | null; error: string | null }> {
  const { data: receipt, error: receiptErr } = await supabase
    .from('receipts')
    .insert({
      user_id: userId,
      store_name: form.store_name.trim(),
      purchase_date: form.purchase_date,
      total_amount: parseFloat(form.total_amount) || 0,
      pib: form.pib.trim(),
      receipt_number: form.receipt_number.trim(),
      image_url: form.image_url || '',
      raw_ocr_text: form.raw_ocr_text || '',
    })
    .select('id')
    .maybeSingle();

  if (receiptErr || !receipt) {
    return { receiptId: null, error: 'Greška pri čuvanju računa' };
  }

  const itemError = await insertItemsWithReminders(userId, receipt.id, form.purchase_date, items);
  if (itemError) return { receiptId: null, error: itemError };

  return { receiptId: receipt.id, error: null };
}

async function insertItemsWithReminders(
  userId: string,
  receiptId: string,
  purchaseDate: string,
  items: ReceiptItemInput[],
): Promise<string | null> {
  const validItems = items.filter((i) => i.name.trim());
  if (validItems.length === 0) return null;

  const itemsToInsert = validItems.map((i) => ({
    receipt_id: receiptId,
    user_id: userId,
    name: i.name.trim(),
    category: i.category,
    price: parseFloat(i.price) || 0,
    warranty_months: parseInt(i.warranty_months, 10) || 24,
    warranty_expires_at: calculateWarrantyExpiry(
      purchaseDate,
      parseInt(i.warranty_months, 10) || 24,
    ),
  }));

  const { data: insertedItems, error } = await supabase
    .from('receipt_items')
    .insert(itemsToInsert)
    .select('id, warranty_expires_at, name');

  if (error) return 'Greška pri dodavanju stavki';

  for (const row of insertedItems ?? []) {
    if (row.warranty_expires_at) {
      await createRemindersForItem(userId, row.id, row.name, row.warranty_expires_at);
    }
  }

  return null;
}

export async function updateReceipt(
  userId: string,
  receiptId: string,
  form: ReceiptFormInput,
  items: ReceiptItemInput[],
  removedItemIds: string[],
): Promise<{ error: string | null }> {
  const { error: receiptErr } = await supabase
    .from('receipts')
    .update({
      store_name: form.store_name.trim(),
      purchase_date: form.purchase_date,
      total_amount: parseFloat(form.total_amount) || 0,
      pib: form.pib.trim(),
      receipt_number: form.receipt_number.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', receiptId)
    .eq('user_id', userId);

  if (receiptErr) return { error: 'Greška pri ažuriranju računa' };

  if (removedItemIds.length > 0) {
    await supabase.from('receipt_items').delete().in('id', removedItemIds).eq('user_id', userId);
  }

  const itemError = await syncReceiptItems(userId, receiptId, form.purchase_date, items);
  return { error: itemError };
}

async function syncReceiptItems(
  userId: string,
  receiptId: string,
  purchaseDate: string,
  items: ReceiptItemInput[],
): Promise<string | null> {
  const validItems = items.filter((i) => i.name.trim());
  if (validItems.length === 0) return null;

  for (const item of validItems) {
    const months = parseInt(item.warranty_months, 10) || 24;
    const warrantyExpiresAt = calculateWarrantyExpiry(purchaseDate, months);
    const payload = {
      name: item.name.trim(),
      category: item.category,
      price: parseFloat(item.price) || 0,
      warranty_months: months,
      warranty_expires_at: warrantyExpiresAt,
    };

    if (item.id) {
      const { error } = await supabase
        .from('receipt_items')
        .update(payload)
        .eq('id', item.id)
        .eq('user_id', userId);
      if (error) return 'Greška pri ažuriranju stavki';
      await syncRemindersForItem(userId, item.id, payload.name, warrantyExpiresAt);
    } else {
      const { data: inserted, error } = await supabase
        .from('receipt_items')
        .insert({ ...payload, receipt_id: receiptId, user_id: userId })
        .select('id, warranty_expires_at, name')
        .maybeSingle();
      if (error) return 'Greška pri dodavanju stavki';
      if (inserted?.warranty_expires_at) {
        await createRemindersForItem(
          userId,
          inserted.id,
          inserted.name,
          inserted.warranty_expires_at,
        );
      }
    }
  }

  return null;
}

export async function updateReceiptItem(
  userId: string,
  itemId: string,
  purchaseDate: string,
  data: Omit<ReceiptItemInput, 'id'>,
): Promise<{ error: string | null }> {
  const months = parseInt(data.warranty_months, 10) || 24;
  const warrantyExpiresAt = calculateWarrantyExpiry(purchaseDate, months);
  const { error } = await supabase
    .from('receipt_items')
    .update({
      name: data.name.trim(),
      category: data.category,
      price: parseFloat(data.price) || 0,
      warranty_months: months,
      warranty_expires_at: warrantyExpiresAt,
    })
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) return { error: 'Greška pri čuvanju proizvoda' };

  await syncRemindersForItem(userId, itemId, data.name.trim(), warrantyExpiresAt);
  return { error: null };
}
