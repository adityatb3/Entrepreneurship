/**
 * scoring.js — Safety Score Calculation Engine
 *
 * Exports one function: computeScore(signals) → { score, verdict, color, breakdown }
 *
 * The engine starts at 100 and deducts points across five categories.
 * Each category has a hard cap so no single factor can tank the whole score.
 * Some signals (SOC2, GDPR compliance) can add points back.
 *
 * This file has zero DOM dependencies — it only reads the signals object
 * and returns a plain data structure. render.js turns that into HTML.
 *
 * ── Category caps ──────────────────────────────────────────────
 *  Breach History          max −35 pts
 *  Data Collection         max −22 pts
 *  Purchase Safety         max −18 pts  (skipped for non-ecom sites)
 *  Technical Risk          max −13 pts
 *  Regulatory & Legal      max  −8 pts  (can give back up to +4)
 * ───────────────────────────────────────────────────────────────
 */

// ── Signals reference ─────────────────────────────────────────────
//
// breaches: Array of { year, severity ('critical'|'high'|'medium'|'low'),
//                      recordsM (float, millions of records),
//                      financial (bool) }
//
// dataPartners:                    number of known third-party data recipients
// hasUnknownPartners:              bool — any undisclosed / data-broker sharing?
// isEcommerce:                     bool
// refundRate:                      number 0–100 (% of refunds that succeed)
// complaintsPerK:                  complaints per 1,000 users
// storesCardOnSite:                bool — card data handled on-site vs delegated
// scamFlag:                        bool — documented scam/fraud pattern
// trackerCount:                    number of distinct tracking domains
// routesThroughHighRiskJurisdiction: bool (CN, RU, etc.)
// fingerprinting:                  bool — canvas/webGL/font fingerprinting active
// aggressiveLocationRequest:       bool — location requested without user action
// majorRegulatoryFine:             bool — FTC, ICO, EU DPA fine on record
// classActionLawsuit:              bool — active or settled class action
// certifiedSOC2:                   bool — SOC 2 / ISO 27001 certified
// gdprCompliant:                   bool — documented GDPR compliance program

