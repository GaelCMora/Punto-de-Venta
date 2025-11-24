// Configuración de Supabase
const SUPABASE_URL = 'https://ndqnbjjfpjpvxchqehdd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcW5iampmcGpwdnhjaHFlaGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDQyMTgsImV4cCI6MjA3OTUyMDIxOH0.-CqoP62dD9O_lQOnkQEkbYdiUc2VpEiTOycqEj6IzV4';

// Cliente de Supabase
let supabase;

// Inicializar Supabase
async function initSupabase() {
    try {
        // Cargar la librería de Supabase desde CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase conectado');
        };
        document.head.appendChild(script);
    } catch (error) {
        console.error('Error al inicializar Supabase:', error);
    }
}

// Funciones de base de datos para Productos
const ProductsDB = {
    async getAll() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    async create(product) {
        const user = await supabase.auth.getUser();
        if (!user.data.user) throw new Error('Usuario no autenticado');
        
        const { data, error } = await supabase
            .from('products')
            .insert([{...product, user_id: user.data.user.id}])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async update(id, product) {
        const { data, error } = await supabase
            .from('products')
            .update(product)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    },

    async updateStock(id, quantity) {
        const product = await this.getById(id);
        const newStock = product.stock - quantity;
        
        const { data, error } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

// Funciones de base de datos para Gastos
const ExpensesDB = {
    async getAll() {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async create(expense) {
        const user = await supabase.auth.getUser();
        if (!user.data.user) throw new Error('Usuario no autenticado');
        
        const { data, error } = await supabase
            .from('expenses')
            .insert([{...expense, user_id: user.data.user.id}])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    },

    async getByDateRange(startDate, endDate) {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data;
    }
};

// Funciones de base de datos para Ventas
const SalesDB = {
    async getAll() {
        const { data, error } = await supabase
            .from('sales')
            .select(`
                *,
                sale_items (*)
            `)
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async create(sale, items) {
        const user = await supabase.auth.getUser();
        if (!user.data.user) throw new Error('Usuario no autenticado');
        
        // Insertar venta
        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert([{
                user_id: user.data.user.id,
                subtotal: sale.subtotal,
                discount: sale.discount,
                total: sale.total,
                payment_method: sale.paymentMethod
            }])
            .select()
            .single();
        
        if (saleError) throw saleError;

        // Insertar items de la venta
        const saleItems = items.map(item => ({
            sale_id: saleData.id,
            product_id: item.id,
            product_name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(saleItems);
        
        if (itemsError) throw itemsError;

        // Actualizar stock de productos
        for (const item of items) {
            await ProductsDB.updateStock(item.id, item.quantity);
        }

        return saleData;
    },

    async getByDateRange(startDate, endDate) {
        const { data, error } = await supabase
            .from('sales')
            .select(`
                *,
                sale_items (*)
            `)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data;
    }
};

// Funciones de base de datos para Configuración de Pagos
const PaymentConfigDB = {
    async getAll() {
        const { data, error } = await supabase
            .from('payment_config')
            .select('*');
        
        if (error) throw error;
        return data;
    },

    async upsert(provider, link, isActive) {
        const { data, error } = await supabase
            .from('payment_config')
            .upsert([{
                provider: provider,
                link: link,
                is_active: isActive
            }], {
                onConflict: 'provider'
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

// Funciones de Autenticación
const AuthDB = {
    async signUp(email, password, businessName = 'Mi Negocio') {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    business_name: businessName
                }
            }
        });
        
        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    async getProfile() {
        const user = await this.getUser();
        if (!user) return null;
        
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (error) throw error;
        return data;
    },

    async updateProfile(updates) {
        const user = await this.getUser();
        if (!user) throw new Error('Usuario no autenticado');
        
        const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Verificar si hay sesión activa
    async isAuthenticated() {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    },

    // Listener para cambios de autenticación
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    }
};

// Exportar para uso global
window.DB = {
    Products: ProductsDB,
    Expenses: ExpensesDB,
    Sales: SalesDB,
    PaymentConfig: PaymentConfigDB,
    Auth: AuthDB,
    init: initSupabase
};
