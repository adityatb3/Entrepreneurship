/**
 * render.js — Report UI Builder
 *
 * Takes data from the KB, URLScan, and RDAP, runs it through the
 * scoring engine, then populates every section of the report.
 *
 * Call order:
 *   scan.js calls renderReport() once all data is fetched.
 *   renderReport() calls the section-specific helpers below.
 *
 * Nothing in this file makes network requests — that is scan.js's job.
 * Nothing in this file calculates scores — that is scoring.js's job.
 */


// ── Main render entry point ───────────────────────────────────────

function renderReport(domain, kbData, urlscanData, rdapData) {

  // 1. Merge signals: KB is the source of truth; live data augments it
  let signals = kbData?.signals || buildFallbackSignals(domain, urlscanData);

  if (urlscanData) {
    const liveTrackers = getLiveTrackerDomains(urlscanData);
    // Use whichever tracker count is higher — KB estimate or live count
    signals.trackerCount = Math.max(signals.trackerCount || 0, liveTrackers.length);

    // If URLScan found the server in a non-safe country, flag it
    const country = urlscanData.page?.country || '';
    if (country && !SAFE_JURISDICTIONS.includes(country)) {
      signals.routesThroughHighRiskJurisdiction = true;
    }
  }

  // Attach data collection items so the scoring engine can count risk levels
  if (!signals.dataItems) signals.dataItems = kbData?.dataCollection || {};

  // 2. Compute score
  const scored = computeScore(signals);

  // 3. Populate sections
  renderSourceBadges(kbData, urlscanData, rdapData);
  renderStatStrip(kbData, urlscanData, rdapData, signals);
  renderScreenshot(urlscanData);
  renderScoreHeader(domain, kbData, scored, signals);
  renderTimeline(kbData);
  renderDomainInfo(urlscanData, rdapData);
  renderDataCollection(kbData);
  renderDataSharing(kbData);
  renderEcommerce(kbData);
  renderTech(kbData, urlscanData);
  renderAlternatives(kbData);
  renderScoreBreakdown(scored);

  // 4. Show results, scroll into view
  updateAutoSaveBtn();
  document.getElementById('heroSection').style.paddingBottom = '24px';
  document.getElementById('resultsSection').classList.add('visible');
  document.querySelectorAll('.tab')[0].click();  // reset to first tab
  window.scrollTo({ top: 56, behavior: 'smooth' });
}


// ── Source badges ─────────────────────────────────────────────────
// Shows which data sources contributed to this report.

function renderSourceBadges(kbData, urlscanData, rdapData) {
  const badges = [];
  if (kbData)      badges.push(`<span class="source-badge kb"><span class="dot"></span>KB: Curated Data</span>`);
  if (urlscanData) badges.push(`<span class="source-badge live"><span class="dot"></span>LIVE: URLScan.io</span>`);
  if (rdapData)    badges.push(`<span class="source-badge rdap"><span class="dot"></span>LIVE: RDAP/WHOIS</span>`);
  document.getElementById('sourceBadges').innerHTML = badges.join('');
}


// ── Stat strip ────────────────────────────────────────────────────

function renderStatStrip(kbData, urlscanData, rdapData, signals) {
  const stats        = kbData?.stats || {};
  const liveTrackers = getLiveTrackerDomains(urlscanData);

  // Domain age from RDAP
  let domainAge = '—';
  if (rdapData) {
    const regEvent = rdapData.events?.find(e => e.eventAction === 'registration');
    if (regEvent) {
      const yrs = new Date().getFullYear() - new Date(regEvent.eventDate).getFullYear();
      domainAge = yrs + (yrs === 1 ? 'yr' : 'yrs');
    }
  }

  document.getElementById('statBreaches').textContent = stats.breaches ?? (kbData?.timeline?.length || '—');
  document.getElementById('statRecords').textContent  = stats.records  || '—';
  document.getElementById('statTrackers').textContent = urlscanData
    ? Math.max(signals.trackerCount || 0, liveTrackers.length)
    : (stats.trackers || '—');
  document.getElementById('statAge').textContent      = domainAge;
  document.getElementById('statShared').textContent   = stats.shared || signals.dataPartners || '—';
}


