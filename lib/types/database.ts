// Handgeschreven equivalent van de types die `supabase gen types typescript` zou genereren.
// Zodra er een echt Supabase-project gekoppeld is, kan dit bestand vervangen worden door de
// gegenereerde versie (`supabase gen types typescript --project-id <id> > lib/types/database.ts`).
// Houd dit bestand tot die tijd in lijn met supabase/migrations/*.sql.
//
// De `Relationships`-array per tabel, en de lege `Views`/`Functions`/`Enums`/`CompositeTypes`,
// zijn nodig omdat @supabase/supabase-js dit exacte vorm verwacht van het `Database`-type
// (dezelfde vorm als de door de CLI gegenereerde types).

import type {
  AanvraagStatus,
  Bedrukking,
  BordAanschaf,
  DesignStatus,
  Levering,
  OverigBestand,
  Provincie,
  Veldtype,
} from "./domain";

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
          provincie: Provincie | null;
          auth_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          naam: string;
          bedrijf?: string | null;
          email: string;
          telefoon?: string | null;
          provincie?: Provincie | null;
          auth_user_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["klanten"]["Insert"]>;
        Relationships: [];
      };
      aanvragen: {
        Row: {
          id: string;
          klant_id: string;
          bestelling_id: string;
          veldtype: Veldtype | null;
          afmeting: string;
          bord_aanschaf: BordAanschaf;
          wens: string | null;
          status: AanvraagStatus;
          bijlage_pad: string | null;
          voorstel_gepland_op: string;
          aantal: number;
          bedrukking: Bedrukking;
          kromtrekken: boolean;
          levering: Levering;
          straat: string | null;
          postcode: string | null;
          plaats: string | null;
          opmerking: string | null;
          ontwerp_door_ons: boolean;
          qr_codes: string | null;
          teksten: string | null;
          waarschuwingen: string | null;
          lege_logoplek: boolean;
          compleet_ontwerp: string | null;
          ontwerp_ontbreekt: boolean;
          drukbestand_pad: string | null;
          drukbestand_achter_pad: string | null;
          voorbeeld_pad: string | null;
          voorbeeld_achter_pad: string | null;
          ontwerp_pad: string | null;
          overige_bestanden: OverigBestand[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          klant_id: string;
          bestelling_id?: string;
          veldtype?: Veldtype | null;
          afmeting: string;
          bord_aanschaf: BordAanschaf;
          wens?: string | null;
          status?: AanvraagStatus;
          bijlage_pad?: string | null;
          voorstel_gepland_op: string;
          aantal?: number;
          bedrukking?: Bedrukking;
          kromtrekken?: boolean;
          levering?: Levering;
          straat?: string | null;
          postcode?: string | null;
          plaats?: string | null;
          opmerking?: string | null;
          ontwerp_door_ons?: boolean;
          qr_codes?: string | null;
          teksten?: string | null;
          waarschuwingen?: string | null;
          lege_logoplek?: boolean;
          compleet_ontwerp?: string | null;
          ontwerp_ontbreekt?: boolean;
          drukbestand_pad?: string | null;
          drukbestand_achter_pad?: string | null;
          voorbeeld_pad?: string | null;
          voorbeeld_achter_pad?: string | null;
          ontwerp_pad?: string | null;
          overige_bestanden?: OverigBestand[] | null;
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
      emails: {
        Row: {
          id: string;
          aanvraag_id: string;
          design_id: string;
          onderwerp: string;
          html_inhoud: string;
          platte_tekst: string;
          verzonden: boolean;
          verzonden_op: string;
        };
        Insert: {
          id?: string;
          aanvraag_id: string;
          design_id: string;
          onderwerp: string;
          html_inhoud: string;
          platte_tekst: string;
          verzonden?: boolean;
          verzonden_op?: string;
        };
        Update: Partial<Database["public"]["Tables"]["emails"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "emails_aanvraag_id_fkey";
            columns: ["aanvraag_id"];
            isOneToOne: false;
            referencedRelation: "aanvragen";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emails_design_id_fkey";
            columns: ["design_id"];
            isOneToOne: false;
            referencedRelation: "designs";
            referencedColumns: ["id"];
          },
        ];
      };
      rate_limieten: {
        Row: {
          sleutel: string;
          aantal: number;
          reset_op: string;
        };
        Insert: {
          sleutel: string;
          aantal?: number;
          reset_op: string;
        };
        Update: Partial<Database["public"]["Tables"]["rate_limieten"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      rate_limit_tik: {
        Args: { p_sleutel: string; p_venster_ms: number };
        Returns: { aantal: number; reset_op: string }[];
      };
      rate_limiet_opruimen: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
