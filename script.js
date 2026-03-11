var cartData = {};

function toggleMenu() {
  document.getElementById("hamburger-btn").classList.toggle("open");
  document.getElementById("main-nav").classList.toggle("open");
  document.getElementById("nav-overlay").classList.toggle("show");
}
function closeMenu() {
  document.getElementById("hamburger-btn").classList.remove("open");
  document.getElementById("main-nav").classList.remove("open");
  document.getElementById("nav-overlay").classList.remove("show");
}

window.addEventListener("scroll", function() {
  var btn = document.getElementById("back-to-top");
  if (btn) btn.classList.toggle("show", window.scrollY > 280);
});

document.addEventListener("DOMContentLoaded", function() {
  var btn = document.getElementById("back-to-top");
  if (btn) btn.addEventListener("click", function() { window.scrollTo({top:0,behavior:"smooth"}); });
  initAnimations();
  // Marquer le lien actif
  var path = window.location.pathname.split("/").pop();
  document.querySelectorAll("nav a").forEach(function(a) {
    var href = a.getAttribute("href");
    if (href && (href === path || (path === "" && href === "index.html"))) {
      a.classList.add("active");
    }
  });
});

function initAnimations() {
  var targets = document.querySelectorAll(".info-card,.product-card,.coach-card,.blog-card,.testi-card,.stat-box,.step");
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
    el.style.opacity = "0";
    el.style.transform = "translateY(22px)";
    el.style.transition = "opacity 0.5s ease " + (i % 4 * 70) + "ms, transform 0.5s ease " + (i % 4 * 70) + "ms";
    obs.observe(el);
  });
}

function addToCart(name, price) {
  if (cartData[name]) { cartData[name].qty++; } else { cartData[name] = {price: price, qty: 1}; }
  renderCart();
  showToast(name + " ajoute au panier");
}
function changeQty(name, delta) {
  if (!cartData[name]) return;
  cartData[name].qty += delta;
  if (cartData[name].qty <= 0) delete cartData[name];
  renderCart();
}
function removeItem(name) { delete cartData[name]; renderCart(); }

function renderCart() {
  var cart = document.getElementById("cart");
  var totalEl = document.getElementById("total");
  var btn = document.getElementById("paypal-btn");
  if (!cart) return;
  cart.innerHTML = "";
  var total = 0;
  var keys = Object.keys(cartData);
  if (keys.length === 0) {
    cart.innerHTML = '<li class="cart-empty-msg">Votre panier est vide</li>';
    if (totalEl) totalEl.textContent = "0 EUR";
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
    var ne = name.replace(/'/g, "\'");
    li.innerHTML = '<span class="cart-item-name">' + name + '</span>'
      + '<div class="cart-item-qty">'
      + '<button class="qty-btn" onclick="changeQty(\'' + ne + '\',-1)">-</button>'
      + '<span class="qty-count">' + qty + '</span>'
      + '<button class="qty-btn" onclick="changeQty(\'' + ne + '\',1)">+</button>'
      + '</div>'
      + '<span class="cart-item-price">' + (price * qty) + ' EUR</span>'
      + '<button class="cart-item-del" onclick="removeItem(\'' + ne + '\')">x</button>';
    cart.appendChild(li);
  }
  if (totalEl) totalEl.textContent = total + " EUR";
  if (btn) btn.disabled = false;
}

function loadPaypalAndPay() {
  var emailEl = document.getElementById("client-email");
  if (emailEl && !emailEl.value) {
    showToast("Entre ton email pour recevoir ton PDF !");
    emailEl.style.borderColor = "var(--gold)";
    emailEl.focus();
    return;
  }
  var total = 0;
  var keys = Object.keys(cartData);
  for (var k = 0; k < keys.length; k++) { total += cartData[keys[k]].price * cartData[keys[k]].qty; }
  if (!total) return;
  document.getElementById("paypal-btn").style.display = "none";
  var container = document.getElementById("paypal-button-container");
  container.style.display = "block";
  container.innerHTML = "";
  if (window.paypal) {
    renderPaypalBtn(total);
    return;
  }
  var script = document.createElement("script");
  script.src = "https://www.paypal.com/sdk/js?client-id=sb&currency=EUR";
  script.onload = function() { renderPaypalBtn(total); };
  script.onerror = function() {
    showToast("Erreur PayPal, verifiez votre connexion.");
    document.getElementById("paypal-btn").style.display = "flex";
    container.style.display = "none";
  };
  document.head.appendChild(script);
}

function renderPaypalBtn(total) {
  paypal.Buttons({
    style: {layout:"vertical",color:"gold",shape:"rect",label:"paypal"},
    createOrder: function(data, actions) {
      return actions.order.create({
        purchase_units: [{description:"Commande SportShop", amount:{currency_code:"EUR", value: total.toFixed(2)}}]
      });
    },
    onApprove: function(data, actions) {
      return actions.order.capture().then(function(details) {
        // Notifier le backend pour envoyer le PDF
        var email = document.getElementById("client-email") ? document.getElementById("client-email").value : "";
        var produits = Object.keys(cartData);
        var produit = produits.length > 0 ? produits[0] : "Commande";
        var montant = total;

        fetch("https://sportshop-backend.up.railway.app/paypal/success", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            orderID: data.orderID,
            email: email || (details.payer ? details.payer.email_address : ""),
            produit: produit,
            montant: montant
          })
        }).catch(function() {});

        cartData = {};
        renderCart();
        var container = document.getElementById("paypal-button-container");
        if (container) container.style.display = "none";
        var btn = document.getElementById("paypal-btn");
        if (btn) { btn.style.display = "flex"; btn.disabled = true; }
        var cart = document.getElementById("cart");
        if (cart) cart.innerHTML = '<li style="padding:20px 0;color:var(--gold);font-family:Cormorant Garamond,serif;font-size:18px;text-align:center;">Commande confirmee — verifiez vos emails !</li>';
        showToast("Paiement confirme ! Ton PDF arrive par email !");
      });
    },
    onError: function() {
      showToast("Erreur de paiement, reessayez.");
      document.getElementById("paypal-button-container").style.display = "none";
      document.getElementById("paypal-btn").style.display = "flex";
    },
    onCancel: function() {
      document.getElementById("paypal-button-container").style.display = "none";
      document.getElementById("paypal-btn").style.display = "flex";
    }
  }).render("#paypal-button-container");
}

