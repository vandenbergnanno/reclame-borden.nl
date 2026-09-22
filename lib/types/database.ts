// Handgeschreven equivalent van de types die `supabase gen types typescript` zou genereren.
// Zodra er een echt Supabase-project gekoppeld is, kan dit bestand vervangen worden door de
// gegenereerde versie (`supabase gen types typescript --project-id <id> > lib/types/database.ts`).
// Houd dit bestand tot die tijd in lijn met supabase/migrations/0001_init.sql.

import type { AanvraagStatus, DesignStatus, Veldtype } from "./domain";

export interface Database {
  public: {
    Tables: {
      klanten: {
        Row: {
          id: string;
          naam: string;
          bedrijf: string | null;
          email: string;
          telefoon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          naam: string;
          bedrijf?: string | null;
          email: string;
          telefoon?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["klanten"]["Insert"]>;
      };
      aanvragen: {
        Row: {
          id: string;
          klant_id: string;
          veldtype: Veldtype;
          wens: string;
          status: AanvraagStatus;
          bijlage_pad: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          klant_id: string;
          veldtype: Veldtype;
          wens: string;
          status?: AanvraagStatus;
          bijlage_pad?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["aanvragen"]["Insert"]>;
      };
      content_checks: {
        Row: {
          id: string;
          aanvraag_id: string;
          probleem: string;
          geblokkeerd: boolean;
          toelichting: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          aanvraag_id: string;
          probleem: string;
          geblokkeerd?: boolean;
          toelichting?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_checks"]["Insert"]>;
      };
      designs: {
        Row: {
          id: string;
          aanvraag_id: string;
          versienummer: number;
          status: DesignStatus;
          opslaglocatie: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          aanvraag_id: string;
          versienummer?: number;
          status?: DesignStatus;
          opslaglocatie: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["designs"]["Insert"]>;
      };
      designdatabase: {
        Row: {
          id: string;
          titel: string;
          veldtype: Veldtype | null;
          opslaglocatie: string;
          tags: string[] | null;
          toegevoegd_op: string;
        };
        Insert: {
          id?: string;
          titel: string;
          veldtype?: Veldtype | null;
          opslaglocatie: string;
          tags?: string[] | null;
          toegevoegd_op?: string;
        };
        Update: Partial<Database["public"]["Tables"]["designdatabase"]["Insert"]>;
      };
      feedback: {
        Row: {
          id: string;
          aanvraag_id: string;
          goedgekeurd: boolean;
          feedbacktekst: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          aanvraag_id: string;
          goedgekeurd: boolean;
          feedbacktekst?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["feedback"]["Insert"]>;
      };
    };
  };
}
