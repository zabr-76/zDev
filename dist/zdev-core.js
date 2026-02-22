// zDev Core v2.0 - 8kB mín. reactividad fina-grained
// Solo lo esencial para estado + templates reactivos

const log = (...args) => window.ZDEV_DEBUG && console.log('%c[zDev]', 'color: #00a884; font-weight: bold;', ...args);

let currentEffect = null;
const effectStack = [];

function ListVirtual(items, renderItem, options = {}) {
    const {
        overscan = 3,
            containerHeight = 400
    } = options;

    const wrapper = document.createElement('div');
    wrapper.style.height = typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight;
    wrapper.style.overflow = 'auto';
    wrapper.style.position = 'relative';

    const content = document.createElement('div');
    content.style.position = 'relative';

    const visibleNodes = new Map();
    const heightCache = new Map();

    const getItemHeight = (index) => heightCache.get(index) || 60;

    const getOffsetTop = (index) => {
        let offset = 0;
        for (let i = 0; i < index; i++) {
            offset += getItemHeight(i);
        }
        return offset;
    };

    const getTotalHeight = () => {
        const list = typeof items === 'function' ? items() : items;
        let total = 0;
        for (let i = 0; i < list.length; i++) {
            total += getItemHeight(i);
        }
        return total;
    };

    const update = () => {
        const list = typeof items === 'function' ? items() : items;
        const scrollTop = wrapper.scrollTop;

        const viewportHeight = wrapper.clientHeight;

        let accumulated = 0;
        let startIdx = 0;
        for (let i = 0; i < list.length; i++) {
            if (accumulated + getItemHeight(i) > scrollTop) {
                startIdx = Math.max(0, i - overscan);
                break;
            }
            accumulated += getItemHeight(i);
        }

        accumulated = 0;
        let endIdx = list.length - 1;
        for (let i = 0; i < list.length; i++) {
            accumulated += getItemHeight(i);
            if (accumulated > scrollTop + viewportHeight) {
                endIdx = Math.min(list.length - 1, i + overscan);
                break;
            }
        }

        for (const [idx, data] of visibleNodes) {
            if (idx < startIdx || idx > endIdx) {
                if (data.node && data.node.offsetHeight > 0) {
                    heightCache.set(idx, data.node.offsetHeight);
                }
                if (data.node && data.node.parentNode) {
                    data.node.parentNode.removeChild(data.node);
                }
                visibleNodes.delete(idx);
            }
        }

        for (let i = startIdx; i <= endIdx; i++) {
            if (!list[i]) continue;

            const offsetTop = getOffsetTop(i);

            if (!visibleNodes.has(i)) {
                const result = renderItem(list[i], i);

                let node;
                if (result instanceof DocumentFragment) {
                    node = result.firstElementChild || result.firstChild;
                } else if (result instanceof Node) {
                    node = result;
                } else {
                    continue;
                }

                if (!node) continue;

                node.style.position = 'absolute';
                node.style.top = `${offsetTop}px`;
                node.style.left = '0';
                node.style.right = '0';

                content.appendChild(node);
                visibleNodes.set(i, {
                    node,
                    top: offsetTop
                });

                requestAnimationFrame(() => {
                    const realHeight = node.offsetHeight;
                    if (realHeight > 0 && realHeight !== heightCache.get(i)) {
                        heightCache.set(i, realHeight);
                        content.style.height = `${getTotalHeight()}px`;
                        repositionFrom(i + 1);
                    }
                });

            } else {
                const data = visibleNodes.get(i);
                if (Math.abs(data.top - offsetTop) > 1) {
                    data.node.style.top = `${offsetTop}px`;
                    data.top = offsetTop;
                }
            }
        }

        content.style.height = `${getTotalHeight()}px`;
    };

    const repositionFrom = (startIndex) => {
        let offset = getOffsetTop(startIndex);
        for (let i = startIndex; i < startIndex + 20; i++) {
            const data = visibleNodes.get(i);
            if (data) {
                data.node.style.top = `${offset}px`;
                data.top = offset;
                offset += data.node.offsetHeight || getItemHeight(i);
            } else {
                offset += getItemHeight(i);
            }
        }
    };

    // 🔥 SCROLL INSTANTÁNEO - sin suavizado
    wrapper.scrollToBottom = () => {
        wrapper.scrollTop = wrapper.scrollHeight;
    };

    wrapper.appendChild(content);
    wrapper.addEventListener('scroll', update);


    if (typeof items === 'function' && items.subscribe) {
        items.subscribe(() => {
            update();
        });
    }

    update();
    return wrapper;
}

