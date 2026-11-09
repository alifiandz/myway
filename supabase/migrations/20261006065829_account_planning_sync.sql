create table public.account_planning_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 1048576),
 revision bigint not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.account_planning_state enable row level security;
grant select,insert,update on public.account_planning_state to authenticated;
create policy "Own planning state read" on public.account_planning_state for select to authenticated using ((select auth.uid())=user_id);
create policy "Own planning state insert" on public.account_planning_state for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Own planning state update" on public.account_planning_state for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create function public.save_account_planning_state(payload jsonb, expected_revision bigint)
returns setof public.account_planning_state language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if expected_revision=0 then
  return query insert into public.account_planning_state(user_id,data) values(auth.uid(),payload)
   on conflict(user_id) do nothing returning *;
 else
  return query update public.account_planning_state set data=payload, revision=revision+1,updated_at=now()
   where user_id=auth.uid() and revision=expected_revision returning *;
 end if;
end; $$;
revoke all on function public.save_account_planning_state(jsonb,bigint) from public,anon;
grant execute on function public.save_account_planning_state(jsonb,bigint) to authenticated;
revoke all on public.account_planning_state from anon,authenticated;
grant select,insert,update on public.account_planning_state to authenticated;
