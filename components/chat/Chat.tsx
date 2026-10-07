'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import {
  IconArrowRight,
  IconBolt,
  IconBriefcase,
  IconFileCheck,
  IconMapPin,
  IconMessageChatbot,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import { useChat } from '@ai-sdk/react';
import { cn } from '@/lib/utils';
import { CHAT_ERROR } from '@/lib/chat-errors';
import { Avatar } from '@/components/ui/Avatar';
import { Bubble, type BubbleFrom } from '@/components/ui/Bubble';
import { CTA } from '@/components/ui/CTA';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Shell } from '@/components/ui/Shell';
import { TypingDots } from '@/components/ui/TypingDots';
import styles from './chat.module.css';

const QUICK_ACTIONS = [
  {
    label: 'Experience',
    icon: IconBriefcase,
    prompt: 'Walk me through his experience',
  },
  { label: 'Core skills', icon: IconBolt, prompt: 'What are his core skills?' },
  {
    label: 'Match a JD',
    icon: IconFileCheck,
    prompt: "Here's a job description — how closely does he fit?",
  },
  {
    label: 'Available?',
    icon: IconMapPin,
    prompt: 'Is he looking for opportunities?',
  },
] as const;

/** Must match the panelOut/sheetOut duration in chat.module.css. */
const CLOSE_MS = 400;

/** Longest the composer grows before it starts scrolling internally. */
const INPUT_MAX_HEIGHT = 90;

/* Safe to read the clock during render: the panel only mounts after a click,
   so it is never part of the server output and can't mismatch on hydration. */
function timeGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/**
 * Extract plain text from a UIMessage's parts array.
 * AI SDK v7 messages store content in `parts` (an array of typed objects).
 * We pull out every `text` part and join them to render inside our Bubble.
 */
function textFromParts(msg: { role: string; parts?: Array<{ type: string; text?: string }> }): string {
  if (!msg.parts) return '';

  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('');
}

