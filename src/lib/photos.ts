// Photo storage — the wedding-photos Supabase Storage bucket. Public bucket
// (photoUrl is a pure string builder, safe from public pages), writes are
// admin-only via storage RLS (see the wedding_photos_storage migration).
import { supabase } from './supabase'

export const PHOTOS_BUCKET = 'wedding-photos'

/** Public URL for a stored path, or null if there's nothing to show. */
export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl
}

const MAX_BYTES = 10 * 1024 * 1024

/**
 * Uploads a file under `prefix/` with a random name (never trusts the
 * original filename) and returns the stored path, or null on failure.
 */
export async function uploadPhoto(file: File, prefix: string): Promise<string | null> {
  if (file.size > MAX_BYTES) {
    console.error(`[union] photo too large: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB, max 10MB)`)
    return null
  }
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file)
  if (error) { console.error('[union] photo upload failed:', error.message); return null }
  return path
}

/** Best-effort delete — a failure here shouldn't block removing the DB row
 *  that pointed at it, so callers don't need to check the result. */
export async function deletePhotoFile(path: string | null | undefined): Promise<void> {
  if (!path) return
  const { error } = await supabase.storage.from(PHOTOS_BUCKET).remove([path])
  if (error) console.error('[union] photo delete failed:', error.message)
}
