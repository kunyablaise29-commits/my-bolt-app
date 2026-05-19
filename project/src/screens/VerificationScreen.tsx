import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import IcelandLogo from '../components/IcelandLogo';
import { ArrowLeft } from 'lucide-react';

export default function VerificationScreen() {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const email = localStorage.getItem('iceland_signup_email') || '';

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 4) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    if (pasted.length === 5) {
      setCode(pasted.split(''));
      inputs.current[4]?.focus();
    }
    e.preventDefault();
  }

  async function handleVerify() {
    const fullCode = code.join('');
    if (fullCode.length !== 5 || loading) return;
    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: fullCode,
      type: 'email',
    });

    if (err) {
      setError('Invalid code. Please try again.');
      setLoading(false);
      return;
    }

    navigate('/setup-profile');
  }

  const isComplete = code.every(c => c !== '');

  return (
    <div style={{
      width: '100%',
      maxWidth: 420,
      height: '100dvh',
      background: '#0a0e17',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '40px 28px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Watermark */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.03,
        pointerEvents: 'none',
      }}>
        <IcelandLogo size={280} />
      </div>

      {/* Back */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/signup')}
          style={{
            background: '#161d2e',
            border: '1px solid #1e2a3d',
            borderRadius: 12,
            padding: '8px 12px',
            color: '#8b9ab5',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Center content */}
      <div style={{ textAlign: 'center', width: '100%', animation: 'slideUp 0.4s ease' }}>
        <IcelandLogo size={70} />

        <h2 style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#f0f4ff',
          marginTop: 28,
          marginBottom: 10,
          lineHeight: 1.4,
        }}>
          Enter the 5-digit code
        </h2>
        <p style={{ color: '#8b9ab5', fontSize: 14, lineHeight: 1.6 }}>
          We just sent a verification code on your email
        </p>
        {email && (
          <p style={{ color: '#1a73e8', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
            {email}
          </p>
        )}

        {/* Code boxes */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          marginTop: 36,
        }} onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el; }}
              type="tel"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                width: 52,
                height: 60,
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 700,
                background: digit ? '#1a73e8' : '#161d2e',
                border: `2px solid ${digit ? '#1a73e8' : '#1e2a3d'}`,
                borderRadius: 14,
                color: digit ? 'white' : '#f0f4ff',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: digit ? '0 4px 12px rgba(26,115,232,0.3)' : 'none',
              }}
            />
          ))}
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: 13, marginTop: 16 }}>{error}</p>
        )}

        <button
          onClick={handleVerify}
          disabled={!isComplete || loading}
          style={{
            width: '100%',
            marginTop: 32,
            padding: '16px',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 700,
            background: isComplete
              ? 'linear-gradient(135deg, #1a73e8, #1558b0)'
              : '#1e2a3d',
            color: isComplete ? 'white' : '#4a5568',
            letterSpacing: 0.5,
            transition: 'all 0.25s ease',
            boxShadow: isComplete ? '0 8px 24px rgba(26,115,232,0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
          ) : 'VERIFY'}
        </button>

        <button
          onClick={() => navigate('/signup')}
          style={{
            background: 'none',
            color: '#4a5568',
            fontSize: 13,
            marginTop: 16,
            padding: 8,
          }}
        >
          Resend code
        </button>
      </div>

      <p style={{ color: '#2d3748', fontSize: 11, letterSpacing: 1.5 }}>
        BY ICELAND CORPORATION
      </p>
    </div>
  );
}
