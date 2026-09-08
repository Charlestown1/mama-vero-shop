let currentUser = null;
let allTrades = [];
let marketPollTimer = null;
let tradesPollTimer = null;
let latestMarket = {};

const TRACKED = ['GBPUSD', 'USDCAD', 'XAUUSD', 'BTCUSD', 'USDJPY'];

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (tab === 'login') {
    document.querySelectorAll('.tab')[0].classList.add('active');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
  } else {
    document.querySelectorAll('.tab')[1].classList.add('active');
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('login-form').classList.add('hidden');
  }
}

async function checkAuth() {
  try {
    const res = await fetch('/api/current-user');
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      showDashboard();
    }
  } catch (err) { console.error(err); }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const res = await fetch('/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.success) { currentUser = data.user; showDashboard(); }
  else { document.getElementById('login-error').innerText = data.message || 'Login failed'; }
}

async function handleSignup(e) {
  e.preventDefault();
  const username = document.getElementById('signup-username').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;
  if (password !== confirm) {
    document.getElementById('signup-error').innerText = "Passwords do not match!";
    return;
  }
  const res = await fetch('/api/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  if (data.success) { currentUser = data.user; showDashboard(); }
  else { document.getElementById('signup-error').innerText = data.message || 'Signup failed'; }
}

function showDashboard() {
  document.getElementById('auth-container').classList.add('hidden');
  document.getElementById('dashboard-container').classList.remove('hidden');
  document.getElementById('welcome-user').innerText = `Welcome, ${currentUser.username}`;
  document.getElementById('user-email-display').innerText = currentUser.email;
  loadTrades();
  fetchMarket();
  if (marketPollTimer) clearInterval(marketPollTimer);
  if (tradesPollTimer) clearInterval(tradesPollTimer);
  marketPollTimer = setInterval(fetchMarket, 15000); // cheap: reads server memory cache only
  tradesPollTimer = setInterval(loadTrades, 25000);  // catches server-side TP/SL flips
}

// ---------- LIVE MARKET BOARD ----------
async function fetchMarket() {
  try {
    const res = await fetch('/api/market');
    const data = await res.json();
    if (!data.success) return;
    latestMarket = data.data || {};

    let mostRecent = null;
    TRACKED.forEach(key => {
      const m = latestMarket[key];
      const priceEl = document.getElementById(`mkt-${key}-price`);
      const changeEl = document.getElementById(`mkt-${key}-change`);
      const statusEl = document.getElementById(`mkt-${key}-status`);
      if (!priceEl) return;

      if (m && m.price !== null && m.price !== undefined) {
        priceEl.innerText = formatMarketPrice(key, m.price);
        if (m.change !== null && m.change !== undefined) {
          const up = m.change >= 0;
          changeEl.innerText = `${up ? '▲' : '▼'} ${up ? '+' : ''}${m.change.toFixed(key === 'XAUUSD' || key === 'BTCUSD' ? 2 : 5)}`;
          changeEl.className = 'market-change num ' + (up ? 'up' : 'down');
        } else {
          changeEl.innerText = '—';
          changeEl.className = 'market-change num';
        }
        if (m.updatedAt && (!mostRecent || new Date(m.updatedAt) > mostRecent)) mostRecent = new Date(m.updatedAt);
      } else {
        priceEl.innerText = '—';
      }

      const status = (m && m.status) || 'offline';
      statusEl.className = 'market-status ' + status;
      statusEl.innerHTML = `<span class="dot"></span>${status.toUpperCase()}`;
    });

    document.getElementById('market-updated').innerText = mostRecent ? `Updated ${formatTime(mostRecent)}` : 'Awaiting first update';
    updateRunningPrices();
  } catch (err) {
    console.error('Market fetch failed:', err);
  }
}

function formatMarketPrice(key, price) {
  if (key === 'BTCUSD') return '$' + Number(price).toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (key === 'XAUUSD') return Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (key === 'USDJPY') return Number(price).toFixed(3);
  return Number(price).toFixed(5);
}

function formatTime(d) {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function normalizePairKey(raw) {
  if (!raw) return null;
  let k = String(raw).toUpperCase().replace(/[^A-Z]/g, '');
  if (k === 'GOLD' || k === 'XAU') k = 'XAUUSD';
  if (k === 'BTC') k = 'BTCUSD';
  return TRACKED.includes(k) ? k : null;
}

// Lightweight patch of "current price" text on already-rendered Running rows,
// without re-fetching trades or re-rendering the whole list every 15s.
function updateRunningPrices() {
  allTrades.forEach((t, i) => {
    if (t.outcome !== 'Running') return;
    const key = normalizePairKey(t.pair);
    const m = key ? latestMarket[key] : null;
    if (!m || m.price === null || m.price === undefined) return;
    const el = document.getElementById(`current-price-${i}`);
    if (el) el.innerText = formatMarketPrice(key, m.price);
  });
}

// ---------- FEATURE 1: SETUP & STRATEGY TAGGING ----------
function toggleTag(element) {
  element.classList.toggle('active');
}

function getSelectedTags() {
  const pills = document.querySelectorAll('.strategy-pill.active');
  const tags = [];
  pills.forEach(p => tags.push(p.innerText.trim()));
  return tags;
}

function clearTags() {
  const pills = document.querySelectorAll('.strategy-pill');
  pills.forEach(p => p.classList.remove('active'));
}

// ---------- FEATURE 2: PROP FIRM RISK & DRAWDOWN GUARDRAILS ----------
function updatePropGuardrails(tradesList) {
  const maxDailyRiskDollars = 500; // Standard evaluation baseline limit
  let totalExposedRisk = 0;

  tradesList.forEach(t => {
    if (t.outcome === 'Running' && t.entry && t.stopLoss) {
      const riskPerUnit = Math.abs(Number(t.entry) - Number(t.stopLoss));
      totalExposedRisk += riskPerUnit * 100; // Estimated unit sizing mapping
    }
  });

  const riskPercentageUsed = Math.min(100, Math.max(0, (totalExposedRisk / maxDailyRiskDollars) * 100));
  const bufferRemaining = Math.max(0, 100 - riskPercentageUsed).toFixed(1);

  const statusText = document.getElementById('guardrail-status-text');
  const barFill = document.getElementById('guardrail-bar');
  const pctDisplay = document.getElementById('guardrail-pct');

  if (!statusText || !barFill || !pctDisplay) return;

  if (riskPercentageUsed > 80) {
    statusText.innerText = `⚠️ High Risk Exposure (${riskPercentageUsed.toFixed(1)}% of limit!)`;
    statusText.style.color = 'var(--loss)';
    barFill.style.background = 'var(--loss)';
  } else if (riskPercentageUsed > 40) {
    statusText.innerText = `Moderate Exposure (${riskPercentageUsed.toFixed(1)}% utilized)`;
    statusText.style.color = 'var(--accent)';
    barFill.style.background = 'var(--accent)';
  } else {
    statusText.innerText = `Safe zone (${riskPercentageUsed.toFixed(1)}% risk exposed)`;
    statusText.style.color = 'var(--win)';
    barFill.style.background = 'var(--win)';
  }

  barFill.style.width = `${bufferRemaining}%`;
  pctDisplay.innerText = `${bufferRemaining}% Buffer`;
}

// ---------- FEATURE 3: SCREENSHOT FILE UPLOAD HANDLER ----------
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'chartScreenshotInput') {
    const file = e.target.files[0];
    const hiddenScreenshotInput = document.getElementById('chartScreenshot');
    if (file && hiddenScreenshotInput) {
      const reader = new FileReader();
      reader.onloadend = () => {
        hiddenScreenshotInput.value = reader.result; // Base64 data string
      };
      reader.readAsDataURL(file);
    }
  }
});

