const CLIQ_NUMBER = "0779713298";
const CURRENCY = "JD";

// لو بدك يفتح واتساب لنفس الرقم: حوله لصيغة دولية (الأردن 962 + بدون 0)
const WHATSAPP_INTL = "962" + CLIQ_NUMBER.replace(/^0+/, ""); // 962779713298

const PRODUCTS = [
  { id: 1,  name: "Canva Pro",             price: 2.5,  cat: "Subscriptions", img: "assets/canva.png" },
  { id: 2,  name: "Microsoft Office 2021", price: 4.99, cat: "Activations",   img: "assets/office2021.png" },
  { id: 3,  name: "Microsoft Office 2024", price: 5.99, cat: "Activations",   img: "assets/office2024.png" },
  { id: 4,  name: "Windows Activation",    price: 4.99, cat: "Activations",   img: "assets/windows.png" },
  { id: 5,  name: "Pin Removal",           price: 4.99, cat: "Services",      img: "assets/pin.png" },
  { id: 6,  name: "McAfee",                price: 7.99, cat: "Security",      img: "assets/mcafee.png" },
  { id: 7,  name: "Kaspersky",             price: 14.5, cat: "Security",      img: "assets/kaspersky.png" },
  { id: 8,  name: "Autodesk",              price: 8.0,  cat: "Software",      img: "assets/autodesk.png" },
  { id: 9,  name: "Duolingo",              price: 3.5,  cat: "Subscriptions", img: "assets/duolingo.png" },
  { id: 10, name: "YouTube Premium",       price: 2.5,  cat: "Subscriptions", img: "assets/youtube.png" },
  { id: 11, name: "ChatGPT Pro",           price: 5.0,  cat: "Subscriptions", img: "assets/chatgpt.png" },
  { id: 12, name: "Spotify Premium",       price: 3.5,  cat: "Subscriptions", img: "assets/spotify.png" },
];


const $ = (id) => document.getElementById(id);

let cart = loadCart(); // {id: qty}

init();

function init() {
  $("cliqText").textContent = CLIQ_NUMBER;

  // categories
  const cats = ["all", ...Array.from(new Set(PRODUCTS.map(p => p.cat)))];
  $("category").innerHTML = cats.map(c => `<option value="${c}">${c === "all" ? "كل التصنيفات" : c}</option>`).join("");

  // events
  $("search").addEventListener("input", render);
  $("category").addEventListener("change", render);

  $("openCart").addEventListener("click", () => openCart(true));
  $("closeCart").addEventListener("click", () => openCart(false));

  $("copyCliq").addEventListener("click", () => copyText(CLIQ_NUMBER));
  $("copyCliq2").addEventListener("click", () => copyText(CLIQ_NUMBER));

  $("makeMsg").addEventListener("click", makeOrderMessage);
  $("copyMsg").addEventListener("click", () => copyText($("orderMsg").value));

  render();
  renderCartBadge();
}

function render() {
  const q = $("search").value.trim().toLowerCase();
  const cat = $("category").value;

  const list = PRODUCTS.filter(p => {
    const byCat = (cat === "all") ? true : p.cat === cat;
    const byQ = q ? p.name.toLowerCase().includes(q) : true;
    return byCat && byQ;
  });

  $("meta").textContent = `${list.length} منتج`;

  $("grid").innerHTML = list.map(p => cardHTML(p)).join("");
  list.forEach(p => $("add-" + p.id).addEventListener("click", () => addToCart(p.id, 1)));
}

function cardHTML(p) {
  return `
    <article class="card">
      <div class="cardMedia">
        <img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy" />
        <div class="mediaOverlay">
          <span class="tag">${p.cat}</span>
          <span class="tag price">${fmt(p.price)} ${CURRENCY}</span>
        </div>
      </div>

      <div class="cardBody">
        <div class="title">${escapeHtml(p.name)}</div>
        <div class="rowBetween">
          <span class="muted tiny">تسليم بدون توصيل</span>
          <button class="btn btnPrimary" id="add-${p.id}" type="button">أضف للسلة</button>
        </div>
      </div>
    </article>
  `;
}

function openCart(open) {
  if (open) {
    $("drawer").classList.remove("hidden");
    renderCart();
  } else {
    $("drawer").classList.add("hidden");
  }
}

