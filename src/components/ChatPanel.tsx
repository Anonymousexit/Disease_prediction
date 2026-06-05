import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api, type Message } from '../api';

interface ChatPanelProps {
  referralId: number;
  currentUserType: 'patient' | 'doctor';
  currentUserId: number;
  partnerName: string;
  disease: string;
  onClose: () => void;
}

export default function ChatPanel({
  referralId, currentUserType, currentUserId, partnerName, disease, onClose,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchMessages = async () => {
    try {
      const msgs = await api.getMessages(referralId);
      setMessages(msgs);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    api.markMessagesRead(referralId, currentUserType).catch(() => {});
    const interval = setInterval(() => {
      fetchMessages();
      api.markMessagesRead(referralId, currentUserType).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [referralId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      await api.sendMessage(referralId, {
        sender_type: currentUserType,
        sender_id: currentUserId,
        content: newMessage.trim(),
      });
      setNewMessage('');
      await fetchMessages();
    } catch { /* silent */ } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getDateLabel = (d: string) => {
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { label: string; msgs: Message[] }[] = [];
  let currentLabel = '';
  for (const msg of messages) {
    const label = getDateLabel(msg.created_at);
    if (label !== currentLabel) {
      currentLabel = label;
      groupedMessages.push({ label, msgs: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].msgs.push(msg);
    }
  }

  const isSent = (msg: Message) => msg.sender_type === currentUserType;
  const partnerType = currentUserType === 'patient' ? 'Doctor' : 'Patient';

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white dark:bg-slate-900 shadow-2xl shadow-black/20 z-[61] flex flex-col"
      >
        {/* ── Header ───────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary">chat</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{partnerName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{disease} • {partnerType}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-xl">close</span>
          </button>
        </div>

        {/* ── Messages ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50 dark:bg-background-dark">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">forum</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No messages yet</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs max-w-[240px]">
                Start the conversation about the {disease} diagnosis with {partnerName}.
              </p>
            </div>
          ) : (
            groupedMessages.map((group, gi) => (
              <div key={gi}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>

                {/* Messages in this date group */}
                <div className="space-y-2.5">
                  {group.msgs.map((msg, mi) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: gi === groupedMessages.length - 1 ? mi * 0.03 : 0 }}
                      className={`flex ${isSent(msg) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] group`}>
                        <div
                          className={`px-4 py-2.5 text-sm leading-relaxed ${
                            isSent(msg)
                              ? 'bg-primary text-white rounded-2xl rounded-br-md shadow-sm shadow-primary/20'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-md shadow-sm border border-slate-100 dark:border-slate-700'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className={`flex items-center gap-1.5 mt-1 px-1 ${isSent(msg) ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatTime(msg.created_at)}</span>
                          {isSent(msg) && (
                            <span className={`material-symbols-outlined text-xs ${msg.is_read ? 'text-primary' : 'text-slate-300 dark:text-slate-600'}`}>
                              {msg.is_read ? 'done_all' : 'done'}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ─────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                style={{ maxHeight: '120px', minHeight: '40px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="size-10 rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex-shrink-0"
            >
              <span className="material-symbols-outlined text-lg">
                {sending ? 'more_horiz' : 'send'}
              </span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 px-1">Press Enter to send • Shift+Enter for new line</p>
        </div>
      </motion.div>
    </>
  );
}
