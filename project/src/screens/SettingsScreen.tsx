import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Image, Eye, Clock, Phone, Bell,
  Info, ChevronRight, LogOut, Moon, Sun, Palette,
  Lock, MessageSquare, Volume2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';

type SettingItem = {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  color?: string;
  action?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
};

export default function SettingsScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallpaper, setWallpaper] = useState<'dark' | 'light' | 'custom'>('dark');
  const [showWallpaperSheet, setShowWallpaperSheet] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile(data);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/splash');
  }

  const sections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          icon: <User size={18} color="#1a73e8" />,
          label: 'My Profile',
          sublabel: profile?.username || 'Set your profile',
          action: () => navigate('/setup-profile'),
        },
        {
          icon: <Eye size={18} color="#00bcd4" />,
          label: 'Status Privacy',
          sublabel: 'Everyone can see your status',
          action: () => {},
        },
      ],
    },
    {
      title: 'Chats',
      items: [
        {
          icon: <Image size={18} color="#9c27b0" />,
          label: 'Wallpapers',
          sublabel: wallpaper.charAt(0).toUpperCase() + wallpaper.slice(1),
          action: () => setShowWallpaperSheet(true),
          rightElement: (
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              background: wallpaper === 'dark' ? '#0a0e17'
                : wallpaper === 'light' ? '#f0f4ff'
                  : 'linear-gradient(135deg, #1a73e8, #f4a261)',
              border: '1px solid #2d3748',
            }} />
          ),
        },
        {
          icon: <Clock size={18} color="#ff9800" />,
          label: 'Disappearing Messages',
          sublabel: 'Off',
          action: () => {},
        },
        {
          icon: <Lock size={18} color="#4caf50" />,
          label: 'Chat Security',
          sublabel: 'End-to-end encrypted',
          action: () => {},
        },
      ],
    },
    {
      title: 'Communication',
      items: [
        {
          icon: <Phone size={18} color="#1a73e8" />,
          label: 'Call Settings',
          sublabel: 'Ringtone, noise cancellation',
          action: () => {},
        },
        {
          icon: <Bell size={18} color="#e91e63" />,
          label: 'Notifications',
          sublabel: 'Sounds, vibration, pop-up',
          action: () => {},
        },
        {
          icon: <Volume2 size={18} color="#ff9800" />,
          label: 'Media & Downloads',
          sublabel: 'Auto-download settings',
          action: () => {},
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <MessageSquare size={18} color="#00bcd4" />,
          label: 'Help & Support',
          sublabel: 'FAQ, contact us',
          action: () => {},
        },
        {
          icon: <Info size={18} color="#8b9ab5" />,
          label: 'About Iceland',
          sublabel: 'Version 1.0.0',
          action: () => {},
        },
        {
          icon: <LogOut size={18} color="#ef4444" />,
          label: 'Log Out',
          danger: true,
          action: handleLogout,
        },
      ],
    },
  ];

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
        padding: '48px 20px 0',
        background: '#111827',
        flexShrink: 0,
      }}>
        <h1 style={{ color: '#f0f4ff', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Settings</h1>

        {/* Profile card */}
        <button
          onClick={() => navigate('/setup-profile')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px',
            background: '#161d2e',
            border: '1px solid #1e2a3d',
            borderRadius: 18,
            marginBottom: 16,
            textAlign: 'left',
          }}
        >
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a73e8, #1558b0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {profile?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#f0f4ff', fontSize: 16, fontWeight: 700 }}>
              {profile?.username || 'Your Name'}
            </div>
            <div style={{ color: '#4a5568', fontSize: 13, marginTop: 2 }}>
              {profile?.about || 'Hey there! I am using Iceland.'}
            </div>
            {profile?.phone && (
              <div style={{ color: '#8b9ab5', fontSize: 12, marginTop: 2 }}>
                {profile.phone}
              </div>
            )}
          </div>
          <ChevronRight size={18} color="#2d3748" />
        </button>
      </div>

      {/* Settings list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 20px' }}>
        {sections.map(section => (
          <div key={section.title} style={{ marginBottom: 8 }}>
            <p style={{
              color: '#4a5568',
              fontSize: 11,
              letterSpacing: 0.8,
              padding: '14px 20px 8px',
            }}>
              {section.title.toUpperCase()}
            </p>
            <div style={{
              background: '#111827',
              borderTop: '1px solid #1e2a3d',
              borderBottom: '1px solid #1e2a3d',
            }}>
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 20px',
                    background: 'none',
                    borderBottom: i < section.items.length - 1 ? '1px solid #161d2e' : 'none',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid #1e2a3d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: item.danger ? '#ef4444' : '#f0f4ff',
                      fontSize: 14,
                      fontWeight: 500,
                    }}>
                      {item.label}
                    </div>
                    {item.sublabel && (
                      <div style={{ color: '#4a5568', fontSize: 12, marginTop: 1 }}>
                        {item.sublabel}
                      </div>
                    )}
                  </div>
                  {item.rightElement || (
                    !item.danger && <ChevronRight size={16} color="#2d3748" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ color: '#2d3748', fontSize: 11, letterSpacing: 1.5 }}>
            BY ICELAND CORPORATION
          </div>
          <div style={{ color: '#1e2a3d', fontSize: 10, marginTop: 4 }}>
            Version 1.0.0 · Built with love
          </div>
        </div>
      </div>

      {/* Wallpaper Sheet */}
      {showWallpaperSheet && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end', zIndex: 200,
        }}
          onClick={() => setShowWallpaperSheet(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: 420,
              background: '#111827',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px 40px',
              animation: 'slideUp 0.3s ease',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: '#2d3748', margin: '0 auto 20px',
            }} />
            <h3 style={{ color: '#f0f4ff', fontSize: 17, fontWeight: 700, marginBottom: 20 }}>
              Choose Wallpaper
            </h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { key: 'dark', label: 'Dark', preview: '#0a0e17', icon: <Moon size={18} /> },
                { key: 'light', label: 'Light', preview: '#e8eef7', icon: <Sun size={18} /> },
                { key: 'custom', label: 'Custom', preview: 'linear-gradient(135deg, #1a73e8, #f4a261)', icon: <Palette size={18} /> },
              ].map(w => (
                <button
                  key={w.key}
                  onClick={() => { setWallpaper(w.key as any); setShowWallpaperSheet(false); }}
                  style={{
                    flex: 1,
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: `2px solid ${wallpaper === w.key ? '#1a73e8' : '#1e2a3d'}`,
                    background: 'none',
                  }}
                >
                  <div style={{
                    height: 80,
                    background: w.preview,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: w.key === 'light' ? '#1a2035' : 'white',
                  }}>
                    {w.icon}
                  </div>
                  <div style={{
                    padding: '8px',
                    background: '#161d2e',
                    color: wallpaper === w.key ? '#1a73e8' : '#8b9ab5',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {w.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
