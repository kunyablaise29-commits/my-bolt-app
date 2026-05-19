import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Phone, Video, MoreVertical,
  Smile, Paperclip, Camera, Mic, Send,
  Check, CheckCheck, Users, UserPlus, Edit2, Trash2, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Message } from '../lib/supabase';

type GroupInfo = {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  memberCount: number;
};

type Member = {
  id: string;
  username: string;
  is_online: boolean;
  is_admin: boolean;
};

export default function GroupChatScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGroup();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadGroup() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) return;
    setCurrentUserId(user.id);

    const { data: groupData } = await supabase
      .from('group_chats').select('*').eq('id', id).maybeSingle();

    const { data: groupMembers } = await supabase
      .from('group_members')
      .select('*, profile:profiles(*)')
      .eq('group_id', id);

    if (groupData) {
      setGroup({
        ...groupData,
        memberCount: (groupMembers || []).length,
      });
    }

    const memberList: Member[] = (groupMembers || []).map((m: any) => ({
      id: m.user_id,
      username: m.profile?.username || 'Unknown',
      is_online: m.profile?.is_online || false,
      is_admin: m.is_admin,
    }));
    setMembers(memberList);

    const me = (groupMembers || []).find((m: any) => m.user_id === user.id);
    setIsAdmin(me?.is_admin || false);

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', id)
      .order('created_at', { ascending: true });

    setMessages(msgs || []);

    const channel = supabase
      .channel(`group-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${id}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }

  async function sendMessage() {
    if (!input.trim() || !id || !currentUserId) return;
    const content = input.trim();
    setInput('');

    await supabase.from('messages').insert({
      group_id: id,
      sender_id: currentUserId,
      content,
      message_type: 'text',
      status: 'sent',
    });

    await supabase.from('group_chats').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq('id', id);
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function getSenderName(senderId: string) {
    const m = members.find(m => m.id === senderId);
    return m?.username || 'Unknown';
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
        position: 'relative',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', padding: 6, color: '#8b9ab5' }}>
          <ArrowLeft size={22} />
        </button>

        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0,
        }}>
          {group?.name.charAt(0).toUpperCase() || 'G'}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ color: '#f0f4ff', fontSize: 15, fontWeight: 600 }}>
            {group?.name || 'Group Chat'}
          </div>
          <div style={{ color: '#4a5568', fontSize: 11 }}>
            <Users size={10} style={{ display: 'inline', marginRight: 3 }} />
            {group?.memberCount || members.length} members
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <HeaderBtn><Phone size={18} color="#8b9ab5" /></HeaderBtn>
          <HeaderBtn><Video size={18} color="#8b9ab5" /></HeaderBtn>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#161d2e', border: '1px solid #1e2a3d',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MoreVertical size={18} color="#8b9ab5" />
          </button>
        </div>

        {/* Dropdown menu */}
        {showMenu && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 16,
            background: '#161d2e',
            border: '1px solid #1e2a3d',
            borderRadius: 14,
            overflow: 'hidden',
            zIndex: 100,
            minWidth: 180,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <MenuItem icon={<UserPlus size={15} color="#1a73e8" />} label="Add Members" />
            {isAdmin && <MenuItem icon={<Edit2 size={15} color="#8b9ab5" />} label="Edit Group" />}
            {isAdmin && <MenuItem icon={<Trash2 size={15} color="#ef4444" />} label="Delete Group" danger />}
            <MenuItem icon={<X size={15} color="#8b9ab5" />} label="Close" onClick={() => setShowMenu(false)} />
          </div>
        )}
      </div>

      {/* Members strip */}
      <div style={{
        display: 'flex',
        gap: 12,
        padding: '8px 16px',
        overflowX: 'auto',
        background: '#0d1322',
        borderBottom: '1px solid #1e2a3d',
        flexShrink: 0,
      }}>
        {members.slice(0, 8).map(m => (
          <div key={m.id} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            minWidth: 44,
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: m.is_admin
                  ? 'linear-gradient(135deg, #f4a261, #e76f51)'
                  : 'linear-gradient(135deg, #2d3748, #1a2035)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'white',
                border: m.id === currentUserId ? '2px solid #1a73e8' : '2px solid transparent',
              }}>
                {m.username.charAt(0).toUpperCase()}
              </div>
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 8, height: 8, borderRadius: '50%',
                background: m.is_online ? '#22c55e' : '#374151',
                border: '1.5px solid #0d1322',
              }} />
            </div>
            <span style={{
              color: '#4a5568', fontSize: 9,
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', maxWidth: 44,
            }}>
              {m.id === currentUserId ? 'You' : m.username.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#4a5568', fontSize: 13 }}>
              Welcome to {group?.name}! Say hello to the group.
            </p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === currentUserId;
          const isLast = i === messages.length - 1 ||
            messages[i + 1]?.sender_id !== msg.sender_id;
          return (
            <GroupMessageBubble
              key={msg.id}
              message={msg}
              isMine={isMine}
              isLast={isLast}
              senderName={getSenderName(msg.sender_id)}
              time={formatTime(msg.created_at)}
              isFirstFromSender={i === 0 || messages[i - 1]?.sender_id !== msg.sender_id}
            />
          );
        })}
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
        }}>
          <input
            type="text"
            placeholder="Message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
            style={{
              flex: 1, background: 'none', border: 'none',
              outline: 'none', fontSize: 14, color: '#f0f4ff',
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
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: input.trim()
              ? 'linear-gradient(135deg, #1a73e8, #1558b0)'
              : '#161d2e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: input.trim() ? '0 4px 12px rgba(26,115,232,0.3)' : 'none',
          }}
        >
          {input.trim() ? <Send size={18} color="white" /> : <Mic size={18} color="#4a5568" />}
        </button>
      </div>
    </div>
  );
}

function GroupMessageBubble({ message, isMine, isLast, senderName, time, isFirstFromSender }: {
  message: Message;
  isMine: boolean;
  isLast: boolean;
  senderName: string;
  time: string;
  isFirstFromSender: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: isMine ? 'flex-end' : 'flex-start',
      marginBottom: isLast ? 8 : 2,
    }}>
      <div style={{ maxWidth: '75%' }}>
        {!isMine && isFirstFromSender && (
          <div style={{ color: '#1a73e8', fontSize: 11, fontWeight: 600, marginBottom: 3, marginLeft: 4 }}>
            {senderName}
          </div>
        )}
        <div style={{
          background: isMine
            ? 'linear-gradient(135deg, #1a73e8, #1558b0)'
            : '#1e2a3d',
          borderRadius: isMine
            ? '18px 18px 4px 18px'
            : '18px 18px 18px 4px',
          padding: '10px 14px',
        }}>
          <p style={{
            color: isMine ? 'white' : '#e2e8f0',
            fontSize: 14, lineHeight: 1.5, marginBottom: 4, wordBreak: 'break-word',
          }}>
            {message.content}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <span style={{ color: isMine ? 'rgba(255,255,255,0.6)' : '#4a5568', fontSize: 10 }}>
              {time}
            </span>
            {isMine && (
              message.status === 'read'
                ? <CheckCheck size={14} color="#60a5fa" />
                : <Check size={14} color="rgba(255,255,255,0.6)" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, danger, onClick }: {
  icon: React.ReactNode; label: string; danger?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        background: 'none',
        color: danger ? '#ef4444' : '#e2e8f0',
        fontSize: 13,
        borderBottom: '1px solid #1e2a3d',
        textAlign: 'left',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function HeaderBtn({ children }: { children: React.ReactNode }) {
  return (
    <button style={{
      width: 36, height: 36, borderRadius: 10,
      background: '#161d2e', border: '1px solid #1e2a3d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </button>
  );
}
