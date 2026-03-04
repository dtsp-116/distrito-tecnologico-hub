-- Adiciona role `editor` e ajusta politicas de escrita para agencias, editais e arquivos.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'editor', 'user'));

create or replace function public.is_editor_or_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'editor')
  );
$$;

-- Atualiza politicas para permitir escrita por admin e editor

drop policy if exists "agencies_admin_write" on public.agencies;
create policy "agencies_admin_write" on public.agencies
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "notices_admin_write" on public.notices;
create policy "notices_admin_write" on public.notices
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "tags_admin_write" on public.tags;
create policy "tags_admin_write" on public.tags
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "notice_tags_admin_write" on public.notice_tags;
create policy "notice_tags_admin_write" on public.notice_tags
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "notice_files_admin_write" on public.notice_files;
create policy "notice_files_admin_write" on public.notice_files
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

-- Storage de arquivos de edital

drop policy if exists "notice_files_storage_admin_write" on storage.objects;
create policy "notice_files_storage_admin_write" on storage.objects
for insert
with check (bucket_id = 'notice-files' and public.is_editor_or_admin());

drop policy if exists "notice_files_storage_admin_update" on storage.objects;
create policy "notice_files_storage_admin_update" on storage.objects
for update
using (bucket_id = 'notice-files' and public.is_editor_or_admin());

drop policy if exists "notice_files_storage_admin_delete" on storage.objects;
create policy "notice_files_storage_admin_delete" on storage.objects
for delete
using (bucket_id = 'notice-files' and public.is_editor_or_admin());

