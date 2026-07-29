create table if not exists public.learning_materials (
  id bigint generated always as identity primary key,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 120),
  description text,
  subject text not null check (subject in ('English Language','Mathematics','Integrated Science','Computing')),
  class_level text not null check (class_level in ('Basic 4','Basic 5','Basic 6','Basic 7','Basic 8','Basic 9')),
  file_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  status text not null default 'pending' check (status in ('pending','published','rejected','archived')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists learning_materials_teacher_created_idx on public.learning_materials (teacher_id, created_at desc);
create index if not exists learning_materials_status_subject_class_idx on public.learning_materials (status, subject, class_level);
create index if not exists learning_materials_reviewed_by_idx on public.learning_materials (reviewed_by) where reviewed_by is not null;

alter table public.learning_materials enable row level security;

grant select, insert, update, delete on public.learning_materials to authenticated;
grant usage, select on sequence public.learning_materials_id_seq to authenticated;

drop policy if exists "users read permitted learning materials" on public.learning_materials;
create policy "users read permitted learning materials" on public.learning_materials
for select to authenticated
using (
  status = 'published'
  or teacher_id = (select auth.uid())
  or exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'administrator' and status in ('active','password_change_required'))
);

drop policy if exists "staff create own learning materials" on public.learning_materials;
create policy "staff create own learning materials" on public.learning_materials
for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('teacher','administrator') and status in ('active','password_change_required'))
);

drop policy if exists "staff update permitted learning materials" on public.learning_materials;
create policy "staff update permitted learning materials" on public.learning_materials
for update to authenticated
using (
  teacher_id = (select auth.uid())
  or exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'administrator' and status in ('active','password_change_required'))
)
with check (
  (
    teacher_id = (select auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  )
  or exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'administrator' and status in ('active','password_change_required'))
);

drop policy if exists "staff delete permitted learning materials" on public.learning_materials;
create policy "staff delete permitted learning materials" on public.learning_materials
for delete to authenticated
using (
  teacher_id = (select auth.uid())
  or exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'administrator' and status in ('active','password_change_required'))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'learning-materials',
  'learning-materials',
  false,
  20971520,
  array[
    'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg','image/png','image/webp','video/mp4','video/webm','audio/mpeg','audio/mp4','audio/wav'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "staff upload learning materials" on storage.objects;
create policy "staff upload learning materials" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'learning-materials'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('teacher','administrator') and status in ('active','password_change_required'))
);

drop policy if exists "users read permitted material files" on storage.objects;
create policy "users read permitted material files" on storage.objects
for select to authenticated
using (
  bucket_id = 'learning-materials'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.learning_materials where file_path = name and status = 'published')
    or exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'administrator' and status in ('active','password_change_required'))
  )
);

drop policy if exists "staff update own material files" on storage.objects;
create policy "staff update own material files" on storage.objects
for update to authenticated
using (bucket_id = 'learning-materials' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'learning-materials' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "staff delete permitted material files" on storage.objects;
create policy "staff delete permitted material files" on storage.objects
for delete to authenticated
using (
  bucket_id = 'learning-materials'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'administrator' and status in ('active','password_change_required'))
  )
);
