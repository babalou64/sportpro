let total = 0;

function addToCart(name, price) {
    const cart = document.getElementById("cart");
    if (!cart) return;

    const item = document.createElement("li");
    item.textContent = name + " - " + price + "€";
    cart.appendChild(item);

    total += price;
    const totalElement = document.getElementById("total");
    if (totalElement) {
        totalElement.textContent = total;
    }
}