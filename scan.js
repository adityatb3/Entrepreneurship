/**
 * scan.js — Live Data Fetching Pipeline
 *
 * Orchestrates the two live data sources and hands results to render.js.
 *
 * ── Source 1: URLScan.io ────────────────────────────────────────
 *   Free public API — no key required for public scans.
 *   Step 1: POST  urlscan.io/api/v1/scan/       → get UUID job ID
 *   Step 2: Wait ~12s for the sandbox to load the site
 *   Step 3: GET   urlscan.io/api/v1/result/{uuid}/ → full result
 *
 *   Result contains:
 *     lists.domains  — every domain the page contacted
 *     lists.ips      — every IP address used
 *     page.country   — server country code
 *     page.server    — web server software
 *     task.screenshotURL — URL to a live screenshot
 *
 * ── Source 2: RDAP (Registration Data Access Protocol) ─────────
 *   RDAP is the modern, structured replacement for plain-text WHOIS.
 *   rdap.org is a free public aggregator — no key, no account.
 *   GET rdap.org/domain/{domain} → JSON with events, entities, nameservers
 *
 *   Events array contains:
 *     eventAction: 'registration'  → when the domain was first registered
 *     eventAction: 'expiration'    → when it expires
 *     eventAction: 'last changed'  → last update
 *
 * ── Known tracker domains ───────────────────────────────────────
 *   Used to filter URLScan's domain list down to tracking-specific ones.
 *   Extend this list to improve live tracker detection.
 */

const TRACKER_KEYWORDS = [
  'google', 'facebook', 'tiktok', 'doubleclick', 'hotjar', 'mixpanel',
  'segment', 'hubspot', 'criteo', 'outbrain', 'taboola', 'amazon-adsystem',
  'twitter', 'clarity', 'pinterest', 'snapchat', 'linkedin', 'quantserve',
  'scorecardresearch', 'chartbeat', 'newrelic', 'datadog', 'fullstory',
];

// Jurisdictions considered high-risk for data privacy (no strong legal protections)
const SAFE_JURISDICTIONS = ['US','GB','DE','FR','NL','CA','AU','SE','NO','DK','FI','CH','IE','BE','AT'];


// ── Scan log helpers ──────────────────────────────────────────────
// Appends an animated log line to the loading panel.
// Returns the element so the caller can update it later.

function addLog(label, value) {
  const container = document.getElementById('loadingLog');
  const line      = document.createElement('div');
  line.className  = 'log-line';
  line.innerHTML  = `
    <div class="log-dot"></div>
    <span class="log-label">${label}</span>
    <span class="log-value">${value}</span>
  `;
  container.appendChild(line);
  return line;
}

function updateLog(line, label, value, isError = false) {
  line.querySelector('.log-label').textContent = label;
  line.querySelector('.log-value').textContent = value;
  line.querySelector('.log-value').style.color = isError ? 'var(--orange)' : 'var(--green)';
  line.querySelector('.log-dot').style.cssText  = `animation:none; background:${isError ? 'var(--orange)' : 'var(--green)'}`;
  line.classList.add('done');
}


// ── Main entry point ──────────────────────────────────────────────
// Called by the Scan button in index.html.

