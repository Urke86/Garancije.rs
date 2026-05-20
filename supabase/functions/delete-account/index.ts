import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BUCKET = "receipt-images";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const userId = user.id;

  try {
    const storagePaths = new Set<string>();

    const { data: receiptRows } = await admin
      .from("receipts")
      .select("image_url")
      .eq("user_id", userId);

    for (const row of receiptRows ?? []) {
      const path = extractStoragePath(row.image_url);
      if (path) storagePaths.add(path);
    }

    const { data: listed, error: listError } = await admin.storage
      .from(BUCKET)
      .list(userId, { limit: 1000 });

    if (listError) {
      console.warn("Storage list warning:", listError.message);
    } else {
      for (const file of listed ?? []) {
        if (file.name) storagePaths.add(`${userId}/${file.name}`);
      }
    }

    if (storagePaths.size > 0) {
      const { error: removeError } = await admin.storage
        .from(BUCKET)
        .remove([...storagePaths]);
      if (removeError) {
        console.warn("Storage remove warning:", removeError.message);
      }
    }

    const { error: receiptsError } = await admin
      .from("receipts")
      .delete()
      .eq("user_id", userId);

    if (receiptsError) {
      throw new Error(`Brisanje računa nije uspelo: ${receiptsError.message}`);
    }

    await admin.from("push_tokens").delete().eq("user_id", userId);
    await admin.from("notification_preferences").delete().eq("user_id", userId);

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      throw new Error(`Brisanje naloga nije uspelo: ${deleteUserError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nepoznata greška";
    console.error("delete-account error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractStoragePath(stored: string | null | undefined): string | null {
  if (!stored?.trim()) return null;
  const value = stored.trim();
  if (!value.includes("://")) return value;
  const match = value.match(/\/receipt-images\/(.+?)(?:\?|$)/);
  return match?.[1] ?? null;
}
