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


// ── URL validation ────────────────────────────────────────────────
// Accepts anything a human would reasonably type:
//   example.com  |  www.example.com  |  https://example.com/path
// Rejects: empty, plain words, IP addresses, localhost, strings
//          with spaces, and anything without a valid TLD.

function validateAndNormalize(raw) {
  const input = raw.trim();

  if (!input) {
    return { error: 'Please enter a website URL.' };
  }

  // Strip protocol and www, isolate the hostname
  const stripped = input
    .replace(/^https?:\/\//i, '')
    .replace(/^ftp:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]       // drop any path
    .split('?')[0]       // drop any query string
    .split('#')[0]       // drop any hash
    .toLowerCase()
    .trim();

  // Must not contain spaces
  if (/\s/.test(stripped)) {
    return { error: 'That doesn\'t look like a URL. Did you mean to search for a website domain?' };
  }

  // Must not be an IP address (IPv4)
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(stripped)) {
    return { error: 'IP addresses are not supported — please enter a domain name (e.g. example.com).' };
  }

  // Must not be localhost or similar
  if (/^localhost(:\d+)?$/.test(stripped) || stripped === '127.0.0.1') {
    return { error: 'Local addresses can\'t be scanned.' };
  }

  // Must look like a domain: at least one dot, no invalid characters,
  // and a TLD of at least 2 characters
  const domainPattern = /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/;
  if (!domainPattern.test(stripped)) {
    return { error: `"${stripped}" doesn't look like a valid domain. Try something like: amazon.com or https://example.com` };
  }

  return { domain: stripped };
}

function showInputError(message) {
  const input  = document.getElementById('urlInput');
  const wrap   = input.closest('.search-bar');

  // Shake the search bar
  wrap.style.borderColor = 'var(--red)';
  wrap.style.boxShadow   = '0 0 0 3px rgba(255,77,109,.15)';

  // Show error message below the bar
  let errEl = document.getElementById('urlError');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.id = 'urlError';
    errEl.style.cssText = 'color:var(--red);font-family:var(--mono);font-size:12px;margin-top:10px;text-align:left;padding:0 4px;';
    wrap.parentNode.insertBefore(errEl, wrap.nextSibling);
  }
  errEl.textContent = '⚠ ' + message;

  // Clear the error styling after 4 seconds
  setTimeout(() => {
    wrap.style.borderColor = '';
    wrap.style.boxShadow   = '';
    if (errEl) errEl.textContent = '';
  }, 4000);
}

function clearInputError() {
  const wrap = document.getElementById('urlInput')?.closest('.search-bar');
  if (wrap) { wrap.style.borderColor = ''; wrap.style.boxShadow = ''; }
  const errEl = document.getElementById('urlError');
  if (errEl) errEl.textContent = '';
}


// ── Main entry point ──────────────────────────────────────────────
// Called by the Scan button in index.html.

async function startScan() {
  const raw = document.getElementById('urlInput').value;

  // Validate before doing anything else
  const result = validateAndNormalize(raw);
  if (result.error) {
    showInputError(result.error);
    return;
  }
  clearInputError();

  const domain = result.domain;

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
