-- Review deduplication helpers for Supabase / Postgres
-- Run the preview queries first. Only run the DELETE blocks after you verify the results.

-- 1) Patients with more than one review row
select
  patient_id,
  count(*) as review_count,
  min(reviewed_at) as first_reviewed_at,
  max(reviewed_at) as last_reviewed_at,
  string_agg(coalesce(status, 'unknown'), ' -> ' order by reviewed_at, id) as status_history
from reviews
where patient_id is not null
group by patient_id
having count(*) > 1
order by review_count desc, patient_id;


-- 2) Preview exact duplicate review rows
-- Keeps the newest row and marks the older copies for deletion.
with ranked_duplicates as (
  select
    id,
    patient_id,
    image_id,
    status,
    label,
    final_impression,
    notes,
    reviewer_name,
    reviewed_at,
    row_number() over (
      partition by
        patient_id,
        image_id,
        status,
        label,
        coalesce(final_impression, ''),
        coalesce(notes, ''),
        coalesce(reviewer_name, '')
      order by reviewed_at desc, id desc
    ) as duplicate_rank
  from reviews
)
select *
from ranked_duplicates
where duplicate_rank > 1
order by patient_id, reviewed_at, id;


-- 3) Delete exact duplicate review rows
-- Safe when the duplicated rows are truly identical except for id / reviewed_at.
with ranked_duplicates as (
  select
    id,
    row_number() over (
      partition by
        patient_id,
        image_id,
        status,
        label,
        coalesce(final_impression, ''),
        coalesce(notes, ''),
        coalesce(reviewer_name, '')
      order by reviewed_at desc, id desc
    ) as duplicate_rank
  from reviews
)
delete from reviews
where id in (
  select id
  from ranked_duplicates
  where duplicate_rank > 1
);


-- 4) Preview older "unsure" rows when a later definitive review exists
-- Example:
--   unsure -> matched   => keep matched, delete older unsure
--   unsure -> mismatch  => keep mismatch, delete older unsure
with latest_definitive as (
  select
    patient_id,
    max(reviewed_at) as latest_definitive_at
  from reviews
  where status in ('matched', 'mismatch')
    and patient_id is not null
  group by patient_id
)
select
  r.*
from reviews r
join latest_definitive d
  on d.patient_id = r.patient_id
where r.status = 'unsure'
  and r.reviewed_at < d.latest_definitive_at
order by r.patient_id, r.reviewed_at, r.id;


-- 5) Delete older "unsure" rows once a later definitive review exists
with latest_definitive as (
  select
    patient_id,
    max(reviewed_at) as latest_definitive_at
  from reviews
  where status in ('matched', 'mismatch')
    and patient_id is not null
  group by patient_id
)
delete from reviews r
using latest_definitive d
where d.patient_id = r.patient_id
  and r.status = 'unsure'
  and r.reviewed_at < d.latest_definitive_at;


-- 6) Preview patients that still have multiple definitive rows
-- This catches cases like matched + matched, or matched + mismatch.
select
  patient_id,
  count(*) as definitive_review_count,
  string_agg(
    concat(coalesce(status, 'unknown'), ' @ ', reviewed_at::text),
    ' | '
    order by reviewed_at, id
  ) as definitive_history
from reviews
where status in ('matched', 'mismatch')
  and patient_id is not null
group by patient_id
having count(*) > 1
order by definitive_review_count desc, patient_id;


-- 7) Optional aggressive cleanup: keep only the newest definitive row per patient
-- Use this only if you want exactly one final definitive review per patient.
with ranked_definitive as (
  select
    id,
    row_number() over (
      partition by patient_id
      order by reviewed_at desc, id desc
    ) as definitive_rank
  from reviews
  where status in ('matched', 'mismatch')
    and patient_id is not null
)
select *
from ranked_definitive
where definitive_rank > 1
order by id;

-- If the preview above looks correct, convert it to delete:
-- delete from reviews
-- where id in (
--   with ranked_definitive as (
--     select
--       id,
--       row_number() over (
--         partition by patient_id
--         order by reviewed_at desc, id desc
--       ) as definitive_rank
--     from reviews
--     where status in ('matched', 'mismatch')
--       and patient_id is not null
--   )
--   select id
--   from ranked_definitive
--   where definitive_rank > 1
-- );
