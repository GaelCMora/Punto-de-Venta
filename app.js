// Estado de la aplicación
const state = {
    products: [],
    cart: [],
    expenses: [],
    sales: [],
    currentCategory: 'todos',
    editingProductId: null,
    discount: 0,
    paymentLinks: {
        stripe: '',
        paypal: '',
        mercadopago: '',
        custom: ''
    }
};

// Registrar Service Worker para PWA
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registrado');
        } catch (error) {
            console.log('Error al registrar Service Worker:', error);
        }
    }
}

// Inicializar aplicación
async function initApp() {
    // Verificar autenticación
    const isAuth = await DB.Auth.isAuthenticated();
    if (!isAuth) {
        window.location.href = 'login.html';
        return;
    }

    // Cargar información del usuario
    try {
        const profile = await DB.Auth.getProfile();
        if (profile) {
            document.getElementById('businessName').textContent = profile.business_name || 'Mi Negocio';
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
    }

    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // Verificar si hay productos en la BD
    try {
        const products = await DB.Products.getAll();
        if (!products || products.length === 0) {
            console.log('No hay productos, puedes agregar algunos...');
        }
    } catch (error) {
        console.error('Error al inicializar:', error);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación de pestañas
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Tema
    document.getElementById('toggleTheme').addEventListener('click', toggleTheme);

    // Cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Búsqueda de productos
    document.getElementById('searchProduct').addEventListener('input', filterProducts);
    document.getElementById('searchBtn').addEventListener('click', () => {
        document.getElementById('searchProduct').focus();
    });

    // Categorías
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => filterByCategory(btn.dataset.category));
    });

    // Botones principales
    document.getElementById('addProductBtn').addEventListener('click', addQuickProduct);
    document.getElementById('newProductBtn').addEventListener('click', () => openProductModal());
    document.getElementById('newExpenseBtn').addEventListener('click', openExpenseModal);
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    document.getElementById('checkoutBtn').addEventListener('click', openCheckoutModal);

    // Modales
    setupModalListeners();

    // Descuento
    document.getElementById('discountInput').addEventListener('input', updateCartSummary);

    // Método de pago
    document.getElementById('paymentMethod').addEventListener('change', toggleCashFields);
    document.getElementById('cashReceived').addEventListener('input', calculateChange);
}

// Cerrar sesión
async function handleLogout() {
    if (confirm('¿Deseas cerrar sesión?')) {
        try {
            await DB.Auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            alert('Error al cerrar sesión');
        }
    }
}

