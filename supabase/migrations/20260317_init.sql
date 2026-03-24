create extension if not exists "pgcrypto";

create table if not exists public.users (id uuid primary key default gen_random_uuid(), apple_id text, name text not null default '', email text, photo_url text, style_preference text not null default 'illustration', generation_frequency text not null default 'daily', is_premium boolean not null default false, onboarding_completed boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.todos (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, title text not null, category text not null, priority text not null, due_date date, recurrence text not null default 'once', is_completed boolean not null default false, completed_at timestamptz, created_at timestamptz not null default now());
create table if not exists public.generated_visuals (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, image_url text not null, thumbnail_url text, prompt_used text not null, style_used text not null, status text not null default 'pending', generation_date date, created_at timestamptz not null default now());
create table if not exists public.visual_todos (id uuid primary key default gen_random_uuid(), visual_id uuid not null references public.generated_visuals(id) on delete cascade, todo_id uuid not null references public.todos(id) on delete cascade, unique (visual_id, todo_id));
create table if not exists public.user_photos (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, photo_url text not null, is_active boolean not null default true, created_at timestamptz not null default now());
alter table public.users enable row level security;
alter table public.todos enable row level security;
alter table public.generated_visuals enable row level security;
alter table public.visual_todos enable row level security;
alter table public.user_photos enable row level security;
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can manage own todos" on public.todos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own visuals" on public.generated_visuals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own photos" on public.user_photos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
