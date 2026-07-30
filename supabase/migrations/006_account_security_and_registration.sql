alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists failed_login_attempts integer not null default 0,
  add column if not exists locked_until timestamptz;

create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  identifier text not null,
  user_id uuid references public.profiles(id) on delete set null,
  successful boolean not null,
  ip_address inet,
  user_agent text,
  attempted_at timestamptz not null default now()
);
create index if not exists login_attempts_attempted_at_idx on public.login_attempts(attempted_at desc);
create index if not exists login_attempts_user_idx on public.login_attempts(user_id,attempted_at desc);
alter table public.login_attempts enable row level security;
drop policy if exists "administrators read login attempts" on public.login_attempts;
create policy "administrators read login attempts" on public.login_attempts for select to authenticated using (public.current_role()='administrator');
grant select on public.login_attempts to authenticated;
grant select,insert,update,delete on public.login_attempts to service_role;
grant usage,select on sequence public.login_attempts_id_seq to service_role;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
declare
  new_role public.app_role := case when new.raw_app_meta_data->>'role'='teacher' then 'teacher'::public.app_role else 'student'::public.app_role end;
begin
  insert into public.profiles(id,full_name,email,phone,role,status,class_level,username,terms_accepted_at,terms_version)
  values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),case when new_role='teacher' then 'New teacher' else 'New student' end),new.email,nullif(trim(new.raw_user_meta_data->>'phone'),''),new_role,case when new_role='teacher' then 'password_change_required'::public.account_status when new.email_confirmed_at is null then 'pending_verification'::public.account_status else 'active'::public.account_status end,case when new_role='student' then nullif(new.raw_user_meta_data->>'class_level','') else null end,nullif(lower(trim(new.raw_user_meta_data->>'username')),''),case when new_role='student' and new.raw_user_meta_data->>'terms_accepted'='true' then now() else null end,case when new_role='student' then nullif(new.raw_user_meta_data->>'terms_version','') else null end);
  insert into public.notifications(user_id,title,body) values(new.id,case when new_role='teacher' then 'Teacher account created' else 'Welcome to LUMA Learning Academy' end,case when new_role='teacher' then 'Your teacher account has been created by an administrator.' else 'Your student account has been created successfully.' end);
  insert into public.notifications(user_id,title,body) select id,case when new_role='teacher' then 'New teacher account' else 'New student registration' end,'A new '||new_role::text||' account was created: '||coalesce(new.raw_user_meta_data->>'full_name',new.email) from public.profiles where role='administrator' and status='active';
  return new;
end;$$;
revoke execute on function public.handle_new_user() from public,anon,authenticated;
grant execute on function public.handle_new_user() to service_role;
notify pgrst,'reload schema';