// Configurar listeners de modales
function setupModalListeners() {
    // Modal de producto
    document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
    document.getElementById('cancelProductBtn').addEventListener('click', closeProductModal);
    document.getElementById('productForm').addEventListener('submit', saveProduct);

    // Modal de gasto
    document.getElementById('closeExpenseModal').addEventListener('click', closeExpenseModal);
    document.getElementById('cancelExpenseBtn').addEventListener('click', closeExpenseModal);
    document.getElementById('expenseForm').addEventListener('submit', saveExpense);

    // Modal de checkout
    document.getElementById('closeCheckoutModal').addEventListener('click', closeCheckoutModal);
    document.getElementById('cancelCheckoutBtn').addEventListener('click', closeCheckoutModal);
    document.getElementById('checkoutForm').addEventListener('submit', completeSale);

    // Cerrar modal al hacer click fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Cambiar de pestaña
function switchTab(tabName) {
    // Actualizar pestañas
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');

    // Cargar datos según la pestaña
    if (tabName === 'productos') renderProductsTable();
    if (tabName === 'gastos') renderExpensesTable();
    if (tabName === 'reportes') renderReports();
}

// Cambiar tema
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    document.getElementById('toggleTheme').textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Filtrar productos
function filterProducts() {
    const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
    renderProductsGrid(searchTerm);
}

function filterByCategory(category) {
    state.currentFilter = category;
    
    // Actualizar botones de categoría
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    renderProductsGrid();
}

// Renderizar grid de productos
async function renderProductsGrid(searchTerm = '') {
    const grid = document.getElementById('productsGrid');
    
    try {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Cargando productos...</p>';
        
        let products = await DB.Products.getAll();
        state.products = products; // Actualizar estado local
        
        let filtered = products.filter(p => {
            const matchesCategory = state.currentFilter === 'todos' || p.category === state.currentFilter;
            const matchesSearch = p.name.toLowerCase().includes(searchTerm) || 
                                p.code.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No se encontraron productos</p>';
            return;
        }

        grid.innerHTML = filtered.map(product => `
            <div class="product-card" onclick="addToCart(${product.id})">
                <div class="product-icon">${getCategoryIcon(product.category)}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-stock">Stock: ${product.stock}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar productos:', error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--danger-color);">Error al cargar productos</p>';
    }
}

// Obtener icono de categoría
function getCategoryIcon(category) {
    const icons = {
        bebidas: '🥤',
        comida: '🍔',
        postres: '🍰',
        otros: '📦'
    };
    return icons[category] || '📦';
}

// Agregar al carrito
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
        alert('Producto sin stock disponible');
        return;
    }

    const cartItem = state.cart.find(item => item.id === productId);
    
    if (cartItem) {
        if (cartItem.quantity < product.stock) {
            cartItem.quantity++;
        } else {
            alert('No hay suficiente stock disponible');
            return;
        }
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    renderCart();
    updateCartSummary();
}

// Renderizar carrito
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    
    if (state.cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <p>🛒 Carrito vacío</p>
                <small>Agrega productos para comenzar la venta</small>
            </div>
        `;
        return;
    }

    cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="cart-item-qty">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                <span class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</span>
                <button class="btn-remove" onclick="removeFromCart(${item.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Actualizar cantidad en carrito
function updateQuantity(productId, change) {
    const cartItem = state.cart.find(item => item.id === productId);
    const product = state.products.find(p => p.id === productId);
    
    if (!cartItem || !product) return;

    const newQuantity = cartItem.quantity + change;
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (newQuantity > product.stock) {
        alert('No hay suficiente stock disponible');
        return;
    }

    cartItem.quantity = newQuantity;
    renderCart();
    updateCartSummary();
}

// Remover del carrito
function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    renderCart();
    updateCartSummary();
}

// Limpiar carrito
function clearCart() {
    if (state.cart.length === 0) return;
    
    if (confirm('¿Deseas limpiar el carrito?')) {
        state.cart = [];
        state.discount = 0;
        document.getElementById('discountInput').value = 0;
        renderCart();
        updateCartSummary();
    }
}

// Actualizar resumen del carrito
function updateCartSummary() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(document.getElementById('discountInput').value) || 0;
    state.discount = discount;
    
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal - discountAmount;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Agregar producto rápido
function addQuickProduct() {
    const name = prompt('Nombre del producto:');
    if (!name) return;

    const price = parseFloat(prompt('Precio del producto:'));
    if (isNaN(price) || price <= 0) {
        alert('Precio inválido');
        return;
    }

    const product = {
        id: Date.now(),
        code: `PROD${Date.now()}`,
        name: name,
        category: 'otros',
        price: price,
        stock: 0
    };

    state.products.push(product);
    saveData();
    addToCart(product.id);
}

// Modal de producto
function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');

    if (productId) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        title.textContent = 'Editar Producto';
        document.getElementById('productCode').value = product.code;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        state.editingProduct = productId;
    } else {
        title.textContent = 'Nuevo Producto';
        form.reset();
        state.editingProduct = null;
    }

    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('productForm').reset();
    state.editingProduct = null;
}

async function saveProduct(e) {
    e.preventDefault();

    const product = {
        code: document.getElementById('productCode').value,
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value)
    };

    try {
        if (state.editingProduct) {
            await DB.Products.update(state.editingProduct, product);
        } else {
            await DB.Products.create(product);
        }

        closeProductModal();
        await renderProductsGrid();
        await renderProductsTable();
        alert('Producto guardado exitosamente');
    } catch (error) {
        console.error('Error al guardar producto:', error);
        alert('Error al guardar el producto: ' + error.message);
    }
}

// Renderizar tabla de productos
async function renderProductsTable() {
    const tbody = document.getElementById('productsTable');
    
    try {
        const products = await DB.Products.getAll();
        state.products = products;
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay productos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.code}</td>
                <td>${product.name}</td>
                <td>${capitalizeFirst(product.category)}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>
                    <button class="btn-table btn-edit" onclick="openProductModal(${product.id})">✏️ Editar</button>
                    <button class="btn-table btn-delete" onclick="deleteProduct(${product.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar productos:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger-color);">Error al cargar productos</td></tr>';
    }
}

