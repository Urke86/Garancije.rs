# Deprecated — Cloud OCR

This edge function (`ocr-receipt`) used Google Cloud Vision and is **no longer called** by the Garancije.rs mobile app.

As of build 7+, receipt OCR runs **on-device** via ML Kit (`expo-mlkit-ocr`). Do not deploy this function for new releases unless you intentionally maintain a legacy fallback.

Remove `GOOGLE_VISION_API_KEY` from active deployment pipelines.
