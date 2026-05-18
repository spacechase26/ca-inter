/**
 * Shapes mirroring each tab of the CA Inter G2 planner Google Sheet.
 * Field names match the Sheet's header row exactly (after the 4-row title block).
 */

export type Paper = "P4" | "P5" | "P6A" | "P6B";
export type PhaseTag = "P1" | "P2" | "P3" | "P4";

export interface Chapter {
  "#": number;
  Paper: Paper;
  "Ch#": number;
  "Chapter / Unit": string;
  Priority: string;
  "Total hrs": number;
  Theory: number;
  Practice: number;
  Lecture: number;
  "Done?": boolean;
  Weight: number;
  "ICAI Sec": string;
  Band: string;
  Start: string;
  End: string;
  Mastery?: number | null;
  Notes?: string | null;
  "PDF URL"?: string | null;
}

export interface DailyRow {
  "#": number;
  Date: string;
  Day: string;
  Phase: PhaseTag;
  "Practical block"?: string | null;
  "Theory block"?: string | null;
  "Revisit (20-30m)"?: string | null;
  "Plan hrs": number;
  "Actual hrs"?: number | null;
  "Done?": boolean;
  Confidence?: number | null;
  Notes?: string | null;
}

export interface Mock {
  "#": number;
  "Planned date": string;
  "Done date"?: string | null;
  Type: string;
  Scope: string;
  "Marks scored"?: number | null;
  "Out of": number;
  "% Score"?: number | string | null;
  "Weak areas to revisit"?: string | null;
}

export interface Phase {
  Phase: string;
  Start: string;
  End: string;
  Days: number;
  "Plan hrs": number;
  "Done hrs"?: number | null;
  "What you do": string;
}

export interface KeyDate {
  Date: string;
  Event: string;
  "Why it matters": string;
  Type: string;
}

export interface Resource {
  Category: string;
  Name: string;
  Link: string;
  Notes?: string | null;
}

export interface NoteRow {
  Section?: string | null;
  Topic?: string | null;
  Content?: string | null;
}

export interface WellnessRow {
  Topic?: string | null;
  Detail?: string | null;
}

/** Generic raw shape from a snapshot or live CSV: ordered headers + array of records. */
export interface SheetData<T = Record<string, unknown>> {
  headers: string[];
  rows: T[];
}

/** Type-safe tab key registry. */
export type TabKey =
  | "start-here"
  | "dashboard"
  | "syllabus"
  | "phases"
  | "daily"
  | "mocks"
  | "key-dates"
  | "resources"
  | "wellness"
  | "notes";
