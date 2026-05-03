create table if not exists users (
  id varchar(36) primary key,
  email varchar(320) not null unique,
  password_hash text not null,
  role varchar(24) not null default 'user',
  organization_id varchar(36),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scam_reports (
  id varchar(36) primary key,
  user_id varchar(36),
  organization_id varchar(36),
  platform varchar(64),
  input_type varchar(24) not null,
  raw_text text not null default '',
  url text not null default '',
  screenshot_url text,
  risk_score integer not null,
  risk_level varchar(24) not null,
  scam_categories jsonb not null default '[]'::jsonb,
  summary text not null,
  red_flags jsonb not null default '[]'::jsonb,
  explanation text not null,
  recommended_action text not null,
  safe_reply text not null,
  report_summary text not null,
  confidence double precision not null,
  matched_patterns jsonb not null default '[]'::jsonb,
  url_checks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists uploaded_files (
  id varchar(36) primary key,
  user_id varchar(36),
  scam_report_id varchar(36),
  file_url text not null,
  file_type varchar(128) not null,
  file_size integer not null,
  ocr_text text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists scam_patterns (
  id varchar(36) primary key,
  scam_category varchar(128) not null,
  platform varchar(64) not null default 'Other',
  pattern_description text not null,
  red_flags jsonb not null default '[]'::jsonb,
  severity varchar(32) not null,
  recommended_action text not null,
  source_reference text not null default '',
  embedding jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_email on users(email);
create index if not exists idx_reports_user_id on scam_reports(user_id);
create index if not exists idx_uploaded_files_user_id on uploaded_files(user_id);
