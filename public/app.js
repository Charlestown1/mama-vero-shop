let currentUser = null;
let allTrades = [];
let marketPollTimer = null;
let tradesPollTimer = null;
let latestMarket = {};

// New Filter & Analytics State
let currentSearchQuery = '';
let currentOutcomeFilter = 'All';
let currentSessionFilter = 'All';
let propAccountConfig = {
  phase: 'Phase 1',
  accountSize: 50000,
  profitTargetPct: 8
};

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

// ---------- ADVANCED ANALYTICS (PROFIT FACTOR & AVG R:R) ----------
function computeAdvancedMetrics(tradesList) {
  let totalGrossProfit = 0;
  let totalGrossLoss = 0;
  let riskRewardSum = 0;
  let validRRCount = 0;

  tradesList.forEach(t => {
    const entry = Number(t.entry);
    const sl = Number(t.stopLoss);
    const tp = Number(t.takeProfit);
    const exit = Number(t.exit);

    if (!isNaN(entry) && !isNaN(sl) && !isNaN(tp) && entry !== sl) {
      const risk = Math.abs(entry - sl);
      const reward = Math.abs(tp - entry);
      riskRewardSum += (reward / risk);
      validRRCount++;
    }

    if (t.outcome === 'Win' && !isNaN(entry) && !isNaN(exit)) {
      totalGrossProfit += Math.abs(exit - entry);
    } else if (t.outcome === 'Loss' && !isNaN(entry) && !isNaN(exit)) {
      totalGrossLoss += Math.abs(exit - entry);
    }
  });

  const avgRR = validRRCount > 0 ? (riskRewardSum / validRRCount).toFixed(2) : '0.00';
  const profitFactor = totalGrossLoss > 0 ? (totalGrossProfit / totalGrossLoss).toFixed(2) : (totalGrossProfit > 0 ? 'Infinite' : '0.00');
  return { avgRR, profitFactor };
}

// ---------- TAG-BASED PROFITABILITY BREAKDOWN ----------
function computeTagBreakdown(tradesList) {
  const breakdown = {};
  tradesList.forEach(t => {
    if (!t.tags || !Array.isArray(t.tags)) return;
    t.tags.forEach(tag => {
      if (!breakdown[tag]) breakdown[tag] = { wins: 0, losses: 0, total: 0 };
      breakdown[tag].total++;
      if (t.outcome === 'Win') breakdown[tag].wins++;
      if (t.outcome === 'Loss') breakdown[tag].losses++;
    });
  });
  return breakdown;
}

// ---------- CSV JOURNAL EXPORT ----------
function exportTradesCSV() {
  if (!allTrades || allTrades.length === 0) {
    alert("No trades available to export.");
    return;
  }
  const headers = ["Pair", "Direction", "Entry", "Exit", "StopLoss", "TakeProfit", "Outcome", "Session", "Tags", "Date"];
  const rows = allTrades.map(t => [
    t.pair || '',
    t.direction || '',
    t.entry || '',
    t.exit || '',
    t.stopLoss || '',
    t.takeProfit || '',
    t.outcome || '',
    t.session || 'London',
    `"${(t.tags || []).join(', ')}"`,
    t.createdAt || ''
  ]);

  let csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Afamefune_Insights_Journal_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ---------- SEARCH & FILTER LOGIC ----------
function filterTrades(tradesList) {
  return tradesList.filter(t => {
    const matchesSearch = !currentSearchQuery || 
      (t.pair && t.pair.toLowerCase().includes(currentSearchQuery.toLowerCase())) || 
      (t.notes && t.notes.toLowerCase().includes(currentSearchQuery.toLowerCase()));
    
    const matchesOutcome = currentOutcomeFilter === 'All' || t.outcome === currentOutcomeFilter;
    const matchesSession = currentSessionFilter === 'All' || t.session === currentSessionFilter;
    
    return matchesSearch && matchesOutcome && matchesSession;
  });
}

document.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'tradeSearchInput') {
    currentSearchQuery = e.target.value.trim();
    renderTradesList();
  }
});

