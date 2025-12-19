/*************************
    CONFIG
**************************/
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRwAKxfinC68si-vhxyGtLs-JSkEg7bkmgDK2ZBFGWxllrqL_Q1DfK-8SGepZ32EJkScI5B7sSWMogZ/pub?gid=0&single=true&output=csv';

// только ссылка на Apps Script:
const ORDER_POST_URL = "https://script.google.com/macros/s/AKfycbyAkQ-BRLVLVKUN_p0t0ZjvlywQQ1rVXSz_x8sciuF9ysTszseHqetpE-bkIgaWVmwkRw/exec";

/*************************
    CART SYSTEM
**************************/
let cart = [];

function init() {
    const grid = document.getElementById('products');

    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {

            grid.innerHTML = '';

            results.data.forEach((item, index) => {

                if (!item.name) return;

                const productId = `${Date.now()}_${index}_${Math.floor(Math.random()*999999)}`;

                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="img-wrapper"><img src="${item.image}"></div>

                    <div class="info">
                        <h3>${item.name}</h3>

                        <div class="price">${item.price} €</div>
                        <div class="stock">В наличии: ${item.qty || 0}</div>

                        <button class="buy-btn" 
                        onclick="addToCart('${productId}','${item.name}',${item.price})">
                        В корзину
                        </button>
                    </div>
                `;

                grid.appendChild(card);
            });
        }
    });
}

/*************************
    ADD / REMOVE ITEMS
**************************/
function addToCart(id, name, price) {

    cart.push({
        id,
        name,
        price
    });

    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(x => x.id !== id);
    updateCartUI();
}

/*************************
    UI UPDATE
**************************/
function updateCartUI() {

    document.getElementById('cartCount').innerText = cart.length;

    const total = cart.reduce((s,i)=>s+i.price,0);
    document.getElementById('modalTotal').innerText = total;

    const list = document.getElementById('orderItemsList');

    if(cart.length === 0){
        list.innerHTML = '<p style="text-align:center; padding:20px;">Корзина пустая</p>';
        return;
    }

    list.innerHTML = cart.map(item => `
        <div class="cart-item-row">
            <span>${item.name}</span>

            <div>
                <b>${item.price}€</b>
                <i class="fas fa-trash-alt remove-item"
                   onclick="removeFromCart('${item.id}')"></i>
            </div>
        </div>
    `).join('');
}

function showOrderModal() {
    document.getElementById('orderModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function hideSuccess() {
    document.getElementById('successMessage').style.display = 'none';
}

/*************************
    SEND ORDER (UPSCRIPTS)
**************************/
async function sendOrder(){

    if(cart.length === 0){
        alert("Корзина пустая");
        return;
    }

    const userTg = document.getElementById('userTelegram').value.trim();
    if(!userTg){
        alert("Введи свой @Telegram!");
        return;
    }

    const total = cart.reduce((s,i)=>s+i.price,0);

    try {

        await fetch(ORDER_POST_URL, {
            method:"POST",
            body: JSON.stringify({
                username:userTg,
                total,
                items:cart
            })
        });

        closeModal();
        cart = [];
        updateCartUI();
        document.getElementById('successMessage').style.display = 'flex';

    } catch(err){
        alert("Ошибка отправки заказа. Проверь Apps Script.");
    }
}

init();
