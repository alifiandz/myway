-- Approved MyWay backend fixes applied 2026-11-05.
-- No existing student or catalogue rows are rewritten.
SET LOCAL lock_timeout = '3s';
ALTER POLICY "Readable universities" ON public.universities TO authenticated;
CREATE POLICY "Published universities are readable"
ON public.universities FOR SELECT TO anon
USING (publication_status = 'published');

CREATE OR REPLACE FUNCTION public.save_programme_fact_review_context(
p_fact_id bigint, p_programme_id text, p_value jsonb, p_status text,
p_source_url text, p_verified_on date, p_note text,
p_academic_year text, p_applicant_context text, p_review_due_on date
) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $function$
begin
 if p_review_due_on is not null and p_verified_on is not null and p_review_due_on<p_verified_on then
  raise check_violation using message='Review due date cannot be before the checked date';
 end if;
 perform public.save_programme_fact_review(p_fact_id,p_programme_id,p_value,p_status,p_source_url,p_verified_on,p_note);
 update public.programme_facts set academic_year=coalesce(btrim(p_academic_year),''),applicant_context=coalesce(btrim(p_applicant_context),''),review_due_on=p_review_due_on
 where id=p_fact_id and programme_id=p_programme_id;
end;
$function$;

/* ROLLBACK (requires separate approval):
BEGIN;
SET LOCAL lock_timeout = '3s';
DROP POLICY "Published universities are readable" ON public.universities;
ALTER POLICY "Readable universities" ON public.universities TO public;
CREATE OR REPLACE FUNCTION public.save_programme_fact_review_context(
p_fact_id bigint, p_programme_id text, p_value jsonb, p_status text,
p_source_url text, p_verified_on date, p_note text,
p_academic_year text, p_applicant_context text, p_review_due_on date
) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $function$
begin
 if p_review_due_on is not null and p_verified_on is not null and p_review_due_on<p_verified_on then
  raise check_violation using message='Review due date cannot be before the checked date';
 end if;
 perform public.save_programme_fact_review(p_fact_id,p_programme_id,p_value,p_status,p_source_url,p_verified_on,p_note);
 update public.programme_facts set academic_year=nullif(btrim(p_academic_year),''),applicant_context=nullif(btrim(p_applicant_context),''),review_due_on=p_review_due_on
 where id=p_fact_id and programme_id=p_programme_id;
end;
$function$;
COMMIT;
*/
