let currentUser = null;
let allTrades = [];
let marketPollTimer = null;
let tradesPollTimer = null;
let latestMarket = {};

let currentSearchQuery = '';
let currentOutcomeFilter = 'All';
let currentSessionFilter = 'All';

const TRACKED = ['GBPUSD', 'USDCAD', 'XAUUSD', 'BTCUSD', 'USDJPY'];

// ---------- SAFE EVENT BINDING ON LOAD ----------
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupForms();
  checkAuth();
});

function setupTabs() {
  const loginTabBtn = document.getElementById('tab-login-btn');
  const signupTabBtn = document.getElementById('tab-signup-btn');

  if (loginTabBtn) {
    loginTabBtn.addEventListener('click', () => switchTab('login'));
  }
  if (signupTabBtn) {
    signupTabBtn.addEventListener('click', () => switchTab('signup'));
  }
}

function setupForms() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  const tradeForm = document.getElementById('trade-form');
  if (tradeForm) {
    tradeForm.addEventListener('submit', submitTrade);
  }
}

function switchTab(tab) {
  const tabs = document.querySelectorAll('.tab');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  if (tabs.length >= 2) {
    tabs.forEach(t => t.classList.remove('active'));
  }

  if (tab === 'login') {
    if (tabs[0]) tabs[0].classList.add('active');
    if (loginForm) loginForm.classList.remove('hidden');
    if (signupForm) signupForm.classList.add('hidden');
  } else {
    if (tabs[1]) tabs[1].classList.add('active');
    if (signupForm) signupForm.classList.remove('hidden');
    if (loginForm) loginForm.classList.add('hidden');
  }
}

async function checkAuth() {
  try {
    const res = await fetch('/api/current-user');
    const data = await res.json();
    if (data.success && data.user) {
      currentUser = data.user;
      showDashboard();
    }
  } catch (err) { console.error(err); }
}

async function handleLogin(e) {
  e.preventDefault();
  const emailEl = document.getElementById('login-email');
  const passwordEl = document.getElementById('login-password');
  const errorEl = document.getElementById('login-error');

  if (!emailEl || !passwordEl) return;

  const email = emailEl.value.trim();
  const password = passwordEl.value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) { 
      currentUser = data.user; 
      showDashboard(); 
    } else { 
      if (errorEl) errorEl.innerText = data.message || 'Login failed'; 
    }
  } catch (err) {
    if (errorEl) errorEl.innerText = 'Network error during login';
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const usernameEl = document.getElementById('signup-username');
  const emailEl = document.getElementById('signup-email');
  const passwordEl = document.getElementById('signup-password');
  const confirmEl = document.getElementById('signup-confirm');
  const errorEl = document.getElementById('signup-error');

  if (!usernameEl || !emailEl || !passwordEl || !confirmEl) return;

  const username = usernameEl.value.trim();
  const email = emailEl.value.trim();
  const password = passwordEl.value;
  const confirm = confirmEl.value;

  if (password !== confirm) {
    if (errorEl) errorEl.innerText = "Passwords do not match!";
    return;
  }

  try {
    const res = await fetch('/api/signup', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (data.success) { 
      currentUser = data.user; 
      showDashboard(); 
    } else { 
      if (errorEl) errorEl.innerText = data.message || 'Signup failed'; 
    }
  } catch (err) {
    if (errorEl) errorEl.innerText = 'Network error during signup';
  }
}

function showDashboard() {
  const authContainer = document.getElementById('auth-container');
  const dashContainer = document.getElementById('dashboard-container');
  const welcomeUser = document.getElementById('welcome-user');
  const userEmail = document.getElementById('user-email-display');

  if (authContainer) authContainer.classList.add('hidden');
  if (dashContainer) dashContainer.classList.remove('hidden');
  if (welcomeUser) welcomeUser.innerText = `Welcome, ${currentUser.username}`;
  if (userEmail) userEmail.innerText = currentUser.email;

  loadTrades();
  fetchMarket();
  if (marketPollTimer) clearInterval(marketPollTimer);
  if (tradesPollTimer) clearInterval(tradesPollTimer);
  marketPollTimer = setInterval(fetchMarket, 15000); 
  tradesPollTimer = setInterval(loadTrades, 25000);  
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

    const updatedEl = document.getElementById('market-updated');
    if (updatedEl) updatedEl.innerText = mostRecent ? `Updated ${formatTime(mostRecent)}` : 'Awaiting first update';
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

// ---------- SETUP & STRATEGY TAGS ----------
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

// ---------- PROP FIRM RISK GUARDRAILS ----------
function updatePropGuardrails(tradesList) {
  const maxDailyRiskDollars = 500; 
  let totalExposedRisk = 0;

  tradesList.forEach(t => {
    if (t.outcome === 'Running' && t.entry && t.stopLoss) {
      const riskPerUnit = Math.abs(Number(t.entry) - Number(t.stopLoss));
      totalExposedRisk += riskPerUnit * 100; 
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

// ---------- ADVANCED ANALYTICS ----------
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
  if (aiBox) {
    aiBox.classList.remove('hidden');
    aiBox.innerText = "Analyzing trade setup with AI mentor...";
  }

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) { 
      if (aiBox) aiBox.innerText = data.text; 
      clearTags();
      if (document.getElementById('chartScreenshot')) document.getElementById('chartScreenshot').value = '';
      loadTrades(); 
    }
    else { if (aiBox) aiBox.innerText = "Error analyzing trade: " + (data.message || 'unknown error'); }
  } catch (err) {
    if (aiBox) aiBox.innerText = "Network error while saving trade: " + err.message;
  }
}

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

  if (allTrades.length === 0) {
    listDiv.innerHTML = '<div class="empty-state">No trades journaled yet.</div>';
    return;
  }

  listDiv.innerHTML = allTrades.map((t, originalIndex) => {
    const isRunning = t.outcome === 'Running';
    const key = normalizePairKey(t.pair);
    const liveM = key ? latestMarket[key] : null;
    const currentDisplay = isRunning
      ? (liveM && liveM.price !== null && liveM.price !== undefined ? formatMarketPrice(key, liveM.price) : (t.currentPrice ?? '—'))
      : null;

    const sessionTag = t.session ? ` · <span style="color:var(--accent);">${t.session}</span>` : '';
    const metaLine = isRunning
      ? `Entry ${fmt(t.entry)} → Current <span id="current-price-${originalIndex}" class="num" style="color:var(--running);">${currentDisplay ?? '—'}</span>${sessionTag}`
      : `Entry ${fmt(t.entry)} → Exit ${fmt(t.exit)}${sessionTag}`;

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
  return `${count} ${noun}${count > 1 ? 's' : ''}`;
}

function labelOutcome(o) {
  if (o === 'BreakEven') return 'Break-even';
  return o;
}

function fmt(v) {
  if (v === null || v === undefined || v === '') return 'N/A';
  return v;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}

function openModal(index) {
  const t = allTrades[index];
  if (!t) return;
  document.getElementById('modal-pair').innerText = t.pair;
  document.getElementById('modal-direction').innerText = t.direction || 'N/A';
  document.getElementById('modal-outcome').innerText = labelOutcome(t.outcome);
  document.getElementById('modal-entry').innerText = fmt(t.entry);
  document.getElementById('modal-exit').innerText = fmt(t.exit);
  document.getElementById('modal-sl').innerText = fmt(t.stopLoss);
  document.getElementById('modal-tp').innerText = fmt(t.takeProfit);
  document.getElementById('modal-notes').innerText = t.notes || 'No notes recorded.';
  document.getElementById('trade-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('trade-modal').classList.add('hidden');
}
