import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, x-cron-secret",
};

interface DueReminder {
  id: string;
  user_id: string;
  receipt_item_id: string;
  message: string;
}

interface PushToken {
  expo_push_token: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("x-cron-secret");
  if (cronSecret && authHeader !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const now = new Date().toISOString();

    const { data: dueReminders, error: fetchError } = await supabase
      .from("reminders")
      .select("id, user_id, receipt_item_id, message")
      .eq("is_sent", false)
      .eq("is_dismissed", false)
      .lte("remind_at", now)
      .limit(200);

    if (fetchError) throw fetchError;

    if (!dueReminders?.length) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No due reminders" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userIds = [...new Set(dueReminders.map((r: DueReminder) => r.user_id))];

    const { data: prefsRows } = await supabase
      .from("notification_preferences")
      .select("user_id, enabled")
      .in("user_id", userIds);

    const disabledUsers = new Set(
      (prefsRows ?? [])
        .filter((p: { enabled: boolean }) => p.enabled === false)
        .map((p: { user_id: string }) => p.user_id),
    );

    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("user_id, expo_push_token")
      .in("user_id", userIds);

    const tokensByUser = new Map<string, string[]>();
    for (const t of tokens ?? []) {
      const row = t as PushToken & { user_id: string };
      const list = tokensByUser.get(row.user_id) ?? [];
      list.push(row.expo_push_token);
      tokensByUser.set(row.user_id, list);
    }

    const messages: {
      to: string;
      title: string;
      body: string;
      data: { receiptItemId: string; reminderId: string };
      sound: string;
      priority: string;
      channelId: string;
    }[] = [];

    const sentReminderIds: string[] = [];

    for (const reminder of dueReminders as DueReminder[]) {
      if (disabledUsers.has(reminder.user_id)) {
        sentReminderIds.push(reminder.id);
        continue;
      }

      const userTokens = tokensByUser.get(reminder.user_id) ?? [];
      if (userTokens.length === 0) continue;

      for (const pushToken of userTokens) {
        messages.push({
          to: pushToken,
          title: "Garancije.rs",
          body: reminder.message,
          data: {
            receiptItemId: reminder.receipt_item_id,
            reminderId: reminder.id,
          },
          sound: "default",
          priority: "high",
          channelId: "reminders",
        });
      }
      sentReminderIds.push(reminder.id);
    }

    if (messages.length > 0) {
      const pushRes = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!pushRes.ok) {
        const errText = await pushRes.text();
        throw new Error(`Expo push failed: ${errText}`);
      }
    }

    if (sentReminderIds.length > 0) {
      await supabase
        .from("reminders")
        .update({ is_sent: true, sent_at: now })
        .in("id", sentReminderIds);
    }

    return new Response(
      JSON.stringify({
        sent: messages.length,
        remindersProcessed: sentReminderIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
