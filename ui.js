/**
 * ui.js — UI State & Interaction
 *
 * Handles everything that doesn't touch the network or calculate scores:
 *   - Tab switching
 *   - Settings panel open/close
 *   - Auto-save toggle
 *   - Safe list (whitelist) management
 *   - URL input helpers
 *
 * State that other files need (currentSite, whitelist, autoSave)
 * is declared here as globals so scan.js and render.js can read them.
 */


// ── Shared state ──────────────────────────────────────────────────

let autoSave    = false;
let currentSite = null;  // set by scan.js when a scan starts

// Safe list persisted to localStorage
let whitelist = JSON.parse(localStorage.getItem('sw_whitelist') || '["gmail.com","github.com"]');


// ── Tab switching ─────────────────────────────────────────────────

const TAB_NAMES = ['timeline', 'domain', 'data', 'ecommerce', 'tech', 'alternatives', 'scoring'];

function switchTab(name) {
  // Deactivate all tabs and panels
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  // Activate the selected one
  const index = TAB_NAMES.indexOf(name);
  document.querySelectorAll('.tab')[index].classList.add('active');
  document.getElementById('panel-' + name).classList.add('active');

  // Re-trigger bar animations when switching to the sharing tab
  if (name === 'data') {
    setTimeout(() => {
      document.querySelectorAll('.share-bar').forEach(b => b.style.width = b.dataset.pct);
    }, 100);
  }
}


// ── Settings panel ────────────────────────────────────────────────

function openSettings()  { document.getElementById('settingsOverlay').classList.add('open'); }
function closeSettings() { document.getElementById('settingsOverlay').classList.remove('open'); }


// ── Auto-save toggle ──────────────────────────────────────────────

function toggleAutoSave() {
  autoSave = !autoSave;
  updateAutoSaveBtn();
}

function updateAutoSaveBtn() {
  const btn = document.getElementById('autoSaveBtn');
  const lbl = document.getElementById('autoSaveStatus');
  btn.classList.toggle('active', autoSave);
  lbl.textContent = autoSave ? 'ON' : 'OFF';
}


// ── Safe list (whitelist) ─────────────────────────────────────────

function addToWhitelist() {
  if (!currentSite || whitelist.includes(currentSite)) return;
  whitelist.push(currentSite);
  saveWhitelist();
  renderWhitelistTags();

  const btn = document.getElementById('whitelistBtn');
  btn.classList.add('active');
  btn.innerHTML = '✓ In Safe List';
}

function addWhitelistItem() {
  const input = document.getElementById('whitelistInput');
  const value = input.value
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .toLowerCase();

  if (value && !whitelist.includes(value)) {
    whitelist.push(value);
    saveWhitelist();
    renderWhitelistTags();
  }
  input.value = '';
}

function removeWhitelistItem(site) {
  whitelist = whitelist.filter(s => s !== site);
  saveWhitelist();
  renderWhitelistTags();
}

function saveWhitelist() {
  localStorage.setItem('sw_whitelist', JSON.stringify(whitelist));
}

function renderWhitelistTags() {
  document.getElementById('whitelistTags').innerHTML = whitelist.map(s => `
    <div class="whitelist-tag">
      ${s}
      <span class="whitelist-remove" onclick="removeWhitelistItem('${s}')">✕</span>
    </div>`).join('');
}

// Show a brief notice instead of running a scan for whitelisted sites
function showWhitelistNotice(domain) {
  const loadingEl = document.getElementById('loadingState');
  document.getElementById('loadingLog').innerHTML = `
    <div class="log-line done" style="opacity:1">
      <div class="log-dot" style="animation:none; background:var(--green)"></div>
      <span class="log-label"><strong style="color:var(--green)">${domain}</strong> is on your Safe List — scan skipped.</span>
    </div>`;
  loadingEl.classList.add('visible');
  setTimeout(() => loadingEl.classList.remove('visible'), 3000);
}


// ── URL input helpers ─────────────────────────────────────────────

// Called by the hint chips below the search bar
function fillUrl(url) {
  document.getElementById('urlInput').value = url;
}

// Allow pressing Enter to trigger a scan
document.getElementById('urlInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') startScan();
});


// ── Init ──────────────────────────────────────────────────────────
// Render the saved whitelist tags when the page first loads.
renderWhitelistTags();
