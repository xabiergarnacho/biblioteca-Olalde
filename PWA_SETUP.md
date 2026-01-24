# Guía de Configuración PWA - Biblioteca Olalde

## ✅ Configuración Completada

### 1. Archivos Creados/Modificados:
- ✅ `public/manifest.json` - Manifest de la PWA
- ✅ `next.config.ts` - Configuración de next-pwa
- ✅ `src/app/layout.tsx` - Meta tags SEO y iOS

### 2. Iconos Necesarios

Para completar la PWA, necesitas crear los siguientes iconos en la carpeta `public/`:

#### Iconos Requeridos:
- `icon-192.png` (192x192px) - Icono para Android y iOS
- `icon-512.png` (512x512px) - Icono grande para Android
- `og-image.png` (1200x630px) - Imagen para compartir en redes sociales

#### Cómo Generar los Iconos:

**Opción 1: Usar el logo existente**
1. Abre `/public/logo-olalde.svg` en un editor de imágenes
2. Exporta como PNG en los tamaños requeridos
3. Coloca los archivos en `/public/`

**Opción 2: Usar herramientas online**
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- Sube tu logo y genera todos los tamaños automáticamente

**Opción 3: Usar ImageMagick (línea de comandos)**
```bash
# Si tienes ImageMagick instalado
convert logo-olalde.svg -resize 192x192 icon-192.png
convert logo-olalde.svg -resize 512x512 icon-512.png
```

### 3. Variable de Entorno (Opcional)

Si quieres que los metadatos OpenGraph usen tu URL real, crea/actualiza `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

### 4. Probar la PWA

#### En Desarrollo:
```bash
npm run build
npm start
```

#### En Producción:
1. Despliega en Vercel/Netlify
2. Abre en Chrome/Edge móvil
3. Verás el banner "Agregar a pantalla de inicio"
4. O usa el menú del navegador → "Instalar aplicación"

#### Verificar PWA:
- Chrome DevTools → Application → Manifest
- Lighthouse → PWA audit
- https://www.pwabuilder.com/

### 5. Características PWA Implementadas

✅ **Instalable**: La app se puede instalar en móviles y escritorio
✅ **Offline**: next-pwa configura service worker automáticamente
✅ **Standalone**: Se abre sin barra del navegador en móviles
✅ **SEO Optimizado**: Meta tags completos para compartir
✅ **iOS Ready**: Meta tags específicos para Safari iOS

### 6. Notas Importantes

- **next-pwa está desactivado en desarrollo** para evitar problemas
- Los iconos son **obligatorios** para que la PWA funcione correctamente
- El manifest.json ya está configurado y listo
- Los meta tags de iOS están en el `<head>` del layout

### 7. Próximos Pasos

1. Genera los iconos (icon-192.png, icon-512.png)
2. Crea og-image.png para compartir en redes sociales
3. Haz build y prueba en producción
4. Verifica con Lighthouse PWA audit

¡Listo para instalar! 📱
