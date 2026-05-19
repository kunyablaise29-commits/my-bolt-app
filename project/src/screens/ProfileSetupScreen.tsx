import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Phone, Info, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ProfileSetupScreen() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(localStorage.getItem('iceland_signup_name') || '');
  const [phone, setPhone] = useState(localStorage.getItem('iceland_signup_phone') || '');
  const [about, setAbout] = useState('Hey there! I am using Iceland.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!username.trim() || loading) return;
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Session expired'); setLoading(false); return; }

    const { error: err } = await supabase.from('profiles').upsert({
      id: user.id,
      username: username.trim(),
      phone: phone.trim() || null,
      about: about.trim() || 'Hey there! I am using Iceland.',
      is_online: true,
      updated_at: new Date().toISOString(),
    });

    if (err) { setError(err.message); setLoading(false); return; }
    navigate('/connectors');
  }

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{
      width: '100%',
      maxWidth: 420,
      height: '100dvh',
      background: '#0a0e17',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #111827, #0d1b2e)',
        padding: '48px 24px 32px',
        textAlign: 'center',
        borderBottom: '1px solid #1e2a3d',
        flexShrink: 0,
      }}>
        <h1 style={{ color: '#f0f4ff', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Set Up Your Profile
        </h1>
        <p style={{ color: '#8b9ab5', fontSize: 13 }}>
          How others will see you on Iceland
        </p>

        {/* Avatar circle */}
        <div style={{
          position: 'relative',
          width: 88,
          height: 88,
          margin: '28px auto 0',
        }}>
          <div style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a73e8, #1558b0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid #1e2a3d',
            fontSize: 28,
            fontWeight: 700,
            color: 'white',
          }}>
            {username ? username.charAt(0).toUpperCase() : <User size={32} color="white" />}
          </div>
          <button style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#f4a261',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #0a0e17',
          }}>
            <Camera size={14} color="white" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {/* Username */}
        <FieldBlock
          label="User Name"
          hint={`${wordCount(username)} / 5 words`}
          icon={<User size={16} color="#1a73e8" />}
        >
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={60}
            style={inputStyle}
          />
        </FieldBlock>

        {/* Phone */}
        <FieldBlock
          label="Telephone Number"
          hint="Optional"
          icon={<Phone size={16} color="#1a73e8" />}
        >
          <input
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={inputStyle}
          />
        </FieldBlock>

        {/* About */}
        <FieldBlock
          label="About"
          hint={`${about.trim().length} / 120 characters`}
          icon={<Info size={16} color="#1a73e8" />}
        >
          <textarea
            placeholder="Tell others about yourself..."
            value={about}
            onChange={e => setAbout(e.target.value)}
            maxLength={120}
            rows={3}
            style={{
              ...inputStyle,
              resize: 'none',
              lineHeight: 1.6,
              paddingTop: 12,
            }}
          />
        </FieldBlock>

        {error && (
          <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={!username.trim() || loading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 700,
            background: username.trim()
              ? 'linear-gradient(135deg, #1a73e8, #1558b0)'
              : '#1e2a3d',
            color: username.trim() ? 'white' : '#4a5568',
            letterSpacing: 0.5,
            transition: 'all 0.25s ease',
            boxShadow: username.trim() ? '0 8px 24px rgba(26,115,232,0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 8,
          }}
        >
          {loading ? (
            <div style={{
              width: 20, height: 20,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : (
            <>
              <CheckCircle size={18} />
              Save Profile
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'none',
  border: 'none',
  outline: 'none',
  fontSize: 15,
  color: '#f0f4ff',
};

function FieldBlock({ label, hint, icon, children }: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon}
          <span style={{ color: '#8b9ab5', fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>
            {label}
          </span>
        </div>
        <span style={{ color: '#2d3748', fontSize: 11 }}>{hint}</span>
      </div>
      <div style={{
        background: '#161d2e',
        border: '1px solid #1e2a3d',
        borderRadius: 14,
        padding: '14px 16px',
      }}>
        {children}
      </div>
    </div>
  );
}
