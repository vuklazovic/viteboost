-- Create a function to find user ID by email
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_user_by_email(email_input text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
BEGIN
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = email_input
    LIMIT 1;

    RETURN user_id;
END;
$$;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION get_user_by_email(text) TO service_role;