// ── URLScan screenshot ────────────────────────────────────────────

function renderScreenshot(urlscanData) {
  const el = document.getElementById('urlscanShot');
  if (!urlscanData?.task?.screenshotURL) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <div class="urlscan-shot">
      <div class="urlscan-shot-label">LIVE SCREENSHOT — CAPTURED BY URLSCAN SANDBOX</div>
      <img src="${urlscanData.task.screenshotURL}" alt="Live site screenshot" loading="lazy"/>
    </div>`;
}


// ── Score header card ─────────────────────────────────────────────

function renderScoreHeader(domain, kbData, scored, signals) {
  // Colour the left accent bar
  document.querySelector('.report-header').style.setProperty('--score-color', scored.color);

  // Animate the score ring
  const ring = document.getElementById('scoreRing');
  ring.style.stroke = scored.color;
  setTimeout(() => {
    ring.style.strokeDashoffset = 220 - (scored.score / 100) * 220;
  }, 100);

  document.getElementById('scoreNum').textContent  = scored.score;
  document.getElementById('scoreNum').style.color  = scored.color;
  document.getElementById('reportUrl').textContent = domain;
  document.getElementById('reportVerdict').textContent  = scored.verdict;
  document.getElementById('reportVerdict').style.color  = scored.color;

  // Tags — use KB tags if available, otherwise auto-generate from live signals
  if (kbData?.tags) {
    document.getElementById('reportTags').innerHTML = kbData.tags.map(t => {
      const [cls, label] = t.split('|');
      return `<span class="rtag ${cls}">${label}</span>`;
    }).join('');
  } else {
    const auto = [];
    if (signals.trackerCount > 10)                      auto.push('<span class="rtag rtag-orange">High Tracker Count</span>');
    if (signals.routesThroughHighRiskJurisdiction)      auto.push('<span class="rtag rtag-red">High-Risk Server Jurisdiction</span>');
    auto.push('<span class="rtag rtag-blue">Unknown Site — Live Scan Only</span>');
    document.getElementById('reportTags').innerHTML = auto.join('');
  }

  // Breach count badge on the tab
  document.getElementById('breachBadge').textContent = kbData?.timeline?.length || 0;
}


// ── Breach Timeline tab ───────────────────────────────────────────

function renderTimeline(kbData) {
  const events = kbData?.timeline || [];

  document.getElementById('timelineContent').innerHTML = events.length
    ? events.map(item => `
        <div class="tl-item">
          <div class="tl-left">
            <div class="tl-dot ${item.severity}"></div>
            <div class="tl-line"></div>
          </div>
          <div class="tl-content">
            <div class="tl-date">${item.date}</div>
            <div class="tl-title">${item.title}</div>
            <div class="tl-desc">${item.desc}</div>
            <span class="tl-severity ${item.severity}">${item.severity.toUpperCase()}</span>
          </div>
        </div>`).join('')
    : `<div style="padding:12px 0; font-family:var(--mono); font-size:13px; color:${kbData ? 'var(--green)' : 'var(--muted)'}">
        ${kbData
          ? '✓ No known security incidents found for this domain.'
          : 'This site is not in our knowledge base. For breach history, check <a href="https://haveibeenpwned.com" target="_blank" style="color:var(--accent)">HaveIBeenPwned</a> and <a href="https://www.privacyrights.org" target="_blank" style="color:var(--accent)">PrivacyRights.org</a>.'}
       </div>`;
}


// ── Domain Info tab ───────────────────────────────────────────────

function renderDomainInfo(urlscanData, rdapData) {
  const strip  = document.getElementById('domainInfoStrip');
  const detail = document.getElementById('domainDetail');

  if (!rdapData && !urlscanData) {
    strip.innerHTML  = '';
    detail.innerHTML = `<div style="color:var(--muted); font-family:var(--mono); font-size:13px; padding:12px 0">
      RDAP lookup failed. Try <a href="https://lookup.icann.org" target="_blank" style="color:var(--accent)">ICANN Lookup</a> for domain registration details.
    </div>`;
    return;
  }

  // Extract dates from RDAP events array
  const findEvent = action => rdapData?.events?.find(e => e.eventAction === action)?.eventDate;
  const regDate     = findEvent('registration');
  const expDate     = findEvent('expiration');
  const updDate     = findEvent('last changed');
  const regYear     = regDate ? new Date(regDate).getFullYear() : null;
  const age         = regYear ? new Date().getFullYear() - regYear : null;

  // Registrar name (buried inside the entities/vcardArray structure)
  const registrar = rdapData?.entities
    ?.find(e => e.roles?.includes('registrar'))
    ?.vcardArray?.[1]?.find(v => v[0] === 'fn')?.[3]
    || 'Unknown';

  const country = urlscanData?.page?.country || '—';
  const server  = urlscanData?.page?.server  || '—';

  const ageClass = age === null ? '' : age < 1 ? 'bad' : age < 3 ? 'warn' : 'good';
  const ageLabel = age === null ? 'Unknown' : age < 1 ? '< 1 year ⚠️' : age + ' years';

  strip.innerHTML = `
    <div class="di-item"><div class="di-label">DOMAIN AGE</div>     <div class="di-val ${ageClass}">${ageLabel}</div></div>
    <div class="di-item"><div class="di-label">REGISTERED</div>     <div class="di-val">${regDate ? new Date(regDate).toLocaleDateString() : 'Unknown'}</div></div>
    <div class="di-item"><div class="di-label">REGISTRAR</div>      <div class="di-val" style="font-size:11px">${registrar.substring(0, 25)}</div></div>
    <div class="di-item"><div class="di-label">SERVER COUNTRY</div> <div class="di-val ${SAFE_JURISDICTIONS.includes(country) ? 'good' : country === '—' ? '' : 'warn'}">${country}</div></div>
  `;

  const nameservers = (rdapData?.nameservers || []).map(n => n.ldhName || '').filter(Boolean).join(', ') || '—';

  detail.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px">
      <div><span style="color:var(--text2)">Web Server:</span>   <span style="font-family:var(--mono)">${server}</span></div>
      <div><span style="color:var(--text2)">Expires:</span>      <span style="font-family:var(--mono)">${expDate ? new Date(expDate).toLocaleDateString() : '—'}</span></div>
      <div><span style="color:var(--text2)">Last Updated:</span> <span style="font-family:var(--mono)">${updDate ? new Date(updDate).toLocaleDateString() : '—'}</span></div>
      <div><span style="color:var(--text2)">Nameservers:</span>  <span style="font-family:var(--mono); font-size:11px">${nameservers.substring(0, 40)}</span></div>
    </div>
    ${age !== null && age < 1 ? `
      <div style="margin-top:14px; padding:12px; background:rgba(255,77,109,.08); border:1px solid rgba(255,77,109,.2); border-radius:8px; font-size:13px; color:var(--red)">
        ⚠️ <strong>New domain warning:</strong> Registered less than a year ago.
        Newly registered domains are a common red flag for scam and phishing sites.
      </div>` : ''}
    ${!SAFE_JURISDICTIONS.includes(country) && country !== '—' ? `
      <div style="margin-top:14px; padding:12px; background:rgba(240,165,0,.07); border:1px solid rgba(240,165,0,.15); border-radius:8px; font-size:13px; color:var(--accent)">
        ⚠️ Site hosted in <strong>${country}</strong>.
        Verify that data protection laws in this country protect your rights as a user.
      </div>` : ''}
  `;
}


