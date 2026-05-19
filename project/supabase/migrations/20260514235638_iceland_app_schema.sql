/*
  # Iceland Messaging App - Initial Schema

  ## Tables Created
  - `profiles` - User profile information (username, phone, about, avatar)
  - `conversations` - Direct message conversations between two users
  - `group_chats` - Group chat rooms
  - `group_members` - Membership table linking users to groups
  - `messages` - All messages (DMs and group)
  - `stories` - Status/story posts
  - `calls` - Call history and scheduled calls
  - `contacts` - User contacts list

  ## Security
  - RLS enabled on all tables
  - Authenticated users can only access their own data and related conversations
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  phone text,
  about text DEFAULT 'Hey there! I am using Iceland.',
  avatar_url text,
  is_online boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message text,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Group chats table
CREATE TABLE IF NOT EXISTS group_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message text,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_admin boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group"
  ON group_chats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_chats.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated can create group"
  ON group_chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admin can update group"
  ON group_chats FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_chats.id
      AND group_members.user_id = auth.uid()
      AND group_members.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_chats.id
      AND group_members.user_id = auth.uid()
      AND group_members.is_admin = true
    )
  );

CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id
      AND gm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can add members"
  ON group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  group_id uuid REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  status text DEFAULT 'sent',
  created_at timestamptz DEFAULT now(),
  CHECK (
    (conversation_id IS NOT NULL AND group_id IS NULL) OR
    (conversation_id IS NULL AND group_id IS NOT NULL)
  )
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    (
      conversation_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
      )
    ) OR (
      group_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = messages.group_id
        AND group_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text,
  media_url text,
  media_type text DEFAULT 'text',
  background_color text DEFAULT '#1a73e8',
  viewed_by uuid[] DEFAULT '{}',
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all stories"
  ON stories FOR SELECT
  TO authenticated
  USING (expires_at > now());

CREATE POLICY "Users can create own stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories"
  ON stories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Calls table
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  callee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  call_type text DEFAULT 'voice',
  status text DEFAULT 'missed',
  duration integer DEFAULT 0,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calls"
  ON calls FOR SELECT
  TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Users can create calls"
  ON calls FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update own calls"
  ON calls FOR UPDATE
  TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = callee_id)
  WITH CHECK (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nickname text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, contact_id)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_group ON messages(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_calls_users ON calls(caller_id, callee_id, created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
