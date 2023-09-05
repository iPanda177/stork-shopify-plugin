// const APP_URL = 'https://stork-app.dev-test.pro';
const APP_URL = 'https://stork-shopify.com';

(function initializeStorkPlugin() {
  swapAddToCartBtn();
  swapCheckoutButton();
  initializeObserver();
})();

function initializeObserver() {
  const target = document.body;

  const config = {
    childList: true
  }

  const callback = function(mutationsList, observer) {
    for (let mutation of mutationsList) {
      swapAddToCartBtn();
      swapCheckoutButton();
    }
  }

  const observer = new MutationObserver(callback);
  observer.observe(target, config);
}

function swapAddToCartBtn() {
  const addToCartBtn = document.querySelector('form[action="/cart/add"] button[type="submit"]');

  if (addToCartBtn) {
    let storkBtn = document.querySelector('#stork-btn');

    if (!storkBtn) {
      storkBtn = addToCartBtn.cloneNode(true);

      storkBtn.setAttribute('type', 'button');
      storkBtn.setAttribute('id', 'stork-btn')
      storkBtn.addEventListener('click', addToCart);
      
      addToCartBtn.parentNode.insertBefore(storkBtn, addToCartBtn);
      addToCartBtn.style.display = "none";
    }
  }
}

async function addToCart() {
  const variantTag = document.querySelector('[name="id"]');
  let selectedOption = null;
  let qtyInput = null;
  let qty = 1;

  if (variantTag.tagName === 'SELECT' || variantTag.tagName === 'select') {
    selectedOption = variantTag.querySelector('option[selected="selected"]').value;
    qtyInput = document.querySelector('[name="quantity"]');
  } else {
    selectedOption = document.querySelector('input[name="id"]').value;
    qtyInput = document.querySelector('input[name="quantity"]');
  }

  if (qtyInput) {
    qty = qtyInput.value;
  }

  const addCart = await fetch(`${APP_URL}/api/product/check-qty?shop=${window.stork_plugin.domain}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{ id: selectedOption, quantity: qty }])
  })

  if (addCart.status === 400) {
    this.setAttribute('disabled', true)
    this.textContent = 'Sorry! Product sold!'
  } else {
    const button = document.querySelector('form[action="/cart/add"] button[type="submit"]');
    button.click()
  }
}

function swapCheckoutButton() {
  const checkoutBtn = document.querySelector('form[action="/cart"] button[type="submit"]');

  if (checkoutBtn) {
    let storkBtn = document.querySelector('#stork-checkout-btn');

    if (!storkBtn) {
      storkBtn = checkoutBtn.cloneNode(true);

      storkBtn.setAttribute('type', 'button');
      storkBtn.setAttribute('id', 'stork-checkout-btn')
      storkBtn.addEventListener('click', checkAvailability);
      
      checkoutBtn.parentNode.insertBefore(storkBtn, checkoutBtn);
      checkoutBtn.style.display = "none";
    }
  }
}

async function checkAvailability() {
  try {
    const cartItems = await fetch(window.Shopify.routes.root + 'cart.js');
    const cartItemsData = await cartItems.json();
    const cartItemsIdsAndQtys = cartItemsData.items.map(item => ({ id: item.variant_id, quantity: item.quantity }));

    const checkAvailability = await fetch(`${APP_URL}/api/product/check-qty?shop=${window.stork_plugin.domain}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cartItemsIdsAndQtys)
    });

    if (checkAvailability.status === 400) {
      const checkoutBtn = document.querySelector('form[action="/cart"] button[type="submit"]');
      checkoutBtn.setAttribute('disabled', true)
      checkoutBtn.textContent = 'Sorry! Some of products have been sold!'
    } else {
      const checkoutBtn = document.querySelector('form[action="/cart"] button[type="submit"]');
      checkoutBtn.click();
    }
  } catch (err) {
    console.log(err);
    const checkoutBtn = document.querySelector('form[action="/cart"] button[type="submit"]');
    checkoutBtn.click();
  }
}