function filterProducts(search) {
  var q = search.toLowerCase();
  document.querySelectorAll(".product-card").forEach(function(c) {
    c.style.display = (c.dataset.name || "").toLowerCase().indexOf(q) !== -1 ? "" : "none";
  });
}
function filterCategory(cat, btn) {
  document.querySelectorAll(".filter-btn").forEach(function(b) { b.classList.remove("active"); });
  btn.classList.add("active");
  document.querySelectorAll(".product-card").forEach(function(c) {
    c.style.display = (cat === "all" || c.dataset.category === cat) ? "" : "none";
  });
  var sb = document.querySelector(".search-bar");
  if (sb) sb.value = "";
}

function submitForm(id) {
  var el = document.getElementById(id);
  if (el) { el.style.display = "block"; setTimeout(function() { el.style.display = "none"; }, 4000); }
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

function toggleFaq(btn) {
  var answer = btn.nextElementSibling;
  var isOpen = btn.classList.contains("open");
  document.querySelectorAll(".faq-question").forEach(function(b) { b.classList.remove("open"); });
  document.querySelectorAll(".faq-answer").forEach(function(a) { a.classList.remove("open"); });
  if (!isOpen) { btn.classList.add("open"); answer.classList.add("open"); }
}

function trackOrder() {
  var val = document.getElementById("tracking-input").value.trim().toUpperCase();
  if (!val) return;
  var orders = {
    "SS-2025-00142": {product:"Programme Prise de Masse 12 semaines", date:"Commande le 08 Mars 2025", status:2},
    "SS-2025-00187": {product:"Basic-Fit Mensuel + Kit Entrainement", date:"Commande le 10 Mars 2025", status:1},
    "SS-2025-00201": {product:"Pack Complements Starter", date:"Commande le 11 Mars 2025", status:3}
  };
  var steps = ["Commande confirmee","En preparation","Expediee","Livree"];
  var stepDesc = ["Paiement accepte","Votre commande est en cours de preparation","Votre colis est en route","Votre commande a ete livree"];
  var order = orders[val];
  document.getElementById("tracking-order-id").textContent = val;
  document.getElementById("tracking-product").textContent = order ? order.product : "Commande en cours de traitement";
  document.getElementById("tracking-date").textContent = order ? order.date : "";
  var stepsEl = document.getElementById("tracking-steps");
  stepsEl.innerHTML = "";
  var status = order ? order.status : 0;
  for (var i = 0; i < steps.length; i++) {
    var div = document.createElement("div");
    div.className = "tracking-step" + (i < status ? " done" : "") + (i === status ? " current" : "");
    div.innerHTML = "<div class='tracking-step-content'><h4>" + steps[i] + "</h4><p>" + stepDesc[i] + "</p></div>";
    stepsEl.appendChild(div);
  }
  document.getElementById("tracking-result").classList.add("show");
}

