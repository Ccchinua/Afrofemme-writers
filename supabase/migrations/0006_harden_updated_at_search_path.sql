-- Pin the trigger function to a trusted search path and qualify built-ins.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$function$;
