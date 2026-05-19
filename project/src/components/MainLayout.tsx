import { Outlet, useLocation, Link } from 'react-router-dom';
import { MessageCircle, Radio, Phone, Settings } from 'lucide-react';

const navItems = [
  { to: '/chats', icon: MessageCircle, label: 'Chats' },
  { to: '/stories', icon: Radio, label: 'Stories' },
  { to: '/calls', icon: Phone, label: 'Calls' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function MainLayout() {
  const location = useLocation();

  return (
    <div style={{
      width: '100%',
      maxWidth: 420,
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0e17',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Outlet />
      </div>
      <nav style={{
        display: 'flex',
        background: '#111827',
        borderTop: '1px solid #1e2a3d',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 100,
        flexShrink: 0,
      }}>
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to === '/chats' && location.pathname === '/');
          return (
            <Link
              key={to}
              to={to}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 0 8px',
                textDecoration: 'none',
                color: active ? '#1a73e8' : '#4a5568',
                transition: 'color 0.2s',
                gap: 3,
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.3 }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
