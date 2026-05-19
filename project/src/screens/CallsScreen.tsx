import { useState, useEffect } from 'react';
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing, Plus, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Call, Profile } from '../lib/supabase';

type CallItem = Call & { caller: Profile; callee: Profile };

export default function CallsScreen() {
  const [calls, setCalls] = useState<CallItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedContact, setSchedContact] = useState('');
  const [schedType, setSchedType] = useState<'voice' | 'video'>('voice');
  const [contacts, setContacts] = useState<Profile[]>([]);

  useEffect(() => {
    loadCalls();
  }, []);

  async function loadCalls() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data } = await supabase
      .from('calls')
      .select(`
        *,
        caller:profiles!calls_caller_id_fkey(*),
        callee:profiles!calls_callee_id_fkey(*)
      `)
      .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50);

    setCalls((data || []) as CallItem[]);

    const { data: profs } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .limit(20);
    setContacts(profs || []);
  }

  async function scheduleCall() {
    if (!schedDate || !schedTime || !schedContact) return;
    const dt = new Date(`${schedDate}T${schedTime}`).toISOString();

    await supabase.from('calls').insert({
      caller_id: currentUserId,
      callee_id: schedContact,
      call_type: schedType,
      status: 'scheduled',
      scheduled_at: dt,
    });

    setShowSchedule(false);
    setSchedDate('');
    setSchedTime('');
    setSchedContact('');
    loadCalls();
  }

  function formatCallTime(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function formatDuration(seconds: number) {
    if (seconds === 0) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const scheduled = calls.filter(c => c.status === 'scheduled');
  const history = calls.filter(c => c.status !== 'scheduled');

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
        padding: '48px 20px 16px',
        background: '#111827',
        borderBottom: '1px solid #1e2a3d',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ color: '#f0f4ff', fontSize: 24, fontWeight: 700 }}>Calls</h1>
          <button
            onClick={() => setShowSchedule(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(26,115,232,0.15)',
              border: '1px solid rgba(26,115,232,0.25)',
              borderRadius: 12, padding: '8px 14px',
              color: '#1a73e8', fontSize: 13, fontWeight: 600,
            }}
          >
            <Calendar size={15} />
            Schedule
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Scheduled calls */}
        {scheduled.length > 0 && (
          <div style={{ padding: '16px 20px 0' }}>
            <p style={{ color: '#4a5568', fontSize: 11, letterSpacing: 0.8, marginBottom: 10 }}>
              SCHEDULED
            </p>
            {scheduled.map(call => {
              const other = call.caller_id === currentUserId ? call.callee : call.caller;
              return (
                <div key={call.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'rgba(26,115,232,0.08)',
                  border: '1px solid rgba(26,115,232,0.15)',
                  borderRadius: 14, padding: '14px',
                  marginBottom: 10,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1a73e8, #1558b0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: 'white',
                  }}>
                    {other?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f0f4ff', fontSize: 14, fontWeight: 600 }}>
                      {other?.username || 'Unknown'}
                    </div>
                    <div style={{ color: '#1a73e8', fontSize: 12, marginTop: 2 }}>
                      <Calendar size={10} style={{ display: 'inline', marginRight: 4 }} />
                      {new Date(call.scheduled_at!).toLocaleString([], {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: call.call_type === 'video' ? 'rgba(0,188,212,0.15)' : 'rgba(26,115,232,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {call.call_type === 'video'
                      ? <Video size={16} color="#00bcd4" />
                      : <Phone size={16} color="#1a73e8" />
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call history */}
        <div style={{ padding: '16px 20px 8px' }}>
          <p style={{ color: '#4a5568', fontSize: 11, letterSpacing: 0.8, marginBottom: 10 }}>
            RECENT CALLS
          </p>
          {history.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', padding: '40px 20px', gap: 12,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#161d2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Phone size={28} color="#2d3748" />
              </div>
              <p style={{ color: '#4a5568', fontSize: 14, textAlign: 'center' }}>
                No call history yet
              </p>
            </div>
          ) : (
            history.map(call => {
              const isCaller = call.caller_id === currentUserId;
              const other = isCaller ? call.callee : call.caller;
              const isMissed = call.status === 'missed';
              const isIncoming = !isCaller;

              return (
                <div key={call.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 0',
                  borderBottom: '1px solid #111827',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2d3748, #1a2035)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0,
                  }}>
                    {other?.username?.charAt(0).toUpperCase() || '?'}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f0f4ff', fontSize: 15, fontWeight: 600 }}>
                      {other?.username || 'Unknown'}
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      marginTop: 3, color: isMissed ? '#ef4444' : '#4a5568', fontSize: 12,
                    }}>
                      {isMissed
                        ? <PhoneMissed size={12} />
                        : isIncoming
                          ? <PhoneIncoming size={12} />
                          : <PhoneOutgoing size={12} />
                      }
                      {isMissed ? 'Missed' : isIncoming ? 'Incoming' : 'Outgoing'}
                      {call.duration > 0 && (
                        <span>· {formatDuration(call.duration)}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#4a5568', fontSize: 11 }}>
                      {formatCallTime(call.created_at)}
                    </div>
                    <button style={{
                      marginTop: 6,
                      background: call.call_type === 'video'
                        ? 'rgba(0,188,212,0.1)'
                        : 'rgba(26,115,232,0.1)',
                      border: 'none',
                      borderRadius: 8,
                      padding: '4px 8px',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {call.call_type === 'video'
                        ? <Video size={14} color="#00bcd4" />
                        : <Phone size={14} color="#1a73e8" />
                      }
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowSchedule(true)}
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

      {/* Schedule Sheet */}
      {showSchedule && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end', zIndex: 200,
        }}
          onClick={() => setShowSchedule(false)}
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
              Schedule a Call
            </h3>

            {/* Call type */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {(['voice', 'video'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSchedType(type)}
                  style={{
                    flex: 1, padding: '12px',
                    borderRadius: 14,
                    background: schedType === type ? 'rgba(26,115,232,0.15)' : '#161d2e',
                    border: `1px solid ${schedType === type ? 'rgba(26,115,232,0.4)' : '#1e2a3d'}`,
                    color: schedType === type ? '#1a73e8' : '#8b9ab5',
                    fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {type === 'voice' ? <Phone size={15} /> : <Video size={15} />}
                  {type.charAt(0).toUpperCase() + type.slice(1)} Call
                </button>
              ))}
            </div>

            {/* Contact select */}
            <select
              value={schedContact}
              onChange={e => setSchedContact(e.target.value)}
              style={{
                width: '100%',
                background: '#161d2e',
                border: '1px solid #1e2a3d',
                borderRadius: 14,
                padding: '14px 16px',
                color: schedContact ? '#f0f4ff' : '#4a5568',
                fontSize: 14,
                outline: 'none',
                marginBottom: 12,
              }}
            >
              <option value="">Select Contact</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.username}</option>
              ))}
            </select>

            {/* Date */}
            <input
              type="date"
              value={schedDate}
              onChange={e => setSchedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                background: '#161d2e',
                border: '1px solid #1e2a3d',
                borderRadius: 14,
                padding: '14px 16px',
                color: '#f0f4ff',
                fontSize: 14,
                outline: 'none',
                marginBottom: 12,
              }}
            />

            {/* Time */}
            <input
              type="time"
              value={schedTime}
              onChange={e => setSchedTime(e.target.value)}
              style={{
                width: '100%',
                background: '#161d2e',
                border: '1px solid #1e2a3d',
                borderRadius: 14,
                padding: '14px 16px',
                color: '#f0f4ff',
                fontSize: 14,
                outline: 'none',
                marginBottom: 20,
              }}
            />

            <button
              onClick={scheduleCall}
              disabled={!schedDate || !schedTime || !schedContact}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                fontSize: 15,
                fontWeight: 700,
                background: (schedDate && schedTime && schedContact)
                  ? 'linear-gradient(135deg, #f4a261, #e76f51)'
                  : '#1e2a3d',
                color: (schedDate && schedTime && schedContact) ? 'white' : '#4a5568',
                letterSpacing: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: (schedDate && schedTime && schedContact)
                  ? '0 8px 24px rgba(244,162,97,0.3)'
                  : 'none',
                transition: 'all 0.25s',
              }}
            >
              <Clock size={18} />
              ENTER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
