const VISION_TIMEOUT_MS = 25_000;
const MIN_BASE64_LENGTH = 100;
const MAX_BASE64_LENGTH = 10_000_000;

export async function extractTextFromImage(imageBase64: string): Promise<string> {
  const cleaned = imageBase64.replace(/\s/g, "");
  if (cleaned.length < MIN_BASE64_LENGTH) {
    throw new Error("Slika nije validna ili je previše mala.");
  }
  if (cleaned.length > MAX_BASE64_LENGTH) {
    throw new Error("Slika je prevelika — pokušajte ponovo sa manjom fotografijom.");
  }

  const apiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
  if (!apiKey) {
    throw new Error("OCR servis nije konfigurisan (GOOGLE_VISION_API_KEY).");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          requests: [
            {
              image: { content: cleaned },
              features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
              imageContext: {
                languageHints: ["sr", "sr-Latn", "hr", "bs", "en"],
              },
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
      throw new Error(
        "Tekst na računu nije prepoznat. Probajte jasniju fotografiju.",
      );
    }

    return text;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Prepoznavanje teksta je isteklo — pokušajte ponovo.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
