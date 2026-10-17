import { useEffect, useRef, useState } from 'react';
import { Send, ShieldCheck } from 'lucide-react';
import Sheet from '../Sheet.jsx';
import { meetApi } from '../../api.js';

const POLL_MS = 4000;

/** Merge messages by id (polling and sending can race and return the same message). */
const merge = (list, incoming) => {
  const seen = new Set(list.map((m) => m.id));
  return [...list, ...incoming.filter((m) => !seen.has(m.id))].sort((a, b) => a.id - b.id);
};

export default function ChatSheet({ connection, onClose, onSafety, toast }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const lastId = useRef(0);
  const listRef = useRef(null);
  const rider = connection.rider;

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const { messages: fresh } = await meetApi.messages(connection.id, lastId.current);
        if (!alive || fresh.length === 0) return;
        lastId.current = Math.max(lastId.current, fresh[fresh.length - 1].id);
        setMessages((m) => merge(m, fresh));
      } catch {
        // transient network errors: the next poll retries
      }
    };
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [connection.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      const { message } = await meetApi.send(connection.id, body);
      setMessages((m) => merge(m, [message]));
    } catch (err) {
      toast(err.message);
      setText(body);
    }
  };

  return (
    <Sheet open onClose={onClose} title={`${rider.avatar} ${rider.name}`}>
      <p className="chat-safety">
        <ShieldCheck size={16} /> Meet in busy spots — lift stations, the main lodge. Don’t share where you’re staying.
      </p>
      <div className="chat-list" ref={listRef} aria-live="polite">
        {messages.length === 0 && <p className="muted chat-empty">Say hi and suggest a meeting point 👋</p>}
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.mine ? 'is-mine' : ''}`}>
            {m.body}
            <time>{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
          </div>
        ))}
      </div>
      <form className="chat-input" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${rider.name}`}
          maxLength={500}
          aria-label="Message"
        />
        <button className="icon-btn icon-btn-primary" type="submit" aria-label="Send" disabled={!text.trim()}>
          <Send size={18} />
        </button>
      </form>
      <div className="chat-safety-actions">
        <button className="link" onClick={() => onSafety('block')}>
          Block {rider.name}
        </button>
        <button className="link" onClick={() => onSafety('Made me feel unsafe')}>
          Report
        </button>
      </div>
    </Sheet>
  );
}
