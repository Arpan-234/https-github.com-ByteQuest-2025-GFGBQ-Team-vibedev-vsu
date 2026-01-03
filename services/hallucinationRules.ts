
import { HallucinationFlag } from '../types';
import { ABSOLUTE_TERMS, AUTHORITY_TERMS, RISK_PENALTIES } from '../constants';

/**
 * Deterministic analysis of text for hallucination markers.
 */
export const analyzeHallucinationRules = (text: string): HallucinationFlag[] => {
  const flags: HallucinationFlag[] = [];
  const lowerText = text.toLowerCase();

  ABSOLUTE_TERMS.forEach(term => {
    if (lowerText.includes(term)) {
      flags.push({
        type: 'Absolute Language',
        match: term,
        impact: RISK_PENALTIES.ABSOLUTE_LANGUAGE
      });
    }
  });

  AUTHORITY_TERMS.forEach(term => {
    if (lowerText.includes(term)) {
      flags.push({
        type: 'Fake Authority',
        match: term,
        impact: RISK_PENALTIES.FAKE_AUTHORITY
      });
    }
  });

  const universalMatch = text.match(/\b(every single|all|no one|universal|everyone knows)\b/gi);
  if (universalMatch) {
    flags.push({
      type: 'Universal Claim',
      match: universalMatch[0],
      impact: RISK_PENALTIES.UNIVERSAL_CLAIM
    });
  }

  const certaintyMatch = text.match(/\b\d{1,3}(\.\d+)?%\b/g);
  if (certaintyMatch && !text.includes('confidence interval') && !text.includes('margin of error')) {
    flags.push({
      type: 'Unsupported Certainty',
      match: certaintyMatch[0],
      impact: RISK_PENALTIES.UNSUPPORTED_CERTAINTY
    });
  }

  return flags;
};