// ---------- TRADE SUBMISSION ----------
async function submitTrade(e) {
  e.preventDefault();
  const payload = {
    currencyPair: document.getElementById('currencyPair').value,
    tradeDirection: document.getElementById('tradeDirection').value,
    entryPrice: document.getElementById('entryPrice').value,
    exitPrice: document.getElementById('exitPrice').value,
    stopLoss: document.getElementById('stopLoss').value,
    takeProfit: document.getElementById('takeProfit').value,
    tradeOutcome: document.getElementById('tradeOutcome').value,
    tradeNotes: document.getElementById('tradeNotes').value,
    tags: getSelectedTags(),                                                                  // Feature 1
    chartScreenshot: document.getElementById('chartScreenshot') ? document.getElementById('chartScreenshot').value.trim() : null // Feature 3
  };

  const aiBox = document.getElementById('ai-result');
  aiBox.classList.remove('hidden');
  aiBox.innerText = "Analyzing trade setup with AI mentor...";

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) { 
      aiBox.innerText = data.text; 
      clearTags();
      if (document.getElementById('chartScreenshot')) document.getElementById('chartScreenshot').value = '';
      if (document.getElementById('chartScreenshotInput')) document.getElementById('chartScreenshotInput').value = '';
      loadTrades(); 
    }
    else { aiBox.innerText = "Error analyzing trade: " + (data.message || 'unknown error'); }
  } catch (err) {
    aiBox.innerText = "Network error while saving trade: " + err.message;
  }
}

