"""
Generador de iconos para PWA
Ejecuta este script con Python 3 y Pillow instalado:
pip install pillow
python generate_icons.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Tamaños de iconos necesarios
sizes = [72, 96, 128, 144, 152, 192, 384, 512]

# Colores
bg_color_start = (79, 70, 229)  # #4F46E5
bg_color_end = (124, 58, 237)   # #7C3AED

def create_gradient(size):
    """Crea un fondo con degradado"""
    image = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(image)
    
    for y in range(size):
        # Interpolar entre los dos colores
        ratio = y / size
        r = int(bg_color_start[0] + (bg_color_end[0] - bg_color_start[0]) * ratio)
        g = int(bg_color_start[1] + (bg_color_end[1] - bg_color_start[1]) * ratio)
        b = int(bg_color_start[2] + (bg_color_end[2] - bg_color_start[2]) * ratio)
        
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    return image

def create_icon(size):
    """Crea un icono del tamaño especificado"""
    # Crear imagen con degradado
    image = create_gradient(size)
    draw = ImageDraw.Draw(image)
    
    # Dibujar un rectángulo redondeado (borde)
    border_width = max(2, size // 50)
    padding = size // 20
    draw.rounded_rectangle(
        [(padding, padding), (size - padding, size - padding)],
        radius=size // 10,
        outline=(255, 255, 255, 50),
        width=border_width
    )
    
    # Agregar texto/emoji (simulado con formas)
    # Dibujar un carrito simple
    cart_size = size // 3
    cart_x = size // 2 - cart_size // 2
    cart_y = size // 2 - cart_size // 4
    
    # Cuerpo del carrito
    draw.rounded_rectangle(
        [(cart_x, cart_y), (cart_x + cart_size, cart_y + cart_size // 2)],
        radius=cart_size // 20,
        fill='white'
    )
    
    # Ruedas
    wheel_radius = cart_size // 8
    draw.ellipse(
        [(cart_x + cart_size // 4 - wheel_radius, cart_y + cart_size // 2 + wheel_radius),
         (cart_x + cart_size // 4 + wheel_radius, cart_y + cart_size // 2 + wheel_radius * 3)],
        fill='white'
    )
    draw.ellipse(
        [(cart_x + 3 * cart_size // 4 - wheel_radius, cart_y + cart_size // 2 + wheel_radius),
         (cart_x + 3 * cart_size // 4 + wheel_radius, cart_y + cart_size // 2 + wheel_radius * 3)],
        fill='white'
    )
    
    return image

def main():
    """Genera todos los iconos"""
    # Crear carpeta icons si no existe
    if not os.path.exists('icons'):
        os.makedirs('icons')
    
    print("Generando iconos PWA...")
    
    for size in sizes:
        icon = create_icon(size)
        filename = f'icons/icon-{size}x{size}.png'
        icon.save(filename, 'PNG')
        print(f"✓ Generado: {filename}")
    
    print("\n¡Iconos generados exitosamente!")
    print("Los iconos están en la carpeta 'icons/'")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("Error: Pillow no está instalado.")
        print("Instala Pillow con: pip install pillow")
        print("\nAlternativamente, puedes:")
        print("1. Abrir generate-icons.html en tu navegador")
        print("2. Hacer clic en 'Generar y Descargar Iconos'")
        print("3. Mover los archivos descargados a la carpeta 'icons/'")
