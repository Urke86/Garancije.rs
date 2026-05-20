export async function extractTextFromImage(imageBase64: string): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
  if (!apiKey) {
    throw new Error("OCR servis nije konfigurisan (GOOGLE_VISION_API_KEY).");
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
            imageContext: { languageHints: ["sr", "sr-Latn", "en"] },
          },
        ],
      }),
    },
  );

  const payload = await response.json();

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      `Google Vision API greška (${response.status})`;
    throw new Error(message);
  }

  const annotation = payload?.responses?.[0];
  if (annotation?.error?.message) {
    throw new Error(annotation.error.message);
  }

  const text =
    annotation?.fullTextAnnotation?.text ||
    annotation?.textAnnotations?.[0]?.description ||
    "";

  if (!text.trim()) {
    throw new Error("Tekst na računu nije prepoznat. Probajte jasniju fotografiju.");
  }

  return text;
}
