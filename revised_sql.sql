create table public.patients (
    patient_id text primary key,
    patient_name text,
    age text,
    sex text
);

create table public.images (
    id bigserial primary key,

    patient_id text not null references public.patients(patient_id),

    patient_name text,
    age text,
    sex text,

    file_name text,
    file_path text,

    body_part_clean text,
    body_part_raw text,

    view_position text,
    study_date date,
    modality text,
    series_description text,

    instance_number integer,
    rows integer,
    columns integer,

    has_missing_body_part boolean default false
);

create table public.reports (
    id bigserial primary key,

    patient_id text not null references public.patients(patient_id),

    report_title text,
    patient_name text,
    age_raw text,

    findings_text text,
    impression_text text,
    full_report_text text,
    raw_text text,

    has_missing_impression boolean default false,

    created_at timestamptz default now()
);

create table reviews (
  id bigserial primary key,

  patient_id text references patients(patient_id),

  image_id bigint references images(id) on delete set null,

  status text check (status in ('matched', 'mismatch', 'unsure')),

  label text check (label in ('normal', 'abnormal')),

  final_impression text,
  notes text,

  reviewer_name text default 'Kawser',
  reviewed_at timestamp default now()
);

create index idx_reviews_patient_id on reviews(patient_id);
create index idx_reviews_image_id on reviews(image_id);



-- images
alter table images enable row level security;

create policy "public read images"
on images
for select
using (true);

-- reports
alter table reports enable row level security;

create policy "public read reports"
on reports
for select
using (true);

-- patients (if used)
alter table patients enable row level security;

create policy "public read patients"
on patients
for select
using (true);