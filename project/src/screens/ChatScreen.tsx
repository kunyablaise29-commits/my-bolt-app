import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Phone, Video, MoreVertical,
  Smile, Paperclip, Camera, Mic, Send,
  Check, CheckCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Message, Profile } from '../lib/supabase';

export default function ChatScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChat();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadChat() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) return;
    setCurrentUserId(user.id);

    const { data: conv } = await supabase
      .from('conversations')
      .select('*, user1:profiles!conversations_user1_id_fkey(*), user2:profiles!conversations_user2_id_fkey(*)')
      .eq('id', id)
      .maybeSingle();

    if (conv) {
      const other = conv.user1_id === user.id ? conv.user2 : conv.user1;
      setOtherUser(other);
    }

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    setMessages(msgs || []);

    // Realtime
    const channel = supabase
      .channel(`chat-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }

  async function sendMessage() {
    if (!input.trim() || !id || !currentUserId || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: currentUserId,
      content,
      message_type: 'text',
      status: 'sent',
    });

    await supabase.from('conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq('id', id);

    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function groupMessages(msgs: Message[]) {
    const groups: { date: string; messages: Message[] }[] = [];
    msgs.forEach(m => {
      const date = new Date(m.created_at).toLocaleDateString([], {
        weekday: 'long', month: 'short', day: 'numeric',
      });
      const last = groups[groups.length - 1];
      if (!last || last.date !== date) {
        groups.push({ date, messages: [m] });
      } else {
        last.messages.push(m);
      }
    });
    return groups;
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 420,
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0e17',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '44px 16px 14px',
        background: '#111827',
        borderBottom: '1px solid #1e2a3d',
        gap: 12,
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', padding: 6, color: '#8b9ab5' }}
        >
          <ArrowLeft size={22} />
        </button>

        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a73e8, #1558b0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            color: 'white',
          }}>
            {otherUser?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div style={{
            position: 'absolute',
            bottom: 1,
            right: 1,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: otherUser?.is_online ? '#22c55e' : '#374151',
            border: '2px solid #111827',
          }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ color: '#f0f4ff', fontSize: 15, fontWeight: 600 }}>
            {otherUser?.username || 'Chat'}
          </div>
          <div style={{
            color: otherUser?.is_online ? '#22c55e' : '#4a5568',
            fontSize: 11,
          }}>
            {otherUser?.is_online ? 'Online' : 'Offline'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <HeaderBtn><Phone size={18} color="#8b9ab5" /></HeaderBtn>
          <HeaderBtn><Video size={18} color="#8b9ab5" /></HeaderBtn>
          <HeaderBtn><MoreVertical size={18} color="#8b9ab5" /></HeaderBtn>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        background: 'linear-gradient(180deg, #0a0e17 0%, #0d1322 100%)',
      }}>
        {groupMessages(messages).map(group => (
          <div key={group.date}>
            <DateDivider label={group.date} />
            {group.messages.map((msg, i) => {
              const isMine = msg.sender_id === currentUserId;
              const isLast = i === group.messages.length - 1 ||
                group.messages[i + 1]?.sender_id !== msg.sender_id;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={isMine}
                  isLast={isLast}
                  time={formatTime(msg.created_at)}
                />
              );
            })}
          </div>
        ))}
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 60,
          }}>
            <div style={{
              background: 'rgba(26,115,232,0.08)',
              border: '1px solid rgba(26,115,232,0.15)',
              borderRadius: 16,
              padding: '12px 20px',
              color: '#4a5568',
              fontSize: 13,
              textAlign: 'center',
            }}>
              Say hello to {otherUser?.username || 'your contact'}! 👋
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        padding: '10px 14px 16px',
        background: '#111827',
        borderTop: '1px solid #1e2a3d',
        flexShrink: 0,
      }}>
        <button style={{ padding: 8, background: 'none', color: '#4a5568' }}>
          <Smile size={22} />
        </button>

        <div style={{
          flex: 1,
          background: '#161d2e',
          borderRadius: 22,
          border: '1px solid #1e2a3d',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 14px',
          gap: 8,
          minHeight: 42,
        }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: '#f0f4ff',
            }}
          />
          <button style={{ background: 'none', color: '#4a5568' }}>
            <Paperclip size={18} />
          </button>
          <button style={{ background: 'none', color: '#4a5568' }}>
            <Camera size={18} />
          </button>
        </div>

        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: input.trim()
              ? 'linear-gradient(135deg, #1a73e8, #1558b0)'
              : '#161d2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s',
            boxShadow: input.trim() ? '0 4px 12px rgba(26,115,232,0.3)' : 'none',
          }}
        >
          {input.trim() ? (
            <Send size={18} color="white" />
          ) : (
            <Mic size={18} color="#4a5568" />
          )}
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message, isMine, isLast, time }: {
  message: Message;
  isMine: boolean;
  isLast: boolean;
  time: string;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: isMine ? 'flex-end' : 'flex-start',
      marginBottom: isLast ? 8 : 2,
    }}>
      <div style={{
        maxWidth: '75%',
        background: isMine
          ? 'linear-gradient(135deg, #1a73e8, #1558b0)'
          : '#1e2a3d',
        borderRadius: isMine
          ? '18px 18px 4px 18px'
          : '18px 18px 18px 4px',
        padding: '10px 14px',
        position: 'relative',
      }}>
        <p style={{
          color: isMine ? 'white' : '#e2e8f0',
          fontSize: 14,
          lineHeight: 1.5,
          marginBottom: 4,
          wordBreak: 'break-word',
        }}>
          {message.content}
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 4,
        }}>
          <span style={{
            color: isMine ? 'rgba(255,255,255,0.6)' : '#4a5568',
            fontSize: 10,
          }}>
            {time}
          </span>
          {isMine && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
}

function MessageStatus({ status }: { status: string }) {
  if (status === 'read') {
    return <CheckCheck size={14} color="#60a5fa" />;
  }
  if (status === 'delivered') {
    return <CheckCheck size={14} color="rgba(255,255,255,0.6)" />;
  }
  return <Check size={14} color="rgba(255,255,255,0.6)" />;
}

function DateDivider({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      margin: '12px 0 8px',
    }}>
      <div style={{ flex: 1, height: 1, background: '#1e2a3d' }} />
      <span style={{
        color: '#4a5568',
        fontSize: 11,
        whiteSpace: 'nowrap',
        background: '#141c2d',
        padding: '3px 10px',
        borderRadius: 10,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: '#1e2a3d' }} />
    </div>
  );
}

function HeaderBtn({ children }: { children: React.ReactNode }) {
  return (
    <button style={{
      width: 36,
      height: 36,
      borderRadius: 10,
      background: '#161d2e',
      border: '1px solid #1e2a3d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {children}
    </button>
  );
}