// Eliminar producto
async function deleteProduct(productId) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        try {
            await DB.Products.delete(productId);
            await renderProductsGrid();
            await renderProductsTable();
            alert('Producto eliminado exitosamente');
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            alert('Error al eliminar el producto: ' + error.message);
        }
    }
}

// Modal de gastos
function openExpenseModal() {
    document.getElementById('expenseModal').classList.add('active');
    document.getElementById('expenseDate').valueAsDate = new Date();
}

function closeExpenseModal() {
    document.getElementById('expenseModal').classList.remove('active');
    document.getElementById('expenseForm').reset();
}

async function saveExpense(e) {
    e.preventDefault();

    const expense = {
        concept: document.getElementById('expenseConcept').value,
        category: document.getElementById('expenseCategory').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        date: document.getElementById('expenseDate').value,
        notes: document.getElementById('expenseNotes').value
    };

    try {
        await DB.Expenses.create(expense);
        closeExpenseModal();
        await renderExpensesTable();
        await updateExpensesSummary();
        alert('Gasto registrado exitosamente');
    } catch (error) {
        console.error('Error al guardar gasto:', error);
        alert('Error al guardar el gasto: ' + error.message);
    }
}

// Renderizar tabla de gastos
async function renderExpensesTable() {
    const tbody = document.getElementById('expensesTable');
    
    try {
        const expenses = await DB.Expenses.getAll();
        state.expenses = expenses;
        
        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay gastos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = expenses.map(expense => `
            <tr>
                <td>${formatDate(expense.date)}</td>
                <td>${expense.concept}</td>
                <td>${capitalizeFirst(expense.category)}</td>
                <td>$${expense.amount.toFixed(2)}</td>
                <td>
                    <button class="btn-table btn-delete" onclick="deleteExpense(${expense.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `).join('');

        await updateExpensesSummary();
    } catch (error) {
        console.error('Error al cargar gastos:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger-color);">Error al cargar gastos</td></tr>';
    }
}

// Actualizar resumen de gastos
async function updateExpensesSummary() {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
        const expenses = await DB.Expenses.getAll();
        
        const expensesToday = expenses
            .filter(e => e.date === today)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const expensesWeek = expenses
            .filter(e => e.date >= weekAgo)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const expensesMonth = expenses
            .filter(e => e.date >= monthAgo)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        document.getElementById('expensesToday').textContent = `$${expensesToday.toFixed(2)}`;
        document.getElementById('expensesWeek').textContent = `$${expensesWeek.toFixed(2)}`;
        document.getElementById('expensesMonth').textContent = `$${expensesMonth.toFixed(2)}`;
    } catch (error) {
        console.error('Error al actualizar resumen de gastos:', error);
    }
}

// Eliminar gasto
async function deleteExpense(expenseId) {
    if (confirm('¿Estás seguro de eliminar este gasto?')) {
        try {
            await DB.Expenses.delete(expenseId);
            await renderExpensesTable();
            alert('Gasto eliminado exitosamente');
        } catch (error) {
            console.error('Error al eliminar gasto:', error);
            alert('Error al eliminar el gasto: ' + error.message);
        }
    }
}

