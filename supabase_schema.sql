
-- 8. RPC: Increment Room Players
CREATE OR REPLACE FUNCTION increment_room_players(room_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE rooms
  SET current_players = current_players + 1
  WHERE id = room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
