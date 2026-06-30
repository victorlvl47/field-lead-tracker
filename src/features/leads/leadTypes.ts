export type LeadStatus = "new" | "contacted" | "qualified" | "lost";

export type Lead = {
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
};

export type LeadFormValues = {
  name: string;
  company: string;
  phone: string;
  email: string;
  status: LeadStatus;
  notes: string;
};