// ── Data Collection tab ───────────────────────────────────────────

function renderDataCollection(kbData) {
  const dc = kbData?.dataCollection || {};

  document.getElementById('dataCollectionContent').innerHTML = Object.keys(dc).length
    ? Object.entries(dc).map(([group, items]) => `
        <div class="dc-group">
          <div class="dc-group-title">${group}</div>
          <div class="dc-items">
            ${items.map(i => `
              <div class="dc-item">
                <div class="risk-dot ${i.risk}"></div>
                ${i.label}
              </div>`).join('')}
          </div>
        </div>`).join('')
    : `<div style="color:var(--muted); font-family:var(--mono); font-size:13px; padding:12px 0">
        Data collection details are available for known sites only.
        Check the site's privacy policy directly.
       </div>`;
}


// ── Data Sharing tab ──────────────────────────────────────────────

function renderDataSharing(kbData) {
  const ds = kbData?.dataSharing || [];

  document.getElementById('dataSharingContent').innerHTML = ds.length
    ? ds.map(item => `
        <div class="share-item">
          <div class="share-name">${item.name}</div>
          <div class="share-bar-wrap">
            <div class="share-bar" style="width:0%" data-pct="${item.pct}%"></div>
          </div>
          <div class="share-cat">${item.cat}</div>
        </div>`).join('')
    : `<div style="color:var(--muted); font-family:var(--mono); font-size:13px; padding:12px 0">
        Data sharing details available for known sites only.
       </div>`;

  // Animate bars after a short delay (they start at width:0)
  setTimeout(() => {
    document.querySelectorAll('.share-bar').forEach(b => b.style.width = b.dataset.pct);
  }, 200);
}


