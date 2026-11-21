-- 2026-11-20 security fix: wedding + Wallet-Thesis tables were writable by ANY
-- signed-in user of the shared project, and guests/households (emails, phones,
-- home addresses, invite codes) were readable by anyone holding the anon key.
--
-- After this migration:
--   * Only accounts in public.app_admins can read/write wedding admin data or
--     write Wallet-Thesis posts/pages.
--   * Public wedding content (events, faq, meals, photos, registry, settings,
--     story, travel, guestbook read + insert) stays public, as before.
--   * The public RSVP flow goes through two SECURITY DEFINER functions that
--     return only household name + guest names, and only accept RSVPs for
--     guests that belong to the household being answered for.

begin;

-- ── Admin allowlist ───────────────────────────────────────────────────────
create table if not exists public.app_admins (
  app     text not null check (app in ('wedding', 'wallet_thesis')),
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (app, user_id)
);
alter table public.app_admins enable row level security;
-- No policies: only service_role / SQL editor can change the allowlist.

create or replace function public.is_app_admin(p_app text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_admins
                 where app = p_app and user_id = (select auth.uid()))
$$;
revoke all on function public.is_app_admin(text) from public, anon;
grant execute on function public.is_app_admin(text) to authenticated;

insert into public.app_admins (app, user_id) values
  ('wedding',       '9d08cbde-8c56-4f85-a78d-69572483bcda'),
  ('wallet_thesis', '9d08cbde-8c56-4f85-a78d-69572483bcda')
on conflict do nothing;

-- ── Wedding admin tables: replace "any authenticated" with admin-only ─────
do $$
declare t text;
begin
  foreach t in array array['wedding_budget','wedding_events','wedding_faq','wedding_gifts',
    'wedding_meals','wedding_photos','wedding_registry','wedding_seat_assignments',
    'wedding_settings','wedding_story','wedding_tables','wedding_tasks','wedding_timeline',
    'wedding_travel','wedding_unnamed_seats','wedding_vendors']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin', t);
    execute format($p$create policy %I on public.%I for all to authenticated
                      using (public.is_app_admin('wedding')) with check (public.is_app_admin('wedding'))$p$,
                   t || '_admin', t);
  end loop;
end $$;

drop policy if exists "guestbook delete admin" on public.wedding_guestbook;
create policy "guestbook delete admin" on public.wedding_guestbook for delete to authenticated
  using (public.is_app_admin('wedding'));

-- guests / households / rsvp_responses: admin-only, no public access at all
drop policy if exists guests_select on public.guests;
drop policy if exists guests_insert on public.guests;
drop policy if exists guests_update on public.guests;
drop policy if exists guests_delete on public.guests;
create policy guests_admin on public.guests for all to authenticated
  using (public.is_app_admin('wedding')) with check (public.is_app_admin('wedding'));

drop policy if exists households_select on public.households;
drop policy if exists households_insert on public.households;
drop policy if exists households_update on public.households;
drop policy if exists households_delete on public.households;
create policy households_admin on public.households for all to authenticated
  using (public.is_app_admin('wedding')) with check (public.is_app_admin('wedding'));

drop policy if exists rsvp_select on public.rsvp_responses;
drop policy if exists rsvp_insert on public.rsvp_responses;
drop policy if exists rsvp_update on public.rsvp_responses;
drop policy if exists rsvp_delete on public.rsvp_responses;
create policy rsvp_admin on public.rsvp_responses for all to authenticated
  using (public.is_app_admin('wedding')) with check (public.is_app_admin('wedding'));

