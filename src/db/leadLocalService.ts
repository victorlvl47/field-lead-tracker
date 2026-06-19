import { getDatabase } from "@/db/database";
import type { LeadStatus } from "@/features/leads/leadTypes";
import * as Crypto from "expo-crypto";

export type LocalSyncStatus = "synced" | "pending_create" | "pending_update";

export type LocalLead = {
  id: string;
  user_id: string;

  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  status: LeadStatus;
  notes: string | null;

  created_at: string;
  updated_at: string;

  sync_status: LocalSyncStatus;
  last_synced_at: string | null;
};

export type DebugLocalLeadRow = Pick<
  LocalLead,
  | "id"
  | "user_id"
  | "name"
  | "company"
  | "status"
  | "notes"
  | "sync_status"
  | "last_synced_at"
  | "created_at"
  | "updated_at"
>;

export type CreateLocalLeadInput = {
  id?: string;
  user_id: string;

  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  status: LeadStatus;
  notes?: string | null;

  sync_status?: LocalSyncStatus;
  last_synced_at?: string | null;
};

export type UpdateLocalLeadInput = {
  id: string;
  user_id: string;

  name?: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: LeadStatus;
  notes?: string | null;
};

function createLocalId() {
  return Crypto.randomUUID();
}

export async function getLocalLeads(userId: string) {
  const db = await getDatabase();

  return db.getAllAsync<LocalLead>(
    `
      SELECT *
      FROM leads
      WHERE user_id = ?
      ORDER BY updated_at DESC;
    `,
    [userId],
  );
}

export async function getPendingLocalLeads(userId: string) {
  const db = await getDatabase();

  return db.getAllAsync<LocalLead>(
    `
      SELECT *
      FROM leads
      WHERE user_id = ?
        AND sync_status IN ('pending_create', 'pending_update')
      ORDER BY updated_at ASC;
    `,
    [userId],
  );
}

export async function getPendingCreateLeads(userId: string) {
  const db = await getDatabase();

  return db.getAllAsync<LocalLead>(
    `
      SELECT *
      FROM leads
      WHERE user_id = ?
        AND sync_status = 'pending_create'
      ORDER BY updated_at ASC;
    `,
    [userId],
  );
}

export async function getPendingUpdateLeads(userId: string) {
  const db = await getDatabase();

  return db.getAllAsync<LocalLead>(
    `
      SELECT *
      FROM leads
      WHERE user_id = ?
        AND sync_status = 'pending_update'
      ORDER BY updated_at ASC;
    `,
    [userId],
  );
}

export async function getDebugLocalLeads() {
  const db = await getDatabase();

  return db.getAllAsync<DebugLocalLeadRow>(
    `
      SELECT
        id,
        user_id,
        name,
        company,
        status,
        notes,
        sync_status,
        last_synced_at,
        created_at,
        updated_at
      FROM leads
      ORDER BY updated_at DESC;
    `,
  );
}

export async function getLocalLeadById(id: string, userId: string) {
  const db = await getDatabase();

  const lead = await db.getFirstAsync<LocalLead>(
    `
      SELECT *
      FROM leads
      WHERE id = ?
        AND user_id = ?;
    `,
    [id, userId],
  );

  return lead ?? null;
}

export async function upsertLocalLead(lead: LocalLead) {
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO leads (
        id,
        user_id,
        name,
        company,
        phone,
        email,
        status,
        notes,
        created_at,
        updated_at,
        sync_status,
        last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        name = excluded.name,
        company = excluded.company,
        phone = excluded.phone,
        email = excluded.email,
        status = excluded.status,
        notes = excluded.notes,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        sync_status = excluded.sync_status,
        last_synced_at = excluded.last_synced_at;
    `,
    [
      lead.id,
      lead.user_id,
      lead.name,
      lead.company,
      lead.phone,
      lead.email,
      lead.status,
      lead.notes,
      lead.created_at,
      lead.updated_at,
      lead.sync_status,
      lead.last_synced_at,
    ],
  );

  return lead;
}

export async function createLocalLead(input: CreateLocalLeadInput) {
  const now = new Date().toISOString();

  const lead: LocalLead = {
    id: input.id ?? createLocalId(),
    user_id: input.user_id,

    name: input.name,
    company: input.company ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    status: input.status,
    notes: input.notes ?? null,

    created_at: now,
    updated_at: now,

    sync_status: input.sync_status ?? "pending_create",
    last_synced_at: input.last_synced_at ?? null,
  };

  await upsertLocalLead(lead);

  return lead;
}

export async function updateLocalLead(input: UpdateLocalLeadInput) {
  const currentLead = await getLocalLeadById(input.id, input.user_id);

  if (!currentLead) {
    throw new Error("Local lead not found");
  }

  const nextSyncStatus: LocalSyncStatus =
    currentLead.sync_status === "pending_create"
      ? "pending_create"
      : "pending_update";

  const updatedLead: LocalLead = {
    ...currentLead,

    name: input.name ?? currentLead.name,
    company:
      input.company !== undefined ? input.company : currentLead.company,
    phone: input.phone !== undefined ? input.phone : currentLead.phone,
    email: input.email !== undefined ? input.email : currentLead.email,
    status: input.status ?? currentLead.status,
    notes: input.notes !== undefined ? input.notes : currentLead.notes,

    updated_at: new Date().toISOString(),
    sync_status: nextSyncStatus,
  };

  await upsertLocalLead(updatedLead);

  return updatedLead;
}

export async function markLocalLeadSynced(
  lead: Pick<LocalLead, "id" | "user_id">,
) {
  const db = await getDatabase();

  const lastSyncedAt = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE leads
      SET sync_status = 'synced',
          last_synced_at = ?
      WHERE id = ?
        AND user_id = ?;
    `,
    [lastSyncedAt, lead.id, lead.user_id],
  );

  return getLocalLeadById(lead.id, lead.user_id);
}

export async function printPendingLocalLeads(userId: string) {
  const pendingLeads = await getPendingLocalLeads(userId);

  console.log(
    "Pending local leads:",
    JSON.stringify(pendingLeads, null, 2),
  );

  return pendingLeads;
}
