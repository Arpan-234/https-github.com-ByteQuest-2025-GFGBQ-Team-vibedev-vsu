
export const SCORING_WEIGHTS = {
  LLM_CONFIDENCE: 0.6,
  RISK_FACTOR: 0.4,
  BASE_RISK: 50,
};

export const RISK_PENALTIES = {
  ABSOLUTE_LANGUAGE: 10,
  FAKE_AUTHORITY: 15,
  UNIVERSAL_CLAIM: 10,
  UNSUPPORTED_CERTAINTY: 15,
};

export const BONUSES = {
  CITATION_VERIFIED: 5,
  WEB_EVIDENCE: 10,
};

export const ABSOLUTE_TERMS = [
  'always', 'never', '100%', 'absolutely', 'undeniably', 
  'guaranteed', 'completely', 'totally', 'perfectly',
  'everyone knows', 'factually impossible'
];

export const AUTHORITY_TERMS = [
  'experts say', 'studies show', 'according to scientists',
  'research suggests', 'it is widely reported', 'official sources'
];

export const TRUSTED_DOMAINS = ['.gov', '.edu', 'reuters.com', 'nature.com', 'bbc.com', 'science.org'];
