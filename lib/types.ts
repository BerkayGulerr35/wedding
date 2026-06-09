// Shared between client and server. No Node-only imports here.

export interface UploadMeta {
  /** Random short id, also part of the stored filename. */
  id: string;
  /** The actual filename on disk / key in R2 (includes timestamp + name + id). */
  storedName: string;
  /** Original filename as the guest's device reported it. */
  originalName: string;
  /** Guest name (optional). */
  name: string | null;
  /** Guest note / message (optional, may be long / multiline). */
  note: string | null;
  /** MIME type, e.g. image/jpeg. */
  mime: string;
  /** Size in bytes. */
  size: number;
  /** ISO timestamp. */
  createdAt: string;
  /** Whether the file was successfully mirrored to Cloudflare R2. */
  r2: boolean;
}

/**
 * Lightweight entry for the admin gallery. Built straight from the media
 * filename (no sidecar read) — so it has no free-text note.
 */
export interface AdminItem {
  storedName: string;
  isImage: boolean;
  /** Guest name parsed from the filename (null if anonymous). */
  name: string | null;
  /** Upload time parsed from the filename. */
  createdAt: string;
}
