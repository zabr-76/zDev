# ⚡ zDev Framework

> Micro-framework reactivo sin Virtual DOM - Creado para facilitar la programación a usuarios novatos

[![Size](https://img.shields.io/badge/size-%3C9KB%20gzip-brightgreen.svg)](https://github.com/zabr-76/zDev)
[![Version](https://img.shields.io/badge/version-1.2-blue.svg)](https://github.com/zabr-76/zDev)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🚀 Características

- **⚡ Zero Dependencies** - No necesitas nada más que el archivo zDev
- **🎯 Sin Virtual DOM** - Trabaja directamente con el DOM real
- **📱 Mobile First** - Diseñado para aplicaciones móviles modernas
- **💾 Estado Persistente** - useStorage integrado con localStorage
- **🌓 Temas** - useTheme para cambio automático claro/oscuro
- **📝 Notificaciones** - useToast para mensajes elegantes
- **⏰ Time Ago** - Formato de tiempo humano automático
- **🔗 Enrutamiento** - useRouter para SPA sin complicaciones
- **📦 < 9KB gzip** - Extremadamente ligero

## 📦 Instalación

### Opción 1: Descarga Directa

Descarga `zdev.js` y colócalo en tu proyecto:

```html
<script src="zdev.js"></script>
```

### Opción 2: ES Modules

```javascript
import zDev from './dist/zdev.module.js';
```

### Opción 3: CDN (Próximamente)

```html
<script src="https://cdn.jsdelivr.net/npm/zdev/zdev.min.js"></script>
```

## 🎯 Primeros Pasos

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mi Primera App con zDev</title>
  <script src="zdev.js"></script>
</head>
<body>
  <div id="app"></div>
  
  <script>
    const { html, render, useState } = zDev;
    
    function App() {
      const [count, setCount] = useState(0);
      
      return html\`
        &lt;div&gt;
          &lt;h1&gt;Contador: ${count()}&lt;/h1&gt;
          &lt;button onclick=${() => setCount(count() + 1)}&gt;
            Incrementar
          &lt;/button&gt;
        &lt;/div&gt;
      \`;
    }
    
    render('#app', App);
  &lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;
```

## 📚 Documentación

Visita la [documentación completa](https://yourusername.github.io/zdev/) para:

- ✅ Guía de inicio rápido
- 📖 Referencia de API completa
- 💡 Ejemplos y tutoriales
- 🎯 Mejores prácticas
- 🔧 Solución de problemas

## 🎮 Demo en Vivo

Prueba la aplicación de chat de demostración:

**[🚀 Ver Demo en Vivo](https://yourusername.github.io/zdev/demo/)**

La demo incluye:
- ✅ Chat en tiempo real con persistencia
- 🌓 Cambio de temas claro/oscuro
- 💾 Almacenamiento automático
- 📝 Notificaciones toast
- 📱 Diseño responsive
- ⚡ 100% zDev, 0% Vanilla JS

## 🔌 API Rápida

### useState - Estado Reactivo

```javascript
const [value, setValue] = useState(initialValue);
```

### useEffect - Efectos Secundarios

```javascript
useEffect(() => {
  // Tu efecto aquí
  return () => {
    // Cleanup opcional
  };
}, [dependencies]);
```

### useStorage - Persistencia Automática

```javascript
const [data, setData] = useStorage('key', initialValue);
// ¡Los datos se guardan automáticamente!
```

### useTheme - Temas Claro/Oscuro

```javascript
const [theme, toggleTheme] = useTheme();
// theme() → 'light' o 'dark'
```

### useToast - Notificaciones

```javascript
const toast = useToast();
toast.success('¡Operación completada!');
toast.error('Algo salió mal');
```

### html - Plantillas Reactivas

```javascript
const element = html\`
  &lt;div&gt;
    &lt;h1&gt;Hello ${name()}&lt;/h1&gt;
    &lt;button onclick=${handler}&gt;Click me&lt;/button&gt;
  &lt;/div&gt;
\`;
```

## 🏗️ Hooks Disponibles

- `useState` / `useSignal` - Estado reactivo
- `useEffect` - Efectos secundarios
- `useStorage` - Estado persistente (localStorage)
- `useSessionStorage` - Estado de sesión
- `useTheme` - Gestión de temas
- `useToast` - Notificaciones
- `useTimeAgo` - Formato de tiempo humano
- `useRouter` - Enrutamiento SPA
- `useFetch` - Peticiones HTTP
- `useDevice` - Detección de dispositivo
- `useMedia` - Media queries reactivas
- `useRef` - Referencias a elementos
- `useTimeout` - Temporizadores
- `useClickOutside` - Detección de clics externos
- `useStyle` - Estilos dinámicos

## 📱 Aplicación de Ejemplo

```bash
cd demo/
python -m http.server 8000
# Abre http://localhost:8000
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! 🎉

1. 🍴 Haz fork del proyecto
2. 🌿 Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. 💻 Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push a la branch (`git push origin feature/AmazingFeature`)
5. 🔄 Abre un Pull Request

### Áreas de Contribución

- 🐛 Reportar bugs
- 💡 Sugerir nuevas características
- 📚 Mejorar documentación
- 🎨 Crear ejemplos y demos
- 🔧 Optimizar rendimiento
- 🧪 Escribir tests

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Agradecimientos

- Creado por **Zenón A. Bastidas R.** en 2018
- Inspirado en la simplicidad de frameworks reactivos
- Diseñado para principiantes y desarrolladores experimentados

## 📊 Especificaciones

- **Tamaño:** < 9KB gzip
- **Dependencias:** 0
- **Browser Support:** Modern browsers (ES6+)
- **License:** MIT
- **Version:** 1.2

---

<div align="center">
  <p>
    <strong>zDev</strong> - Haz que la programación reactiva sea accesible para todos 🚀
  </p>
  <p>
    <a href="https://yourusername.github.io/zdev/">📚 Documentación</a> •
    <a href="https://yourusername.github.io/zdev/demo/">🎮 Demo</a> •
    <a href="https://github.com/zabr-76/zDev">⭐ GitHub</a>
  </p>
</div>