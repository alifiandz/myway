-- Documents are immutable versions; only a deletion tombstone can be updated.
create table public.user_documents (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (id ~ '^[a-zA-Z0-9_-]{1,128}$'),
  name text not null check (char_length(name) between 1 and 255),
  content_type text not null,
  size_bytes bigint not null check (size_bytes between 0 and 20971520),
  uploaded_at timestamptz not null default now(),
  category text not null default 'General document' check (char_length(category) <= 255),
  version integer not null default 1 check (version > 0),
  previous_version_id text,
  deleted_at timestamptz,
  primary key (user_id, id)
);
alter table public.user_documents enable row level security;
revoke all on public.user_documents from anon, authenticated;
grant select, insert on public.user_documents to authenticated;
grant update (deleted_at) on public.user_documents to authenticated;
create policy documents_read_own on public.user_documents for select to authenticated using (user_id = (select auth.uid()));
create policy documents_create_own on public.user_documents for insert to authenticated with check (user_id = (select auth.uid()));
create policy documents_delete_own on public.user_documents for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and deleted_at is not null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('myway-documents','myway-documents',false,20971520,array['application/pdf','image/png','image/jpeg','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
create policy myway_documents_read_own on storage.objects for select to authenticated using (bucket_id = 'myway-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy myway_documents_upload_own on storage.objects for insert to authenticated with check (
  bucket_id = 'myway-documents'
  and name ~ '^[0-9a-f-]{36}/[a-zA-Z0-9_-]{1,128}$'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (select 1 from public.user_documents d where d.user_id = (select auth.uid()) and d.id = storage.filename(name) and d.deleted_at is not null)
);
create policy myway_documents_remove_own on storage.objects for delete to authenticated using (bucket_id = 'myway-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
comment on table public.user_documents is 'Private document metadata. File bytes are in the private myway-documents bucket. Tombstones prevent stale browser files being re-imported.';
