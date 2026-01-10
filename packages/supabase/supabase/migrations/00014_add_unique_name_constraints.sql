-- First, update any existing NULL or empty names to a generated default
UPDATE api_keys
SET name = 'Key ' || SUBSTRING(key_prefix FROM 12 FOR 3)
WHERE name IS NULL OR name = '';

-- Rename duplicate active keys by appending a suffix
-- Keeps the oldest key's name, appends " (2)", " (3)", etc. to duplicates
WITH duplicates AS (
  SELECT id, name, developer_id,
         ROW_NUMBER() OVER (PARTITION BY developer_id, LOWER(name) ORDER BY created_at) as rn
  FROM api_keys
  WHERE is_active = true
)
UPDATE api_keys
SET name = api_keys.name || ' (' || d.rn || ')'
FROM duplicates d
WHERE api_keys.id = d.id AND d.rn > 1;

-- Add NOT NULL constraint to name column
ALTER TABLE api_keys ALTER COLUMN name SET NOT NULL;

-- Add unique constraint for API key names per developer
-- Case-insensitive, only for active keys (allows reusing names from revoked keys)
CREATE UNIQUE INDEX idx_api_keys_unique_name_per_developer
ON api_keys (developer_id, LOWER(name))
WHERE is_active = true;

-- Add index for connection duplicate check queries (active only)
-- The existing UNIQUE constraint on (developer_id, farmer_identifier, provider)
-- already enforces uniqueness, but this index optimizes active-only lookups
CREATE INDEX idx_farmer_connections_active_name_lookup
ON farmer_connections (developer_id, LOWER(farmer_identifier), provider)
WHERE is_active = true;
