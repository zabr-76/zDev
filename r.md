# ⚡ zDev Framework v2.0

> Micro-framework reactivo sin Virtual DOM - Reactividad simplificada para todos

[![CDN Core](https://cdn.jsdelivr.net/gh/zabr-76/zDev@latest/dist/zdev-core.js)](https://cdn.jsdelivr.net/gh/zabr-76/zDev@latest/dist/zdev-core.js)
[![Size](https://img.shields.io/badge/size-3KB%20core-brightgreen.svg)](https://github.com/zabr-76/zDev)
[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/zabr-76/zDev)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🚀 Características

- **⚡ Zero Dependencies** - Solo JavaScript vanilla
- **🎯 Sin Virtual DOM** - DOM real con reactividad fina
- **🔄 Signals Nativos** - Suscripción automática 60fps
- **🎨 useComputed** - Clases/Styles dinámicos sin `() =>`
- **📦 3KB Core** - React DX en tamaño Svelte
- **📱 Mobile-First** - ListVirtual + Swipe gestures
- **🧭 Router SPA** - History API enterprise
- **🎮 Capas Tree-shake** - Elige solo lo que usas

## 📦 Instalación CDN (0 Config)

### **1. Core Esencial (Páginas estáticas)**
```html
<script src="https://cdn.jsdelivr.net/gh/zabr-76/zDev@latest/dist/zdev-core.js"></script>
```

### **2. Web Completa (SPA)**
```html
<script src="https://cdn.jsdelivr.net/gh/zabr-76/zDev@latest/dist/zdev-core.js"></script>
<script src="https://cdn.jsdelivr.net/gh/zabr-76/zDev@latest/dist/zdev-hooks.js"></script>
```

### **3. MAGIC 1-Línea (Todo zDev)**
```html
<script src="https://cdn.jsdelivr.net/gh/zabr-76/zDev@latest/dist/zdev.all.js"></script>
```

## 🎯 Primeros Pasos

```html
<!DOCTYPE html>
<html>
<head>
    <!-- 🔥 1 Línea = zDev Completo -->
    <script src="https://cdn.jsdelivr.net/gh/zabr-76/zDev@latest/dist/zdev.all.js"></script>
</head>
<body>
    <div id="app"></div>
    <script type="module">
        // ✅ TODO en window.zDev!
        const { html, useSignal, useComputed, renderReactive } = window.zDev;
        
        const App = () => {
            const [count, setCount] = useSignal(0);
            const [isVip, setIsVip] = useSignal(false);
            
            // 🔥 Clase dinámica (SIN () =>)
            const cardClass = useComputed(() => 
                isVip() ? 'card vip' : 'card'
            );
            
            return html`
                <div class=${cardClass}>
                    <h1>Visitas: ${count()}</h1>
                    
                    <!-- 🔥 Condicional reactivo -->
                    ${() => isVip() && html`
                        <span class="badge">⭐ VIP</span>
                    `}
                    
                    <div style="display: flex; gap: 10px;">
                        <button onclick=${() => setCount(c => c + 1)}>
                            +1
                        </button>
                        <button onclick=${() => setIsVip(v => !v)}>
                            ${() => isVip() ? 'Quitar VIP' : 'Hacer VIP'}
                        </button>
                    </div>
                </div>
            `;
        };
        
        renderReactive('#app', App);
    </script>
</body>
</html>
```

## 📦 Capas zDev (Tree-shake Manual)

| Archivo | Bundle | Para... |
|---------|--------|---------|
| `zdev-core.js` | **3KB** | Páginas estáticas |
| `+ zdev-hooks.js` | **8KB** | SPA Web/Desktop |
| `zdev.all.js` | **12KB** | Apps completas |

## 🔥 Hooks Completos + Ejemplos

### **useSignal** - Estado Reactivo
```javascript
const [count, setCount] = useSignal(0);
const [user, setUser] = useSignal(null);

setCount(c => c + 1);  // Updater function
setUser({ name: 'Zenon' });
console.log(count(), user().name);  // Leer
```

### **useComputed** - Valores Derivados
```javascript
const isEven = useComputed(() => count() % 2 === 0);
const fullName = useComputed(() => `${first()} ${last()}`);

html`<div class=${isEven ? 'even' : 'odd'}>${fullName}</div>`;
```

### **useEffect** - Side Effects
```javascript
useEffect(() => {
    document.title = `Count: ${count()}`;
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);  // Cleanup
}, [count]);
```

### **useRouter** - SPA Navigation
```javascript
const router = useRouter([
    { route: '/', component: Home },
    { route: '/user/:id', component: UserProfile },
    { route: '*', component: NotFound }
]);

// Uso
router.navigate('/user/123');
html`<a onclick=${(e) => { e.preventDefault(); router.navigate('/about'); }}>About</a>`;
```

### **useForm** - Formularios Reactivos
```javascript
const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
        email: [useForm.validators.required(), useForm.validators.email()],
        password: useForm.validators.minLength(6)
    }
});

html`
    <form onsubmit=${form.handleSubmit}>
        <input ...${form.register('email')} />
        ${() => form.errors().email && html`<span>${form.errors().email}</span>`}
        <button disabled=${() => form.isSubmitting()}>
            ${() => form.isSubmitting() ? 'Enviando...' : 'Login'}
        </button>
    </form>
`;
```

### **useToast** - Notificaciones
```javascript
const toast = useToast();
toast.success('¡Usuario creado!');
toast.error('Error de red');
html`<button onclick=${() => toast.info('Hola!')}>Notificar</button>`;
```

### **useStorage** - Persistencia
```javascript
const settings = useStorage('app-settings', { theme: 'light' });
const cart = useStorage('cart', []);
```

### **ListVirtual** - Listas Grandes
```javascript
${ListVirtual(
    messages,                    // 500+ mensajes
    (msg) => html`<div>${msg.text}</div>`,
    (msg) => msg.id,
    { height: '400px', itemHeight: 60 }
)}
```

## 🏗️ Estructura de Proyecto Recomendada

```text
mi-app/
├── index.html
├── main.js
├── style.css
├── components/
│   ├── Chat.js
│   ├── Header.js
│   └── UserCard.js
└── pages/
    ├── Home.js
    ├── Profile.js
    └── Dashboard.js
```

**main.js:**
```javascript
const { html, renderReactive } = window.zDev;
import './components/Chat.js';
import './pages/Home.js';

renderReactive('#app', App);
```

## 🎮 Live Demos

- [💬 Chat WhatsApp (500+ msgs)](https://zabr-76.github.io/zDev/demo/chat.html)
- [🎨 Class/Style Reactivo](https://zabr-76.github.io/zDev/demo/class-style.html)
- [📱 Lista Virtual 1000 items](https://zabr-76.github.io/zDev/demo/list-virtual.html)

## 🆚 Benchmarks

| Framework | Bundle | Signals | Mobile | DX |
|-----------|--------|---------|--------|----|
| **React 19** | 42KB | ❌ | ❌ | ⭐⭐⭐ |
| **Preact** | 10KB | ❌ | ❌ | ⭐⭐⭐ |
| **Svelte** | 4KB | ✅ | ❌ | ⭐⭐ |
| **zDev** | **3KB** | ✅ | ✅ | **⭐⭐⭐⭐⭐** |

## 📝 Licencia
MIT © **Zenón A. Bastidas R.** (2018-2026)

---

<div align="center">
    <p><strong>zDev v2.0</strong> - <em>Reactividad sin complejidad</em> 🚀</p>
    <a href="https://cdn.jsdelivr.net/gh/zabr-76/zDev@latest/dist/zdev.all.js">🚀 Probar CDN</a>
</div>


