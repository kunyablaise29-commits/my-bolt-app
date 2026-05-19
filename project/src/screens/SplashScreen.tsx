import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import IcelandLogo from '../components/IcelandLogo';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate('/signup'), 2800);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div style={{
      width: '100%',
      maxWidth: 420,
      height: '100dvh',
      background: 'linear-gradient(160deg, #0a0e17 0%, #0d1b2e 60%, #0a0e17 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow circles */}
      <div style={{
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,115,232,0.12) 0%, transparent 70%)',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
      }} />
      <div style={{
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,115,232,0.08) 0%, transparent 70%)',
        bottom: '25%',
        right: '10%',
      }} />

      <div style={{ animation: 'fadeIn 0.8s ease', textAlign: 'center' }}>
        <IcelandLogo size={110} showTagline />
      </div>

      <div style={{
        position: 'absolute',
        bottom: 48,
        textAlign: 'center',
        animation: 'fadeIn 1.2s ease 0.4s both',
      }}>
        <div style={{ color: '#2d3748', fontSize: 12, letterSpacing: 1.5 }}>
          BY ICELAND CORPORATION
        </div>
        <div style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'center',
          marginTop: 20,
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: i === 0 ? '#1a73e8' : '#1e2a3d',
              animation: `pulse 1.2s ease ${i * 0.3}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
