(async function () {
  const user = await requireAuth();
  if (!user) return;
  await renderNavbar('orders');
  renderFooter();

  const list = document.getElementById('orders-list');
  list.innerHTML = `<div class="skeleton" style="height:100px;margin-bottom:16px;"></div>`.repeat(3);

  try {
    const { orders } = await apiFetch('/orders');

    if (!orders.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">📦</div>
          <h3>You haven't placed any orders yet.</h3>
          <a href="index.html#shop" class="btn btn-primary mt-2">Shop Now</a>
        </div>`;
      return;
    }

    list.innerHTML = orders.map((o) => `
      <div class="card order-card">
        <div class="top-row">
          <div>
            <div class="order-num">${escapeHtml(o.orderNumber)}</div>
            <div class="meta">${new Date(o.createdAt).toLocaleString()}</div>
          </div>
          <div class="flex gap-1">
            <span class="badge badge-${o.paymentStatus}">Payment: ${formatOrderStatus(o.paymentStatus)}</span>
            <span class="badge badge-${o.orderStatus}">${formatOrderStatus(o.orderStatus)}</span>
          </div>
        </div>
        <div class="order-items-preview">${o.items.map((i) => `${escapeHtml(i.name)} ×${i.quantity}`).join(', ')}</div>
        <div class="flex-between">
          <b>${formatNaira(o.totalAmount)}</b>
          <a href="order-details.html?id=${o._id}" class="btn btn-outline btn-sm">View Details</a>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><h3>Could not load orders.</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
})();
