create table private.myway_usage_visits (
 visit_id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 page text not null check(page in ('dashboard','explore','pathway','tasks','progress','profile','settings')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 active_seconds integer not null default 0 check(active_seconds>=0)
);
alter table private.myway_usage_visits enable row level security;
revoke all on private.myway_usage_visits from public,anon,authenticated;
create index myway_usage_retention_idx on private.myway_usage_visits(created_at);
create index myway_usage_user_idx on private.myway_usage_visits(user_id,created_at);
create table private.myway_usage_configuration (singleton boolean primary key default true check(singleton),started_at timestamptz not null default now());
insert into private.myway_usage_configuration(singleton) values(true);
alter table private.myway_usage_configuration enable row level security;
revoke all on private.myway_usage_configuration from public,anon,authenticated;
create function private.myway_record_usage(p_visit uuid,p_page text,p_seconds integer default 0)
returns void language plpgsql security definer set search_path='' as $fn$
begin
 if auth.uid() is null then raise insufficient_privilege using message='Sign in required';end if;
 if p_visit is null or p_page is null or p_page not in ('dashboard','explore','pathway','tasks','progress','profile','settings') or p_seconds is null or p_seconds<0 or p_seconds>30 then raise invalid_parameter_value using message='Invalid usage sample';end if;
 insert into private.myway_usage_visits(visit_id,user_id,page) values(p_visit,auth.uid(),p_page)
 on conflict(visit_id) do update set
 active_seconds=private.myway_usage_visits.active_seconds+least(p_seconds,greatest(0,floor(extract(epoch from now()-private.myway_usage_visits.updated_at))::integer)),
 updated_at=now()
 where private.myway_usage_visits.user_id=auth.uid() and private.myway_usage_visits.page=p_page;
end;$fn$;
create function public.myway_record_usage(p_visit uuid,p_page text,p_seconds integer default 0)
returns void language sql security invoker set search_path='' as $fn$ select private.myway_record_usage(p_visit,p_page,p_seconds);$fn$;
revoke all on function private.myway_record_usage(uuid,text,integer),public.myway_record_usage(uuid,text,integer) from public,anon;
grant execute on function private.myway_record_usage(uuid,text,integer),public.myway_record_usage(uuid,text,integer) to authenticated;
create function private.myway_admin_account_directory(p_search text default '',p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $fn$
declare answer jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where user_id=auth.uid() and role='admin') then raise insufficient_privilege using message='MyWay administrator access required';end if;
 if p_offset<0 or p_offset>10000 or length(p_search)>100 then raise invalid_parameter_value;end if;
 with accounts as (
 select u.id,u.email,coalesce(nullif(p.display_name,''),nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),'') as display_name,
 coalesce(u.raw_user_meta_data->>'avatar_url',u.raw_user_meta_data->>'picture') as avatar_url,
 u.created_at,u.last_sign_in_at,
 coalesce((select jsonb_agg(distinct i.provider) from auth.identities i where i.user_id=u.id),'[]'::jsonb) as providers,
 (select count(*) from private.myway_usage_visits v where v.user_id=u.id and v.created_at>=now()-interval '30 days') as page_views,
 coalesce((select sum(v.active_seconds) from private.myway_usage_visits v where v.user_id=u.id and v.created_at>=now()-interval '30 days'),0) as active_seconds,
 (select max(v.updated_at) from private.myway_usage_visits v where v.user_id=u.id and v.created_at>=now()-interval '30 days') as last_seen_at
 from auth.users u left join public.profiles p on p.user_id=u.id where u.deleted_at is null
 ),filtered as(select * from accounts where position(lower(coalesce(p_search,'')) in lower(coalesce(email,'')||' '||display_name))>0),
 paged as(select * from filtered order by created_at desc,id limit 25 offset p_offset)
 select jsonb_build_object('total',(select count(*) from filtered),'accounts',coalesce((select jsonb_agg(to_jsonb(paged)) from paged),'[]'::jsonb),'updated_at',now()) into answer;
 return answer;
end;$fn$;
create function public.myway_admin_account_directory(p_search text default '',p_offset integer default 0)
returns jsonb language sql stable security invoker set search_path='' as $fn$ select private.myway_admin_account_directory(p_search,p_offset);$fn$;
revoke all on function private.myway_admin_account_directory(text,integer),public.myway_admin_account_directory(text,integer) from public,anon;
grant execute on function private.myway_admin_account_directory(text,integer),public.myway_admin_account_directory(text,integer) to authenticated;
create function private.myway_admin_usage_summary()
returns jsonb language plpgsql stable security definer set search_path='' as $fn$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where user_id=auth.uid() and role='admin') then raise insufficient_privilege using message='MyWay administrator access required';end if;
 return (with visits as(select * from private.myway_usage_visits where created_at>=now()-interval '30 days'),
 pages as(select page,count(*) as views,count(distinct user_id) as accounts,sum(active_seconds) as active_seconds from visits group by page order by count(*) desc,page),
 days as(select (created_at at time zone 'Asia/Jakarta')::date as day,count(*) as views from visits group by 1 order by 1)
 select jsonb_build_object('page_views',(select count(*) from visits),'active_accounts',(select count(distinct user_id) from visits),'active_seconds',coalesce((select sum(active_seconds) from visits),0),'pages',coalesce((select jsonb_agg(to_jsonb(pages)) from pages),'[]'::jsonb),'days',coalesce((select jsonb_agg(to_jsonb(days)) from days),'[]'::jsonb),'started_at',(select started_at from private.myway_usage_configuration where singleton),'updated_at',now()));
end;$fn$;
create function public.myway_admin_usage_summary()
returns jsonb language sql stable security invoker set search_path='' as $fn$ select private.myway_admin_usage_summary();$fn$;
revoke all on function private.myway_admin_usage_summary(),public.myway_admin_usage_summary() from public,anon;
grant execute on function private.myway_admin_usage_summary(),public.myway_admin_usage_summary() to authenticated;
create extension if not exists pg_cron;
select cron.schedule('myway-usage-retention','17 * * * *',$job$delete from private.myway_usage_visits where created_at < now()-interval '30 days'$job$);
notify pgrst,'reload schema';