async function startScan() {
  const raw = document.getElementById('urlInput').value.trim();
  if (!raw) return;

  // Normalise to bare domain (strip protocol, www, path)
  const domain = raw
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .toLowerCase();

  // Whitelist check — skip scan for trusted sites
  if (whitelist.includes(domain)) {
    showWhitelistNotice(domain);
    return;
  }

  // Reset UI
  document.getElementById('resultsSection').classList.remove('visible');
  document.getElementById('urlscanShot').innerHTML = '';
  document.getElementById('scanBtn').disabled      = true;

  const loadingEl = document.getElementById('loadingState');
  document.getElementById('loadingLog').innerHTML  = '';
  loadingEl.classList.add('visible');

  // Track current site so whitelist button works
  currentSite = domain;

  let urlscanData = null;
  let rdapData    = null;
  const kbData    = KB[domain] || null;

  // ── Step 1: KB lookup ─────────────────────────────────────────
  const l0 = addLog('Checking knowledge base…', domain);
  await sleep(400);
  updateLog(l0, 'Knowledge base', kbData
    ? '✓ Known site — full history available'
    : 'Not in KB — live scan only');

  // ── Step 2: URLScan.io ────────────────────────────────────────
  const l1 = addLog('Submitting to URLScan.io sandbox…', 'connecting');
  try {
    const submitRes  = await fetch('https://urlscan.io/api/v1/scan/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url: 'https://' + domain, visibility: 'public' }),
    });
    const submitData = await submitRes.json();

    if (submitData.uuid) {
      updateLog(l1, 'URLScan sandbox', 'queued ✓');

      const l2 = addLog('Waiting for live scan results…', '~15s');
      await sleep(12000);  // give URLScan time to load and screenshot the page

      // Poll up to 5 times, 3 seconds apart
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const resultRes = await fetch(`https://urlscan.io/api/v1/result/${submitData.uuid}/`);
          if (resultRes.ok) {
            urlscanData = await resultRes.json();
            break;
          }
        } catch (_) { /* not ready yet */ }
        await sleep(3000);
      }

      updateLog(l2, 'URLScan live scan',
        urlscanData
          ? `${urlscanData.lists?.urls?.length || 0} requests captured ✓`
          : 'timed out',
        !urlscanData);
    } else {
      updateLog(l1, 'URLScan', 'rate limited — skipped', true);
    }
  } catch (_) {
    updateLog(l1, 'URLScan', 'unavailable', true);
  }

  // ── Step 3: RDAP domain registration info ─────────────────────
  const l3 = addLog('Fetching domain registration info…', 'RDAP lookup');
  try {
    const rdapRes = await fetch(`https://rdap.org/domain/${domain}`);
    if (rdapRes.ok) {
      rdapData = await rdapRes.json();
      const regEvent = rdapData.events?.find(e => e.eventAction === 'registration');
      const regYear  = regEvent ? new Date(regEvent.eventDate).getFullYear() : null;
      updateLog(l3, 'Domain registration', regYear ? `Registered ${regYear} ✓` : 'Data retrieved ✓');
    } else {
      updateLog(l3, 'RDAP', 'no data available', true);
    }
  } catch (_) {
    updateLog(l3, 'RDAP', 'lookup failed', true);
  }

  // ── Step 4: Build and display report ─────────────────────────
  const l4 = addLog('Building report…', 'rendering');
  await sleep(400);
  updateLog(l4, 'Report', 'complete ✓');

  await sleep(400);
  loadingEl.classList.remove('visible');
  document.getElementById('scanBtn').disabled = false;
  renderReport(domain, kbData, urlscanData, rdapData);
}


// ── Signal builder for unknown sites ─────────────────────────────
// When a site is not in the knowledge base, we synthesise signals
// from whatever URLScan returned. Scoring still runs — it just has
// less to work with, so scores tend toward the safe middle range.

function buildFallbackSignals(domain, urlscanData) {
  const country = urlscanData?.page?.country || '';

  // Count how many contacted domains are known trackers
  const trackerCount = (urlscanData?.lists?.domains || [])
    .filter(d => TRACKER_KEYWORDS.some(kw => d.includes(kw)))
    .length;

  return {
    breaches:                          [],
    dataPartners:                      trackerCount,
    hasUnknownPartners:                false,
    isEcommerce:                       false,
    trackerCount,
    routesThroughHighRiskJurisdiction: !!country && !SAFE_JURISDICTIONS.includes(country),
    fingerprinting:                    false,
    aggressiveLocationRequest:         false,
    majorRegulatoryFine:               false,
    classActionLawsuit:                false,
    certifiedSOC2:                     false,
    gdprCompliant:                     false,
  };
}


// ── Helpers ───────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Returns the list of live tracker domains found by URLScan
function getLiveTrackerDomains(urlscanData) {
  return (urlscanData?.lists?.domains || [])
    .filter(d => TRACKER_KEYWORDS.some(kw => d.includes(kw)));
}
