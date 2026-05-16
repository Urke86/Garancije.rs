import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { image_base64 } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use a simple heuristic-based OCR approach for Serbian fiscal receipts
    // In production, this would call an external OCR API (Google Vision, Tesseract, etc.)
    // For now, we return a structured template that the user can edit
    const result = {
      store_name: "",
      purchase_date: new Date().toISOString().split("T")[0],
      total_amount: "",
      pib: "",
      receipt_number: "",
      items: [] as { name: string; price: number; category: string }[],
      raw_text: "OCR processing - please edit the fields manually",
    };

    // Attempt basic pattern matching on base64-decoded text if possible
    // Serbian fiscal receipts typically have patterns like:
    // PIB: XXXXXXXXX
    // UKUPNO: X,XXX.XX
    // Date patterns: DD.MM.YYYY

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Processing failed", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
