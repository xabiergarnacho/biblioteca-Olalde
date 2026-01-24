# Guía de Instalación PWA - Biblioteca Olalde

## ✅ Configuración Completada

### 1. Manifest.json ✅
El archivo `public/manifest.json` ya está configurado correctamente con:
- **Name**: "Biblioteca Olalde"
- **Short Name**: "Olalde"
- **Background Color**: "#FDFCF8"
- **Theme Color**: "#1A1A1A"
- **Display**: "standalone" (quita la barra de Safari)

### 2. Meta Tags iOS ✅
Los meta tags necesarios ya están en `src/app/layout.tsx`:
- `apple-mobile-web-app-capable`
- `apple-mobile-web-app-status-bar-style`
- `apple-mobile-web-app-title`
- `apple-touch-icon`

### 3. Dependencias ✅
- `next-pwa` ya está instalado (aunque desactivado por compatibilidad con Turbopack)

## 📱 Iconos Requeridos

Para que la PWA funcione completamente, necesitas crear estos iconos en la carpeta `public/`:

### Iconos Obligatorios:
1. **`icon-192.png`** (192x192px)
   - Para Android y iOS
   - Usado en el manifest.json

2. **`icon-512.png`** (512x512px)
   - Para Android (alta resolución)
   - Usado en el manifest.json

3. **`apple-touch-icon.png`** (180x180px) - OPCIONAL pero recomendado
   - Para iOS específicamente
   - Si no existe, iOS usará icon-192.png

### Cómo Generar los Iconos:

**Opción 1: Desde tu logo SVG**
```bash
# Si tienes ImageMagick instalado
convert logo-olalde.svg -resize 192x192 icon-192.png
convert logo-olalde.svg -resize 512x512 icon-512.png
convert logo-olalde.svg -resize 180x180 apple-touch-icon.png
```

**Opción 2: Herramientas Online**
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- Sube tu logo y genera todos los tamaños automáticamente

**Opción 3: Editor de Imágenes**
- Abre `/public/logo-olalde.svg` en Photoshop/GIMP/Figma
- Exporta como PNG en los tamaños requeridos
- Guarda en `/public/`

### Estructura Final de Archivos:
```
public/
  ├── manifest.json ✅ (ya existe)
  ├── icon-192.png ⚠️ (necesitas crearlo)
  ├── icon-512.png ⚠️ (necesitas crearlo)
  └── apple-touch-icon.png ⚠️ (opcional pero recomendado)
```

## 🔧 Configuración Next.js

El archivo `next.config.ts` está configurado para funcionar con Turbopack. 

**Nota**: `next-pwa` está desactivado porque no es compatible con Turbopack en Next.js 16. La app **SÍ es instalable** sin service worker, solo necesita el manifest.json y los iconos.

## 📲 Cómo Instalar la PWA

### En iOS (Safari):
1. Abre la web en Safari
2. Toca el botón "Compartir" (cuadrado con flecha)
3. Selecciona "Añadir a pantalla de inicio"
4. La app aparecerá como un icono en tu pantalla de inicio

### En Android (Chrome):
1. Abre la web en Chrome
2. Verás un banner "Agregar a pantalla de inicio"
3. O usa el menú (3 puntos) → "Instalar aplicación"
4. La app se instalará como una app nativa

### En Desktop (Chrome/Edge):
1. Abre la web en Chrome o Edge
2. Verás un icono de "Instalar" en la barra de direcciones
3. Haz clic y la app se instalará como aplicación de escritorio

## ✅ Checklist de Verificación

- [x] manifest.json configurado
- [x] Meta tags iOS en layout.tsx
- [x] next-pwa instalado (aunque desactivado)
- [ ] **icon-192.png creado** ⚠️
- [ ] **icon-512.png creado** ⚠️
- [ ] apple-touch-icon.png creado (opcional)

## 🚀 Una vez tengas los iconos:

1. Colócalos en `/public/`
2. Haz `npm run build`
3. Despliega en producción
4. Prueba la instalación en tu dispositivo

¡La PWA estará lista para instalar! 📱
