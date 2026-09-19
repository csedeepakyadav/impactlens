import type { ImpactReport } from '../../../shared/types.ts';
import { DISCLAIMER } from '../../../shared/types.ts';

// Demo-mode analysis: returned when GEMINI_API_KEY is unset so the full
// portal (dashboard + PDF) can be exercised without an API key.
export function demoReport(id: string, sourceFile: string): ImpactReport {
  return {
    meta: { id, analyzedAt: new Date().toISOString(), model: 'demo-mode (no API key)', sourceFile },
    document: {
      title: 'Adani Group: How The World’s 3rd Richest Man Is Pulling The Largest Con In Corporate History',
      publisher: 'Hindenburg Research',
      publishDate: '2023-01-24',
      documentType: 'short_seller',
      subjectEntities: ['Adani Group', 'Adani Enterprises', 'Gautam Adani'],
      disclosedConflicts: ['Publisher discloses short positions in Adani Group companies via U.S.-traded bonds and non-Indian-traded derivatives'],
    },
    overall: {
      score: 88,
      band: 'critical',
      direction: 'negative',
      summary:
        'The report alleges large-scale stock manipulation and accounting fraud across the Adani Group, built on a two-year investigation. Given the publisher’s track record and the breadth of documented allegations, severe near-term market impact on listed Adani entities is highly likely, with sustained legal, regulatory, and financing pressure to follow. Reputational damage extends to auditors, lenders, and politically connected stakeholders. The group’s response strategy and regulatory findings will determine whether impact stabilizes or compounds.',
    },
    dimensions: [
      { key: 'market', label: 'Market / Stock', score: 95, direction: 'negative', confidence: 0.92, rationale: 'The report alleges an 85%+ downside on fundamentals; comparable short-seller reports triggered immediate double-digit drawdowns across listed group entities.' },
      { key: 'reputational', label: 'Reputational', score: 90, direction: 'negative', confidence: 0.9, rationale: 'Allegations target the chairman personally and the group’s governance; global media amplification is near-certain.' },
      { key: 'legal', label: 'Legal & Regulatory', score: 82, direction: 'negative', confidence: 0.78, rationale: 'The report alleges securities violations that invite SEBI scrutiny and potential cross-border investigations.' },
      { key: 'financial', label: 'Financial / Credit', score: 85, direction: 'negative', confidence: 0.8, rationale: 'Alleged leverage concerns plus falling collateral values pressure refinancing, ratings outlooks, and planned share sales.' },
      { key: 'operational', label: 'Operational', score: 55, direction: 'negative', confidence: 0.6, rationale: 'Core infrastructure assets keep operating, but partner and lender caution can slow expansion projects.' },
      { key: 'sentiment', label: 'Investor Sentiment', score: 92, direction: 'negative', confidence: 0.88, rationale: 'Retail and institutional sentiment on the group and adjacent Indian large-caps turns sharply risk-off.' },
    ],
    entities: [
      { name: 'Adani Enterprises', kind: 'company', score: 93, ticker: 'ADANIENT', summary: 'Flagship listed entity; the report’s allegations and the pending FPO put it at the center of the market reaction.' },
      { name: 'Adani Group', kind: 'company', score: 90, summary: 'Group-wide governance and leverage allegations affect all listed subsidiaries.' },
      { name: 'Gautam Adani', kind: 'person', score: 85, summary: 'Personal net worth and reputation directly targeted by the allegations.' },
      { name: 'Indian infrastructure sector', kind: 'sector', score: 45, summary: 'Contagion risk to lenders and index-heavy peers; foreign-investor perception of governance standards.' },
    ],
    claims: [
      { text: 'The report alleges a web of offshore shell entities in tax havens used to manipulate stock prices and launder money.', severity: 'critical', pageRef: 'pp. 12–31' },
      { text: 'The report alleges that key listed companies have substantial leverage with pledged shares of inflated stock.', severity: 'high', pageRef: 'pp. 45–52' },
      { text: 'The report alleges auditor independence issues, citing a small firm auditing a complex multinational.', severity: 'high', pageRef: 'pp. 58–61' },
      { text: 'The report alleges prior fraud investigations involving group executives that were never fully resolved.', severity: 'high', pageRef: 'pp. 20–28' },
      { text: 'The report alleges related-party transactions not properly disclosed under listing regulations.', severity: 'medium', pageRef: 'pp. 33–40' },
    ],
    timeline: {
      immediate: 'Sharp sell-off across listed group entities; group issues a lengthy public rebuttal; the pending secondary share offering comes under pressure and may be pulled.',
      shortTerm: 'Regulatory reviews open; index providers and lenders reassess exposure; bond spreads widen; short interest and volatility stay elevated while rebuttals and follow-up reporting trade blows.',
      longTerm: 'Partial market-cap recovery is possible if regulatory findings are limited, but financing costs, governance reforms, and litigation overhang persist for 1–2 years; strategic investors may be sought to restore confidence.',
    },
    analogs: [
      { event: 'Hindenburg → Nikola', year: 2020, outcome: 'Stock fell ~40% in days; founder resigned and was later convicted of fraud.', similarity: 0.72 },
      { event: 'Muddy Waters → Sino-Forest', year: 2011, outcome: 'Stock collapsed ~70%; company filed for bankruptcy protection within a year.', similarity: 0.55 },
      { event: 'FT investigation → Wirecard', year: 2019, outcome: 'Initial denials, then insolvency in 2020 after the alleged missing cash was confirmed.', similarity: 0.5 },
    ],
    risks: [
      'Regulatory findings that substantiate core allegations would compound legal and financing impact.',
      'Index exclusion or MSCI free-float review could force passive outflows.',
      'A credible independent audit or strategic investment could dampen the impact trajectory.',
      'Political dimension may polarize domestic response and slow regulatory action.',
      'Margin calls on pledged shares create reflexive downside risk.',
    ],
    credibility: {
      score: 78,
      rationale: 'Publisher has a strong track record of substantiated reports (Nikola, Clover Health). Evidence presented is extensive and document-based, but the disclosed short position is a financial conflict of interest, and some claims rely on unnamed sources.',
    },
    disclaimer: DISCLAIMER,
  };
}
