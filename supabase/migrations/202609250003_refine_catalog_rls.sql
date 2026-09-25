drop policy "Published universities are readable" on public.universities;
drop policy "Published programmes are readable" on public.programmes;
drop policy "Public programme facts are readable" on public.programme_facts;
drop policy "Admins manage universities" on public.universities;
drop policy "Admins manage programmes" on public.programmes;
drop policy "Admins manage programme facts" on public.programme_facts;

create policy "Readable universities"
on public.universities for select
using (
  publication_status = 'published'
  or exists (
    select 1 from public.profiles
    where user_id = (select auth.uid()) and role = 'admin'
  )
);

create policy "Readable programmes"
on public.programmes for select
using (
  publication_status = 'published'
  or exists (
    select 1 from public.profiles
    where user_id = (select auth.uid()) and role = 'admin'
  )
);

create policy "Readable programme facts"
on public.programme_facts for select
using (
  (
    is_public
    and exists (
      select 1 from public.programmes p
      where p.id = programme_id and p.publication_status = 'published'
    )
  )
  or exists (
    select 1 from public.profiles
    where user_id = (select auth.uid()) and role = 'admin'
  )
);

create policy "Admins insert universities"
on public.universities for insert to authenticated
with check (exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin'));
create policy "Admins update universities"
on public.universities for update to authenticated
using (exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin'))
with check (exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin'));
create policy "Admins delete universities"
on public.universities for delete to authenticated
using (exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin'));

create policy "Admins insert programmes"
on public.programmes for insert to authenticated
with check (exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin'));
create policy "Admins update programmes"
on public.programmes for update to authenticated
using (exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin'))
with check (exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin'));
create policy "Admins delete programmes"
on public.programmes for delete to authenticated
using (exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin'));

create policy "Admins insert programme facts"
on public.programme_facts for insert to authenticated
with check (exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin'));
create policy "Admins update programme facts"
on public.programme_facts for update to authenticated
using (exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin'))
with check (exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin'));
create policy "Admins delete programme facts"
on public.programme_facts for delete to authenticated
using (exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin'));