-- ── Public RSVP API ───────────────────────────────────────────────────────
-- Lookup by invite code (exact) or by exact last name / "first last" name.
-- Returns only what the RSVP form renders. No email, phone, or address.
create or replace function public.wedding_rsvp_lookup(p_query text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare q text := lower(btrim(coalesce(p_query, ''))); hid uuid;
begin
  if length(q) < 2 or length(q) > 80 then return null; end if;
  select id into hid from public.households where invite_code = upper(q);
  if hid is null then
    select g.household_id into hid from public.guests g
     where lower(g.last_name) = q or lower(g.first_name || ' ' || g.last_name) = q
     order by g.created_at limit 1;
  end if;
  if hid is null then return null; end if;
  return (
    select jsonb_build_object(
      'id', h.id, 'name', h.name, 'max_guests', h.max_guests,
      'guests', coalesce((select jsonb_agg(jsonb_build_object(
                  'id', g.id, 'household_id', g.household_id, 'first_name', g.first_name,
                  'last_name', g.last_name, 'is_child', g.is_child) order by g.created_at)
                from public.guests g where g.household_id = h.id), '[]'::jsonb))
    from public.households h where h.id = hid);
end $$;

-- p_rows: [{guest_id, attending, meal_choice_id, dietary_restrictions, song_request, notes}]
create or replace function public.wedding_rsvp_submit(p_household_id uuid, p_rows jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0
     or jsonb_array_length(p_rows) > 20 then
    raise exception 'invalid rsvp payload';
  end if;
  if exists (select 1 from jsonb_array_elements(p_rows) r
             where not exists (select 1 from public.guests g
                               where g.id = (r->>'guest_id')::uuid and g.household_id = p_household_id)) then
    raise exception 'guest does not belong to household';
  end if;
  insert into public.rsvp_responses
    (household_id, guest_id, attending, meal_choice_id, dietary_restrictions, song_request, notes, submitted_at)
  select p_household_id, (r->>'guest_id')::uuid, coalesce((r->>'attending')::boolean, false),
         left(r->>'meal_choice_id', 100), left(r->>'dietary_restrictions', 500),
         left(r->>'song_request', 200), left(r->>'notes', 2000), now()
    from jsonb_array_elements(p_rows) r
  on conflict (guest_id) do update set
    attending = excluded.attending, meal_choice_id = excluded.meal_choice_id,
    dietary_restrictions = excluded.dietary_restrictions, song_request = excluded.song_request,
    notes = excluded.notes, submitted_at = excluded.submitted_at
   where public.rsvp_responses.household_id = p_household_id;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.wedding_rsvp_lookup(text) from public;
revoke all on function public.wedding_rsvp_submit(uuid, jsonb) from public;
grant execute on function public.wedding_rsvp_lookup(text) to anon, authenticated;
grant execute on function public.wedding_rsvp_submit(uuid, jsonb) to anon, authenticated;

-- ── wedding-photos storage bucket: admin-only writes (reads stay public) ──
drop policy if exists wedding_photos_storage_insert on storage.objects;
drop policy if exists wedding_photos_storage_update on storage.objects;
drop policy if exists wedding_photos_storage_delete on storage.objects;
create policy wedding_photos_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'wedding-photos' and public.is_app_admin('wedding'));
create policy wedding_photos_storage_update on storage.objects for update to authenticated
  using (bucket_id = 'wedding-photos' and public.is_app_admin('wedding'));
create policy wedding_photos_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'wedding-photos' and public.is_app_admin('wedding'));

-- ── wallet-thesis-images bucket: admin-only writes (reads stay public) ────
drop policy if exists wallet_thesis_images_authenticated_insert on storage.objects;
drop policy if exists wallet_thesis_images_authenticated_update on storage.objects;
drop policy if exists wallet_thesis_images_authenticated_delete on storage.objects;
create policy wallet_thesis_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'wallet-thesis-images' and public.is_app_admin('wallet_thesis'));
create policy wallet_thesis_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'wallet-thesis-images' and public.is_app_admin('wallet_thesis'));
create policy wallet_thesis_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'wallet-thesis-images' and public.is_app_admin('wallet_thesis'));

-- ── Wallet-Thesis: admin-only writes and draft reads ──────────────────────
drop policy if exists "authenticated can insert pages" on public.wallet_thesis_pages;
drop policy if exists "authenticated can update pages" on public.wallet_thesis_pages;
create policy "admin can insert pages" on public.wallet_thesis_pages for insert to authenticated
  with check (public.is_app_admin('wallet_thesis'));
create policy "admin can update pages" on public.wallet_thesis_pages for update to authenticated
  using (public.is_app_admin('wallet_thesis')) with check (public.is_app_admin('wallet_thesis'));

drop policy if exists "authenticated can read all posts" on public.wallet_thesis_posts;
drop policy if exists "authenticated can insert posts" on public.wallet_thesis_posts;
drop policy if exists "authenticated can update posts" on public.wallet_thesis_posts;
drop policy if exists "authenticated can delete posts" on public.wallet_thesis_posts;
create policy "admin can read all posts" on public.wallet_thesis_posts for select to authenticated
  using (public.is_app_admin('wallet_thesis'));
create policy "admin can insert posts" on public.wallet_thesis_posts for insert to authenticated
  with check (public.is_app_admin('wallet_thesis'));
create policy "admin can update posts" on public.wallet_thesis_posts for update to authenticated
  using (public.is_app_admin('wallet_thesis')) with check (public.is_app_admin('wallet_thesis'));
create policy "admin can delete posts" on public.wallet_thesis_posts for delete to authenticated
  using (public.is_app_admin('wallet_thesis'));

commit;
