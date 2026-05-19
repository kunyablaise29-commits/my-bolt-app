import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  phone: string | null;
  about: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string | null;
  group_id: string | null;
  sender_id: string;
  content: string;
  message_type: string;
  status: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string | null;
  last_message_at: string;
  created_at: string;
};

export type GroupChat = {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  last_message: string | null;
  last_message_at: string;
  created_at: string;
};

export type Story = {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string;
  background_color: string;
  viewed_by: string[];
  expires_at: string;
  created_at: string;
};

export type Call = {
  id: string;
  caller_id: string;
  callee_id: string;
  call_type: string;
  status: string;
  duration: number;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};
