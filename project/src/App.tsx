import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

import SplashScreen from './screens/SplashScreen';
import SignUpScreen from './screens/SignUpScreen';
import VerificationScreen from './screens/VerificationScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import ConnectorsHome from './screens/ConnectorsHome';
import ChatsListScreen from './screens/ChatsListScreen';
import ChatScreen from './screens/ChatScreen';
import GroupChatScreen from './screens/GroupChatScreen';
import StoriesScreen from './screens/StoriesScreen';
import StoryViewer from './screens/StoryViewer';
import CallsScreen from './screens/CallsScreen';
import SettingsScreen from './screens/SettingsScreen';
import MainLayout from './components/MainLayout';
import IcelandLogo from './components/IcelandLogo';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        (async () => { await checkProfile(session.user.id); })();
      } else {
        setHasProfile(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
    setHasProfile(!!data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{
        width: '100%', maxWidth: 420, height: '100dvh',
        background: '#0a0e17', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <IcelandLogo size={80} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/verify" element={<VerificationScreen />} />
        <Route path="/setup-profile" element={
          session ? <ProfileSetupScreen /> : <Navigate to="/signup" replace />
        } />
        <Route path="/connectors" element={
          session ? <ConnectorsHome /> : <Navigate to="/signup" replace />
        } />
        <Route path="/" element={
          session
            ? (hasProfile ? <MainLayout /> : <Navigate to="/setup-profile" replace />)
            : <Navigate to="/splash" replace />
        }>
          <Route index element={<ChatsListScreen />} />
          <Route path="chats" element={<ChatsListScreen />} />
          <Route path="stories" element={<StoriesScreen />} />
          <Route path="calls" element={<CallsScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
        </Route>
        <Route path="/chat/:id" element={session ? <ChatScreen /> : <Navigate to="/signup" replace />} />
        <Route path="/group/:id" element={session ? <GroupChatScreen /> : <Navigate to="/signup" replace />} />
        <Route path="/story/:id" element={session ? <StoryViewer /> : <Navigate to="/signup" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
