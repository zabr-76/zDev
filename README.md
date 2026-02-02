# ⚡ zDev Framework v2.0

> Micro-framework reactivo sin Virtual DOM - Reactividad simplificada para todos

[![Size](https://img.shields.io/badge/size-%3C10KB%20gzip-brightgreen.svg )](https://github.com/zabr-76/zDev )
[![Version](https://img.shields.io/badge/version-2.0-blue.svg )](https://github.com/zabr-76/zDev )
[![License](https://img.shields.io/badge/license-MIT-green.svg )](LICENSE)

## 🚀 Características

- **⚡ Zero Dependencies** - Solo JavaScript vanilla
- **🎯 Sin Virtual DOM** - Trabaja directamente con el DOM real
- **🔄 Reactividad Real** - Signals con suscripción automática
- **🎨 useComputed** - Clases dinámicas sin complejidad
- **📱 Mobile First** - Diseñado para apps modernas
- **🧭 Router Enterprise** - History API + navegación SPA completa
- **📦 ~10KB gzip** - Extremadamente ligero

## 📦 Instalación

### Módulos ES6 (Recomendado)

```javascript
import zDev from './utils/zdev.js';
const { useSignal, useComputed, html, renderReactive, useEffect, useRouter, useForm, useDebounce } = zDev;
```

### CDN (Prototipado Rápido)

```html
<script type="module">
  import zDev from 'https://cdn.jsdelivr.net/gh/zabr-76/zdev@latest/zdev.js';
</script>
```

### Estructura de Proyecto

```text
mi-app/
├── index.html
├── main.js
├── style.css
├── utils/
│   └── zdev.js          # Framework core
├── pages/
│   ├── home.js
│   ├── about.js
│   └── dashboard.js
└── components/
    ├── header.js
    ├── sidebar.js
    └── chat.js
```

## 🎯 Primeros Pasos

```javascript
const { html, renderReactive, useSignal, useComputed, useEffect } = zDev;

const App = () => {
  const [count, setCount] = useSignal(0);
  const [isVip, setIsVip] = useSignal(false);
  
  // Clase dinámica con useComputed
  const cardClass = useComputed(() => 
    isVip() ? 'card vip' : 'card'
  );

  // Efecto con cleanup
  useEffect(() => {
    console.log('Count cambió a:', count());
    const timer = setTimeout(() => console.log('Debounce effect'), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  return html`
    <div class="${cardClass}">           <!-- ✅ Atributo: sin () => -->
      <h1>Visitas: ${() => count()}</h1> <!-- ✅ Texto: con () => -->
      
      ${() => isVip() && html`           <!-- ✅ Condicional: con () => -->
        <span class="badge">VIP</span>
      `}
      
      <button onclick=${() => setCount(c => c + 1)}>
        Incrementar
      </button>
    </div>
  `;
};

renderReactive('#app', App);
```

## 🔥 Novedades v2.0

### useEffect Mejorado - Performance Enterprise

```javascript
// Antes (v1.x): Usaba JSON.stringify para comparar deps (lento)
// Ahora (v2.0): Tracking nativo de señales con WeakMap

useEffect(() => {
  // Se ejecuta solo cuando 'user' cambia de valor
  fetchUserData(user());
  return () => cancelRequest();
}, [user]); // user es una señal - comparación por referencia, no por JSON
```

### useRouter - SPA Enterprise Grade

```javascript
const router = useRouter([
  { route: '/', component: HomePage },
  { route: '/user/:id', component: UserProfile },
  { route: '/dashboard/*', component: Dashboard },
  { route: '*', component: NotFound }
], { type: 'history' }); // History API (no hash)

// Uso
router.navigate('/user/123');
router.navigate('/user/:id', { params: { id: 456 } });
router.back();

// En template
html`<a href="/about" onclick=${(e) => { e.preventDefault(); router.navigate('/about'); }}>About</a>`
```

### useForm - Manejo de Formularios Completo

```javascript
const form = useForm({
  initialValues: { email: '', password: '' },
  validate: {
    email: [
      useForm.validators.required('Email requerido'),
      useForm.validators.email('Email inválido')
    ],
    password: useForm.validators.minLength(6, 'Mínimo 6 caracteres')
  },
  onSubmit: async (values) => {
    await api.login(values);
  }
});

// En template
html`
  <form onsubmit=${form.handleSubmit}>
    <input type="email" ...${form.register('email')} />
    ${() => form.errors().email && html`<span class="error">${form.errors().email}</span>`}
    
    <input type="password" ...${form.register('password')} />
    
    <button type="submit" disabled=${() => form.isSubmitting()}>
      ${() => form.isSubmitting() ? 'Enviando...' : 'Enviar'}
    </button>
  </form>
`
```

### useDebounce - Inputs de Búsqueda

```javascript
const [search, setSearch] = useSignal('');
const debouncedSearch = useDebounce(search, 300);

// Solo busca después de 300ms sin escribir
useEffect(() => {
  performSearch(debouncedSearch());
}, [debouncedSearch]);
```

## 📚 API Core

### useSignal(initialValue)
```javascript
const [value, setValue] = useSignal(0);
console.log(value());        // Leer
setValue(5);                 // Escribir
setValue(v => v + 1);        // Basado en anterior
```

### useComputed(getter)
```javascript
const fullName = useComputed(() => 
  firstName() + ' ' + lastName()
);
// Uso: class="${fullName}" (sin () =>)
```

### useEffect(fn, [deps])
```javascript
useEffect(() => {
  console.log('Efecto');
  return () => console.log('Cleanup');
}, [dependency]);
```

### useRouter(routes, options)
```javascript
const { navigate, RouterView, back, params, query } = useRouter([
  { route: '/', component: Home },
  { route: '/user/:id', component: User }
], { type: 'history', base: '/app' });
```

### useForm(config)
```javascript
const { values, errors, handleSubmit, register, reset } = useForm({
  initialValues: {},
  validate: {},
  onSubmit: fn
});
```

### useDebounce(value, delay)
```javascript
const debounced = useDebounce(signal, 300);
```

### html`...` - Template literals reactivos
```javascript
const view = html`
  <div class="${dynamicClass}">
    ${() => dynamicContent()}
  </div>
`;
```

### List(items, renderFn, keyFn)
```javascript
${List(
  todos,
  (todo) => html`<li>${todo.text}</li>`,
  (todo) => todo.id
)}
```

### useStyle(css)
```javascript
useStyle(`
  .app { padding: 20px; }
  .dark { background: #333; }
`);
```

## 🏗️ Mejores Prácticas

### ✅ Separa en Componentes

```javascript
// ✅ Bien: Componentes aislados
const ItemList = () => html`
  <div>
    ${List(items, ItemComponent, item => item.id)}
  </div>
`;

const ItemComponent = (item) => {
  const itemClass = useComputed(() => 
    item.active ? 'item active' : 'item'
  );
  
  return html`
    <div class="${itemClass}">
      ${item.name}
    </div>
  `;
};
```

### ✅ useComputed para Atributos

```javascript
const buttonClass = useComputed(() => 
  isPrimary() ? 'btn primary' : 'btn'
);

return html`
  <button class="${buttonClass}">
    Click
  </button>
`;
```

### ✅ Cleanup en useEffect

```javascript
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal });
  return () => controller.abort();
}, [url]);
```

### ✅ Router Cleanup

```javascript
const router = useRouter(routes);

// En unmount o cambio de layout
window.addEventListener('beforeunload', () => {
  router.cleanup();
});
```

## 🎮 Demo

Aplicación de chat completa incluida en `/demo`:
- ✅ Chat en tiempo real
- 🎨 Clases dinámicas con useComputed
- 📱 Diseño responsive
- 💬 Scroll suave con animaciones
- 🔄 Estados reactivos complejos
- 🧭 Navegación SPA con useRouter

```bash
cd demo/
python -m http.server 8000
# Abre http://localhost:8000
```

## 📝 Licencia

MIT - Creado por **Zenón A. Bastidas R.** (2018-2024)

---

<div align="center">
  <p><strong>zDev v2.0</strong> - Reactividad sin complejidad 🚀</p>
</div>

---
