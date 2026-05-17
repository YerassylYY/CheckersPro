import { useCallback, useEffect, useRef, useState } from 'react'
import type { BotProfile } from '../data/bots'
import { pickChatLine } from '../data/bots'

export interface ChatMessage {
  id: string
  from: 'bot' | 'system'
  text: string
  timestamp: number
}

const TYPING_MS = 2000

let msgCounter = 0

function nextId(): string {
  msgCounter += 1
  return `msg-${msgCounter}-${Date.now()}`
}

export function useBotChat(bot: BotProfile) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  const pushBotLine = useCallback(
    (lines: string[]) => {
      if (typingTimer.current) clearTimeout(typingTimer.current)
      setIsTyping(true)
      typingTimer.current = setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            from: 'bot',
            text: pickChatLine(lines),
            timestamp: Date.now(),
          },
        ])
      }, TYPING_MS)
    },
    [],
  )

  const resetChat = useCallback(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current)
    setMessages([])
    setIsTyping(false)
    msgCounter = 0
  }, [])

  const sendGreeting = useCallback(() => {
    pushBotLine(bot.chatLines.greeting)
  }, [bot, pushBotLine])

  const onUserCapture = useCallback(() => {
    pushBotLine(bot.chatLines.onUserCapture)
  }, [bot, pushBotLine])

  const onBotCapture = useCallback(
    (multiJump = false) => {
      const lines = bot.chatLines.onBotCapture
      pushBotLine(multiJump ? lines : lines)
    },
    [bot, pushBotLine],
  )

  const onBlunder = useCallback(() => {
    if (Math.random() > 0.55) return
    pushBotLine(bot.chatLines.onBlunder)
  }, [bot, pushBotLine])

  const onWin = useCallback(() => {
    pushBotLine(bot.chatLines.onWin)
  }, [bot, pushBotLine])

  const onLose = useCallback(() => {
    pushBotLine(bot.chatLines.onLose)
  }, [bot, pushBotLine])

  useEffect(
    () => () => {
      if (typingTimer.current) clearTimeout(typingTimer.current)
    },
    [],
  )

  return {
    messages,
    isTyping,
    scrollRef,
    resetChat,
    sendGreeting,
    onUserCapture,
    onBotCapture,
    onBlunder,
    onWin,
    onLose,
  }
}
