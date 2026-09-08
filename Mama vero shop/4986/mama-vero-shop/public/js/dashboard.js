(async function () {
  const user = await requireAuth();
  if (!user) return;
  await renderNavbar('dashboard');
  renderFooter();

  document.getElementById('welcome-msg').textContent = `Welcome back, ${user.name}`;
  document.getElementById('stat-cart').textContent = cartCount();

  try {
    const { orders } = await apiFetch('/orders');
    const pending = orders.filter((o) => o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled').length;
    const completed = orders.filter((o) => o.orderStatus === 'completed').length;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-completed').textContent = completed;
  } catch (e) { /* silent */ }

  const grid = document.getElementById('product-grid');
  try {
    const { products } = await apiFetch('/products?sort=');
    const available = products.filter((p) => p.isAvailable);
    document.getElementById('stat-products').textContent = available.length;

    const top = products.slice(0, 8);
    if (!top.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🛒</div><h3>No products found.</h3></div>`;
      return;
    }
    grid.innerHTML = top.map((p) => {
      const stock = stockStatusLabel(p);
      const disabled = p.stockQuantity <= 0 || !p.isAvailable;
      return `
        <div class="card product-card">
          <div class="product-image">${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">` : '🥫'}</div>
          <div class="product-body">
            <span class="category-pill">${escapeHtml(p.category)}</span>
            <div class="product-name">${escapeHtml(p.name)}</div>
            <div class="product-price">${formatNaira(p.price)}</div>
            <div class="product-stock ${stock.cls}">${stock.text}</div>
            <div class="product-footer">
              <button class="btn btn-primary btn-block btn-sm add-btn" data-id="${p._id}" ${disabled ? 'disabled' : ''}>${disabled ? 'Out of Stock' : 'Add to Cart'}</button>
            </div>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.add-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const product = top.find((p) => p._id === btn.dataset.id);
        addToCart(product, 1);
        document.getElementById('stat-cart').textContent = cartCount();
        showToast(`${product.name} added to cart.`, 'success');
      });
    });
  } catch (e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>Could not load products.</h3></div>`;
  }
})();
