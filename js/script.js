// ==========================================
// 1. MANAJEMEN USER & SESI LOGIN
// ==========================================
function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ==========================================
// 2. MANAJEMEN KERANJANG (CART) & BADGE
// ==========================================
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(kodeBarang) {
    let cart = getCart();
    
    // Pastikan dataKatalogBuku ada dari data.js
    if (typeof dataKatalogBuku === 'undefined') {
        alert('Data katalog buku belum dimuat!');
        return;
    }

    let book = dataKatalogBuku.find(b => b.kodeBarang === kodeBarang);
    if (!book) {
        alert('Buku tidak ditemukan!');
        return;
    }

    let existing = cart.find(item => item.kodeBarang === kodeBarang);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            kodeBarang: book.kodeBarang,
            namaBarang: book.namaBarang,
            harga: book.harga,
            cover: book.cover,
            qty: 1
        });
    }
    
    saveCart(cart);
    alert(`Buku "${book.namaBarang}" berhasil ditambahkan ke keranjang!`);
}

function updateCartBadge() {
    // Mendukung ID badge dari berbagai versi navbar Anda (cart-count atau cartCount)
    let badge = document.getElementById('cart-count') || document.getElementById('cartCount');
    if (badge) {
        let cart = getCart();
        let total = cart.reduce((sum, item) => sum + item.qty, 0);
        badge.textContent = total;
        // Jika menggunakan atribut hidden pada badge baru
        if (total > 0 && badge.hasAttribute('hidden')) {
            badge.removeAttribute('hidden');
        } else if (total === 0 && !badge.hasAttribute('hidden')) {
            badge.setAttribute('hidden', '');
        }
    }
}

// ==========================================
// 3. MODAL TOGGLE HELPERS
// ==========================================
function openModal(id) {
    const el = document.getElementById(id);
    if (el) {
        if (typeof el.showModal === 'function') {
            el.showModal();
        } else {
            el.style.display = 'flex';
        }
    }
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) {
        if (typeof el.close === 'function') {
            el.close();
        } else {
            el.style.display = 'none';
        }
    }
}

// ==========================================
// 4. LOGIKA HALAMAN CHECKOUT / PEMESANAN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();

    // Otomatis isi nama user yang login ke input form jika ada
    const currentUser = getCurrentUser();
    if (currentUser) {
        const inputNama = document.getElementById('nama');
        const inputEmail = document.getElementById('email');
        const spanUserName = document.getElementById('userName');

        if (inputNama && !inputNama.value) inputNama.value = currentUser.nama || '';
        if (inputEmail && !inputEmail.value) inputEmail.value = currentUser.email || '';
        if (spanUserName) spanUserName.textContent = currentUser.nama || '';
    }

    // Jalankan skrip khusus halaman checkout jika beratribut data-page="checkout" atau ada tabel pesanan
    if (document.body.getAttribute('data-page') === 'checkout' || document.getElementById('tabelPesanan')) {
        initCheckoutPage();
    }
});

function initCheckoutPage() {
    renderCheckoutTable();
    populateDropdowns();
    setupCheckoutEvents();
}

function renderCheckoutTable() {
    const cart = getCart();
    const tbody = document.querySelector('#tabelPesanan tbody');
    const rItem = document.getElementById('rItem');
    const rSubtotal = document.getElementById('rSubtotal');
    const rTotal = document.getElementById('rTotal');
    
    if (!tbody) return;
    tbody.innerHTML = '';

    let totalQty = 0;
    let subtotalHarga = 0;

    if (cart.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#777; padding: 20px;">Keranjang belanja masih kosong.</td></tr>`;
    } else {
        cart.forEach((item, index) => {
            const hargaNum = parseInt(item.harga.replace(/[^0-9]/g, '')) || 0;
            const subtotalItem = hargaNum * item.qty;
            totalQty += item.qty;
            subtotalHarga += subtotalItem;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.namaBarang}</strong><br><small style="color:#777;">${item.kodeBarang}</small></td>
                <td class="num">${item.harga}</td>
                <td>
                    <input type="number" min="1" value="${item.qty}" style="width: 60px; padding: 4px;" data-index="${index}" class="qty-input">
                </td>
                <td class="num">Rp ${subtotalItem.toLocaleString('id-ID')}</td>
                <td><button type="button" class="btn btn-outline" style="padding: 2px 8px; font-size:0.8rem;" onclick="removeCartItem(${index})">Hapus</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Update Ringkasan Biaya
    if (rItem) rItem.textContent = `${totalQty} buku`;
    if (rSubtotal) rSubtotal.textContent = `Rp ${subtotalHarga.toLocaleString('id-ID')}`;
    if (rTotal) rTotal.textContent = `Rp ${subtotalHarga.toLocaleString('id-ID')}`;

    // Event listener untuk ubah qty langsung di tabel
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = e.target.getAttribute('data-index');
            let val = parseInt(e.target.value);
            let cartData = getCart();
            if (val > 0) {
                cartData[idx].qty = val;
            } else {
                cartData.splice(idx, 1);
            }
            saveCart(cartData);
            renderCheckoutTable();
        });
    });
}

