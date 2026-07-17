# Field Lead Tracker

A mobile lead tracking app built with React Native and Expo, designed to work offline.

This project is a small demo app for field sales or field marketing teams. The goal is to build a realistic mobile app foundation with authentication, lead management, Supabase integration, and a clean path toward offline-first sync.

## Current Scope

implements the online foundation:

* Expo Router navigation
* Supabase authentication
* User sign up and sign in
* Session-based redirects
* Leads table in Supabase
* Row-Level Security policies
* Lead list screen
* Create lead screen
* Edit lead screen
* TanStack Query for Supabase/server data
* Zustand for local UI state
* Search and status filters
* Skip unchanged lead updates

## Tech Stack

* React Native
* Expo
* Expo Router
* TypeScript
* Supabase
* TanStack Query
* Zustand

## App Features

### Authentication

Users can:

* Create an account
* Confirm their email
* Sign in
* Sign out
* Stay logged in through Supabase session persistence

### Lead Management

Users can:

* View their leads
* Create a new lead
* Edit an existing lead
* Search leads
* Filter leads by status

Lead statuses:

* New
* Contacted
* Qualified
* Lost

### Data Ownership

Each lead belongs to one authenticated user.

Supabase Row-Level Security makes sure users can only access their own leads.

## Architecture Notes

The app separates responsibilities like this:

```txt
Supabase = authentication and database
TanStack Query = remote/server data fetching and caching
Zustand = small local UI state
Expo Router = navigation and screen routing
```

Lead data is not stored in Zustand.

Lead data comes from Supabase and is managed through TanStack Query.

Zustand is only used for local UI state such as:

* Search text
* Selected status filter
* Reset filters action

This keeps the data flow clean and avoids duplicating server data in global state.

## Project Structure

```txt
src/
  app/
    _layout.tsx
    index.tsx
    login.tsx
    leads/
      index.tsx
      new.tsx
      [id].tsx

  features/
    leads/
      LeadForm.tsx
      leadQueries.ts
      leadService.ts
      leadTypes.ts

  lib/
    queryClient.ts
    supabase.ts

  store/
    leadFiltersStore.ts
```

## Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
```

The `.env` file should not be committed.

Use `.env.example` to document the required variables.

## Supabase Setup

The app uses a `leads` table.

Basic table shape:

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  company text,
  phone text,
  email text,
  status text not null default 'new',
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Enable Row-Level Security:

```sql
alter table leads enable row level security;
```

Policies:

```sql
create policy "Users can read their own leads"
on public.leads for select
using (auth.uid() = user_id);

create policy "Users can insert their own leads"
on public.leads for insert
with check (auth.uid() = user_id);

create policy "Users can update their own leads"
on public.leads for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own leads"
on public.leads for delete
using (auth.uid() = user_id);
```

If automatic table exposure is disabled in Supabase, grant access to the authenticated role:

```sql
grant usage on schema public to authenticated;

grant select, insert, update, delete
on table public.leads
to authenticated;
```

## Running the Project

Install dependencies:

```bash
npm install
```

Start the Expo dev server:

```bash
npx expo start
```

Run on web:

```bash
npm run web
```

Run TypeScript checks:

```bash
npx tsc --noEmit
```

## Release flow

This project uses EAS Build to define separate build profiles for development, internal testing, and production.

### Build profiles

* `development`: creates a development client build for local development and testing. Debug tools are enabled.
* `preview`: creates an internal testing build for QA/demo testing. Debug tools are enabled so sync and local database behavior can be inspected.
* `production`: creates a production-ready build for a future store release. Debug tools are disabled with `EXPO_PUBLIC_DISPLAY_DEBUG_TOOLS=false`.

### Build commands

```bash
npx eas-cli build --profile development --platform android
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile production --platform android
```

### Monitoring

The app uses Sentry to capture app errors, including sync and fake CRM integration failures. In a real release flow, preview builds would be tested internally first, then production builds would be monitored through Sentry after release.

## Current Flow

```txt
Open app
Sign in or create account
Go to leads list
Create a lead
Edit the lead
Search/filter leads
Sign out
```

## Current Progress

Completed:

* Project setup
* Expo Router routes
* Supabase client
* Supabase Auth
* Leads table
* RLS policies
* TanStack Query setup
* Remote leads list
* Create lead flow
* Edit lead flow
* Zustand filters
* Basic app polish

## Next Phase

focus on offline-first functionality:

* Local SQLite database
* Saving leads locally
* Reading leads from local storage
* Basic offline support
* Preparing for sync queue architecture

Future phases will add:

* Pending sync queue
* Sync when internet returns
* Conflict detection
* Supabase Edge Function
* Simulated CRM integration
* Error tracking
* Testing
* EAS build profiles
