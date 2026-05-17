import type { RefObject } from 'react'
import type { BotProfile } from '../../data/bots'
import type { ChatMessage } from '../../hooks/useBotChat'

interface BotChatProps {
  bot: BotProfile
  messages: ChatMessage[]
  isTyping: boolean
  scrollRef: RefObject<HTMLDivElement | null>
}

export function BotChat({ bot, messages, isTyping, scrollRef }: BotChatProps) {
  const Avatar = bot.avatar

  return (
    <aside className="flex h-full min-h-[280px] flex-col rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-xl lg:min-h-[420px]">
      <header className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bot.avatarBg}`}
        >
          <Avatar className={bot.avatarColor} size={20} strokeWidth={2} />
        </div>
        <div>
          <p className="font-semibold text-zinc-100">{bot.name}</p>
          <p className="text-xs text-zinc-500">{bot.elo} ELO · Online</p>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-4"
        aria-live="polite"
      >
        {messages.length === 0 && !isTyping && (
          <p className="text-center text-xs text-zinc-600">
            Start the clock to hear from {bot.name}…
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-zinc-800 px-3.5 py-2 text-sm leading-relaxed text-zinc-100">
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-zinc-800 px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-zinc-800 px-3 py-2">
        <p className="text-center text-[10px] text-zinc-600">
          Bot messages react to your moves in real time
        </p>
      </footer>
    </aside>
  )
}
