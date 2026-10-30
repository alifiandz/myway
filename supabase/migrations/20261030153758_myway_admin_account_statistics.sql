create schema if not exists private;
create function private.myway_admin_account_statistics()
returns jsonb language plpgsql stable security definer set search_path = '' as $fn$
begin
 if auth.uid() is null or not exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin') then
  raise insufficient_privilege using message = 'MyWay administrator access required';
 end if;
 return (select jsonb_build_object(
  'registered',count(*),
  'signed_in',count(*) filter (where last_sign_in_at is not null),
  'last_7_days',count(*) filter (where last_sign_in_at >= now() - interval '7 days'),
  'last_30_days',count(*) filter (where last_sign_in_at >= now() - interval '30 days'),
  'updated_at',now()
 ) from auth.users where deleted_at is null);
end;
$fn$;
revoke all on function private.myway_admin_account_statistics() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.myway_admin_account_statistics() to authenticated;
create function public.myway_admin_account_statistics()
returns jsonb language sql stable security invoker set search_path = '' as $fn$
 select private.myway_admin_account_statistics();
$fn$;
revoke all on function public.myway_admin_account_statistics() from public, anon;
grant execute on function public.myway_admin_account_statistics() to authenticated;
notify pgrst,'reload schema';
