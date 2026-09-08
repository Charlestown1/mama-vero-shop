(async function () {
  const user = await requireAuth();
  if (!user) return;
  await renderNavbar('orders');
  renderFooter();

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('id');
  const content = document.getElementById('order-content');

  if (!orderId) {
    content.innerHTML = `<div class="empty-state"><h3>No order specified.</h3></div>`;
    return;
  }

  const STEPS = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'payment_verified', label: 'Payment Verified' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready_for_pickup', label: 'Ready for Pickup' },
    { key: 'completed', label: 'Completed' },
  ];

  function stepState(order) {
    if (order.orderStatus === 'cancelled') return -1;
    const orderStatusIndexMap = { pending: 0, preparing: 2, ready_for_pickup: 3, completed: 4 };
    let idx = orderStatusIndexMap[order.orderStatus] ?? 0;
    if (idx === 0 && order.paymentStatus === 'verified') idx = 1;
    return idx;
  }

  try {
    const { order } = await apiFetch(`/orders/${orderId}`);
    const activeIdx = stepState(order);

    let stepsHtml = '';
    if (order.orderStatus === 'cancelled') {
      stepsHtml = `<div class="badge badge-cancelled" style="font-size:0.95rem;">This order has been cancelled.</div>`;
    } else {
      stepsHtml = `<div class="progress-steps">` + STEPS.map((s, i) => {
        const cls = i < activeIdx ? 'done' : i === activeIdx ? 'active' : '';
        const mark = i < activeIdx ? '✓' : i === activeIdx ? '●' : '○';
        return `
          <div class="progress-step ${cls}">
            <div class="dot">${mark}</div>
            <div><div class="label">${s.label}</div></div>
          </div>`;
      }).join('') + `</div>`;
    }

    let proofHtml = '';
    if (order.paymentProof && order.paymentProof.objectPath) {
      proofHtml = `<button class="btn btn-outline btn-sm" id="view-proof-btn">View My Uploaded Payment Proof</button>`;
    } else {
      proofHtml = `<p class="section-subtitle">No payment proof uploaded yet.</p><a href="checkout.html" class="btn btn-primary btn-sm">Upload Payment Proof</a>`;
    }

    content.innerHTML = `
      <div class="card" style="padding:24px;">
        <div class="flex-between mb-2" style="flex-wrap:wrap;">
          <div>
            <h2 style="color:var(--color-primary-dark);">${escapeHtml(order.orderNumber)}</h2>
            <p class="meta">${new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div class="flex gap-1">
            <span class="badge badge-${order.paymentStatus}">Payment: ${formatOrderStatus(order.paymentStatus)}</span>
            <span class="badge badge-${order.orderStatus}">${formatOrderStatus(order.orderStatus)}</span>
          </div>
        </div>

        <h3 class="mb-1 mt-2">Order Progress</h3>
        ${stepsHtml}

        <h3 class="mb-1 mt-3">Items</h3>
        ${order.items.map((i) => `<div class="order-line"><span>${escapeHtml(i.name)} × ${i.quantity}</span><span>${formatNaira(i.subtotal)}</span></div>`).join('')}
        <div class="order-line" style="font-weight:800;border-bottom:none;"><span>Total</span><span>${formatNaira(order.totalAmount)}</span></div>

        <h3 class="mb-1 mt-3">Payment Proof</h3>
        ${proofHtml}
      </div>
    `;

    const viewBtn = document.getElementById('view-proof-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', async () => {
        viewBtn.disabled = true;
        viewBtn.textContent = 'Loading...';
        try {
          const { url } = await apiFetch(`/orders/${orderId}/payment-proof-url`);
          window.open(url, '_blank', 'noopener');
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          viewBtn.disabled = false;
          viewBtn.textContent = 'View My Uploaded Payment Proof';
        }
      });
    }
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><h3>Could not load this order.</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
})();