// ── Purchase Safety tab ───────────────────────────────────────────

function renderEcommerce(kbData) {
  const ecom = kbData?.ecom || { scores: [], complaints: [] };

  document.getElementById('ecomScores').innerHTML = ecom.scores?.length
    ? ecom.scores.map(s => `
        <div class="ecom-score-item">
          <div class="ecom-score-val" style="color:${s.color}">${s.val}</div>
          <div class="ecom-score-label">${s.label}</div>
        </div>`).join('')
    : `<div style="color:var(--muted); font-family:var(--mono); font-size:13px; grid-column:1/-1">
        Purchase safety details available for known sites only.
        Look up the site on <a href="https://www.bbb.org" target="_blank" style="color:var(--accent)">BBB.org</a>.
       </div>`;

  document.getElementById('complaintsList').innerHTML = (ecom.complaints || []).map(c => `
    <div class="complaint-item">
      <div class="complaint-icon">${c.icon}</div>
      <div class="complaint-body">
        <div class="complaint-title">${c.title}</div>
        <div class="complaint-meta">${c.count} · ${c.period}</div>
      </div>
    </div>`).join('');
}


// ── Under the Hood tab ────────────────────────────────────────────
// Merges KB tech items with live URLScan findings.

function renderTech(kbData, urlscanData) {
  const items = [...(kbData?.tech || [])];

  // Augment with live URLScan data when the site is unknown
  if (urlscanData && !kbData) {
    const liveTrackers = getLiveTrackerDomains(urlscanData);

    if (liveTrackers.length) {
      items.unshift({
        raw:     liveTrackers.slice(0, 5).join(', '),
        type:    'Live Trackers',
        live:    true,
        title:   `${liveTrackers.length} tracking domain(s) detected in real-time`,
        explain: `URLScan's sandbox detected connections to ${liveTrackers.length} known tracking/advertising domain(s) when loading this site. Each one receives data about your visit.`,
        risk:    `⚠️ ${liveTrackers.length} live tracker connection(s) confirmed by URLScan.`,
      });
    }

    const ips     = (urlscanData.lists?.ips     || []).slice(0, 4);
    const country = urlscanData.page?.country   || '?';
    const server  = urlscanData.page?.server    || 'unknown';

    if (ips.length) {
      items.push({
        raw:     `${ips.join(', ')} | Country: ${country} | Server: ${server}`,
        type:    'IP / Hosting',
        live:    true,
        title:   `Site hosted in ${country} on ${server}`,
        explain: `URLScan confirmed this site connects to servers in ${country}. The web server software is ${server}. ${
          SAFE_JURISDICTIONS.includes(country)
            ? 'This is a reputable hosting jurisdiction.'
            : 'This jurisdiction may have weaker user privacy protections.'}`,
        risk: SAFE_JURISDICTIONS.includes(country)
          ? '✓ Reputable hosting jurisdiction.'
          : `⚠️ Verify data protection laws apply in ${country}.`,
      });
    }
  }

  document.getElementById('techContent').innerHTML = items.length
    ? items.map(t => `
        <div class="tech-item" onclick="this.classList.toggle('open')">
          <div class="tech-header">
            <span class="tech-type${t.live ? ' live' : ''}">${t.type}</span>
            <span class="tech-raw">${t.raw}</span>
            <span class="tech-arrow">▶</span>
          </div>
          <div class="tech-explain">
            <div class="explain-title">${t.title}</div>
            <div class="explain-body">${t.explain}</div>
            <div class="explain-risk">${t.risk}</div>
          </div>
        </div>`).join('')
    : `<div style="color:var(--muted); font-family:var(--mono); font-size:13px; padding:12px 0">
        No technical data available — URLScan may have timed out for this site.
       </div>`;
}


