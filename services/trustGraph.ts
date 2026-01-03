
import { TrustState, Claim, CitationResult, WebResult } from '../types';
import { extractAndAnalyzeClaims, performWebSearch, performDeepTrustReview } from './geminiService';
import { analyzeHallucinationRules } from './hallucinationRules';
import { scanAndVerifyCitations } from './citationService';
import { SCORING_WEIGHTS, BONUSES } from '../constants';

/**
 * Enhanced Trust Pipeline with Thinking Mode and Grounding.
 */
export const runTrustPipeline = async (
  text: string, 
  enableWeb: boolean, 
  enableDeepThinking: boolean,
  onUpdate: (step: string) => void
): Promise<TrustState> => {
  
  // 1. Input Parsing Node
  onUpdate("Initializing Analysis State...");
  let state: TrustState = {
    raw_text: text,
    claims: [],
    hallucination_flags: [],
    citation_results: [],
    web_results: [],
    risk_score: 50,
    trust_score: 0,
    trust_level: 'Low',
    explanation: "",
    processing_step: "Parsing"
  };

  // 2. Claim Extraction & Analysis (Fast Node)
  onUpdate("Extracting Claims (Gemini Flash)...");
  state.claims = await extractAndAnalyzeClaims(text);

  // 3. Hallucination Rule Engine (Deterministic)
  onUpdate("Scanning Linguistic Red Flags...");
  state.hallucination_flags = analyzeHallucinationRules(text);

  // 4. Citation Verification Node (API Calls)
  onUpdate("Verifying Citations (CrossRef/Semantic)...");
  state.citation_results = await scanAndVerifyCitations(text);

  // 5. Search Grounding Node (If enabled)
  if (enableWeb && state.claims.length > 0) {
    onUpdate("Consulting Web Grounding (Google Search)...");
    const sortedClaims = [...state.claims].sort((a, b) => a.confidence_score - b.confidence_score);
    const suspiciousClaim = sortedClaims[0];
    
    try {
        const searchResult = await performWebSearch(suspiciousClaim.text);
        state.web_results.push({
            query: suspiciousClaim.text,
            evidence_found: searchResult.sources.length > 0,
            credible_sources: searchResult.sources.map((s: any) => s.web?.title || s.maps?.title || "Search Result"),
            summary: searchResult.text || "No summary available."
        });
    } catch (e) {
        console.warn("Web search failed", e);
    }
  }

  // 6. Base Scoring Node
  onUpdate("Calculating Base Trust Metrics...");
  let riskScore = SCORING_WEIGHTS.BASE_RISK;
  
  state.hallucination_flags.forEach(f => { riskScore += f.impact; });
  
  // Scoring logic for citations: Verified = Bonus, Unverified/Fake = Penalty
  state.citation_results.forEach(c => { 
    if (c.verified) {
      riskScore -= BONUSES.CITATION_VERIFIED; 
    } else {
      // Significant penalty for unverified citations - likely a hallucination
      riskScore += 15; 
    }
  });
  
  state.web_results.forEach(w => { 
    if (w.evidence_found) riskScore -= BONUSES.WEB_EVIDENCE; 
    else riskScore += 5; // Penalty if the claim couldn't be grounded
  });
  
  state.risk_score = Math.max(0, Math.min(100, riskScore));

  const avgLlmConfidence = state.claims.length > 0 
    ? state.claims.reduce((sum, c) => sum + c.confidence_score, 0) / state.claims.length 
    : 50;

  state.trust_score = Math.round(
    (avgLlmConfidence * SCORING_WEIGHTS.LLM_CONFIDENCE) + 
    ((100 - state.risk_score) * SCORING_WEIGHTS.RISK_FACTOR)
  );

  // 7. Deep Thinking Node (Pro)
  if (enableDeepThinking) {
    onUpdate("Running Deep Thinking Review (Gemini Pro)...");
    const deepReview = await performDeepTrustReview(state);
    state.explanation = deepReview.explanation;
    state.trust_score = Math.max(0, Math.min(100, state.trust_score + deepReview.scoreAdjustment));
  } else {
    const citationCount = state.citation_results.filter(c => c.verified).length;
    state.explanation = `Standard analysis completed. ${state.claims.length} claims processed. ${citationCount}/${state.citation_results.length} citations verified. Linguistic risk: ${state.hallucination_flags.length} flags found.`;
  }

  if (state.trust_score >= 75) state.trust_level = 'High';
  else if (state.trust_score >= 50) state.trust_level = 'Medium';
  else state.trust_level = 'Low';

  onUpdate("Complete");
  return state;
};
