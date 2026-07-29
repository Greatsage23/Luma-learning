create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_role()
returns public.app_role
language sql stable security definer
set search_path = ''
as $$
  select role from public.profiles
  where id = auth.uid()
    and status in ('active', 'password_change_required')
$$;

create or replace function private.current_status()
returns public.account_status
language sql stable security definer
set search_path = ''
as $$
  select status from public.profiles where id = auth.uid()
$$;

revoke all on function private.current_role() from public, anon;
revoke all on function private.current_status() from public, anon;
grant execute on function private.current_role() to authenticated;
grant execute on function private.current_status() to authenticated;

drop policy if exists "update own safe profile" on public.profiles;
create policy "update own safe profile" on public.profiles
for update to authenticated
using (id = (select auth.uid()) and private.current_status() = 'active')
with check (
  id = (select auth.uid())
  and role = private.current_role()
  and status = private.current_status()
);

drop policy if exists "administrators manage profiles" on public.profiles;
create policy "administrators manage profiles" on public.profiles
for all to authenticated
using (private.current_role() = 'administrator')
with check (private.current_role() = 'administrator');

drop policy if exists "teachers read assigned students" on public.profiles;
create policy "teachers read assigned students" on public.profiles
for select to authenticated
using (
  private.current_role() = 'teacher'
  and role = 'student'
  and class_level = any(coalesce(
    (select classes from public.teacher_assignments where teacher_id = (select auth.uid()) limit 1),
    '{}'::text[]
  ))
);

drop policy if exists "administrators manage assignments" on public.teacher_assignments;
create policy "administrators manage assignments" on public.teacher_assignments
for all to authenticated
using (private.current_role() = 'administrator')
with check (private.current_role() = 'administrator');

drop policy if exists "administrators read audit logs" on public.audit_logs;
create policy "administrators read audit logs" on public.audit_logs
for select to authenticated
using (private.current_role() = 'administrator');

drop policy if exists "administrators manage notifications" on public.notifications;
create policy "administrators manage notifications" on public.notifications
for all to authenticated
using (private.current_role() = 'administrator')
with check (private.current_role() = 'administrator');

alter function public.handle_new_user() set search_path = '';
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop function if exists public.current_role();