// Modal de checkout
function openCheckoutModal() {
    if (state.cart.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (state.discount / 100);
    const total = subtotal - discountAmount;

    document.getElementById('checkoutTotal').textContent = `$${total.toFixed(2)}`;
    document.getElementById('checkoutModal').classList.add('active');
    document.getElementById('paymentMethod').value = 'efectivo';
    toggleCashFields();
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active');
    document.getElementById('checkoutForm').reset();
}

function toggleCashFields() {
    const method = document.getElementById('paymentMethod').value;
    const cashGroup = document.getElementById('cashGroup');
    
    if (method === 'efectivo') {
        cashGroup.style.display = 'block';
        document.getElementById('cashReceived').required = true;
    } else {
        cashGroup.style.display = 'none';
        document.getElementById('cashReceived').required = false;
    }
}

function calculateChange() {
    const total = parseFloat(document.getElementById('checkoutTotal').textContent.replace('$', ''));
    const received = parseFloat(document.getElementById('cashReceived').value) || 0;
    const change = received - total;
    
    document.getElementById('changeAmount').textContent = `$${Math.max(0, change).toFixed(2)}`;
}

// Completar venta
async function completeSale(e) {
    e.preventDefault();

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (state.discount / 100);
    const total = subtotal - discountAmount;

    const method = document.getElementById('paymentMethod').value;
    
    if (method === 'efectivo') {
        const received = parseFloat(document.getElementById('cashReceived').value);
        if (received < total) {
            alert('El efectivo recibido es menor al total');
            return;
        }
    }

    try {
        // Registrar venta en Supabase
        const sale = {
            subtotal: subtotal,
            discount: state.discount,
            total: total,
            paymentMethod: method
        };

        await DB.Sales.create(sale, state.cart);

        // Limpiar carrito
        state.cart = [];
        state.discount = 0;
        document.getElementById('discountInput').value = 0;

        closeCheckoutModal();
        renderCart();
        updateCartSummary();
        await renderProductsGrid();

        alert(`¡Venta completada!\nTotal: $${total.toFixed(2)}\nMétodo: ${capitalizeFirst(method)}`);
    } catch (error) {
        console.error('Error al completar venta:', error);
        alert('Error al completar la venta: ' + error.message);
    }
}

// Renderizar reportes
async function renderReports() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    try {
        let filteredSales, filteredExpenses;

        if (startDate && endDate) {
            filteredSales = await DB.Sales.getByDateRange(startDate, endDate + 'T23:59:59');
            filteredExpenses = await DB.Expenses.getByDateRange(startDate, endDate);
        } else {
            filteredSales = await DB.Sales.getAll();
            filteredExpenses = await DB.Expenses.getAll();
        }

        const totalSales = filteredSales.reduce((sum, s) => sum + parseFloat(s.total), 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const netProfit = totalSales - totalExpenses;
        const profitMargin = totalSales > 0 ? (netProfit / totalSales * 100) : 0;

        document.getElementById('totalSales').textContent = `$${totalSales.toFixed(2)}`;
        document.getElementById('salesCount').textContent = `${filteredSales.length} ventas`;
        document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
        document.getElementById('expensesCount').textContent = `${filteredExpenses.length} gastos`;
        document.getElementById('netProfit').textContent = `$${netProfit.toFixed(2)}`;
        document.getElementById('profitMargin').textContent = `${profitMargin.toFixed(1)}% margen`;

        renderTopProducts(filteredSales);
    } catch (error) {
        console.error('Error al cargar reportes:', error);
        alert('Error al cargar reportes: ' + error.message);
    }
}

// Renderizar productos más vendidos
function renderTopProducts(sales) {
    const productSales = {};

    sales.forEach(sale => {
        if (sale.sale_items) {
            sale.sale_items.forEach(item => {
                if (!productSales[item.product_id]) {
                    productSales[item.product_id] = {
                        name: item.product_name,
                        quantity: 0,
                        total: 0
                    };
                }
                productSales[item.product_id].quantity += item.quantity;
                productSales[item.product_id].total += parseFloat(item.subtotal);
            });
        }
    });

    const sorted = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    const container = document.getElementById('topProducts');

    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No hay datos disponibles</p>';
        return;
    }

    container.innerHTML = sorted.map(product => `
        <div class="top-product-item">
            <div>
                <strong>${product.name}</strong>
                <br>
                <small>${product.quantity} unidades</small>
            </div>
            <strong>$${product.total.toFixed(2)}</strong>
        </div>
    `).join('');
}

// Establecer fechas por defecto
function setDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('startDate').valueAsDate = firstDay;
    document.getElementById('endDate').valueAsDate = today;

    document.getElementById('filterReportBtn').addEventListener('click', renderReports);
}

// Guardar datos (ahora solo para caché local del carrito)
function saveData() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
}

// Cargar datos desde Supabase
async function loadData() {
    try {
        // Cargar carrito del localStorage (temporal)
        const cart = localStorage.getItem('cart');
        if (cart) state.cart = JSON.parse(cart);

        // Cargar productos desde Supabase
        await renderProductsGrid();
        renderCart();
        updateCartSummary();
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

// Utilidades
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    await DB.init();
    // Esperar a que Supabase se cargue
    setTimeout(async () => {
        await initApp();
        await loadData();
        setupEventListeners();
        registerServiceWorker();
        setDefaultDates();
    }, 1000);
});
