add user as superadmin


-- Replace 'USER_ID_HERE' with the actual UUID of the user from auth.users
INSERT INTO public.user_roles (user_id, role) 
VALUES ('a692e89e-2286-4ad3-a9d1-56fcbdcaedac', 'superadmin')
ON CONFLICT (user_id, role) DO NOTHING;


