import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import IcelandLogo from '../components/IcelandLogo';

export default function SignUpScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isActive = name.trim() && phone.trim() && email.trim();

  async function handleEnter() {
    if (!isActive || loading) return;
    setLoading(true);
    setError('');

    const password = Math.random().toString(36).slice(2, 10) + 'A1!';
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim(), phone: phone.trim() },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        const { error: signInError } = await supabase.auth.signInWithOtp({ email: email.trim() });
        if (signInError) { setError(signInError.message); setLoading(false); return; }
      } else {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
    }

    localStorage.setItem('iceland_signup_name', name.trim());
    localStorage.setItem('iceland_signup_phone', phone.trim());
    localStorage.setItem('iceland_signup_email', email.trim());

    navigate('/verify', { state: { name, phone, email } });
    setLoading(false);
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 420,
      height: '100dvh',
      background: 'linear-gradient(160deg, #0a0e17 0%, #0d1b2e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '48px 28px 40px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,115,232,0.08) 0%, transparent 70%)',
        top: -100,
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{ animation: 'slideUp 0.4s ease', textAlign: 'center' }}>
        <IcelandLogo size={80} />
        <p style={{ color: '#4a5568', fontSize: 13, marginTop: 8, letterSpacing: 0.5 }}>
          Stay connected with everyone
        </p>
      </div>

      {/* Form */}
      <div style={{
        width: '100%',
        animation: 'slideUp 0.4s ease 0.1s both',
      }}>
        <h2 style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#f0f4ff',
          marginBottom: 24,
          letterSpacing: -0.3,
        }}>
          Create Account
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InputField
            icon={<User size={18} color="#1a73e8" />}
            placeholder="Name"
            value={name}
            onChange={setName}
            type="text"
          />
          <InputField
            icon={<Phone size={18} color="#1a73e8" />}
            placeholder="Phone Number"
            value={phone}
            onChange={setPhone}
            type="tel"
          />
          <InputField
            icon={<Mail size={18} color="#1a73e8" />}
            placeholder="Email Address"
            value={email}
            onChange={setEmail}
            type="email"
          />
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleEnter}
          disabled={!isActive || loading}
          style={{
            width: '100%',
            marginTop: 28,
            padding: '16px',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 0.25s ease',
            background: isActive
              ? 'linear-gradient(135deg, #f4a261, #e76f51)'
              : '#1e2a3d',
            color: isActive ? '#fff' : '#4a5568',
            boxShadow: isActive ? '0 8px 24px rgba(244,162,97,0.3)' : 'none',
          }}
        >
          {loading ? (
            <div style={{
              width: 20, height: 20,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          ) : (
            <>
              ENTER
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>

      {/* Bottom */}
      <div style={{ textAlign: 'center', animation: 'fadeIn 0.6s ease 0.3s both' }}>
        <p style={{ color: '#2d3748', fontSize: 11, letterSpacing: 1.5 }}>
          BY ICELAND CORPORATION
        </p>
        <p style={{ color: '#1e2a3d', fontSize: 10, marginTop: 6 }}>
          By signing up, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}

function InputField({
  icon, placeholder, value, onChange, type,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: '#161d2e',
      border: '1px solid #1e2a3d',
      borderRadius: 14,
      padding: '14px 16px',
      transition: 'border-color 0.2s',
    }}
      onFocus={(e) => (e.currentTarget.style.borderColor = '#1a73e8')}
      onBlur={(e) => (e.currentTarget.style.borderColor = '#1e2a3d')}
    >
      {icon}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          outline: 'none',
          fontSize: 15,
          color: '#f0f4ff',
        }}
        autoComplete="off"
      />
    </div>
  );
}
