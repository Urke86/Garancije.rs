/**
 * Portfolio/demo mode: replaces Supabase with seeded in-memory data so every
 * screen renders a complete, realistic state without touching the real backend.
 * Enabled only when the bundle is built with EXPO_PUBLIC_DEMO_MODE=1.
 */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === '1';

export const DEMO_OCR_KEY = 'pending-ocr:demo';