// ── Safe Alternatives tab ─────────────────────────────────────────

function renderAlternatives(kbData) {
  const alts = kbData?.alternatives || [];

  document.getElementById('altGrid').innerHTML = alts.length
    ? alts.map(a => `
        <div class="alt-card">
          <div class="alt-name">${a.name}</div>
          <div class="alt-desc">${a.desc}</div>
          <div class="alt-why">✓ <strong>${a.why}</strong></div>
          <div class="alt-score">
            <div class="alt-score-bar">
              <div class="alt-score-fill" style="width:${a.score}%"></div>
            </div>
            <div class="alt-score-num">${a.score}/100</div>
          </div>
        </div>`).join('')
    : `<div style="color:var(--muted); font-family:var(--mono); font-size:13px; padding:12px 0">
        Alternatives are available for known sites only.
       </div>`;
}


// ── Score Breakdown tab ───────────────────────────────────────────

function renderScoreBreakdown(scored) {
  // Build the formula display
  const formulaLines = scored.breakdown.map(cat => {
    if (cat.deduction === 0) return `<span> 00 pts  (${cat.category})</span>`;
    const sign = cat.deduction > 0 ? '−' : '+';
    const cls  = cat.deduction > 0 ? 'minus' : 'plus';
    return `<span class="${cls}">${sign}${String(Math.abs(cat.deduction)).padStart(2,'0')} pts  (${cat.category})</span>`;
  });

  document.getElementById('scoreBreakdownContent').innerHTML = `
    <div class="breakdown-intro">
      <div class="breakdown-score-big" style="color:${scored.color}">${scored.score}</div>
      <div class="breakdown-formula">
        <div class="breakdown-formula-title">CALCULATION</div>
        <div class="formula-eq">
          <span>100 pts  (Starting score)</span><br>
          ${formulaLines.join('<br>')}
          <br><span class="eq">= ${scored.score} / 100</span>
        </div>
      </div>
    </div>

    <div class="breakdown-categories">
      ${scored.breakdown.map(cat => `
        <div class="bcat" onclick="this.classList.toggle('open'); this.querySelectorAll('.bcat-bar').forEach(b => b.style.width = b.dataset.pct)">
          <div class="bcat-header">
            <div class="bcat-name">${cat.category}</div>
            <div class="bcat-bar-wrap">
              <div class="bcat-bar" style="width:0%; background:${cat.color}"
                   data-pct="${Math.round(Math.abs(cat.deduction) / cat.cap * 100)}%"></div>
            </div>
            <div class="bcat-deduction" style="color:${cat.color}">
              ${cat.deduction > 0 ? '−' : cat.deduction < 0 ? '+' : ''}${Math.abs(cat.deduction)} pts
            </div>
            <div class="bcat-cap">/ ${cat.cap} max</div>
            <div class="bcat-arrow">▶</div>
          </div>
          <div class="bcat-detail">
            <div class="bcat-explain">${cat.detail}</div>
            <div class="bcat-factors">
              ${cat.factors.map(f => `
                <div class="bfactor">
                  <span class="bfactor-label">${f.label}</span>
                  <span class="bfactor-value">${f.value}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>`).join('')}
    </div>

    <div class="total-row">
      <span class="total-label">FINAL SAFETY SCORE</span>
      <span class="total-val" style="color:${scored.color}">${scored.score} / 100</span>
    </div>`;

  // Animate bars immediately (they start at 0)
  setTimeout(() => {
    document.querySelectorAll('.bcat-bar').forEach(b => b.style.width = b.dataset.pct);
  }, 100);
}
