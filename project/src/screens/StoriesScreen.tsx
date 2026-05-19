import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Story, Profile } from '../lib/supabase';

type StoryGroup = {
  user: Profile;
  stories: Story[];
  hasUnviewed: boolean;
};

export default function StoriesScreen() {
  const navigate = useNavigate();
  const [myStory, setMyStory] = useState<Story[]>([]);
  const [otherStories, setOtherStories] = useState<StoryGroup[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [showAddStory, setShowAddStory] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#1a73e8');

  const bgColors = ['#1a73e8', '#e91e63', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4'];

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setMyProfile(profile);

    const { data: stories } = await supabase
      .from('stories')
      .select('*, user:profiles(*)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!stories) return;

    const mine = stories.filter((s: any) => s.user_id === user.id);
    setMyStory(mine);

    const otherMap = new Map<string, StoryGroup>();
    stories.forEach((s: any) => {
      if (s.user_id === user.id) return;
      if (!otherMap.has(s.user_id)) {
        otherMap.set(s.user_id, {
          user: s.user,
          stories: [],
          hasUnviewed: false,
        });
      }
      const group = otherMap.get(s.user_id)!;
      group.stories.push(s);
      if (!s.viewed_by?.includes(user.id)) group.hasUnviewed = true;
    });

    setOtherStories(Array.from(otherMap.values()));
  }

  async function postStory() {
    if (!storyText.trim() && !selectedColor) return;

    await supabase.from('stories').insert({
      user_id: currentUserId,
      content: storyText.trim(),
      media_type: 'text',
      background_color: selectedColor,
    });

    setStoryText('');
    setShowAddStory(false);
    loadStories();
  }

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
        <h1 style={{ color: '#f0f4ff', fontSize: 24, fontWeight: 700 }}>Stories</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* My story */}
        <div style={{ padding: '16px 20px 8px' }}>
          <p style={{ color: '#4a5568', fontSize: 11, letterSpacing: 0.8, marginBottom: 12 }}>
            MY STATUS
          </p>
          <button
            onClick={() => setShowAddStory(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              width: '100%',
              background: 'none',
              textAlign: 'left',
              padding: '8px 0',
            }}
          >
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: myStory.length > 0
                  ? 'linear-gradient(135deg, #1a73e8, #f4a261)'
                  : '#161d2e',
                padding: myStory.length > 0 ? 2 : 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: myStory.length > 0 ? 50 : 56,
                  height: myStory.length > 0 ? 50 : 56,
                  borderRadius: '50%',
                  background: myProfile?.avatar_url
                    ? `url(${myProfile.avatar_url}) center/cover`
                    : 'linear-gradient(135deg, #1a73e8, #1558b0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: 'white',
                  border: myStory.length > 0 ? '2px solid #0a0e17' : 'none',
                }}>
                  {!myProfile?.avatar_url && (myProfile?.username?.charAt(0).toUpperCase() || 'Y')}
                </div>
              </div>
              <div style={{
                position: 'absolute',
                bottom: 0, right: 0,
                width: 20, height: 20,
                borderRadius: '50%',
                background: '#1a73e8',
                border: '2px solid #0a0e17',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={12} color="white" />
              </div>
            </div>
            <div>
              <div style={{ color: '#f0f4ff', fontSize: 15, fontWeight: 600 }}>My Status</div>
              <div style={{ color: '#4a5568', fontSize: 12, marginTop: 2 }}>
                {myStory.length > 0 ? `${myStory.length} update${myStory.length > 1 ? 's' : ''}` : 'Tap to add status update'}
              </div>
            </div>
          </button>
        </div>

        {/* Recent updates */}
        {otherStories.length > 0 && (
          <div style={{ padding: '8px 20px' }}>
            <p style={{ color: '#4a5568', fontSize: 11, letterSpacing: 0.8, marginBottom: 12 }}>
              RECENT UPDATES
            </p>

            {/* Horizontal scroll preview */}
            <div style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 8,
              marginBottom: 16,
            }}>
              {otherStories.map(group => (
                <button
                  key={group.user.id}
                  onClick={() => navigate(`/story/${group.stories[0].id}`)}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                  }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    padding: 2.5,
                    background: group.hasUnviewed
                      ? 'linear-gradient(135deg, #1a73e8, #f4a261)'
                      : '#2d3748',
                  }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2d3748, #1a2035)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700, color: 'white',
                      border: '2px solid #0a0e17',
                    }}>
                      {group.user.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <span style={{
                    color: '#8b9ab5', fontSize: 10,
                    maxWidth: 64, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {group.user.username.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>

            {/* List view */}
            {otherStories.map(group => (
              <button
                key={group.user.id}
                onClick={() => navigate(`/story/${group.stories[0].id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  width: '100%', background: 'none', textAlign: 'left',
                  padding: '10px 0',
                  borderBottom: '1px solid #111827',
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', padding: 2.5,
                  background: group.hasUnviewed
                    ? 'linear-gradient(135deg, #1a73e8, #f4a261)'
                    : '#2d3748',
                }}>
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2d3748, #1a2035)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: 'white',
                    border: '2px solid #0a0e17',
                  }}>
                    {group.user.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f0f4ff', fontSize: 15, fontWeight: 600 }}>
                    {group.user.username}
                  </div>
                  <div style={{ color: '#4a5568', fontSize: 12, marginTop: 2 }}>
                    {group.stories.length} update{group.stories.length > 1 ? 's' : ''}
                  </div>
                </div>
                <Eye size={16} color="#4a5568" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Story Sheet */}
      {showAddStory && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end', zIndex: 200,
        }}
          onClick={() => setShowAddStory(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: 420, background: '#111827',
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
            <h3 style={{ color: '#f0f4ff', fontSize: 17, fontWeight: 600, marginBottom: 16 }}>
              Add Status Update
            </h3>

            {/* Preview */}
            <div style={{
              height: 120, borderRadius: 16, background: selectedColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, fontSize: 16, color: 'white', fontWeight: 500,
              padding: 16, textAlign: 'center',
            }}>
              {storyText || 'Your status preview'}
            </div>

            <textarea
              placeholder="What's on your mind?"
              value={storyText}
              onChange={e => setStoryText(e.target.value)}
              maxLength={150}
              rows={2}
              style={{
                width: '100%', background: '#161d2e', border: '1px solid #1e2a3d',
                borderRadius: 14, padding: '12px 14px',
                color: '#f0f4ff', fontSize: 14, outline: 'none',
                resize: 'none', marginBottom: 14,
              }}
            />

            {/* Color picker */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {bgColors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: color,
                    border: selectedColor === color ? '3px solid white' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>

            <button
              onClick={postStory}
              style={{
                width: '100%', padding: 14, borderRadius: 14,
                background: 'linear-gradient(135deg, #1a73e8, #1558b0)',
                color: 'white', fontSize: 15, fontWeight: 700,
                boxShadow: '0 6px 18px rgba(26,115,232,0.3)',
              }}
            >
              Post Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
