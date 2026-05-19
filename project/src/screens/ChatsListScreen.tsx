import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit3, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  isGroup: boolean;
  avatar?: string;
};

export default function ChatsListScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<ChatItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load conversations
    const { data: convos } = await supabase
      .from('conversations')
      .select('*, user1:profiles!conversations_user1_id_fkey(*), user2:profiles!conversations_user2_id_fkey(*)')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    // Load groups
    const { data: memberGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    const groupIds = (memberGroups || []).map(m => m.group_id);
    let groups: any[] = [];
    if (groupIds.length > 0) {
      const { data } = await supabase
        .from('group_chats')
        .select('*')
        .in('id', groupIds)
        .order('last_message_at', { ascending: false });
      groups = data || [];
    }

    const chatItems: ChatItem[] = [];

    (convos || []).forEach((c: any) => {
      const other = c.user1_id === user.id ? c.user2 : c.user1;
      if (!other) return;
      chatItems.push({
        id: c.id,
        name: other.username,
        lastMessage: c.last_message || 'Say hello!',
        time: formatTime(c.last_message_at),
        unread: 0,
        isOnline: other.is_online,
        isGroup: false,
        avatar: other.avatar_url,
      });
    });

    groups.forEach(g => {
      chatItems.push({
        id: g.id,
        name: g.name,
        lastMessage: g.last_message || 'Group created',
        time: formatTime(g.last_message_at),
        unread: 0,
        isOnline: false,
        isGroup: true,
        avatar: g.avatar_url,
      });
    });

    setChats(chatItems);
  }

  function formatTime(ts: string) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  const filtered = chats.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0e17',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '48px 20px 14px',
        background: '#111827',
        borderBottom: '1px solid #1e2a3d',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <h1 style={{ color: '#f0f4ff', fontSize: 24, fontWeight: 700 }}>
            Chats
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <IconBtn onClick={() => {}}>
              <Users size={18} color="#8b9ab5" />
            </IconBtn>
            <IconBtn onClick={() => {}}>
              <Edit3 size={18} color="#8b9ab5" />
            </IconBtn>
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#161d2e',
          borderRadius: 14,
          padding: '10px 14px',
          border: '1px solid #1e2a3d',
        }}>
          <Search size={16} color="#4a5568" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: '#f0f4ff',
            }}
          />
        </div>
      </div>

      {/* Chats list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          filtered.map(chat => (
            <ChatRow
              key={chat.id}
              chat={chat}
              onClick={() => navigate(chat.isGroup ? `/group/${chat.id}` : `/chat/${chat.id}`)}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => {}}
        style={{
          position: 'absolute',
          bottom: 80,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a73e8, #1558b0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(26,115,232,0.4)',
          zIndex: 10,
        }}
      >
        <Plus size={24} color="white" />
      </button>
    </div>
  );
}

function ChatRow({ chat, onClick }: { chat: ChatItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 20px',
        background: 'none',
        borderBottom: '1px solid #111827',
        textAlign: 'left',
        transition: 'background 0.15s',
      }}
      onMouseDown={e => (e.currentTarget.style.background = '#111827')}
      onMouseUp={e => (e.currentTarget.style.background = 'none')}
      onTouchStart={e => (e.currentTarget.style.background = '#111827')}
      onTouchEnd={e => (e.currentTarget.style.background = 'none')}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: chat.isGroup
            ? 'linear-gradient(135deg, #1a73e8, #0d47a1)'
            : 'linear-gradient(135deg, #2d3748, #1a2035)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 700,
          color: 'white',
          overflow: 'hidden',
        }}>
          {chat.avatar ? (
            <img src={chat.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : chat.name.charAt(0).toUpperCase()}
        </div>
        {!chat.isGroup && (
          <div style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 11,
            height: 11,
            borderRadius: '50%',
            background: chat.isOnline ? '#22c55e' : '#374151',
            border: '2px solid #0a0e17',
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            color: '#f0f4ff',
            fontSize: 15,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '65%',
          }}>
            {chat.name}
          </span>
          <span style={{ color: chat.unread > 0 ? '#1a73e8' : '#4a5568', fontSize: 11 }}>
            {chat.time}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
          <span style={{
            color: '#4a5568',
            fontSize: 13,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '80%',
          }}>
            {chat.lastMessage}
          </span>
          {chat.unread > 0 && (
            <div style={{
              background: '#1a73e8',
              color: 'white',
              borderRadius: 10,
              padding: '2px 7px',
              fontSize: 11,
              fontWeight: 700,
            }}>
              {chat.unread}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60%',
      gap: 12,
      padding: 32,
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: '#161d2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Edit3 size={28} color="#2d3748" />
      </div>
      <p style={{ color: '#4a5568', fontSize: 15, textAlign: 'center' }}>
        {search ? `No chats matching "${search}"` : 'No chats yet. Start a conversation!'}
      </p>
    </div>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: '#161d2e',
        border: '1px solid #1e2a3d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}
