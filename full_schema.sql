-- Full Schema for Uno Royale
-- Run this in Supabase SQL Editor

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  avatar_url TEXT,
  gold INTEGER DEFAULT 1000,
  gems INTEGER DEFAULT 100,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  trophies INTEGER DEFAULT 0,
  current_arena INTEGER DEFAULT 0,
  is_first_time BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id),
  creator_name TEXT,
  max_players INTEGER DEFAULT 2,
  current_players INTEGER DEFAULT 0,
  bet_amount INTEGER DEFAULT 10,
  time_per_turn INTEGER DEFAULT 10,
  status TEXT DEFAULT 'Aguardando', -- 'Aguardando', 'Em Jogo', 'Finalizado'
  arena_name TEXT,
  game_state JSONB, -- Stores the entire ActiveGameState
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Room Players Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS room_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  player_name TEXT,
  avatar TEXT,
  is_ready BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 5. Social Messages (Global Chat)
CREATE TABLE IF NOT EXISTS social_messages (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  "user" TEXT, -- Quoted reserved word
  avatar TEXT,
  text TEXT,
  timestamp BIGINT
);

-- 6. Card Collection (Optional for MVP, but good for progression)
CREATE TABLE IF NOT EXISTS card_collection (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  card_id TEXT,
  level INTEGER DEFAULT 1,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, card_id)
);

-- 7. Inventory (Optional)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  item_id TEXT,
  acquired_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Profiles: Public Read, Self Update
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Rooms: Public Read, Authenticated Insert/Update
CREATE POLICY "Rooms are viewable by everyone" ON rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Creators can update their rooms" ON rooms FOR UPDATE USING (auth.uid() = creator_id OR status = 'Em Jogo'); -- Allow updates during game for sync? Actually, better:
CREATE POLICY "Anyone in room can update game state" ON rooms FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM room_players WHERE room_id = id) OR auth.uid() = creator_id
);

-- Room Players: Public Read, Self Insert/Delete
CREATE POLICY "Room players viewable by everyone" ON room_players FOR SELECT USING (true);
CREATE POLICY "Users can join rooms" ON room_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON room_players FOR DELETE USING (auth.uid() = user_id);

-- Social: Public Read, Auth Insert
CREATE POLICY "Chat viewable by everyone" ON social_messages FOR SELECT USING (true);
CREATE POLICY "Users can post messages" ON social_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Collection/Inventory: Self Read/Write
CREATE POLICY "Users see own collection" ON card_collection FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own collection" ON card_collection FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own inventory" ON inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own inventory" ON inventory FOR ALL USING (auth.uid() = user_id);


-- 9. RPC Functions

-- Increment Players
CREATE OR REPLACE FUNCTION increment_room_players(room_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE rooms
  SET current_players = current_players + 1
  WHERE id = room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement Players
CREATE OR REPLACE FUNCTION decrement_room_players(room_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE rooms
  SET current_players = GREATEST(0, current_players - 1)
  WHERE id = room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE rooms, room_players, social_messages;
COMMIT;