function renderCartBadge() {
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  $("cartCount").textContent = String(count);
}

function renderCart() {
  const items = Object.entries(cart)
    .map(([id, qty]) => ({ p: PRODUCTS.find(x => x.id === Number(id)), qty: Number(qty) }))
    .filter(x => x.p);

  if (!items.length) {
    $("cartItems").innerHTML = `<div class="muted">السلة فاضية.</div>`;
    $("total").textContent = `0 ${CURRENCY}`;
    return;
  }

  const total = items.reduce((s, { p, qty }) => s + p.price * qty, 0);
  $("total").textContent = `${fmt(total)} ${CURRENCY}`;

  $("cartItems").innerHTML = items.map(({ p, qty }) => `
    <div class="cartItem">
      <div class="cartInfo">
        <div style="font-weight:900">${escapeHtml(p.name)}</div>
        <div class="muted tiny">${fmt(p.price)} ${CURRENCY}</div>
        <div class="qty">
          <button type="button" id="dec-${p.id}">-</button>
          <div>${qty}</div>
          <button type="button" id="inc-${p.id}">+</button>
          <button type="button" class="btn" style="padding:8px 10px" id="rm-${p.id}">حذف</button>
        </div>
      </div>
    </div>
  `).join("");

  items.forEach(({ p }) => {
    $("inc-" + p.id).addEventListener("click", () => { addToCart(p.id, 1); renderCart(); });
    $("dec-" + p.id).addEventListener("click", () => { decFromCart(p.id); renderCart(); });
    $("rm-" + p.id).addEventListener("click", () => { removeFromCart(p.id); renderCart(); });
  });
}

function addToCart(id, qty) {
  cart[id] = (cart[id] || 0) + qty;
  saveCart();
  renderCartBadge();
}
function decFromCart(id) {
  if (!cart[id]) return;
  cart[id] -= 1;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCartBadge();
}
function removeFromCart(id) {
  delete cart[id];
  saveCart();
  renderCartBadge();
}

function makeOrderMessage() {
  const items = Object.entries(cart)
    .map(([id, qty]) => ({ p: PRODUCTS.find(x => x.id === Number(id)), qty: Number(qty) }))
    .filter(x => x.p);

  if (!items.length) return alert("السلة فاضية.");

  const name = $("custName").value.trim();
  const phone = $("custPhone").value.trim();
  const email = $("custEmail").value.trim();
  const notes = $("notes").value.trim();

if (!name || !phone || !email) {
  return alert("اكتب اسمك، رقمك، وإيميلك.");
}


  let total = 0;
  const lines = [];
  lines.push("طلب جديد ✅ (NEOCODE)");
  lines.push(`الاسم: ${name}`);
  lines.push(`الهاتف: ${phone}`);
  lines.push("⚠️ شرط: تم إرسال سكرين شوت للتحويل مع هذه الرسالة.");
  lines.push(`CliQ: ${CLIQ_NUMBER}`);
  if (notes) lines.push(`ملاحظات: ${notes}`);
  lines.push("");
  lines.push("الطلب:");
  items.forEach(({ p, qty }) => {
    const sub = p.price * qty;
    total += sub;
    lines.push(`- ${p.name} | ${qty} × ${fmt(p.price)} = ${fmt(sub)} ${CURRENCY}`);
  });
  lines.push("");
  lines.push(`الإجمالي: ${fmt(total)} ${CURRENCY}`);

  $("orderMsg").value = lines.join("\n");
  $("msgWrap").classList.remove("hidden");

  const msg = encodeURIComponent($("orderMsg").value);
  $("waLink").href = `https://wa.me/${WHATSAPP_INTL}?text=${msg}`;
  $("waLink").textContent = "إرسال واتساب";
}

function fmt(n) {
  return (Math.round(n * 100) / 100).toString();
}

function saveCart() {
  localStorage.setItem("neo_cart", JSON.stringify(cart));
}
function loadCart() {
  try { return JSON.parse(localStorage.getItem("neo_cart") || "{}"); }
  catch { return {}; }
}

function copyText(t) {
  navigator.clipboard.writeText(t).then(() => {
    // سناك بسيط
    const old = document.title;
    document.title = "Copied ✓";
    setTimeout(() => (document.title = old), 700);
  });
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
