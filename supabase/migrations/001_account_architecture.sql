create type public.app_role as enum ('student','teacher','administrator');
create type public.account_status as enum ('pending_verification','active','suspended','disabled','password_change_required');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null,
  email text not null unique,
  phone text,
  role public.app_role not null default 'student',
  status public.account_status not null default 'active',
  class_level text,
  staff_id text unique,
  username text unique,
  created_by uuid references public.profiles(id),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (role <> 'student' or class_level is null or class_level in ('Basic 4','Basic 5','Basic 6','Basic 7','Basic 8','Basic 9'))
);
create table public.teacher_assignments (id bigint generated always as identity primary key,teacher_id uuid not null references public.profiles(id),subjects text[] not null default '{}',classes text[] not null default '{}',assigned_by uuid references public.profiles(id),created_at timestamptz not null default now());
create table public.audit_logs (id bigint generated always as identity primary key,actor_id uuid references public.profiles(id),action text not null,affected_record text,ip_address inet,previous_value jsonb,new_value jsonb,created_at timestamptz not null default now());
create table public.notifications (id bigint generated always as identity primary key,user_id uuid not null references public.profiles(id),title text not null,body text not null,read_at timestamptz,created_at timestamptz not null default now());
create index profiles_role_status_idx on public.profiles(role,status);create index profiles_created_at_idx on public.profiles(created_at desc);create index audit_logs_created_at_idx on public.audit_logs(created_at desc);create index notifications_user_idx on public.notifications(user_id,created_at desc);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$begin insert into public.profiles(id,full_name,email,phone,role,status,class_level) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','New student'),new.email,new.raw_user_meta_data->>'phone','student','active',new.raw_user_meta_data->>'class_level');return new;end;$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.current_role() returns public.app_role language sql stable security definer set search_path=public as $$select role from public.profiles where id=auth.uid() and status in ('active','password_change_required')$$;

alter table public.profiles enable row level security;alter table public.teacher_assignments enable row level security;alter table public.audit_logs enable row level security;alter table public.notifications enable row level security;
create policy "read own profile" on public.profiles for select using(id=auth.uid());
create policy "update own safe profile" on public.profiles for update using(id=auth.uid()) with check(id=auth.uid() and role=(select role from public.profiles where id=auth.uid()));
create policy "administrators manage profiles" on public.profiles for all using(public.current_role()='administrator') with check(public.current_role()='administrator');
create policy "teachers read assigned students" on public.profiles for select using(public.current_role()='teacher' and role='student' and class_level=any(coalesce((select classes from public.teacher_assignments where teacher_id=auth.uid() limit 1),'{}'::text[])));
create policy "teachers read own assignments" on public.teacher_assignments for select using(teacher_id=auth.uid());
create policy "administrators manage assignments" on public.teacher_assignments for all using(public.current_role()='administrator') with check(public.current_role()='administrator');
create policy "administrators read audit logs" on public.audit_logs for select using(public.current_role()='administrator');
create policy "users read own notifications" on public.notifications for select using(user_id=auth.uid());
create policy "users update own notifications" on public.notifications for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "administrators manage notifications" on public.notifications for all using(public.current_role()='administrator') with check(public.current_role()='administrator');

-- Bootstrap the existing academy administrator after creating that Auth user:
-- update public.profiles set role='administrator',status='active' where email='YOUR_ADMIN_EMAIL';
