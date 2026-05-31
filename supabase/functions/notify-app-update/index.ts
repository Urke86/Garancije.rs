import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, x-cron-secret",
};

const DEFAULT_STORE_URL =
  "https://play.google.com/store/apps/details?id=rs.garancije.app";

const EXPO_PUSH_CHUNK = 100;

interface NotifyBody {
  app_version?: string;
  build_number?: string;
  store_url?: string;
  force?: boolean;
}

function buildMessage(appVersion: string, buildNumber: string): string {
  return `Garancije.rs v${appVersion} (build ${buildNumber}) — ažurirajte aplikaciju`;
}

async function sendExpoPush(
  messages: {
    to: string;
    title: string;
    body: string;
    data: { type: string; url: string };
    sound: string;
    priority: string;
    channelId: string;
  }[],
): Promise<void> {
  for (let i = 0; i < messages.length; i += EXPO_PUSH_CHUNK) {
    const chunk = messages.slice(i, i + EXPO_PUSH_CHUNK);
    const pushRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(chunk),
    });

    if (!pushRes.ok) {
      const errText = await pushRes.text();
      throw new Error(`Expo push failed: ${errText}`);
    }
  }
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

  let body: NotifyBody = {};
  try {
    if (req.headers.get("Content-Type")?.includes("application/json")) {
      body = (await req.json()) as NotifyBody;
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const appVersion =
    body.app_version?.trim() ||
    Deno.env.get("APP_VERSION")?.trim() ||
    "1.0.0";
  const buildNumber =
    body.build_number?.trim() ||
    Deno.env.get("APP_BUILD_NUMBER")?.trim() ||
    "1";
  const storeUrl = body.store_url?.trim() || DEFAULT_STORE_URL;
  const force = body.force === true;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { count: testerCount } = await supabase
      .from("closed_testers")
      .select("*", { count: "exact", head: true });

    if (!testerCount) {
      return new Response(
        JSON.stringify({
          sent: 0,
          error:
            "Lista closed testera je prazna. Dodajte emailove u tabelu closed_testers.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!force) {
      const { data: existing } = await supabase
        .from("app_update_push_log")
        .select("id")
        .eq("app_version", appVersion)
        .eq("build_number", buildNumber)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({
            sent: 0,
            skipped: true,
            message:
              `Obaveštenje za v${appVersion} (build ${buildNumber}) je već poslato. Koristite force: true za ponovno slanje.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { data: tokenRows, error: tokenError } = await supabase.rpc(
      "get_closed_tester_push_tokens",
    );

    if (tokenError) throw tokenError;

    const tokens = [
      ...new Set(
        (tokenRows ?? [])
          .map((row: { expo_push_token: string }) => row.expo_push_token)
          .filter(Boolean),
      ),
    ];

    const pushBody = buildMessage(appVersion, buildNumber);
    const messages = tokens.map((pushToken) => ({
      to: pushToken,
      title: "Garancije.rs",
      body: pushBody,
      data: {
        type: "app_update",
        url: storeUrl,
      },
      sound: "default",
      priority: "high",
      channelId: "app_updates",
    }));

    if (messages.length > 0) {
      await sendExpoPush(messages);
    }

    await supabase.from("app_update_push_log").upsert(
      {
        app_version: appVersion,
        build_number: buildNumber,
        store_url: storeUrl,
        tokens_sent: messages.length,
        created_at: new Date().toISOString(),
      },
      { onConflict: "app_version,build_number" },
    );

    return new Response(
      JSON.stringify({
        sent: messages.length,
        app_version: appVersion,
        build_number: buildNumber,
        store_url: storeUrl,
        closed_testers_on_list: testerCount,
        message:
          messages.length === 0
            ? "Nijedan tester sa liste nema registrovan push token u aplikaciji (mora otvoriti app i dozvoliti obaveštenja)."
            : undefined,
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
