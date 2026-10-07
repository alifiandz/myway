create table public.programme_fact_review_notes (
 fact_id bigint primary key references public.programme_facts(id) on delete cascade,
 note text,
 updated_at timestamptz not null default now()
);
alter table public.programme_fact_review_notes enable row level security;
revoke all on public.programme_fact_review_notes from public, anon, authenticated;
grant select, insert, update, delete on public.programme_fact_review_notes to authenticated;
create policy "Admins read private fact notes" on public.programme_fact_review_notes for select to authenticated
 using (exists(select 1 from public.profiles where user_id=(select auth.uid()) and role='admin'));
create policy "Admins insert private fact notes" on public.programme_fact_review_notes for insert to authenticated
 with check (exists(select 1 from public.profiles where user_id=(select auth.uid()) and role='admin'));
create policy "Admins update private fact notes" on public.programme_fact_review_notes for update to authenticated
 using (exists(select 1 from public.profiles where user_id=(select auth.uid()) and role='admin'))
 with check (exists(select 1 from public.profiles where user_id=(select auth.uid()) and role='admin'));
create policy "Admins delete private fact notes" on public.programme_fact_review_notes for delete to authenticated
 using (exists(select 1 from public.profiles where user_id=(select auth.uid()) and role='admin'));
insert into public.programme_fact_review_notes(fact_id,note,updated_at)
 select id,note,updated_at from public.programme_facts where note is not null;
update public.programme_facts set note=null where note is not null;
alter table public.programme_facts add constraint private_notes_not_in_public_facts check (note is null);
comment on column public.programme_facts.note is 'Retired. Must remain null. Private notes are held in programme_fact_review_notes.';
create function public.save_programme_fact_review(
 p_fact_id bigint,p_programme_id text,p_value jsonb,p_status text,p_source_url text,p_verified_on date,p_note text
) returns void language plpgsql security invoker set search_path='' as $fn$
begin
 if not exists(select 1 from public.profiles where user_id=(select auth.uid()) and role='admin') then
   raise insufficient_privilege using message='Administrator access required';
 end if;
 if p_status='verified' and (p_value is null or p_value='null'::jsonb or p_value='""'::jsonb or nullif(btrim(p_source_url),'') is null or p_verified_on is null) then
   raise check_violation using message='Verified facts require a value, source and date';
 end if;
 update public.programme_facts set value=p_value,status=p_status,source_url=p_source_url,verified_on=p_verified_on,updated_at=now()
 where id=p_fact_id and programme_id=p_programme_id;
 if not found then raise exception 'Fact unavailable'; end if;
 insert into public.programme_fact_review_notes(fact_id,note,updated_at)
 values(p_fact_id,p_note,now())
 on conflict(fact_id) do update set note=excluded.note,updated_at=excluded.updated_at;
end;
$fn$;
revoke all on function public.save_programme_fact_review(bigint,text,jsonb,text,text,date,text) from public,anon;
grant execute on function public.save_programme_fact_review(bigint,text,jsonb,text,text,date,text) to authenticated;
notify pgrst, 'reload schema';