// ---------- TRADE LIST & STATS ----------
async function loadTrades() {
  if (!currentUser) return;
  const res = await fetch('/api/trades');
  const data = await res.json();
  const listDiv = document.getElementById('trades-list');

  if (data.success && data.trades.length > 0) {
    allTrades = [...data.trades].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = allTrades.length;
    const wins = allTrades.filter(t => t.outcome === 'Win').length;
    const losses = allTrades.filter(t => t.outcome === 'Loss').length;
    const decided = wins + losses; // Running & BreakEven excluded, by design
    const winRate = decided > 0 ? ((wins / decided) * 100).toFixed(1) : '0.0';

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-winrate').innerText = winRate + '%';
    document.getElementById('stat-record').innerText = `${wins}W / ${losses}L`;
    document.getElementById('stat-streak').innerText = computeStreak(allTrades);

    // Update Prop Firm Risk Guardrail visual
    updatePropGuardrails(allTrades);

    listDiv.innerHTML = allTrades.map((t, i) => {
      const isRunning = t.outcome === 'Running';
      const key = normalizePairKey(t.pair);
      const liveM = key ? latestMarket[key] : null;
      const currentDisplay = isRunning
        ? (liveM && liveM.price !== null && liveM.price !== undefined ? formatMarketPrice(key, liveM.price) : (t.currentPrice ?? '—'))
        : null;

      const metaLine = isRunning
        ? `Entry ${fmt(t.entry)} → Current <span id="current-price-${i}" class="num" style="color:var(--running);">${currentDisplay ?? '—'}</span> · ${formatDate(t.createdAt)}`
        : `Entry ${fmt(t.entry)} → Exit ${fmt(t.exit)} · ${formatDate(t.createdAt)}${t.exitReason ? ' · ' + escapeHtml(t.exitReason) : ''}`;

      return `
        <div class="trade-row" onclick="openModal(${i})">
          <div class="trade-row-left">
            <span class="trade-dir-pill ${t.direction === 'Sell' ? 'sell' : 'buy'}">${t.direction === 'Sell' ? 'SELL' : 'BUY'}</span>
            <div class="trade-row-info">
              <div class="trade-pair">${escapeHtml(t.pair)}</div>
              <div class="trade-meta">${metaLine}</div>
            </div>
          </div>
          <span class="trade-outcome-tag ${t.outcome}">${labelOutcome(t.outcome)}</span>
        </div>
      `;
    }).join('');
  } else {
    allTrades = [];
    document.getElementById('stat-total').innerText = 0;
    document.getElementById('stat-winrate').innerText = '0%';
    document.getElementById('stat-record').innerText = '0W / 0L';
    document.getElementById('stat-streak').innerText = '—';
    updatePropGuardrails([]);
    listDiv.innerHTML = '<div class="empty-state">No trades journaled yet — log your first setup above.</div>';
  }
}

function computeStreak(sortedTrades) {
  const decided = sortedTrades.filter(t => t.outcome === 'Win' || t.outcome === 'Loss');
  if (decided.length === 0) return '—';
  const first = decided[0].outcome;
  let count = 0;
  for (const t of decided) {
    if (t.outcome === first) count++;
    else break;
  }
  const noun = first === 'Win' ? 'win' : 'loss';
  const plural = count > 1 ? (first === 'Win' ? 's' : 'es') : '';
  return `${count} ${noun}${plural}`;
}

function labelOutcome(o) {
  if (o === 'BreakEven') return 'Break-even';
  return o;
}

