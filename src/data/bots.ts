import {
  Baby,
  GraduationCap,
  Flame,
  Shield,
  Cpu,
  type LucideIcon,
} from 'lucide-react'
import type { AiDifficulty } from '../game/types'

export type BotStyle = 'casual' | 'balanced' | 'aggressive' | 'defensive' | 'perfect'

export interface BotChatLines {
  greeting: string[]
  onUserCapture: string[]
  onBotCapture: string[]
  onBlunder: string[]
  onWin: string[]
  onLose: string[]
}

export interface BotProfile {
  id: string
  name: string
  avatar: LucideIcon
  avatarBg: string
  avatarColor: string
  elo: number
  depth: number
  style: BotStyle
  bio: string
  thinkDelayMs: number
  chatLines: BotChatLines
}

export const BOT_ROSTER: BotProfile[] = [
  {
    id: 'jimmy',
    name: 'Jimmy',
    avatar: Baby,
    avatarBg: 'bg-sky-500/20',
    avatarColor: 'text-sky-400',
    elo: 400,
    depth: 1,
    style: 'casual',
    bio: 'Just learned the rules yesterday. Loves snacks more than captures.',
    thinkDelayMs: 350,
    chatLines: {
      greeting: [
        'Hi!! Wanna play? My mom said I\'m getting better!',
        'Oh cool, checkers! Which way do the pieces go again?',
      ],
      onUserCapture: [
        'Hey, that was my favorite piece... 😢',
        'Wait, you\'re allowed to do that??',
        'Oops, I wasn\'t looking.',
      ],
      onBotCapture: [
        'Got one! Did you see that?!',
        'Yes! My brother taught me that move!',
      ],
      onBlunder: [
        'I think I clicked the wrong square lol',
        'Is it my turn? Oh.',
      ],
      onWin: [
        'I WON!! Tell everyone!!',
        'Best day ever!!',
      ],
      onLose: [
        'Aww, good game... wanna get ice cream?',
        'Rematch?? I wasn\'t ready!',
      ],
    },
  },
  {
    id: 'sarah',
    name: 'Sarah',
    avatar: GraduationCap,
    avatarBg: 'bg-violet-500/20',
    avatarColor: 'text-violet-400',
    elo: 800,
    depth: 2,
    style: 'balanced',
    bio: 'Club player who studies openings but still walks into traps.',
    thinkDelayMs: 500,
    chatLines: {
      greeting: [
        'Hey! Ready for a friendly spar?',
        'Let\'s play — I\'ve been practicing my endgame.',
      ],
      onUserCapture: [
        'Ouch! Didn\'t see that coming.',
        'Okay, fair capture. I\'ll adjust.',
        'Hmm, that complicates things for me.',
      ],
      onBotCapture: [
        'Trade accepted. 😊',
        'There we go — piece up!',
        'Classic fork. Saw that one coming.',
      ],
      onBlunder: [
        'Wait… I had a capture there, didn\'t I?',
        'Brain lag. Ignore that.',
      ],
      onWin: [
        'GG! That was a clean finish.',
        'Thanks for the game — well played on your side too!',
      ],
      onLose: [
        'Nice game! You found the right plan.',
        'I need to review that ending. Rematch soon?',
      ],
    },
  },
  {
    id: 'viktor',
    name: 'Viktor',
    avatar: Flame,
    avatarBg: 'bg-orange-500/20',
    avatarColor: 'text-orange-400',
    elo: 1300,
    depth: 4,
    style: 'aggressive',
    bio: 'Pushes forward like fire. Back rank? Never heard of her.',
    thinkDelayMs: 600,
    chatLines: {
      greeting: [
        'You dare challenge Viktor? Let\'s burn the board.',
        'No defense. Only attack. Ready?',
      ],
      onUserCapture: [
        'Lucky hit. I\'ll return the favor.',
        'Tch. Fine. More room to advance.',
        'You poke the bear — bear remembers.',
      ],
      onBotCapture: [
        'Forward! Always forward!',
        'Another one falls. Press the attack!',
        'Double jump! You cannot stop the tide!',
        'That\'s how Viktor plays — total war!',
      ],
      onBlunder: [
        'You hesitate. I do not.',
        'Missed capture? Amateur hour.',
      ],
      onWin: [
        'Victory belongs to the bold!',
        'As I predicted. Crush or be crushed.',
      ],
      onLose: [
        'Impossible… the board betrayed me.',
        'A rare loss. Respect, warrior.',
      ],
    },
  },
  {
    id: 'chen',
    name: 'Master Chen',
    avatar: Shield,
    avatarBg: 'bg-emerald-500/20',
    avatarColor: 'text-emerald-400',
    elo: 1800,
    depth: 6,
    style: 'defensive',
    bio: 'Fortress on the back row. Patience is the ultimate weapon.',
    thinkDelayMs: 850,
    chatLines: {
      greeting: [
        'Welcome. The board will teach us both something today.',
        'Sit. Breathe. We begin when you are ready.',
      ],
      onUserCapture: [
        'A necessary concession. The position remains sound.',
        'You strike well. I shall consolidate.',
        'Material is temporary. Structure endures.',
      ],
      onBotCapture: [
        'Precision, not haste.',
        'The trap closes quietly.',
        'Your flank was undefended. Classic.',
      ],
      onBlunder: [
        'Opportunity missed. The gods of tactics weep.',
        'When the forcing line appears, one must see it.',
      ],
      onWin: [
        'Harmony on the squares. Thank you for the lesson.',
        'The fortress holds. Well fought.',
      ],
      onLose: [
        'You played with clarity. Honor to the victor.',
        'Even stone may crack. Beautiful game.',
      ],
    },
  },
  {
    id: 'cyber-x',
    name: 'Cyber-X',
    avatar: Cpu,
    avatarBg: 'bg-cyan-500/20',
    avatarColor: 'text-cyan-400',
    elo: 2500,
    depth: 8,
    style: 'perfect',
    bio: 'Neural-grade minimax. Probability of your win: statistically adorable.',
    thinkDelayMs: 1100,
    chatLines: {
      greeting: [
        'OPPONENT DETECTED. INITIALIZING OPTIMAL PLAY.',
        'Hello, human. I have already calculated your defeat.',
      ],
      onUserCapture: [
        'ANOMALY LOGGED. RECALIBRATING EVAL…',
        'Material delta +1 for you. Temporary.',
        'Capture registered. Counter-sequence loading.',
      ],
      onBotCapture: [
        'FORCED SEQUENCE EXECUTED.',
        'MULTI-JUMP OPTIMAL. PAIN THRESHOLD: MAX.',
        'Your piece has been deleted from the matrix.',
        'CHECKMATE PROBABILITY INCREASING.',
      ],
      onBlunder: [
        'ERROR: HUMAN MISSED MANDATORY CAPTURE.',
        'SUBOPTIMAL. I would not recommend that line.',
      ],
      onWin: [
        'GAME OVER. RESULT: INEVITABLE.',
        'Thank you for the training data.',
      ],
      onLose: [
        'IMPOSSIBLE OUTCOME. RERUNNING SIMULATION…',
        'Victory acknowledged. Updating heuristics.',
      ],
    },
  },
]

export function getBotById(id: string): BotProfile | undefined {
  return BOT_ROSTER.find((b) => b.id === id)
}

/** Maps bot strength to legacy quest / stats buckets. */
export function botToLegacyDifficulty(bot: BotProfile): AiDifficulty {
  if (bot.elo < 600) return 'beginner'
  if (bot.elo < 1500) return 'intermediate'
  return 'expert'
}

export function pickChatLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)]
}
