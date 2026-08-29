/**
 * Image upload adapter.
 *
 * ⚠️ OPEN CONTRACT — needs a backend decision.
 *
 * contractRules.md §17 requires `originalPhotoUrl`, `characterImageUrl` and
 * `previewImageUrl` as URLs, but no upload endpoint is specified anywhere in
 * the contract. Until the real endpoint exists, this module hands back a local
 * object URL so the full hider flow can be exercised end to end.
 *
 * When the endpoint is defined, replace ONLY the body of `uploadImage` — the
 * signature is what every caller depends on.
 */

export type UploadKind = 'original' | 'character' | 'preview'

export type UploadImageInput = {
  kind: UploadKind
  blob: Blob
  fileName: string
}

export function uploadImage({ blob }: UploadImageInput): Promise<string> {
  return Promise.resolve(URL.createObjectURL(blob))
}
