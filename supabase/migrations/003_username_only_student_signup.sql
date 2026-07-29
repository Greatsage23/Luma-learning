create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    username,
    role,
    status,
    class_level
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', 'New student'),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'username',
    'student',
    'active',
    new.raw_user_meta_data->>'class_level'
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
