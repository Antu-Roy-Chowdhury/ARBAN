create table patients (
  patient_id text primary key,
  patient_name text,
  age int,
  sex text
);

create table images (
  id bigserial primary key,
  patient_id text references patients(patient_id),

  file_name text,
  file_path text,

  body_part_clean text,
  body_part_raw text,

  view_position text,
  study_date date,
  modality text,
  series_description text,

  instance_number int,
  rows int,
  columns int,

  age int,

  has_missing_body_part boolean default false
);

create table reports (
  id bigserial primary key,
  patient_id text references patients(patient_id),

  report_title text,
  findings_text text,
  impression_text text,
  full_report_text text,

  has_missing_impression boolean default false
);

create table reviews (
  id bigserial primary key,

  patient_id text,
  image_id bigint references images(id),

  status text check (status in ('matched', 'mismatch', 'unsure')),

  label text check (label in ('normal', 'abnormal')),

  final_impression text,
  notes text,

  reviewer_name text default "Kawser",
  reviewed_at timestamp default now()
);

alter table images add column patient_name text;
alter table images add column sex text;

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