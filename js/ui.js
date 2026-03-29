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


let autoSave    = false;
let currentSite = null;  
let whitelist = JSON.parse(localStorage.getItem('dc_whitelist') || '["gmail.com","github.com"]');



const TAB_NAMES = ['timeline', 'domain', 'data', 'ecommerce', 'tech', 'alternatives', 'scoring'];

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  const index = TAB_NAMES.indexOf(name);
  document.querySelectorAll('.tab')[index].classList.add('active');
  document.getElementById('panel-' + name).classList.add('active');

  if (name === 'data') {
    setTimeout(() => {
      document.querySelectorAll('.share-bar').forEach(b => b.style.width = b.dataset.pct);
    }, 100);
  }
}



function openSettings()  { document.getElementById('settingsOverlay').classList.add('open'); }
function closeSettings() { document.getElementById('settingsOverlay').classList.remove('open'); }



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
  localStorage.setItem('dc_whitelist', JSON.stringify(whitelist));
}

function renderWhitelistTags() {
  document.getElementById('whitelistTags').innerHTML = whitelist.map(s => `
    <div class="whitelist-tag">
      ${s}
      <span class="whitelist-remove" onclick="removeWhitelistItem('${s}')">✕</span>
    </div>`).join('');
}

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



function fillUrl(url) {
  document.getElementById('urlInput').value = url;
}

document.getElementById('urlInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') startScan();
});
document.getElementById('urlInput').addEventListener('input', () => {
  clearInputError();
});


renderWhitelistTags();
