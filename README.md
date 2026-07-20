# Field Lead Tracker

## Overview

Field Lead Tracker is an Expo / React Native demo app for field sales or field marketing teams. It lets an authenticated user create, edit, search, and filter their own leads. On native devices, the lead experience is offline-first: the app reads and writes a local SQLite database first, then sends queued changes to Supabase when the user chooses **Sync Now**.

The project demonstrates a practical mobile data flow rather than only an online CRUD screen: local persistence, a sync queue, conflict detection and resolution, monitoring, and a simulated CRM handoff.

## Why this project

Field teams cannot assume a reliable connection. A rep should be able to record or update a lead in a parking lot, at an event, or between customer visits without losing work. This project explores how a small React Native app can keep that workflow responsive offline while still syncing securely to a central system when connectivity returns.

## Tech stack

- Expo SDK 56 and React Native with TypeScript
- Expo Router for file-based navigation
- Supabase Auth and Postgres for authenticated remote data
- Supabase Row-Level Security (RLS) so users access only their own leads
- Expo SQLite for native local persistence
- TanStack Query for server and local-query caching
- Zustand for small UI-only state (lead search and status filters)
- `@react-native-community/netinfo` for network status
- Sentry for error monitoring
- Vitest and React Native Testing Library for tests
- EAS Build profiles for development, preview, and future production builds

## Architecture

```txt
Expo React Native app (Expo Router screens + LeadForm)
   |
   +--> Native: SQLite local database --> Sync service
   |                                      |
   |                                      v
   +--> Web: Supabase queries ----------> Supabase Auth + Postgres + RLS
                                             |
                                             v
                                  Supabase Edge Function
                                             |
                                             v
                           Fake CRM / HubSpot simulation

Sentry captures app, sync, and CRM errors.
```

`src/app/` contains the login and lead routes. `src/features/leads/` owns the lead form, types, Supabase service, and query hooks. `src/db/` owns the native SQLite schema, local lead operations, and remote-to-local caching. `src/sync/` owns queued sync and conflict rules. `src/features/crm/` invokes the Edge Function, while `src/lib/` configures Supabase, Sentry, and the query client.

The root layout initializes SQLite before rendering the app. The index route checks the saved Supabase session and sends the user to the leads list or login screen. Supabase stores native sessions in AsyncStorage; the web server fallback uses in-memory storage.

## Lead and authentication flow

Users can create an account, confirm email when required by Supabase, sign in, sign out, and return through a persisted native session. Each lead belongs to the signed-in user. RLS is the server-side boundary that restricts reads and writes to that user's rows.

The lead list supports search and status filtering (`new`, `contacted`, `qualified`, and `lost`). On native, creating a lead saves it in SQLite immediately. Editing a local lead also succeeds locally first. On web, the app uses the Supabase query and mutation hooks directly instead of SQLite.

## Offline-first strategy

Native mobile uses SQLite because field users need to keep working with poor or missing internet. A local `leads` table stores the lead fields plus timestamps, the current sync status, and `last_synced_at`. SQLite uses write-ahead logging (WAL) for its local database.

The local sync statuses are:

| Status | Meaning |
| --- | --- |
| `synced` | The local row is up to date after a successful sync or remote cache. |
| `pending_create` | A new local lead still needs to be inserted in Supabase. |
| `pending_update` | An existing lead was edited locally and needs an update in Supabase. |
| `conflict` | The remote record changed after this device last synced, so the update needs a user decision. |
| `sync_error` | A local error-state status available for failed sync handling. |

An edit to a brand-new, unsynced lead stays `pending_create`; an edit to a previously synced lead becomes `pending_update`. The list exposes the current status so the user can see whether a row is synced, pending, conflicted, or has an error state.

## Local SQLite storage

On native platforms, SQLite is the source used by the list and edit screens. Local rows are scoped by `user_id`, ordered by `updated_at`, and include the remote-compatible lead ID generated on-device. This means a lead created offline already has a stable ID when it is later inserted into Supabase.

Remote caching is deliberately conservative: while pulling leads from Supabase, the app skips any existing local row whose status is not `synced`. That prevents a pending local change from being overwritten by a stale remote copy.

## Sync flow

