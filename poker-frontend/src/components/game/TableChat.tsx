import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronRight, Send, X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import type { ChatMessage } from '../../store/gameStore';

// ─── Quick emote presets ──────────────────────────────────────────────────────

const QUICK_EMOTES: Array<{ label: string; message: string }> = [
  { label: '👍 Good hand!',  message: 'Good hand!' },
  { label: '🔥 Nice bet',    message: 'Nice bet!' },
  { label: '😤 Well played', message: 'Well played!' },
  { label: '🤔 Hmm...',      message: 'Hmm...' },
  { label: '😂 lol',         message: 'lol' },
  { label: '😎 GG',          message: 'GG' },
  { label: '🙏 Good luck',   message: 'Good luck everyone!' },
  { label: '😱 Wow!',        message: 'Wow!' },
];

// ─── Timestamp formatter ──────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

// ─── Single message row ───────────────────────────────────────────────────────

const MessageRow: React.FC<{ msg: ChatMessage; isOwn: boolean }> = ({
  msg,
  isOwn,
}) => {
  if (msg.isSystem) {
    return (
      <div className="flex items-center gap-2 py-0.5">
        <div className="flex-1 h-px bg-surface-elevated/50" />
        <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap px-1">
          {msg.message}
        </span>
        <div className="flex-1 h-px bg-surface-elevated/50" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} gap-0.5`}
    >
      {/* Username + time */}
      <div className={`flex items-baseline gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
        <span
          className={`text-[10px] font-bold ${
            isOwn ? 'text-gold/80' : 'text-neon-blue/80'
          }`}
        >
          {isOwn ? 'You' : msg.username}
        </span>
        <span className="text-[9px] text-slate-700">{formatTime(msg.timestamp)}</span>
      </div>

      {/* Bubble */}
      <div
        className={`
          max-w-[85%] px-3 py-1.5 rounded-2xl text-xs text-slate-200 leading-relaxed
          ${isOwn
            ? 'bg-gold/15 border border-gold/20 rounded-tr-sm'
            : 'bg-surface-card/80 border border-surface-elevated/60 rounded-tl-sm'
          }
        `}
      >
        {msg.message}
      </div>
    </motion.div>
  );
};

// ─── TableChat ────────────────────────────────────────────────────────────────

interface TableChatProps {
  /** Fired when user sends a message — parent routes to sendChat() */
  onSendMessage: (message: string) => void;
  /** Optional: mount collapsed */
  defaultCollapsed?: boolean;
}

export const TableChat: React.FC<TableChatProps> = ({
  onSendMessage,
  defaultCollapsed = false,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [input, setInput] = useState('');
  const [showEmotes, setShowEmotes] = useState(false);

  const chatMessages = useGameStore((s) => s.chatMessages);
  const { username } = useAuthStore();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!collapsed) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, collapsed]);

  // Focus input when panel opens
  useEffect(() => {
    if (!collapsed) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [collapsed]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput('');
    setShowEmotes(false);
  }, [input, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') setShowEmotes(false);
  };

  const handleEmote = (message: string) => {
    onSendMessage(message);
    setShowEmotes(false);
  };

  // Unread count when collapsed
  const [lastSeenCount, setLastSeenCount] = useState(chatMessages.length);
  const unread = collapsed ? Math.max(0, chatMessages.length - lastSeenCount) : 0;

  const handleToggle = () => {
    setCollapsed((c) => {
      if (c) setLastSeenCount(chatMessages.length);
      return !c;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header / Toggle bar ──────────────────────────────────────────── */}
      <button
        onClick={handleToggle}
        className="
          flex items-center justify-between w-full
          px-3 py-2.5 rounded-xl
          bg-surface/80 border border-surface-elevated/60
          hover:border-surface-elevated hover:bg-surface-card/60
          transition-all duration-150 select-none
        "
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-gold/70" />
          <span className="text-xs font-bold text-slate-300">Live Chat</span>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-gold/80 text-surface">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: collapsed ? 0 : 90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight size={13} className="text-slate-600" />
        </motion.div>
      </button>

      {/* ── Collapsible panel ────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="chat-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="
              mt-1.5 flex flex-col rounded-xl overflow-hidden
              bg-surface/80 border border-surface-elevated/60
              backdrop-blur-sm
            ">
              {/* Message list */}
              <div className="flex flex-col gap-2 p-3 overflow-y-auto h-52 scrollbar-thin">
                {chatMessages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-slate-700 text-center">
                      No messages yet.<br />Say hello! 👋
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <MessageRow
                      key={msg.id}
                      msg={msg}
                      isOwn={msg.username === username}
                    />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick emotes panel */}
              <AnimatePresence>
                {showEmotes && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden border-t border-surface-elevated/40"
                  >
                    <div className="p-2 grid grid-cols-2 gap-1">
                      {QUICK_EMOTES.map(({ label, message }) => (
                        <button
                          key={label}
                          onClick={() => handleEmote(message)}
                          className="
                            text-left px-2.5 py-1.5 rounded-lg text-[10px]
                            font-medium text-slate-400
                            hover:bg-surface-elevated/50 hover:text-slate-200
                            transition-colors duration-100 truncate
                          "
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input bar */}
              <div className="flex items-center gap-1.5 p-2 border-t border-surface-elevated/40">
                {/* Emote toggle */}
                <button
                  onClick={() => setShowEmotes((v) => !v)}
                  title="Quick reactions"
                  className={`
                    flex-shrink-0 p-1.5 rounded-lg text-base leading-none transition-colors
                    ${showEmotes
                      ? 'bg-gold/15 text-gold'
                      : 'text-slate-600 hover:text-slate-300 hover:bg-surface-elevated/40'
                    }
                  `}
                >
                  😊
                </button>

                <input
                  ref={inputRef}
                  id="chat-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Say something…"
                  maxLength={200}
                  className="
                    flex-1 min-w-0 bg-transparent text-xs text-slate-300
                    placeholder-slate-700 outline-none
                  "
                />

                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="
                    flex-shrink-0 p-1.5 rounded-lg transition-colors
                    disabled:opacity-30 disabled:cursor-not-allowed
                    text-gold/70 hover:text-gold hover:bg-gold/10
                  "
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
