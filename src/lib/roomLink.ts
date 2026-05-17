import { generateRoomCode } from './roomCode'

export function generateRoomId(): string {
  return generateRoomCode()
}

export function buildRoomLink(roomId: string): string {
  if (typeof window === 'undefined') {
    return `http://localhost:5173/room/${roomId}`
  }
  return `${window.location.origin}/room/${roomId}`
}

export async function copyRoomLink(roomId: string): Promise<void> {
  await navigator.clipboard.writeText(buildRoomLink(roomId))
}

export function buildSpectateLink(roomId: string): string {
  return `${buildRoomLink(roomId).replace('/room/', '/play/online/')}?spectate=true`
}