The native leads screen shows connection status and offers **Sync Now**. It does not attempt a sync when the device is clearly offline. A sync runs in this order:

1. Local changes are stored in SQLite.
2. New rows are marked `pending_create`.
3. Edited synced rows are marked `pending_update`.
4. Pending creates are inserted into Supabase and marked `synced` after success.
5. Pending updates are checked for conflicts, then updated in Supabase and marked `synced` after success.
6. Remote leads are pulled back into SQLite.
7. Local pending or conflict rows are protected from the remote pull and are not overwritten.

The queue processes rows individually. A failed create or update is reported in the sync result and captured by Sentry, while the remaining queued rows continue processing. The screen also includes development-only controls to inspect local rows, pending rows, and remote rows; those controls are controlled by `EXPO_PUBLIC_DISPLAY_DEBUG_TOOLS`.

## Conflict handling

Before pushing a `pending_update`, the app fetches that lead's remote row. If the remote `updated_at` timestamp is newer than the phone's `last_synced_at`, the local row becomes a `conflict` and its update is not pushed.

In plain terms: if the server version changed after this phone last synced, the app pauses rather than silently choosing a winner.

Opening a conflicted lead presents two choices:

- **Keep Local Version** updates Supabase from the local row, then marks the row synced.
- **Use Remote Version** replaces the local row with the remote version and marks it synced.

## Fake CRM integration

The app includes a fake CRM / HubSpot simulation, not a real HubSpot integration. From the leads screen, a synced lead can be sent to the Supabase Edge Function named `sync-lead-to-crm`. The client sends the lead payload to that function and displays the returned simulated CRM ID on success.

This keeps the app-side shape of an external CRM handoff—request, response, and error handling—without claiming that a production HubSpot account or API integration exists. On native, the action checks network status before attempting the fake CRM sync, and failures are captured by Sentry.

## Sentry monitoring

Sentry initializes when `EXPO_PUBLIC_SENTRY_DSN` is configured. The root app is wrapped with Sentry, and error capture is used around sync, conflict-resolution, remote-cache, and fake CRM failures. This gives a release team visibility into failures that occur on user devices instead of relying only on local logs.

Development builds can use the debug control to send a deliberate test error. The DSN is documented in `.env.example`; it should be provided through environment configuration, not committed in `.env`.

## Testing strategy

Run the current test suite with:

```bash
npm test
```

The tests currently cover:

- Conflict timestamp logic, including equal, older, missing, and invalid timestamps.
- `pending_create` queue behavior: a failed row is recorded and later rows still sync.
- `pending_update` queue behavior: a failed row is recorded and later rows still sync.
- A basic `LeadForm` component submission.

## Environment variables

Create a `.env` file in the project root using `.env.example` as the template:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
EXPO_PUBLIC_DISPLAY_DEBUG_TOOLS=false
```

Do not commit `.env`. Only `EXPO_PUBLIC_` variables are exposed to the Expo client, so they must not contain private server secrets.

## Running the project

```bash
npm install
npx expo start
```

Useful commands:

```bash
npm run android
npm run ios
npm run web
npx tsc --noEmit
npm test
```

## Release flow

EAS Build defines three build profiles in `eas.json`:

- `development` is a developer build with a development client and internal distribution.
- `preview` is an internal QA/demo build.
- `production` is a future store-ready build profile; it does not mean the app is currently published to the App Store or Play Store.

Development and preview enable local debug tools. Production disables them with `EXPO_PUBLIC_DISPLAY_DEBUG_TOOLS=false` and uses EAS remote app-version management with auto-increment enabled.

Example Android build commands:

```bash
npx eas-cli build --profile development --platform android
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile production --platform android
```

## Demo flow

1. Create an account or sign in.
2. Create a lead on a native device; it appears immediately as `pending_create`.
3. Use **Sync Now** while online; the lead is inserted into Supabase and becomes `synced`.
4. Edit the lead; it becomes `pending_update`.
5. Sync again to push the update and refresh the local cache.
6. To demonstrate a conflict, change the same remote lead after the device last synced, then sync the pending local update. Choose **Keep Local Version** or **Use Remote Version** on the edit screen.
7. Send a synced lead through the fake CRM action and inspect Sentry/debug feedback as needed.