function html(strings, ...values) {
    log(`[html] 🚀 Iniciando función html con ${strings.length} strings y ${values.length} valores`);

    let result = '';
    const nodeMarkers = [];
    const eventMap = new Map();
    const reactiveBindings = [];
    const unsubscribes = [];
    let nodeCounter = 0;
    let eventCounter = 0;
    let attrCounter = 0;

    for (let i = 0; i < strings.length; i++) {
        result += strings[i];
        if (i < values.length) {
            const val = values[i];
            log(`[html] 📊 Procesando valor ${i}:`, val, `Tipo:`, typeof val, `¿Tiene subscribe?:`, val && typeof val.subscribe === 'function');

            if (val === null || val === undefined || val === false) {
                log(`[html] ⏭️  Saltando valor nulo/undefined/false`);
                continue;
            }

            // 🎨 FIX: Detectar contexto de atributo correctamente
            const lastChunk = strings[i];
            const attrContextMatch = lastChunk.match(/(\w+)\s*=\s*["']?$/);
            const isAttrContext = attrContextMatch !== null;

            // 🔥 ANTES de procesar val, detectar ESPECIAL value/disabled  
            if (typeof val === 'function' && val.subscribe) {
                const attrMatch = lastChunk.match(/(\w+)\s*=\s*$/); // ✅ 
                log(`[html] 🔍 DEBUG attrMatch para "${lastChunk.slice(-20)}":`, attrMatch ? attrMatch[1] : 'NULL');
                if (attrMatch) {
                    const attrName = attrMatch[1].toLowerCase();
                    log(`[html] 🔍 attrName detectado: "${attrName}"`);
                    if (['value', 'disabled', 'checked', 'selected', 'readonly', 'required', 'multiple', 'class', 'style'].includes(attrName)) {
                        log(`[html] 🎯 ${attrName.toUpperCase()} ESPECIAL detectado`);
                        const placeholder = `zdev_${attrName}_${attrCounter++}`;
                        result += `${placeholder}"`;

                        reactiveBindings.push({
                            type: 'input-special',
                            attrName,
                            placeholder,
                            getValue: val,
                            isBoolean: ['disabled', 'checked', 'selected', 'readonly', 'required', 'multiple'].includes(attrName),
                            isClass: attrName === 'class',
                            isStyle: attrName === 'style'
                        });
                        continue;

                    } else {
                        log(`[html] ❌ attrName "${attrName}" NO es input-special`);
                    }
                } else {
                    log(`[html] ❌ NO match attr en "${lastChunk}"`);
                }

                // Resto signals texto/reactivo igual...
                if (!isAttrContext) {
                    log(`[html] 📝 Detectando SIGNAL para texto reactivo puro...`);
                    const key = `REACTIVE_TEXT_${nodeCounter++}`;
                    result += `<!--${key}-->`;
                    reactiveBindings.push({
                        key,
                        getValue: val,
                        type: 'reactive-text'
                    });
                    continue;
                }
            }

            if (val instanceof Node || val instanceof DocumentFragment) {
                const key = `NODE_${nodeCounter++}`;
                nodeMarkers.push({
                    key,
                    node: val
                });
                result += `<!--${key}-->`;
            } else if (typeof val === 'function') {
                const eventMatch = lastChunk.match(/on(\w+)=\s*["']?$/);

                if (eventMatch) {
                    const eventName = eventMatch[1];
                    const key = `ev_${eventCounter++}`;
                    // 🔥 FIX: Guardar la función con su scope cerrado correctamente
                    eventMap.set(key, val);
                    result = result.slice(0, -eventMatch[0].length);
                    result += `zdev-on${eventName}="${key}"`;
                    log(`[html] 🎯 Añadido evento ${eventName} con key: ${key}`);
                } else if (isAttrContext) {
                    const attrName = attrContextMatch[1];
                    const placeholder = `reactive_attr_${attrCounter++}`;
                    result += `${placeholder}"`;

                    reactiveBindings.push({
                        type: 'attr',
                        attrName,
                        placeholder,
                        getValue: val
                    });
                    console.log(`[html] 🎨 Añadido atributo reactivo ${attrName} con placeholder: ${placeholder}`);
                } else {
                    const key = `REACTIVE_FN_${nodeCounter++}`;
                    result += `<!--${key}-->`;
                    reactiveBindings.push({
                        key,
                        getValue: val,
                        type: 'reactive-fn'
                    });
                    log(`[html] 🔄 Añadido función reactiva con key: ${key}`);
                }
            } else {
                result += String(val ?? '');
            }
        }
    }

    const template = document.createElement('template');
    template.innerHTML = result.trim();

    // Procesar nodos estáticos
    nodeMarkers.forEach(({
        key,
        node
    }) => {
        const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_COMMENT, {
            acceptNode(n) {
                return n.nodeValue === key ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        });
        const comment = walker.nextNode();
        if (comment) comment.replaceWith(node);
    });

    // Procesar eventos - 🔥 FIX: Aplicar eventos inmediatamente, no esperar
    const eventWalker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
    let el;
    while (el = eventWalker.nextNode()) {
        for (const attr of Array.from(el.attributes)) {
            if (attr.name.startsWith('zdev-on')) {
                const eventName = attr.name.slice(7);
                const fn = eventMap.get(attr.value);
                if (fn) {
                    // 🔥 FIX: Añadir listener directamente, no usar variable intermedia
                    el.addEventListener(eventName, (e) => fn(e));
                    log(`[html] 🎯 Añadido listener para ${eventName} en`, el.tagName);
                }
                el.removeAttribute(attr.name);
            }
        }
    }

    // 🔥 PROCESAR BINDINGS REACTIVOS
    reactiveBindings.forEach((binding) => {
        log(`[html] 🔍 Procesando binding.type: "${binding.type}" attrName: "${binding.attrName || 'N/A'}"`);
        if (binding.type === 'input-special' || binding.type === 'attr') {
            const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
            let el;
            while (el = walker.nextNode()) {
                if (el.hasAttribute(binding.attrName)) {
                    const attrValue = el.getAttribute(binding.attrName);
                    if (attrValue && attrValue.includes(binding.placeholder)) {
                        const getter = binding.getValue;

                        const updateAttr = () => {
                            try {
                                const newVal = getter();

                                // 🔥 CLASS reactivo (signal O arrow function)
                                if (binding.attrName === 'class' || binding.isClass) {
                                    el.className = String(newVal ?? '').trim();
                                    log(`[html] 🎨 CLASS reactivo: "${el.className}"`);
                                }
                                // 🔥 STYLE reactivo  
                                else if (binding.attrName === 'style' || binding.isStyle) {
                                    el.setAttribute('style', String(newVal ?? ''));
                                    log(`[html] 🎨 STYLE reactivo: "${el.style.cssText}"`);
                                }
                                // 🔥 Boolean attributes
                                else if (binding.isBoolean || ['disabled', 'checked', 'selected', 'readonly', 'required'].includes(binding.attrName)) {
                                    el.toggleAttribute(binding.attrName, !!newVal);
                                    log(`[html] 🎯 ${binding.attrName} boolean:`, !!newVal);
                                }
                                // 🔥 Value input
                                else if (binding.attrName === 'value') {
                                    el.value = String(newVal ?? '');
                                    el.setAttribute(binding.attrName, String(newVal ?? ''));
                                    log(`[html] 🎯 value input: "${el.value}"`);
                                } else {
                                    // Otros attrs
                                    const cleanAttrValue = attrValue.replace(binding.placeholder, '').trim();
                                    const newValue = (cleanAttrValue + ' ' + String(newVal ?? '')).trim();
                                    el.setAttribute(binding.attrName, newValue);
                                    log(`[html] 🎨 Attr ${binding.attrName}: "${newValue}"`);
                                }
                            } catch (e) {
                                console.error(e);
                            }
                        };

                        // 🔥 INIT + SUBSCRIBE (signal O nada)
                        requestAnimationFrame(updateAttr);

                        // Solo signals tienen subscribe
                        if (getter.subscribe) {
                            const unsub = getter.subscribe(() => requestAnimationFrame(updateAttr));
                            unsubscribes.push(unsub);
                        }

                        el.removeAttribute(binding.attrName);
                        break;
                    }
                }
            }
            return;
        } else if (binding.type === 'reactive-text') {
            const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_COMMENT, {
                acceptNode(n) {
                    return n.nodeValue === binding.key ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            });
            const comment = walker.nextNode();
            if (comment) {
                const getter = binding.getValue;
                const initialValue = getter();
                const textNode = document.createTextNode(String(initialValue ?? ''));
                comment.replaceWith(textNode);

                if (typeof getter.subscribe === 'function') {
                    const unsub = getter.subscribe(() => {
                        textNode.textContent = String(getter() ?? '');
                    });
                    unsubscribes.push(unsub);
                }
            }

        } else if (binding.type === 'reactive-fn') {
            log(`[html] 🔄 Procesando función reactiva para key: ${binding.key}`);

            const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_COMMENT, {
                acceptNode(n) {
                    return n.nodeValue === binding.key;
                }
            });

            const comment = walker.nextNode();
            if (comment) {
                const getter = binding.getValue;
                // 🔥 FIX: Wrapper que contendrá los nodos
                let currentWrapper = null;

                createEffect(() => {
                    try {
                        const value = getter();
                        log(`[html] 🔄 Valor actualizado en reactive-fn ${binding.key}:`, value);

                        // Remover wrapper anterior si existe
                        if (currentWrapper && currentWrapper.parentNode) {
                            currentWrapper.parentNode.removeChild(currentWrapper);
                            log(`[html] 🗑️ Removiendo wrapper anterior`);
                        }
                        currentWrapper = null;

                        if (value === null || value === undefined || value === false) {
                            // Insertar comment vacío
                            currentWrapper = document.createComment(`fn-empty:${binding.key}`);
                            if (comment.parentNode) {
                                comment.parentNode.insertBefore(currentWrapper, comment.nextSibling);
                            }
                        } else if (value instanceof DocumentFragment) {
                            // 🔥 FIX: Crear un wrapper y mover los hijos del fragmento
                            currentWrapper = document.createElement('div');
                            currentWrapper.style.display = 'contents'; // Invisible en layout
                            currentWrapper.setAttribute('data-zdev-wrapper', binding.key);

                            // MOVER (no clonar) los nodos al wrapper
                            while (value.firstChild) {
                                currentWrapper.appendChild(value.firstChild);
                            }

                            if (comment.parentNode) {
                                comment.parentNode.insertBefore(currentWrapper, comment.nextSibling);
                            }
                        } else if (value instanceof Node) {
                            currentWrapper = value;
                            if (comment.parentNode) {
                                comment.parentNode.insertBefore(currentWrapper, comment.nextSibling);
                            }
                        } else {
                            currentWrapper = document.createTextNode(String(value ?? ''));
                            if (comment.parentNode) {
                                comment.parentNode.insertBefore(currentWrapper, comment.nextSibling);
                            }
                        }

                        log(`[html] ✅ Nodo insertado en reactive-fn ${binding.key}`);
                    } catch (error) {
                        console.error(`[html] ❌ Error en reactive-fn ${binding.key}:`, error);
                        if (currentWrapper && currentWrapper.parentNode) {
                            currentWrapper.parentNode.removeChild(currentWrapper);
                        }
                        currentWrapper = document.createComment(`error:${binding.key}`);
                        if (comment.parentNode) {
                            comment.parentNode.insertBefore(currentWrapper, comment.nextSibling);
                        }
                    }
                });

                log(`[html] ✅ Función reactiva ${binding.key} configurada con createEffect`);
            } else {
                console.warn(`[html] ⚠️ No se encontró comentario para función reactiva: ${binding.key}`);
            }
        }
    });

    const fragment = document.createDocumentFragment();
    while (template.content.firstChild) {
        fragment.appendChild(template.content.firstChild);
    }

    fragment.dispose = () => {
        unsubscribes.forEach(unsub => unsub?.());
        log('[html] 🗑️ Disposed all subscriptions');
    };

    log(`[html] ✅ Fragmento creado con ${fragment.childNodes.length} nodos`);
    return fragment;
}

function renderReactive(target, componentFn) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) throw new Error('Contenedor no encontrado');

    let mountedFragment = null;

    function mountOnce() {
        log(`[renderReactive] ⚙️ Montando componente...`);
        const result = componentFn();
        if (!(result instanceof Node)) {
            container.appendChild(document.createTextNode(String(result ?? '')));
        } else {
            container.appendChild(result);
            mountedFragment = result;
        }
        log(`[renderReactive] ✅ Montaje completado.`);
    }

    mountOnce();

    return {
        dispose: () => {
            if (mountedFragment && mountedFragment.dispose) mountedFragment.dispose();
            container.innerHTML = '';
            log('[renderReactive] 🗑️ Disposed.');
        }
    };
}

function List(items, renderItem, getKey = null) {
    const container = document.createElement('div');

    const keyFn = getKey || ((item, i) => item?.id ?? item?.key ?? `i${i}`);

    // Mapa: key -> node (para reutilizar nodos existentes)
    const nodeMap = new Map();
    let lastKeys = [];

    const update = () => {
        const list = typeof items === 'function' ? items() : items;
        const newKeys = list.map((item, i) => keyFn(item, i));

        // Solo actualizar si cambió algo
        const keysChanged = newKeys.length !== lastKeys.length ||
            !newKeys.every((k, i) => k === lastKeys[i]);

        if (!keysChanged) {
            console.log('⏭️ Sin cambios');
            return;
        }

        console.log('🔄 Actualizando:', lastKeys.length, '→', newKeys.length);

        // 🔥 Guardar referencias a nodos actuales antes de limpiar
        const currentNodes = Array.from(container.children);
        const keyToNode = new Map();

        // Recuperar keys de los nodos actuales
        for (let i = 0; i < currentNodes.length; i++) {
            const node = currentNodes[i];
            const key = lastKeys[i]; // La key que tenía este índice antes
            if (key) {
                keyToNode.set(key, node);
                // Guardar key en el nodo para futuras referencias
                node._listKey = key;
            }
        }

        // Limpiar container (pero los nodos siguen existiendo en keyToNode)
        container.innerHTML = '';

        // Reconstruir en orden correcto
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            const key = newKeys[i];

            if (keyToNode.has(key)) {
                // 🔥 REUTILIZAR nodo existente
                console.log('♻️ Reutilizando:', key);
                const oldNode = keyToNode.get(key);
                container.appendChild(oldNode);
            } else {
                // Crear nuevo nodo
                console.log('➕ Nuevo:', key);
                const newNode = renderItem(item, i);
                if (newNode instanceof Node) {
                    newNode._listKey = key;
                    container.appendChild(newNode);
                    // Guardar en mapa por si se reordena luego
                    nodeMap.set(key, newNode);
                }
            }
        }

        // Limpiar nodos que ya no se usan (eliminados)
        for (const [key, node] of keyToNode) {
            if (!newKeys.includes(key)) {
                console.log('🗑️ Eliminando del mapa:', key);
                nodeMap.delete(key);
                // El nodo ya no está en el DOM, se deja para garbage collection
            }
        }

        lastKeys = newKeys;
        console.log('✅ Listo:', container.children.length, 'nodos');
    };

    if (typeof items === 'function' && items.subscribe) {
        items.subscribe(update);
    }

    update();
    return container;
}

