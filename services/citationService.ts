
import { CitationResult } from '../types';

/**
 * Verifies a DOI using the free CrossRef API with robust error handling.
 */
export const verifyDOI = async (doi: string): Promise<CitationResult> => {
  try {
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      const title = data.message?.title?.[0] || 'Untitled Work';
      const author = data.message?.author?.[0]?.family || 'Unknown';
      return {
        citation: doi,
        verified: true,
        source_type: 'DOI',
        metadata: { title, author, journal: data.message?.['container-title']?.[0] }
      };
    }
    return { citation: doi, verified: false, source_type: 'DOI', metadata: { error: `API Error: ${response.status}` } };
  } catch (error: any) {
    return { citation: doi, verified: false, source_type: 'DOI', metadata: { error: error.message || "Network Error" } };
  }
};

/**
 * Searches for a paper using Author-Year patterns on Semantic Scholar.
 */
export const verifyAuthorYear = async (author: string, year: string): Promise<CitationResult> => {
  try {
    const query = `${author} ${year}`;
    const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=1&fields=title,authors,year`, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.total > 0 && data.data[0]) {
        const paper = data.data[0];
        const yearMatch = paper.year && paper.year.toString() === year;
        return {
          citation: `${author} (${year})`,
          verified: yearMatch,
          source_type: 'Author-Year',
          metadata: { title: paper.title, year: paper.year?.toString(), author: paper.authors?.[0]?.name }
        };
      }
    }
    return { citation: `${author} (${year})`, verified: false, source_type: 'Author-Year' };
  } catch (error: any) {
    return { citation: `${author} (${year})`, verified: false, source_type: 'Author-Year', metadata: { error: error.message } };
  }
};

export const scanAndVerifyCitations = async (text: string): Promise<CitationResult[]> => {
  const doiRegex = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/gi;
  const doiMatches = Array.from(new Set(text.match(doiRegex) || []));
  
  const authorYearRegex = /([A-Z][a-z]+(?:\s+et\s+al\.)?)\s*\((\d{4})\)/g;
  const authorYearMatches: {author: string, year: string}[] = [];
  let match;
  while ((match = authorYearRegex.exec(text)) !== null) {
    authorYearMatches.push({ author: match[1], year: match[2] });
  }

  const doiPromises = doiMatches.map(doi => verifyDOI(doi));
  const ayPromises = authorYearMatches.slice(0, 3).map(m => verifyAuthorYear(m.author, m.year));

  return await Promise.all([...doiPromises, ...ayPromises]);
};
