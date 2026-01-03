
export interface Claim {
  id: string;
  text: string;
  plausibility: 'high' | 'medium' | 'low';
  confidence_score: number;
  reasoning: string;
  red_flags: string[];
}

export interface CitationResult {
  citation: string;
  verified: boolean;
  source_type: 'DOI' | 'URL' | 'Author-Year' | 'Unknown';
  metadata?: {
    title?: string;
    author?: string;
    year?: string;
    journal?: string;
    error?: string;
  };
}

export interface WebResult {
  query: string;
  evidence_found: boolean;
  credible_sources: string[];
  summary: string;
}

export interface HallucinationFlag {
  type: 'Absolute Language' | 'Fake Authority' | 'Universal Claim' | 'Unsupported Certainty';
  match: string;
  impact: number;
}

export interface TrustState {
  raw_text: string;
  claims: Claim[];
  hallucination_flags: HallucinationFlag[];
  citation_results: CitationResult[];
  web_results: WebResult[];
  risk_score: number;
  trust_score: number;
  trust_level: 'High' | 'Medium' | 'Low';
  explanation: string;
  processing_step: string;
  media_type?: 'image' | 'video';
  media_url?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AnalysisHistory {
  id: string;
  timestamp: number;
  text_preview: string;
  score: number;
  level: string;
  full_state: TrustState;
}
