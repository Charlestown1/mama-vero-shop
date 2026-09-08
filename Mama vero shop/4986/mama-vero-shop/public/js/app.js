/* ===== Mama Vero Shop — shared frontend utilities ===== */

const API_BASE = '/api';

/* ---------- Fetch wrapper ---------- */
async function apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* no JSON body */ }
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data;
}

/* ---------- Toast notifications ---------- */
function ensureToastContainer() {
  let el = document.getElementById('toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-container';
    document.body.appendChild(el);
  }
  return el;
}

function showToast(message, type = 'info', duration = 3500) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* ---------- Currency formatting (Nigerian Naira) ---------- */
function formatNaira(amount) {
  return '₦' + Number(amount || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 });
}

/* ---------- Cart (persisted client-side; server re-validates on checkout) ---------- */
const CART_KEY = 'mvs_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.productId === product._id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      maxStock: product.stockQuantity,
    });
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  saveCart(getCart().filter((i) => i.productId !== productId));
}

function updateCartQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find((i) => i.productId === productId);
  if (item) {
    item.quantity = Math.max(1, quantity);
    saveCart(cart);
  }
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.quantity * i.price, 0);
}

function updateCartBadge() {
  document.querySelectorAll('.cart-badge').forEach((el) => {
    el.textContent = cartCount();
  });
}

/* ---------- Navbar rendering ---------- */
async function renderNavbar(activePage = '') {
  const mount = document.getElementById('navbar-mount');
  if (!mount) return;

  let user = null;
  try {
    const data = await apiFetch('/auth/me');
    user = data.user;
  } catch (e) {
    user = null;
  }

  const link = (href, label, key) =>
    `<a href="${href}" class="${activePage === key ? 'active' : ''}">${label}</a>`;

  let linksHtml = '';
  if (user) {
    linksHtml += link('dashboard.html', 'Dashboard', 'dashboard');
    linksHtml += link('index.html#shop', 'Shop', 'shop');
    linksHtml += link('cart.html', `🛒 Cart <span class="cart-badge">${cartCount()}</span>`, 'cart');
    linksHtml += link('orders.html', 'My Orders', 'orders');
    linksHtml += link('account.html', 'Account', 'account');
    if (user.role === 'admin') {
      linksHtml += `<a href="admin.html" class="admin-link ${activePage === 'admin' ? 'active' : ''}">Admin Dashboard</a>`;
    }
    linksHtml += `<a href="#" id="logout-link">Logout</a>`;
  } else {
    linksHtml += link('index.html', 'Home', 'home');
    linksHtml += link('login.html', 'Login', 'login');
    linksHtml += link('signup.html', 'Sign Up', 'signup');
  }

  mount.innerHTML = `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="index.html" class="brand">Mama <span>Vero</span> Shop</a>
        <button class="nav-toggle" id="nav-toggle" aria-label="Menu">☰</button>
        <div class="nav-links" id="nav-links">${linksHtml}</div>
      </div>
    </nav>
  `;

  document.getElementById('nav-toggle').addEventListener('click', () => {
    document.getElementById('nav-links').classList.toggle('open');
  });

  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await apiFetch('/auth/logout', { method: 'POST' });
        showToast('Logged out successfully.', 'success');
      } catch (err) { /* ignore */ }
      window.location.href = 'login.html';
    });
  }

  updateCartBadge();
  return user;
}

function renderFooter() {
  const mount = document.getElementById('footer-mount');
  if (!mount) return;
  mount.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div>
          <h4>Mama Vero Shop</h4>
          <p>Quality African foodstuff, conveniently available.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <p><a href="index.html#shop">Browse Products</a></p>
          <p><a href="cart.html">My Cart</a></p>
        </div>
        <div>
          <h4>Contact</h4>
          <p>Orders are fulfilled via bank transfer + pickup.</p>
          <p>Reach out via the contact details on our storefront.</p>
        </div>
      </div>
      <p class="bottom">&copy; ${new Date().getFullYear()} Mama Vero Shop. All rights reserved.</p>
    </footer>
  `;
}

/* Requires the user to be logged in; redirects otherwise. Returns the user object. */
async function requireAuth(redirectTo = 'login.html') {
  try {
    const data = await apiFetch('/auth/me');
    return data.user;
  } catch (e) {
    window.location.href = redirectTo;
    return null;
  }
}

async function requireAdmin() {
  const user = await requireAuth('login.html');
  if (user && user.role !== 'admin') {
    showToast('You are not authorized to view this page.', 'error');
    window.location.href = 'dashboard.html';
    return null;
  }
  return user;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function stockStatusLabel(product) {
  if (product.stockQuantity <= 0) return { text: 'Out of Stock', cls: 'stock-out' };
  if (product.stockQuantity <= 5) return { text: 'Low Stock', cls: 'stock-low' };
  return { text: 'In Stock', cls: 'stock-in' };
}

function formatOrderStatus(status) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