export default function Chat() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [tip, setTip] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /*
   * useChat from @ai-sdk/react manages the full conversation lifecycle:
   *  - `messages`: the conversation history (both user + assistant)
   *  - `sendMessage`: sends a new user message and triggers streaming
   *  - `setMessages`: lets us reset the thread
   *  - `status`: 'ready' | 'submitted' | 'streaming' | 'error'
   *
   * It auto-POSTs to `/api/chat` (the default) and parses the SSE
   * UIMessageStream that our route handler sends back.
   */
  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
  } = useChat();

  console.log('my check 13: ', messages, status, error);

  /** True while the model is still responding. */
  const isStreaming = status === 'submitted' || status === 'streaming';

  /* Only trust messages our server chose; browser-side failures (e.g. a
     dropped connection) carry raw text like "Failed to fetch". */
  const errorMessage =
    error?.message === CHAT_ERROR.offline ? CHAT_ERROR.offline : CHAT_ERROR.retry;

  // Keep the newest turn in view as the thread grows.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isStreaming]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const close = useCallback(() => {
    setTip(false);
    setClosing(true);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setClosing(false);
      setOpen(false);
    }, CLOSE_MS);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  /* The sheet covers the viewport below 1024px, so the page behind it must
     not scroll. From 1024px up the panel is docked and the page stays
     usable, hence the media-query guard. */
  useEffect(() => {
    if (!open || !window.matchMedia('(max-width: 1023px)').matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /**
   * Send a message — called from the textarea, send button, or quick-action
   * chips. Accepts an optional string override so quick actions can pass
   * their prompt directly without touching the textarea.
   */
  const send = useCallback(
    (textOverride?: string) => {
      const value =
        typeof textOverride === 'string'
          ? textOverride.trim()
          : (textareaRef.current?.value ?? '').trim();

      if (!value || isStreaming) return;

      // sendMessage handles everything: appending the user turn,
      // POSTing to /api/chat, streaming the response, and updating
      // the `messages` array on every SSE chunk.
      sendMessage({ text: value });

      // Reset the textarea after sending.
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.value = '';
      }
    },
    [sendMessage, isStreaming],
  );

  const reset = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  /* Grows the textarea with its content up to INPUT_MAX_HEIGHT. Reset to
     'auto' first so scrollHeight reports the shrunk height when text is
     deleted, not the previously-set one. */
  const onDraft = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, INPUT_MAX_HEIGHT)}px`;
  };

  // Enter sends; Shift+Enter is a newline.
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  /** Map SDK message role → Bubble 'from' prop. */
  const roleToFrom = (role: string): BubbleFrom =>
    role === 'user' ? 'me' : 'bot';

  return (
    <>
      {!open && (
        <div className={styles.launcherDock}>
          <span className={styles.tip} data-visible={tip || undefined} aria-hidden>
            Ask about me
          </span>
          <GlassSurface
            as="button"
            type="button"
            radius="full"
            glow="subtle"
            className={styles.launcher}
            title="Ask about Soumya"
            aria-label="Ask about Soumya"
            onClick={() => setOpen(true)}
            onMouseEnter={() => setTip(true)}
            onMouseLeave={() => setTip(false)}
            onFocus={() => setTip(true)}
            onBlur={() => setTip(false)}
          >
            <span className={styles.ring} aria-hidden />
            <Avatar size="sm" className={styles.launcherMark}>
              <IconMessageChatbot />
            </Avatar>
          </GlassSurface>
        </div>
      )}

      {open && (
        <div
          className={styles.dock}
          data-closing={closing || undefined}
          role="dialog"
          aria-modal="true"
          aria-label="Ask about Soumya"
        >
          <Shell className={styles.panel}>
            <header className={styles.header}>
              <Avatar initial="S" online />
              <div className={styles.identity}>
                <span className={styles.name}>Ask about Soumya</span>
                <span className={cn(styles.eyebrow, styles.presence)}>
                  AI assistant · replies instantly
                </span>
              </div>
              <GlassSurface
                as="button"
                type="button"
                radius="full"
                glow="subtle"
                className={cn(styles.iconBtn, styles.resetBtn)}
                title="New chat"
                aria-label="New chat"
                onClick={reset}
              >
                <IconRefresh />
              </GlassSurface>
              <GlassSurface
                as="button"
                type="button"
                radius="full"
                glow="subtle"
                className={cn(styles.iconBtn, styles.closeBtn)}
                title="Close"
                aria-label="Close chat"
                onClick={close}
              >
                <IconX />
              </GlassSurface>
            </header>

            <div ref={threadRef} className={styles.thread}>
              {messages.length === 0 && (
                <div className={styles.intro}>
                  <span className={styles.eyebrow}>{timeGreeting()}</span>
                  <span className={styles.introTitle}>
                    I&apos;m Orbit, Soumya&apos;s assistant.
                  </span>
                  <p className={styles.introBody}>
                    Ask about his experience, skills or availability or paste a
                    job description and I&apos;ll tell you how closely he fits.
                  </p>
                </div>
              )}

              {messages.map((msg) => {
                // Reasoning models stream reasoning parts before any text;
                // the typing dots cover that gap instead of an empty bubble.
                const text = textFromParts(msg);
                return text ? (
                  <Bubble key={msg.id} from={roleToFrom(msg.role)}>
                    {text}
                  </Bubble>
                ) : null;
              })}

              {isStreaming &&
                (messages.length === 0 ||
                  messages[messages.length - 1].role !== 'assistant' ||
                  textFromParts(messages[messages.length - 1]) === '') && (
                  <TypingDots />
                )}

              {error && <Bubble from="bot">{errorMessage}</Bubble>}
            </div>

            <div className={styles.quick}>
              <div className={styles.quickLabel}>
                <span className={styles.eyebrow}>Quick actions</span>
                <span className={styles.quickRule} aria-hidden />
              </div>
              <div className={styles.quickRow}>
                {QUICK_ACTIONS.map(({ label, icon: Icon, prompt }) => (
                  <CTA
                    key={label}
                    variant="ghost"
                    className={styles.chip}
                    onClick={() => send(prompt)}
                  >
                    <Icon className={styles.chipIcon} aria-hidden />
                    {label}
                  </CTA>
                ))}
              </div>
            </div>

            <div className={styles.composer}>
              <div className={styles.field}>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  onChange={onDraft}
                  onKeyDown={onKey}
                  placeholder="Ask anything, or paste a job description…"
                  aria-label="Message"
                  className={styles.input}
                  disabled={isStreaming}
                />
                <CTA
                  variant="primary"
                  className={styles.send}
                  title="Send"
                  aria-label="Send message"
                  disabled={isStreaming}
                  onClick={() => send()}
                >
                  <IconArrowRight />
                </CTA>
              </div>
              <p className={styles.footnote}>Answers drawn from Soumya&apos;s CV</p>
            </div>
          </Shell>
        </div>
      )}
    </>
  );
}