function fmt(v) {
  if (v === null || v === undefined || v === '') return 'N/A';
  return v;
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}

// ---------- MODAL ----------
function openModal(index) {
  const t = allTrades[index];
  if (!t) return;
  document.getElementById('modal-pair').innerText = t.pair;
  document.getElementById('modal-direction').innerText = t.direction || 'N/A';
  const outcomeEl = document.getElementById('modal-outcome');
  outcomeEl.innerText = labelOutcome(t.outcome);
  outcomeEl.style.color = t.outcome === 'Win' ? 'var(--win)' : t.outcome === 'Loss' ? 'var(--loss)' : t.outcome === 'Running' ? 'var(--running)' : 'var(--text)';
  document.getElementById('modal-entry').innerText = fmt(t.entry);
  document.getElementById('modal-exit').innerText = fmt(t.exit);
  document.getElementById('modal-sl').innerText = fmt(t.stopLoss);
  document.getElementById('modal-tp').innerText = fmt(t.takeProfit);
  document.getElementById('modal-date').innerText = formatDate(t.createdAt);
  document.getElementById('modal-notes').innerText = t.notes && t.notes.trim() ? t.notes : 'No notes recorded.';

  // Feature 1: Render Strategy Tags in Modal
  const tagsContainer = document.getElementById('modal-tags-container');
  if (tagsContainer) {
    if (t.tags && t.tags.length > 0) {
      tagsContainer.innerHTML = `<div style="font-size:0.72rem; color:var(--text-dim); margin-bottom:6px;">Setup Tags</div><div class="strategy-pills">${t.tags.map(tag => `<div class="strategy-pill active" style="cursor:default;">${escapeHtml(tag)}</div>`).join('')}</div>`;
    } else {
      tagsContainer.innerHTML = '';
    }
  }

  // Feature 3: Render Chart Screenshot in Modal
  const screenshotContainer = document.getElementById('modal-screenshot-container');
  if (screenshotContainer) {
    if (t.chartScreenshot) {
      screenshotContainer.innerHTML = `
        <div class="modal-field-label" style="margin-top:12px;">Chart Screenshot Attachment</div>
        <a href="${escapeHtml(t.chartScreenshot)}" target="_blank">
          <img src="${escapeHtml(t.chartScreenshot)}" class="screenshot-preview" alt="Chart Setup Screenshot">
        </a>
      `;
    } else {
      screenshotContainer.innerHTML = '';
    }
  }

  const currentWrap = document.getElementById('modal-current-wrap');
  const reasonWrap = document.getElementById('modal-reason-wrap');

  if (t.outcome === 'Running') {
    const key = normalizePairKey(t.pair);
    const liveM = key ? latestMarket[key] : null;
    const currentPrice = liveM && liveM.price !== null && liveM.price !== undefined ? formatMarketPrice(key, liveM.price) : (t.currentPrice ?? 'N/A');
    document.getElementById('modal-current').innerText = currentPrice;
    currentWrap.classList.remove('hidden');
    reasonWrap.classList.add('hidden');
  } else if (t.exitReason) {
    document.getElementById('modal-reason').innerText = t.exitReason;
    reasonWrap.classList.remove('hidden');
    currentWrap.classList.add('hidden');
  } else {
    currentWrap.classList.add('hidden');
    reasonWrap.classList.add('hidden');
  }

  document.getElementById('trade-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('trade-modal').classList.add('hidden');
}

function closeModalOnOverlay(e) {
  if (e.target.id === 'trade-modal') closeModal();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

async function confirmReset() {
  const confirmation = prompt("Are you sure you want to reset all data and clear your win/loss rates back to zero?\nType 'yes' to confirm:");
  if (confirmation && confirmation.trim().toLowerCase() === 'yes') {
    try {
      const res = await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (data.success) { loadTrades(); alert("All data has been reset successfully."); }
      else { alert("Reset failed: " + (data.message || "unknown error")); }
    } catch (err) { alert("Reset failed: " + err.message); }
  }
}

async function logout() {
  if (marketPollTimer) clearInterval(marketPollTimer);
  if (tradesPollTimer) clearInterval(tradesPollTimer);
  window.location.href = '/auth/logout';
}

checkAuth();