document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'outcomeFilterSelect') {
    currentOutcomeFilter = e.target.value;
    renderTradesList();
  }
  if (e.target && e.target.id === 'sessionFilterSelect') {
    currentSessionFilter = e.target.value;
    renderTradesList();
  }
});

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
    session: document.getElementById('tradeSession') ? document.getElementById('tradeSession').value : 'London',
    tags: getSelectedTags(),
    chartScreenshot: document.getElementById('chartScreenshot') ? document.getElementById('chartScreenshot').value.trim() : null
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
      if (document.getElementById('chartScreenshotInput')) document.getElementById('chartScreenshotInput'].value = '';
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

  if (data.success && data.trades.length > 0) {
    allTrades = [...data.trades].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = allTrades.length;
    const wins = allTrades.filter(t => t.outcome === 'Win').length;
    const losses = allTrades.filter(t => t.outcome === 'Loss').length;
    const decided = wins + losses;
    const winRate = decided > 0 ? ((wins / decided) * 100).toFixed(1) : '0.0';

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-winrate').innerText = winRate + '%';
    document.getElementById('stat-record').innerText = `${wins}W / ${losses}L`;
    document.getElementById('stat-streak').innerText = computeStreak(allTrades);

    const metrics = computeAdvancedMetrics(allTrades);
    const tagBreakdown = computeTagBreakdown(allTrades);
    
    const avgRREl = document.getElementById('stat-avgrr');
    if (avgRREl) avgRREl.innerText = metrics.avgRR + 'R';
    const pfEl = document.getElementById('stat-profitfactor');
    if (pfEl) pfEl.innerText = metrics.profitFactor;

    updatePropGuardrails(allTrades);
    renderTradesList();
  } else {
    allTrades = [];
    document.getElementById('stat-total').innerText = 0;
    document.getElementById('stat-winrate').innerText = '0%';
    document.getElementById('stat-record').innerText = '0W / 0L';
    document.getElementById('stat-streak').innerText = '—';
    updatePropGuardrails([]);
    const listDiv = document.getElementById('trades-list');
    if (listDiv) listDiv.innerHTML = '<div class="empty-state">No trades journaled yet — log your first setup above.</div>';
  }
}

function renderTradesList() {
  const listDiv = document.getElementById('trades-list');
  if (!listDiv) return;

  const filtered = filterTrades(allTrades);

  if (filtered.length === 0) {
    listDiv.innerHTML = '<div class="empty-state">No trades match your active filters.</div>';
    return;
  }

  listDiv.innerHTML = filtered.map((t) => {
    const originalIndex = allTrades.findIndex(item => item === t);
    const isRunning = t.outcome === 'Running';
    const key = normalizePairKey(t.pair);
    const liveM = key ? latestMarket[key] : null;
    const currentDisplay = isRunning
      ? (liveM && liveM.price !== null && liveM.price !== undefined ? formatMarketPrice(key, liveM.price) : (t.currentPrice ?? '—'))
      : null;

    const sessionTag = t.session ? ` · <span style="color:var(--accent);">${t.session}</span>` : '';
    const metaLine = isRunning
      ? `Entry ${fmt(t.entry)} → Current <span id="current-price-${originalIndex}" class="num" style="color:var(--running);">${currentDisplay ?? '—'}</span>${sessionTag} · ${formatDate(t.createdAt)}`
      : `Entry ${fmt(t.entry)} → Exit ${fmt(t.exit)}${sessionTag} · ${formatDate(t.createdAt)}${t.exitReason ? ' · ' + escapeHtml(t.exitReason) : ''}`;

    return `
      <div class="trade-row" onclick="openModal(${originalIndex})">
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
  
  const pairEl = document.getElementById('modal-pair');
  if (pairEl) pairEl.innerText = t.pair;

  const dirEl = document.getElementById('modal-direction');
  if (dirEl) dirEl.innerText = t.direction || 'N/A';

  const outcomeEl = document.getElementById('modal-outcome');
  if (outcomeEl) {
    outcomeEl.innerText = labelOutcome(t.outcome);
    outcomeEl.style.color = t.outcome === 'Win' ? 'var(--win)' : t.outcome === 'Loss' ? 'var(--loss)' : t.outcome === 'Running' ? 'var(--running)' : 'var(--text)';
  }

  const entryEl = document.getElementById('modal-entry');
  if (entryEl) entryEl.innerText = fmt(t.entry);

  const exitEl = document.getElementById('modal-exit');
  if (exitEl) exitEl.innerText = fmt(t.exit);

  const slEl = document.getElementById('modal-sl');
  if (slEl) slEl.innerText = fmt(t.stopLoss);

  const tpEl = document.getElementById('modal-tp');
  if (tpEl) tpEl.innerText = fmt(t.takeProfit);

  const sessionEl = document