function computeScore(signals) {
  const currentYear = new Date().getFullYear();
  const breakdown   = [];
  let   total       = 100;


  // ── 1. BREACH HISTORY  (cap: −35) ──────────────────────────────
  //
  // Each breach earns base points by severity, then multiplied by:
  //   recency   — recent breaches hurt more than old ones
  //   scale     — more exposed records = higher multiplier
  //   financial — card / bank data exposed adds a further multiplier

  let breachDeduction = 0;

  (signals.breaches || []).forEach(b => {
    // Base points by severity
    let pts = { critical: 11, high: 7, medium: 4, low: 2 }[b.severity] ?? 2;

    // Recency multiplier
    const age = currentYear - b.year;
    if      (age <= 1) pts *= 1.30;
    else if (age <= 3) pts *= 1.00;
    else if (age <= 6) pts *= 0.80;
    else               pts *= 0.55;

    // Scale multiplier (records exposed)
    if      (b.recordsM >= 100) pts *= 1.25;
    else if (b.recordsM >= 10)  pts *= 1.10;
    else if (b.recordsM >= 1)   pts *= 1.05;

    // Financial data multiplier
    if (b.financial) pts *= 1.20;

    breachDeduction += pts;
  });

  breachDeduction = Math.min(35, Math.round(breachDeduction));
  total -= breachDeduction;

  const breaches     = signals.breaches || [];
  const maxRecords   = breaches.length ? Math.max(...breaches.map(b => b.recordsM)) : 0;
  const hadFinancial = breaches.some(b => b.financial);

  breakdown.push({
    category:  'Breach History',
    deduction: breachDeduction,
    cap:       35,
    color:     breachDeduction >= 25 ? 'var(--red)' : breachDeduction >= 12 ? 'var(--orange)' : 'var(--accent)',
    detail:    `${breaches.length} breach event(s); weighted by severity, recency, scale, and data type`,
    factors: [
      { label: 'Number of breaches',        value: breaches.length },
      { label: 'Financial data exposed',     value: hadFinancial ? 'YES ⚠️' : 'No' },
      { label: 'Largest single breach (M)',  value: maxRecords.toFixed(1) + 'M' },
      { label: 'Recency weighting',          value: breaches.length ? 'Applied' : 'N/A' },
    ],
  });


  // ── 2. DATA COLLECTION & SHARING  (cap: −22) ───────────────────
  //
  // Points deducted for high/medium-risk data types, partner count,
  // and the presence of unknown / broker partners.

  let dataDeduction = 0;
  let highRiskCount = 0;
  let medRiskCount  = 0;

  // Count risk levels across all data collection groups
  Object.values(signals.dataItems || {}).flat().forEach(item => {
    if      (item.risk === 'high') highRiskCount++;
    else if (item.risk === 'med')  medRiskCount++;
  });

  dataDeduction += Math.min(10, highRiskCount * 1.8 + medRiskCount * 0.6);
  dataDeduction += Math.min(7,  (signals.dataPartners || 0) * 0.75);
  if (signals.hasUnknownPartners) dataDeduction += 5;

  dataDeduction = Math.min(22, Math.round(dataDeduction));
  total -= dataDeduction;

  breakdown.push({
    category:  'Data Collection & Sharing',
    deduction: dataDeduction,
    cap:       22,
    color:     dataDeduction >= 16 ? 'var(--red)' : dataDeduction >= 9 ? 'var(--orange)' : 'var(--accent)',
    detail:    `${highRiskCount} high-risk data types; ${signals.dataPartners || 0} data partners` +
               (signals.hasUnknownPartners ? '; unknown/broker partners detected' : ''),
    factors: [
      { label: 'High-risk data types',      value: highRiskCount },
      { label: 'Medium-risk data types',    value: medRiskCount },
      { label: 'Third-party partners',      value: signals.dataPartners || 0 },
      { label: 'Unknown/broker sharing',    value: signals.hasUnknownPartners ? 'YES ⚠️' : 'No' },
    ],
  });


  // ── 3. PURCHASE SAFETY  (cap: −18) ─────────────────────────────
  //
  // Only applied to e-commerce sites. Deductions for poor refund rate,
  // high complaint volume, on-site card storage, and scam flags.

  let ecomDeduction = 0;

  if (signals.isEcommerce) {
    const refund = signals.refundRate ?? 80;
    // Deduct up to 7 pts for refund rate below 80%
    ecomDeduction += Math.max(0, Math.round((80 - refund) / 80 * 7));
    // Deduct up to 6 pts for complaint volume
    ecomDeduction += Math.min(6, Math.round((signals.complaintsPerK || 0) * 1.2));
    if (signals.storesCardOnSite) ecomDeduction += 4;
    if (signals.scamFlag)         ecomDeduction += 4;
  }

  ecomDeduction = Math.min(18, Math.round(ecomDeduction));
  total -= ecomDeduction;

  breakdown.push({
    category:  'Purchase Safety',
    deduction: ecomDeduction,
    cap:       18,
    color:     ecomDeduction >= 12 ? 'var(--red)' : ecomDeduction >= 6 ? 'var(--orange)' : 'var(--green)',
    detail:    signals.isEcommerce
      ? `Refund rate: ${signals.refundRate ?? '?'}%; complaints: ${signals.complaintsPerK || 0}/1K; card storage: ${signals.storesCardOnSite ? 'on-site ⚠️' : 'delegated ✓'}`
      : 'Not an e-commerce site — category skipped',
    factors: [
      { label: 'E-commerce site',        value: signals.isEcommerce ? 'Yes' : 'No' },
      { label: 'Refund success rate',    value: signals.isEcommerce ? (signals.refundRate ?? '?') + '%' : 'N/A' },
      { label: 'Complaints per 1K users',value: signals.isEcommerce ? (signals.complaintsPerK || 0) : 'N/A' },
      { label: 'Card data handled on-site', value: signals.isEcommerce ? (signals.storesCardOnSite ? 'YES ⚠️' : 'No') : 'N/A' },
    ],
  });


  // ── 4. TECHNICAL RISK  (cap: −13) ──────────────────────────────
  //
  // Deductions for tracker count, high-risk server jurisdiction,
  // browser fingerprinting, and aggressive location access.

  let techDeduction = 0;

  techDeduction += Math.min(4, Math.round((signals.trackerCount || 0) * 0.28));
  if (signals.routesThroughHighRiskJurisdiction) techDeduction += 4;
  if (signals.fingerprinting)                    techDeduction += 3;
  if (signals.aggressiveLocationRequest)         techDeduction += 2;

  techDeduction = Math.min(13, Math.round(techDeduction));
  total -= techDeduction;

  breakdown.push({
    category:  'Technical Risk',
    deduction: techDeduction,
    cap:       13,
    color:     techDeduction >= 9 ? 'var(--red)' : techDeduction >= 5 ? 'var(--orange)' : 'var(--green)',
    detail:    [
      `${signals.trackerCount || 0} trackers`,
      signals.routesThroughHighRiskJurisdiction && 'high-risk server jurisdiction',
      signals.fingerprinting && 'browser fingerprinting detected',
    ].filter(Boolean).join('; '),
    factors: [
      { label: 'Tracker count',                value: signals.trackerCount || 0 },
      { label: 'High-risk server routing',     value: signals.routesThroughHighRiskJurisdiction ? 'YES ⚠️' : 'No' },
      { label: 'Browser fingerprinting',       value: signals.fingerprinting ? 'Detected ⚠️' : 'None' },
      { label: 'Aggressive location access',   value: signals.aggressiveLocationRequest ? 'YES ⚠️' : 'No' },
    ],
  });


  // ── 5. REGULATORY & LEGAL  (range: −8 to +4) ───────────────────
  //
  // Deductions for fines and lawsuits; points back for certifications.
  // Allowed to go negative (add points to total) up to a +4 bonus.

  let legalDeduction = 0;

  if (signals.majorRegulatoryFine)  legalDeduction += 4;
  if (signals.classActionLawsuit)   legalDeduction += 3;
  if (signals.certifiedSOC2)        legalDeduction -= 3;  // bonus
  if (signals.gdprCompliant)        legalDeduction -= 2;  // bonus

  legalDeduction = Math.max(-4, Math.min(8, Math.round(legalDeduction)));
  total -= legalDeduction;

  const legalDetail = [
    signals.majorRegulatoryFine  && 'Major regulatory fine',
    signals.classActionLawsuit   && 'Class action lawsuit',
    signals.certifiedSOC2        && 'SOC 2 certified (+3 pts)',
    signals.gdprCompliant        && 'GDPR compliant (+2 pts)',
  ].filter(Boolean).join('; ') || 'No regulatory actions on record';

  breakdown.push({
    category:  'Regulatory & Legal',
    deduction: legalDeduction,
    cap:       8,
    color:     legalDeduction >= 5 ? 'var(--red)' : legalDeduction >= 3 ? 'var(--orange)' : legalDeduction <= 0 ? 'var(--green)' : 'var(--accent)',
    detail:    legalDetail,
    factors: [
      { label: 'Major regulatory fine',  value: signals.majorRegulatoryFine ? 'YES ⚠️' : 'No' },
      { label: 'Class action lawsuit',   value: signals.classActionLawsuit  ? 'YES ⚠️' : 'No' },
      { label: 'SOC 2 / ISO 27001',      value: signals.certifiedSOC2       ? 'Certified ✓' : 'None' },
      { label: 'GDPR compliant',         value: signals.gdprCompliant        ? 'Yes ✓' : 'Not confirmed' },
    ],
  });


  // ── Final score + verdict ───────────────────────────────────────

  total = Math.max(0, Math.min(100, total));

  let verdict, color;
  if      (total >= 80) { verdict = 'LOW RISK — Generally safe to use';           color = '#00e5a0'; }
  else if (total >= 60) { verdict = 'MODERATE RISK — Some concerns found';        color = '#f0a500'; }
  else if (total >= 40) { verdict = 'MODERATE–HIGH RISK — Use with caution';      color = '#ff7c2a'; }
  else                  { verdict = 'HIGH RISK — Multiple serious concerns found'; color = '#ff4d6d'; }

  return { score: total, verdict, color, breakdown };
}
