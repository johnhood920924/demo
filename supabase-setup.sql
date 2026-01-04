-- Create storage bucket for MIDI files
insert into storage.buckets (id, name, public)
values ('midi-files', 'midi-files', true)
on conflict (id) do nothing;

-- Create table for MIDI file metadata
create table if not exists midi_files (
  id bigserial primary key,
  name text not null,
  file_name text not null,
  file_url text not null,
  duration numeric,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table midi_files enable row level security;

-- Allow public reads
create policy "Allow public reads" on midi_files
  for select using (true);

-- Allow public inserts
create policy "Allow public inserts" on midi_files
  for insert with check (true);

-- Allow public deletes
create policy "Allow public deletes" on midi_files
  for delete using (true);

-- Storage policies (allow public uploads and reads)
create policy "Allow public uploads" on storage.objects
  for insert with check (bucket_id = 'midi-files');

create policy "Allow public reads" on storage.objects
  for select using (bucket_id = 'midi-files');

-- Allow public deletes from storage
create policy "Allow public deletes" on storage.objects
  for delete using (bucket_id = 'midi-files');

