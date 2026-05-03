/** Shared types for the Lineage Engine UI */

export interface PaperEntry {
  id: string;
  title: string;
  ready: boolean;
  uploadedAt: string;
}

export interface ExtractionResult {
  /** Unique key for React rendering */
  _key: string;
  found: boolean;
  exact_sentence: string | null;
  page_number: number | null;
  context: string | null;
  verdict: "SUPPORTS" | "REFUTES" | "UNRELATED";
  paperTitle: string;
  paperId: string;
  /** The original claim text the user typed */
  claim: string;
}
