/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current RLS policies on users table cause infinite recursion
    - Policies query the same users table they're protecting
    - This creates circular dependencies

  2. Solution
    - Drop existing problematic policies
    - Create new policies that don't self-reference
    - Use auth.uid() for user identification
    - Store admin status in auth metadata or use a different approach

  3. Changes
    - Remove recursive admin policies
    - Keep simple user self-access policy
    - Add new admin policies that don't cause recursion
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update user status" ON users;

-- Keep the existing user self-access policy (this one is fine)
-- "Users can read own data" policy is already correct

-- Create new admin policies that don't cause recursion
-- For now, we'll create a simpler approach where admin access is handled at the application level
-- or we can use a different strategy

-- Alternative approach: Create policies that check admin status without recursion
-- We'll use a function that safely checks admin status

-- Create a function to safely check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM users WHERE id = user_id LIMIT 1),
    false
  );
$$;

-- Create new admin policies using the function
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update user status"
  ON users
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;