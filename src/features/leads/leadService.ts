import type { LocalLead } from "@/db/leadLocalService";
import { supabase } from "@/lib/supabase";
import type { Lead, LeadFormValues } from "./leadTypes";

export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getLeadById(id: string): Promise<Lead> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getRemoteLeadByIdForUser(
  id: string,
  userId: string,
): Promise<Lead | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function createLead(values: LeadFormValues): Promise<Lead> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!userData.user) {
    throw new Error("User is not authenticated.");
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      user_id: userData.user.id,
      name: values.name.trim(),
      company: values.company.trim() || null,
      phone: values.phone.trim() || null,
      email: values.email.trim() || null,
      status: values.status,
      notes: values.notes.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateLead(
  id: string,
  values: LeadFormValues
): Promise<Lead> {
  const { data, error } = await supabase
    .from("leads")
    .update({
      name: values.name.trim(),
      company: values.company.trim() || null,
      phone: values.phone.trim() || null,
      email: values.email.trim() || null,
      status: values.status,
      notes: values.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function insertLocalLeadIntoSupabase(
  lead: LocalLead
): Promise<Lead> {
  const { data, error } = await supabase
    .from("leads")
    .insert({
      id: lead.id,
      user_id: lead.user_id,

      name: lead.name,
      company: lead.company,
      phone: lead.phone,
      email: lead.email,
      status: lead.status,
      notes: lead.notes,

      created_at: lead.created_at,
      updated_at: lead.updated_at,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateSupabaseLeadFromLocal(
  lead: LocalLead
): Promise<Lead> {
  const { data, error } = await supabase
    .from("leads")
    .update({
      name: lead.name,
      company: lead.company,
      phone: lead.phone,
      email: lead.email,
      status: lead.status,
      notes: lead.notes,
      updated_at: lead.updated_at,
    })
    .eq("id", lead.id)
    .eq("user_id", lead.user_id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
