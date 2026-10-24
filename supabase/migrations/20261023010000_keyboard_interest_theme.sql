-- Apply after 20261023000000_keyboard_interest_requests.sql.
-- Existing requests retain their recorded color; new requests specify a theme.
begin;

alter table public.keyboard_interest_requests
  add column preferred_theme text;

alter table public.keyboard_interest_requests
  alter column preferred_color drop not null;

-- NOT VALID preserves earlier color-only rows while enforcing a theme on new rows.
alter table public.keyboard_interest_requests
  add constraint keyboard_interest_preferred_theme_check
  check (preferred_theme is not null and preferred_theme in
    ('mosaic', 'space', 'ocean', 'basketball', 'music', 'animals', 'trains')) not valid;

commit;
