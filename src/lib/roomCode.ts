const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** 6-character room code (no ambiguous 0/O/1/I). */
export function generateRoomCode(): string {
  let code = ''
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length]
  }
  return code
}

export function normalizeRoomCode(raw: string | undefined): string | null {
  if (!raw) return null
  const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  return code.length >= 4 && code.length <= 8 ? code.slice(0, 6) : null
}
