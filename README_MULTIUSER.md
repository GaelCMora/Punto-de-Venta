# 🛒 Punto de Venta PWA Multi-Usuario

Una Progressive Web App (PWA) completa para gestión de ventas, productos y gastos, con integración a Supabase y **sistema multi-usuario con autenticación**. Cada usuario tiene su propia base de datos completamente aislada.

![PWA](https://img.shields.io/badge/PWA-Enabled-blue)
![Supabase](https://img.shields.io/badge/Supabase-Integrated-green)
![Multi-User](https://img.shields.io/badge/Multi--User-Enabled-orange)

## ✨ Características Principales

### 🔐 **Sistema Multi-Usuario**
- ✅ **Cada usuario tiene su propia base de datos completamente aislada**
- ✅ Registro e inicio de sesión seguro con Supabase Auth
- ✅ Datos privados protegidos con Row Level Security (RLS)
- ✅ Gestión de perfil de negocio personalizado
- ✅ Sin interferencia entre usuarios

### 💰 **Punto de Venta**
- Interfaz intuitiva para realizar ventas
- Búsqueda rápida de productos
- Carrito de compras con control de cantidades
- Sistema de descuentos
- Múltiples métodos de pago (efectivo, tarjeta, transferencia)
- Cálculo automático de cambio
- **Sistema de pagos con tarjeta mediante enlaces compartidos**

### 📦 **Gestión de Productos**
- Agregar, editar y eliminar productos
- Organización por categorías (Bebidas, Comida, Postres, Otros)
- Control de inventario/stock en tiempo real
- Código de producto único por usuario
- Almacenamiento en la nube con Supabase

### 📊 **Control de Gastos**
- Registro de gastos por categoría
- Seguimiento diario, semanal y mensual
- Notas y detalles de cada gasto
- Reportes automáticos

### 📈 **Reportes y Estadísticas**
- Ventas totales por período
- Gastos totales
- Ganancia neta y margen de utilidad
- Productos más vendidos
- Filtros por fecha personalizados
- Datos en tiempo real desde Supabase

### 📱 **PWA Features**
- Funciona offline con Service Workers
- Instalable en móvil y escritorio
- Diseño 100% responsive (mobile-first)
- Tema claro/oscuro
- Sincronización automática con la nube

## 🛠️ Tecnologías

- **Frontend:** HTML5, CSS3 (Variables CSS, Grid, Flexbox), JavaScript ES6+
- **Backend:** Supabase (PostgreSQL + Auth)
- **Autenticación:** Supabase Auth con RLS
- **PWA:** Service Workers, Web App Manifest
- **Base de Datos:** PostgreSQL con Row Level Security

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/punto-de-venta-pwa.git
cd punto-de-venta-pwa
```

### 2. Configurar Supabase

1. **Crear cuenta en Supabase:**
   - Ve a [supabase.com](https://supabase.com) y crea una cuenta
   - Crea un nuevo proyecto

2. **Configurar la Base de Datos:**
   - En el panel de Supabase, ve a "SQL Editor"
   - Copia todo el contenido de `database-schema.sql`
   - Pégalo en el editor SQL y ejecuta

3. **Configurar Autenticación:**
   - Ve a "Authentication" → "Settings"
   - Habilita "Email" como provider
   - (Opcional) Deshabilita "Email Confirmations" para desarrollo

4. **Obtener Credenciales:**
   - Ve a "Project Settings" → "API"
   - Copia tu `URL` y `anon/public key`

5. **Actualizar Credenciales:**
   - Abre `supabase.js`
   - Reemplaza las credenciales:

```javascript
const SUPABASE_URL = 'TU_URL_DE_SUPABASE';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_DE_SUPABASE';
```

### 3. Generar Iconos PWA

Elige uno de estos métodos:

**Método 1 - Navegador (Más fácil):**
```bash
# Abre generate-icons.html en tu navegador
# Haz clic en "Generar y Descargar Iconos"
# Mueve los archivos descargados a la carpeta icons/
```

**Método 2 - Python:**
```bash
pip install pillow
python generate_icons.py
```

### 4. Ejecutar la Aplicación

**Con Python:**
```bash
python -m http.server 8000
# Abre http://localhost:8000
```

**Con Node.js:**
```bash
npm install -g http-server
http-server
```

**Con VS Code:**
- Instala la extensión "Live Server"
- Click derecho en `login.html` → "Open with Live Server"

## 🔑 Uso del Sistema Multi-Usuario

### Primer Uso

1. **Abrir la aplicación** → Se muestra la página de login
2. **Hacer clic en "Registrarse"**
3. **Completar el formulario:**
   - Nombre del negocio (ej: "Tienda de José")
   - Correo electrónico
   - Contraseña (mínimo 6 caracteres)
4. **Crear cuenta** → Se redirige automáticamente al dashboard
5. **¡Listo!** Ahora puedes agregar tus productos, registrar ventas y gastos

### Usuarios Adicionales

- Cada persona puede crear su propia cuenta
- **Los datos están completamente separados**
- Un usuario NO puede ver los productos/ventas de otro usuario
- Cada negocio es independiente y privado

### Cerrar Sesión

- Click en el botón 🚪 en la esquina superior derecha
- Los datos quedan guardados en la nube
- Inicia sesión desde cualquier dispositivo

## 📱 Instalación como PWA

### En Móvil (Android/iOS):
1. Abre la app en Chrome/Safari
2. Toca el menú (⋮ o compartir)
3. Selecciona "Agregar a pantalla de inicio"
4. ¡Listo! Ya tienes la app instalada

### En Escritorio (Chrome/Edge):
1. Busca el icono de instalación en la barra de direcciones (⊕)
2. Haz clic en "Instalar"
3. La app se abrirá como aplicación independiente

## 🗄️ Estructura de Base de Datos

```sql
- user_profiles      (perfiles de usuario)
- products          (productos - separados por user_id)
- expenses          (gastos - separados por user_id)
- sales             (ventas - separadas por user_id)
- sale_items        (items de venta)
- payment_config    (configuración de pagos por usuario)
```

**Todas las tablas usan Row Level Security (RLS)** para garantizar que cada usuario solo vea sus propios datos.

## 📖 Guía de Uso

### 1. Realizar una Venta
1. Ve a la pestaña "Venta"
2. Busca o selecciona productos del grid
3. Ajusta cantidades con los botones +/-
4. Aplica descuento si es necesario
5. Click en "Cobrar"
6. Selecciona método de pago
7. Completa la venta

### 2. Agregar Productos
1. Ve a "Productos"
2. Click en "+ Nuevo Producto"
3. Completa: Código, Nombre, Categoría, Precio, Stock
4. Guardar

**Producto Rápido:** En la página de ventas, click en "+ Producto Rápido" para agregar sin salir de la venta.

### 3. Registrar Gastos
1. Ve a "Gastos"
2. Click en "+ Nuevo Gasto"
3. Completa: Concepto, Categoría, Monto, Fecha, Notas
4. Guardar

### 4. Ver Reportes
1. Ve a "Reportes"
2. Selecciona rango de fechas (o usa el mes actual por defecto)
3. Revisa:
   - Ventas totales
   - Gastos totales
   - Ganancia neta
   - Productos más vendidos

## 🎨 Personalización

### Cambiar Colores del Tema

Edita las variables CSS en `styles.css`:

```css
:root {
    --primary-color: #4F46E5;      /* Color principal */
    --success-color: #10B981;       /* Color de éxito */
    --danger-color: #EF4444;        /* Color de peligro */
    --bg-color: #F9FAFB;           /* Fondo claro */
    --surface-color: #FFFFFF;       /* Superficie */
}
```

### Agregar Categorías

Edita `index.html` en la sección de categorías y `app.js` para agregar lógica.

## 🔒 Seguridad

- ✅ Row Level Security (RLS) habilitado en todas las tablas
- ✅ Cada usuario solo puede acceder a sus propios datos
- ✅ Autenticación segura con Supabase Auth
- ✅ Políticas de acceso estrictas en la base de datos
- ✅ Credenciales de API de solo lectura (anon key)
- ✅ Validación de datos en cliente y servidor

## 🐛 Solución de Problemas

### No puedo iniciar sesión
- Verifica que hayas ejecutado todo el script `database-schema.sql`
- Revisa que las credenciales en `supabase.js` sean correctas
- Asegúrate de que la autenticación por email esté habilitada en Supabase

### Los productos no se guardan
- Verifica que hayas iniciado sesión correctamente
- Mira la consola del navegador (F12) para ver errores
- Confirma que las políticas RLS estén creadas en Supabase

### Error "No rows returned"
- Esto es normal si no tienes datos aún
- Simplemente agrega tus primeros productos

### La PWA no se instala
- Usa HTTPS o localhost (no file://)
- Verifica que los iconos estén en `icons/`
- Revisa que `manifest.json` sea accesible
- Limpia la caché del navegador

## 📄 Licencia

MIT License - Siéntete libre de usar este proyecto para tu negocio.

## 🤝 Contribuciones

Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/MiFeature`)
3. Commit tus cambios (`git commit -m 'Agregué X feature'`)
4. Push a la rama (`git push origin feature/MiFeature`)
5. Abre un Pull Request

## 📧 Soporte

Si tienes preguntas o problemas:
- Abre un [Issue](../../issues) en GitHub
- Revisa la documentación de [Supabase](https://supabase.com/docs)

## 🎯 Roadmap

- [ ] Exportar reportes a PDF/Excel
- [ ] Gráficos de ventas
- [ ] Soporte para múltiples sucursales
- [ ] App móvil nativa
- [ ] Integración con impresoras térmicas
- [ ] Modo oscuro automático
- [ ] Notificaciones push
- [ ] Backup automático

---

**Hecho con ❤️ para pequeños negocios**

**¿Te gustó el proyecto? Dale una ⭐ en GitHub!**
