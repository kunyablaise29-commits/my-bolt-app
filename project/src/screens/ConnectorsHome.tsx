import { useNavigate } from 'react-router-dom';
import { Tv, Search, TrendingUp, Briefcase, Settings, ChevronRight, Wifi } from 'lucide-react';
import IcelandLogo from '../components/IcelandLogo';

const tiles = [
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: Tv,
    color: '#e91e63',
    bg: 'rgba(233,30,99,0.1)',
    border: 'rgba(233,30,99,0.2)',
    desc: 'Movies, music & more',
  },
  {
    id: 'research',
    label: 'Research',
    icon: Search,
    color: '#00bcd4',
    bg: 'rgba(0,188,212,0.1)',
    border: 'rgba(0,188,212,0.2)',
    desc: 'Explore and discover',
  },
  {
    id: 'lead-creations',
    label: 'Lead Creations',
    icon: TrendingUp,
    color: '#4caf50',
    bg: 'rgba(76,175,80,0.1)',
    border: 'rgba(76,175,80,0.2)',
    desc: 'Grow your network',
  },
  {
    id: 'business',
    label: 'Business Corner',
    icon: Briefcase,
    color: '#ff9800',
    bg: 'rgba(255,152,0,0.1)',
    border: 'rgba(255,152,0,0.2)',
    desc: 'Business tools & contacts',
  },
];

export default function ConnectorsHome() {
  const navigate = useNavigate();

  return (
    <div style={{
      width: '100%',
      maxWidth: 420,
      height: '100dvh',
      background: 'linear-gradient(160deg, #0a0e17 0%, #0d1b2e 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '48px 24px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        borderBottom: '1px solid #1e2a3d',
        background: 'linear-gradient(180deg, #111827 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 8px #22c55e',
          }} />
          <span style={{ color: '#22c55e', fontSize: 11, letterSpacing: 1 }}>CONNECTED</span>
        </div>
        <IcelandLogo size={50} />
        <h1 style={{
          color: '#f0f4ff',
          fontSize: 26,
          fontWeight: 700,
          marginTop: 20,
          letterSpacing: -0.5,
          textAlign: 'center',
        }}>
          Where do we go?
        </h1>
        <p style={{ color: '#4a5568', fontSize: 13, textAlign: 'center' }}>
          Choose your destination
        </p>
      </div>

      {/* Tiles */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {tiles.map((tile, i) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.id}
              onClick={() => navigate('/')}
              style={{
                width: '100%',
                background: tile.bg,
                border: `1px solid ${tile.border}`,
                borderRadius: 18,
                padding: '20px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                textAlign: 'left',
                animation: `slideUp 0.35s ease ${i * 0.06}s both`,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: `${tile.color}22`,
                border: `1px solid ${tile.color}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={24} color={tile.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#f0f4ff', fontSize: 16, fontWeight: 600 }}>
                  {tile.label}
                </div>
                <div style={{ color: '#4a5568', fontSize: 12, marginTop: 2 }}>
                  {tile.desc}
                </div>
              </div>
              <ChevronRight size={18} color="#2d3748" />
            </button>
          );
        })}

        {/* Settings tile */}
        <button
          onClick={() => navigate('/settings')}
          style={{
            width: '100%',
            background: 'rgba(26,115,232,0.08)',
            border: '1px solid rgba(26,115,232,0.15)',
            borderRadius: 18,
            padding: '20px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            textAlign: 'left',
            animation: 'slideUp 0.35s ease 0.24s both',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'rgba(26,115,232,0.15)',
            border: '1px solid rgba(26,115,232,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Settings size={24} color="#1a73e8" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#f0f4ff', fontSize: 16, fontWeight: 600 }}>Settings</div>
            <div style={{ color: '#4a5568', fontSize: 12, marginTop: 2 }}>
              Configure your experience
            </div>
          </div>
          <ChevronRight size={18} color="#2d3748" />
        </button>

        {/* Continue to Chats */}
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            marginTop: 4,
            padding: '16px',
            borderRadius: 16,
            fontSize: 15,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1a73e8, #1558b0)',
            color: 'white',
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 8px 24px rgba(26,115,232,0.25)',
            animation: 'slideUp 0.35s ease 0.3s both',
          }}
        >
          <Wifi size={18} />
          Go to Iceland Chats
        </button>
      </div>
    </div>
  );
}