function removeCartItem(index) {
    let cartData = getCart();
    cartData.splice(index, 1);
    saveCart(cartData);
    renderCheckoutTable();
}

function populateDropdowns() {
    // Dropdown tambah buku lain
    const selectTambah = document.getElementById('tambahBuku');
    if (selectTambah && typeof dataKatalogBuku !== 'undefined') {
        selectTambah.innerHTML = '<option value="">Pilih buku...</option>';
        dataKatalogBuku.forEach(book => {
            selectTambah.innerHTML += `<option value="${book.kodeBarang}">${book.namaBarang} (${book.harga})</option>`;
        });
    }

    // Dropdown Ekspedisi
    const selectEkspedisi = document.getElementById('ekspedisi');
    if (selectEkspedisi) {
        selectEkspedisi.innerHTML = `
            <option value="">Pilih ekspedisi…</option>
            <option value="JNE">JNE</option>
            <option value="Pos Indonesia">Pos Indonesia</option>
            <option value="SiCepat">SiCepat</option>
        `;
    }

    // Dropdown Jenis Paket
    const selectPaket = document.getElementById('paket');
    if (selectPaket) {
        selectPaket.innerHTML = `
            <option value="">Pilih jenis paket…</option>
            <option value="Reguler">Reguler (3-5 Hari)</option>
            <option value="Express">Express (1-2 Hari)</option>
        `;
    }

    // Dropdown Metode Pembayaran
    const selectMetode = document.getElementById('metode');
    if (selectMetode) {
        selectMetode.innerHTML = `
            <option value="">Pilih metode…</option>
            <option value="Transfer Bank">Transfer Bank</option>
            <option value="COD">Bayar di Tempat (COD)</option>
            <option value="E-Wallet">E-Wallet (QRIS)</option>
        `;
    }
}

function setupCheckoutEvents() {
    const btnTambahLine = document.getElementById('btnTambahLine');
    if (btnTambahLine) {
        btnTambahLine.addEventListener('click', () => {
            const kode = document.getElementById('tambahBuku').value;
            const qty = parseInt(document.getElementById('tambahQty').value) || 1;
            if (!kode) {
                alert('Pilih buku terlebih dahulu!');
                return;
            }
            const book = dataKatalogBuku.find(b => b.kodeBarang === kode);
            if (book) {
                let cart = getCart();
                let existing = cart.find(item => item.kodeBarang === kode);
                if (existing) {
                    existing.qty += qty;
                } else {
                    cart.push({
                        kodeBarang: book.kodeBarang,
                        namaBarang: book.namaBarang,
                        harga: book.harga,
                        cover: book.cover,
                        qty: qty
                    });
                }
                saveCart(cart);
                renderCheckoutTable();
                alert(`Buku "${book.namaBarang}" berhasil ditambahkan.`);
            }
        });
    }

    // Form submit / Buat Pesanan
    const formCheckout = document.getElementById('formCheckout');
    if (formCheckout) {
        formCheckout.addEventListener('submit', (e) => {
            e.preventDefault();
            const nama = document.getElementById('nama').value.trim();
            const email = document.getElementById('email').value.trim();
            const alamat = document.getElementById('alamat').value.trim();

            if (!nama || !email || !alamat) {
                alert('Mohon lengkapi data pemesan (Nama, Email, dan Alamat lengkap)!');
                return;
            }

            const cart = getCart();
            if (cart.length === 0) {
                alert('Keranjang belanja Anda masih kosong!');
                return;
            }

            // Generate nomor Delivery Order (DO) acak
            const randomDO = 'DO' + Math.floor(100000 + Math.random() * 900000);
            
            // Tampilkan Modal Sukses
            const modalSukses = document.getElementById('modalSukses');
            const hasilDO = document.getElementById('hasilDO');
            const hasilTotal = document.getElementById('hasilTotal');
            const rTotal = document.getElementById('rTotal');

            if (hasilDO) hasilDO.textContent = randomDO;
            if (hasilTotal && rTotal) hasilTotal.textContent = rTotal.textContent;

            if (modalSukses) {
                if (typeof modalSukses.showModal === 'function') {
                    modalSukses.showModal();
                } else {
                    modalSukses.style.display = 'block';
                }
            }

            // Kosongkan keranjang setelah pesanan berhasil dibuat
            localStorage.removeItem('cart');
            updateCartBadge();
        });
    }
}