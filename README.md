# ⚡ zDev Framework v2.0

> Micro-framework reactivo sin Virtual DOM - Reactividad simplificada para todos

[![Size](https://img.shields.io/badge/size-%3C10KB%20gzip-brightgreen.svg)](https://github.com/zabr-76/zDev)
[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/zabr-76/zDev)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🚀 Características

- **⚡ Zero Dependencies** - Solo JavaScript vanilla
- **🎯 Sin Virtual DOM** - Trabaja directamente con el DOM real
- **🔄 Reactividad Real** - Signals con suscripción automática
- **🎨 useComputed** - Clases dinámicas sin complejidad
- **📱 Mobile First** - Diseñado para apps modernas
- **📦 ~10KB gzip** - Extremadamente ligero

## 📦 Instalación

```html
<script src="zdev.js"></script>
```

## 🎯 Primeros Pasos

```javascript
const { html, renderReactive, useSignal, useComputed } = zDev;

const App = () => {
  const [count, setCount] = useSignal(0);
  const [isVip, setIsVip] = useSignal(false);
  
  // Clase dinámica con useComputed
  const cardClass = useComputed(() => 
    isVip() ? 'card vip' : 'card'
  );

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

### useComputed - Clases Dinámicas Simplificadas

```javascript
// Antes (v1.x):
class="${() => isActive() ? 'active' : ''}"

// Ahora (v2.0):
const itemClass = useComputed(() => isActive() ? 'active' : '');
// ...
class="${itemClass}"  // Más limpio, mejor performance
```

### Reglas de Reactividad Claras

| Contexto | Sintaxis | Ejemplo |
|----------|----------|---------|
| **Atributos HTML** | `${signal}` | `class="${itemClass}"` |
| **Texto/Contenido** | `${() => signal()}` | `Count: ${() => count()}` |
| **Condicionales** | `${() => cond && html``}` | `${() => show() && html`...`}` |

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
  (todo) => TodoItem(todo),
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

Evita mezclar `List()` con lógica reactiva compleja en el mismo template:

```javascript
// ❌ Mal: Todo junto causa bugs
const App = () => html`
  <div>
    ${List(items, Item, i => i.id)}
    ${() => { /* lógica que se mezcla con List */ }}
  </div>
`;

// ✅ Bien: Componentes aislados
const App = () => html`
  <div>
    ${ItemList()}
    ${ActiveDetail()}  // Separado, no se mezcla
  </div>
`;
```

### ✅ useComputed para Atributos

```javascript
const buttonClass = useComputed(() => 
  isPrimary() ? 'btn primary' : 'btn'
);

return html`
  <button class="${buttonClass}">  <!-- Sin () => -->
    Click
  </button>
`;
```

### ✅ Funciones Flecha para Contenido

```javascript
return html`
  <div>
    ${() => userName()}           <!-- Texto dinámico -->
    ${() => isAdmin() && html`   <!-- Condicional -->
      <span>Admin</span>
    `}
  </div>
`;
```

## 🎮 Demo

Aplicación de chat completa incluida en `/demo`:
- ✅ Chat en tiempo real
- 🎨 Clases dinámicas con useComputed
- 📱 Diseño responsive
- 💬 Scroll suave con animaciones
- 🔄 Estados reactivos complejos

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
```
