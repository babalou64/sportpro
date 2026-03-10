function showPage(name) {
  var allPages = document.querySelectorAll(".page");
  for (var i = 0; i < allPages.length; i++) { allPages[i].classList.remove("active"); }
  var allTabs = document.querySelectorAll(".tab-bar button");
  for (var i = 0; i < allTabs.length; i++) { allTabs[i].classList.remove("active"); }
  var p = document.getElementById("page-" + name);
  var t = document.getElementById("tab-" + name);
  if (p) p.classList.add("active");
  if (t) t.classList.add("active");
  window.scrollTo(0, 0);
  setTimeout(initAnimations, 100);
}

function toggleMenu() {
  var h = document.getElementById("hamburger-btn");
  var n = document.getElementById("main-nav");
  var o = document.getElementById("nav-overlay");
  if (h) h.classList.toggle("open");
  if (n) n.classList.toggle("open");
  if (o) o.classList.toggle("show");
}

function closeMenu() {
  var h = document.getElementById("hamburger-btn");
  var n = document.getElementById("main-nav");
  var o = document.getElementById("nav-overlay");
  if (h) h.classList.remove("open");
  if (n) n.classList.remove("open");
  if (o) o.classList.remove("show");
}

window.addEventListener("scroll", function() {
  var btn = document.getElementById("back-to-top");
  if (btn) btn.classList.toggle("show", window.scrollY > 280);
});

document.addEventListener("DOMContentLoaded", function() {
  var btn = document.getElementById("back-to-top");
  if (btn) btn.addEventListener("click", function() { window.scrollTo({top:0,behavior:"smooth"}); });
  setTimeout(initAnimations, 150);
});

function initAnimations() {
  var page = document.querySelector(".page.active");
  if (!page) return;
  var sel = ".info-card,.step,.product-card,.coach-card,.blog-card,.testi-card,.bf-banner,.form-box";
  var targets = page.querySelectorAll(sel);
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.style.opacity = "1";
        e.target.style.transform = "translateY(0)";
        obs.unobserve(e.target);
      }
    });
  }, {threshold: 0.1});
  targets.forEach(function(el, i) {
    if (!el.dataset.animated) {
      el.style.opacity = "0";
      el.style.transform = "translateY(28px)";
      el.style.transition = "opacity 0.5s ease " + (i%4*80) + "ms, transform 0.5s ease " + (i%4*80) + "ms";
      el.dataset.animated = "true";
    }
    obs.observe(el);
  });
}

var cartData = {};

function addToCart(name, price) {
  if (cartData[name]) { cartData[name].qty++; }
  else { cartData[name] = {price: price, qty: 1}; }
  renderCart();
  showToast("Ajoute : " + name);
}

function changeQty(name, delta) {
  if (!cartData[name]) return;
  cartData[name].qty += delta;
  if (cartData[name].qty <= 0) delete cartData[name];
  renderCart();
}

function removeItem(name) {
  delete cartData[name];
  renderCart();
}

