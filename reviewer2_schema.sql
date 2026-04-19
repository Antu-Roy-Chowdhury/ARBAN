-- Suggested second-review table for ARBAN
-- Purpose:
-- 1. Load the first review into the second-review form
-- 2. Let reviewer 2 either approve it as-is or submit corrections
-- 3. Keep an audit trail without overwriting the original review

create table public.reviews_second_pass (
  id bigserial primary key,

  source_review_id bigint not null
    references public.reviews(id) on delete cascade,

  patient_id text not null
    references public.patients(patient_id),

  image_id bigint
    references public.images(id) on delete set null,

  review_decision text not null
    check (review_decision in ('approved', 'corrected')),

  status text not null
    check (status in ('matched', 'mismatch', 'unsure')),

  label text not null
    check (label in ('normal', 'abnormal')),

  final_impression text,
  notes text,

  reviewer2_name text not null default 'Siyam',
  reviewed_at timestamptz not null default now(),

  constraint reviews_second_pass_one_per_source unique (source_review_id)
);

create index idx_reviews_second_pass_patient_id
  on public.reviews_second_pass(patient_id);

create index idx_reviews_second_pass_image_id
  on public.reviews_second_pass(image_id);

create index idx_reviews_second_pass_decision
  on public.reviews_second_pass(review_decision);


-- Recommended companion query idea:
-- If reviewer 2 clicks "Looks right", insert the same review values from source review
-- with review_decision = 'approved'.
--
-- If reviewer 2 edits anything, insert the edited values into this table
-- with review_decision = 'corrected'.
--
-- This keeps:
-- - original review in `reviews`
-- - second-pass decision in `reviews_second_pass`
-- - final audit trail for both people
