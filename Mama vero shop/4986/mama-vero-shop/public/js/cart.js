(async function () {
  await renderNavbar('cart');
  renderFooter();
  render();

  function render() {
    const cart = getCart();
    const content = document.getElementById('cart-content');

    if (!cart.length) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="icon">🛒</div>
          <h3>Your cart is empty.</h3>
          <p>Browse our products and add something delicious.</p>
          <a href="index.html#shop" class="btn btn-primary mt-2">Shop Now</a>
        </div>`;
      return;
    }

    const rows = cart.map((item) => `
      <tr>
        <td data-label="Product">${escapeHtml(item.name)}</td>
        <td data-label="Unit Price">${formatNaira(item.price)}</td>
        <td data-label="Quantity">
          <div class="qty-control">
            <button class="qty-minus" data-id="${item.productId}">−</button>
            <span>${item.quantity}</span>
            <button class="qty-plus" data-id="${item.productId}">+</button>
          </div>
        </td>
        <td data-label="Subtotal">${formatNaira(item.price * item.quantity)}</td>
        <td data-label="Remove"><button class="btn btn-danger btn-sm remove-btn" data-id="${item.productId}">Remove</button></td>
      </tr>
    `).join('');

    content.innerHTML = `
      <table class="cart-table">
        <thead><tr><th>Product</th><th>Unit Price</th><th>Quantity</th><th>Subtotal</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="cart-summary">
        <div class="row"><span>Items</span><span>${cartCount()}</span></div>
        <div class="row total-row"><span>Total</span><span>${formatNaira(cartTotal())}</span></div>
        <button class="btn btn-primary btn-block mt-2" id="checkout-btn">Proceed to Checkout</button>
      </div>
    `;

    content.querySelectorAll('.qty-plus').forEach((btn) => btn.addEventListener('click', () => {
      const item = cart.find((i) => i.productId === btn.dataset.id);
      if (item.quantity < item.maxStock) {
        updateCartQuantity(btn.dataset.id, item.quantity + 1);
      } else {
        showToast('You have reached the available stock for this item.', 'error');
      }
      render();
    }));
    content.querySelectorAll('.qty-minus').forEach((btn) => btn.addEventListener('click', () => {
      const item = cart.find((i) => i.productId === btn.dataset.id);
      if (item.quantity <= 1) {
        removeFromCart(btn.dataset.id);
      } else {
        updateCartQuantity(btn.dataset.id, item.quantity - 1);
      }
      render();
    }));
    content.querySelectorAll('.remove-btn').forEach((btn) => btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.id);
      showToast('Item removed from cart.', 'info');
      render();
    }));

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => { window.location.href = 'checkout.html'; });
    }
  }
})();
