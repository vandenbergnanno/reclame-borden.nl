// Handgeschreven equivalent van de types die `supabase gen types typescript` zou genereren.
// Zodra er een echt Supabase-project gekoppeld is, kan dit bestand vervangen worden door de
// gegenereerde versie (`supabase gen types typescript --project-id <id> > lib/types/database.ts`).
// Houd dit bestand tot die tijd in lijn met supabase/migrations/0001_init.sql.
//
// De `Relationships`-array per tabel, en de lege `Views`/`Functions`/`Enums`/`CompositeTypes`,
// zijn nodig omdat @supabase/supabase-js dit exacte vorm verwacht van het `Database`-type
// (dezelfde vorm als de door de CLI gegenereerde types).

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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "aanvragen_klant_id_fkey";
            columns: ["klant_id"];
            isOneToOne: false;
            referencedRelation: "klanten";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "content_checks_aanvraag_id_fkey";
            columns: ["aanvraag_id"];
            isOneToOne: false;
            referencedRelation: "aanvragen";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "designs_aanvraag_id_fkey";
            columns: ["aanvraag_id"];
            isOneToOne: false;
            referencedRelation: "aanvragen";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "feedback_aanvraag_id_fkey";
            columns: ["aanvraag_id"];
            isOneToOne: false;
            referencedRelation: "aanvragen";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