function renderCart() {
  var cart = document.getElementById("cart");
  var totalEl = document.getElementById("total");
  var btn = document.getElementById("paypal-btn");
  if (!cart) return;
  cart.innerHTML = "";
  var total = 0;
  var keys = Object.keys(cartData);
  if (keys.length === 0) {
    cart.innerHTML = "<li class='cart-empty-msg'>Ton panier est vide</li>";
    if (totalEl) totalEl.textContent = "0 euros";
    if (btn) btn.disabled = true;
    return;
  }
  for (var k = 0; k < keys.length; k++) {
    var name = keys[k];
    var price = cartData[name].price;
    var qty = cartData[name].qty;
    total += price * qty;
    var li = document.createElement("li");
    li.className = "cart-item";
    var nameEsc = name.replace(/'/g, "\'");
    li.innerHTML = "<span class='cart-item-name'>" + name + "</span>"
      + "<div class='cart-item-qty'>"
      + "<button class='qty-btn' onclick='changeQty(\"" + nameEsc + "\",-1)'>-</button>"
      + "<span class='qty-count'>" + qty + "</span>"
      + "<button class='qty-btn' onclick='changeQty(\"" + nameEsc + "\",1)'>+</button>"
      + "</div>"
      + "<span class='cart-item-price'>" + (price*qty) + "euros</span>"
      + "<button class='cart-item-del' onclick='removeItem(\"" + nameEsc + "\")'>x</button>";
    cart.appendChild(li);
  }
  if (totalEl) totalEl.textContent = total + " euros";
  if (btn) btn.disabled = false;
}

function getTotal() {
  var total = 0;
  var keys = Object.keys(cartData);
  for (var k = 0; k < keys.length; k++) {
    total += cartData[keys[k]].price * cartData[keys[k]].qty;
  }
  return total;
}

function payWithPaypal() {
  var total = getTotal();
  if (!total) return;
  // Cacher le bouton statique, montrer le vrai bouton PayPal
  document.getElementById("paypal-btn").style.display = "none";
  var container = document.getElementById("paypal-button-container");
  container.style.display = "block";
  container.innerHTML = "";
  paypal.Buttons({
    style: {
      layout: "vertical",
      color: "gold",
      shape: "rect",
      label: "paypal"
    },
    createOrder: function(data, actions) {
      return actions.order.create({
        purchase_units: [{
          description: "Commande SportPro",
          amount: {
            currency_code: "EUR",
            value: total.toFixed(2)
          }
        }]
      });
    },
    onApprove: function(data, actions) {
      return actions.order.capture().then(function(details) {
        // Paiement réussi
        document.getElementById("paypal-button-container").style.display = "none";
        document.getElementById("paypal-btn").style.display = "flex";
        document.getElementById("paypal-btn").disabled = true;
        cartData = {};
        renderCart();
        showToast("Paiement confirme ! Merci " + (details.payer.name ? details.payer.name.given_name : "") + " !");
        // Afficher message de confirmation
        var cart = document.getElementById("cart");
        if (cart) cart.innerHTML = "<li style='padding:16px 0;color:#2e7d32;font-weight:700;text-align:center;'>Commande confirmee ! Merci pour ton achat.</li>";
      });
    },
    onError: function(err) {
      showToast("Erreur de paiement. Reessaie.");
      document.getElementById("paypal-button-container").style.display = "none";
      document.getElementById("paypal-btn").style.display = "flex";
    },
    onCancel: function() {
      document.getElementById("paypal-button-container").style.display = "none";
      document.getElementById("paypal-btn").style.display = "flex";
    }
  }).render("#paypal-button-container");
}

function closePaypalModal() {
  var modal = document.getElementById("paypal-modal");
  if (modal) modal.style.display = "none";
}

function confirmPaypalPayment() {
  closePaypalModal();
}

function filterProducts(search) {
  var q = search.toLowerCase();
  var cards = document.querySelectorAll(".product-card");
  for (var i = 0; i < cards.length; i++) {
    var n = (cards[i].dataset.name || "").toLowerCase();
    cards[i].style.display = n.indexOf(q) !== -1 ? "" : "none";
  }
}

function filterCategory(cat, btn) {
  var allBtns = document.querySelectorAll(".filter-btn");
  for (var i = 0; i < allBtns.length; i++) { allBtns[i].classList.remove("active"); }
  btn.classList.add("active");
  var cards = document.querySelectorAll(".product-card");
  for (var i = 0; i < cards.length; i++) {
    cards[i].style.display = (cat === "all" || cards[i].dataset.category === cat) ? "" : "none";
  }
  var sb = document.querySelector(".search-bar");
  if (sb) sb.value = "";
}

function submitForm(id) {
  var el = document.getElementById(id);
  if (el) {
    el.style.display = "block";
    setTimeout(function() { el.style.display = "none"; }, 4000);
  }
}

function showToast(msg) {
  var c = document.getElementById("toast-container");
  if (!c) return;
  var t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 3000);
}