function useRef(initial) {
    return {
        current: initial
    };
}

function createEffect(fn) {
    const effect = () => {
        effectStack.push(effect);
        currentEffect = effect;
        try {
            fn();
        } finally {
            currentEffect = effectStack.pop();
        }
    };
    effect();
}

function useSignal(initial) {
    let value = initial;
    const subscribers = new Set();

    const getter = () => {
        if (currentEffect) {
            subscribers.add(currentEffect);
            log('[useSignal] Subscribing currentEffect to signal', value);
        }
        return value;
    };

    getter.subscribe = (fn) => {
        log('[subscribe] Adding subscriber:', fn?.name || fn);
        subscribers.add(fn);
        return () => subscribers.delete(fn);
    };

    getter.toString = () => String(value);
    getter.valueOf = () => value;

    const setter = (v) => {
        const newValue = typeof v === 'function' ? v(value) : v;
        if (value === newValue) return;
        value = newValue;
        log('[useSignal] Value changed:', value, 'Notifying', subscribers.size, 'subscribers');
        subscribers.forEach(fn => fn());
    };

    return [getter, setter];
}

const useState = useSignal;

function useComputed(getter) {
    const [value, setValue] = useSignal();
    createEffect(() => setValue(getter()));
    return value;
}

const useDerived = useComputed;

window.zDevCore = {
    useSignal,
    html,
    useComputed,
    useState,
    useDerived,
    createEffect,
    renderReactive,
    List,
    useRef,
    ListVirtual
};