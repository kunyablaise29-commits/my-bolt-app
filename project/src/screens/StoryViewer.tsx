import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Story, Profile } from '../lib/supabase';

export default function StoryViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stories, setStories] = useState<(Story & { user: Profile })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadStories();
  }, [id]);

  useEffect(() => {
    if (stories.length === 0) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(i => i + 1);
          } else {
            navigate(-1);
          }
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [currentIndex, stories.length]);

  async function loadStories() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: story } = await supabase
      .from('stories')
      .select('*, user:profiles(*)')
      .eq('id', id)
      .maybeSingle();

    if (!story) { navigate(-1); return; }

    const { data: allStories } = await supabase
      .from('stories')
      .select('*, user:profiles(*)')
      .eq('user_id', story.user_id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true });

    const storyList = (allStories || []) as (Story & { user: Profile })[];
    setStories(storyList);
    const idx = storyList.findIndex(s => s.id === id);
    setCurrentIndex(idx >= 0 ? idx : 0);

    // Mark as viewed
    if (!story.viewed_by?.includes(user.id)) {
      await supabase.from('stories').update({
        viewed_by: [...(story.viewed_by || []), user.id],
      }).eq('id', id);
    }
  }

  if (stories.length === 0) return null;

  const current = stories[currentIndex];
  if (!current) return null;

  return (
    <div style={{
      width: '100%',
      maxWidth: 420,
      height: '100dvh',
      background: current.background_color || '#1a73e8',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Progress bars */}
      <div style={{
        position: 'absolute',
        top: 48,
        left: 12,
        right: 12,
        display: 'flex',
        gap: 4,
        zIndex: 10,
      }}>
        {stories.map((_, i) => (
          <div key={i} style={{
            flex: 1,
            height: 2.5,
            background: 'rgba(255,255,255,0.3)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: 'white',
              width: i < currentIndex ? '100%'
                : i === currentIndex ? `${progress}%`
                  : '0%',
              transition: 'width 0.05s linear',
            }} />
          </div>
        ))}
      </div>

      {/* User info */}
      <div style={{
        position: 'absolute',
        top: 64,
        left: 16,
        right: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        zIndex: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: 'white',
          border: '2px solid rgba(255,255,255,0.4)',
        }}>
          {current.user?.username?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
            {current.user?.username}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
            {timeAgo(current.created_at)}
          </div>
        </div>
      </div>

      {/* Close */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
          top: 68,
          right: 16,
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '50%',
          width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <X size={18} color="white" />
      </button>

      {/* Tap areas */}
      <div style={{ display: 'flex', flex: 1, zIndex: 5 }}>
        <div
          style={{ flex: 1 }}
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
        />
        <div
          style={{ flex: 1 }}
          onClick={() => {
            if (currentIndex < stories.length - 1) {
              setCurrentIndex(currentIndex + 1);
            } else {
              navigate(-1);
            }
          }}
        />
      </div>

      {/* Content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        padding: '120px 24px 80px',
      }}>
        {current.media_url ? (
          <img
            src={current.media_url}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12 }}
          />
        ) : (
          <p style={{
            color: 'white',
            fontSize: 22,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.5,
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            {current.content}
          </p>
        )}
      </div>

      {/* Bottom viewer count */}
      <div style={{
        position: 'absolute',
        bottom: 32,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 10,
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 20,
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'rgba(255,255,255,0.8)',
          fontSize: 12,
        }}>
          <ChevronLeft size={14} />
          {current.viewed_by?.length || 0} viewers
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
