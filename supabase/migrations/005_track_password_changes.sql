alter table public.profiles
add column if not exists password_changed_at timestamptz;

