// zDev Hooks v2.0 - Router, Forms, Toast, Theme
// Importa core primero: <script src="zdev-core.js"></script>
(function() {

    // Core access
    const Core = window.zDevCore;
    if (!Core) return console.error('❌ Carga zdev-core.js PRIMERO');

    const {
        useSignal,
        createEffect,
        useComputed,
        html
    } = Core;

    function useEffect(fn, deps = []) {
        // 🔥 Si NO hay deps → Ejecutar UNA vez (mount)
        if (deps.length === 0) {
            const cleanup = createEffect(fn);
            return typeof cleanup === 'function' ? cleanup : undefined;
        }

        // 🔥 Si hay deps → Re-ejecutar cuando cambien
        createEffect(() => {
            let cleanup;
            const result = fn();
            if (typeof result === 'function') cleanup = result;
            return cleanup;
        });
    }

    function useRouter(routes, options = {}) {
        let {
            base = '',
                type = 'history',
                beforeEach = null,
                onError = null
        } = options;

        // Auto-detección file://
        const isFileProtocol = location.protocol === 'file:';
        const actualType = (isFileProtocol && type === 'history') ? 'hash' : type;

        if (isFileProtocol && type === 'history') {
            console.log('[useRouter] ⚠️ file:// detectado, usando hash mode');
        }

        log('[useRouter] Inicializando:', {
            type: actualType,
            base
        });

        function getInitialPath() {
            let path;

            if (actualType === 'hash') {
                path = location.hash.slice(1) || '/';
                if (!path.startsWith('/')) path = '/' + path;
            } else {
                path = location.pathname;

                // 🔥 FIX: Limpiar ruta completa de archivo SOLO si termina en .html
                if (path.endsWith('.html')) {
                    const fileName = path.split('/').pop().replace('.html', '');
                    path = fileName === 'index' ? '/' : `/${fileName}`;
                    log('[useRouter] Limpiando .html:', path);
                } else {
                    path = path.replace(base, '') || '/';
                }
            }

            log('[useRouter] Ruta inicial:', path);
            return path;
        }

        const [currentPath, setCurrentPath] = useSignal(getInitialPath());
        const [params, setParams] = useSignal({});
        const [query, setQuery] = useSignal({});

        let cleanupFns = [];

        function parseQuery(search = '') {
            const q = {};
            new URLSearchParams(search).forEach((val, key) => {
                q[key] = val;
            });
            return q;
        }

        function matchRoute(path) {
            const cleanPath = path.split('?')[0].split('#')[0];

            for (const route of routes) {
                if (route.route === '*') continue;

                const paramNames = [];
                const regexPattern = route.route
                    .replace(/:([^/]+)/g, (match, name) => {
                        paramNames.push(name);
                        return '([^/]+)';
                    })
                    .replace(/\*/g, '.*');

                const regex = new RegExp(`^${regexPattern}$`);
                const match = cleanPath.match(regex);

                if (match) {
                    const routeParams = {};
                    paramNames.forEach((name, i) => {
                        routeParams[name] = match[i + 1];
                    });
                    return {
                        route,
                        params: routeParams
                    };
                }
            }

            const notFound = routes.find(r => r.route === '*');
            if (notFound) {
                return {
                    route: notFound,
                    params: {}
                };
            }

            return {
                route: null,
                params: {}
            };
        }

        function handleRouteChange(path, replace = false) {
            if (!path.startsWith('/')) path = '/' + path;

            if (beforeEach) {
                const result = beforeEach(path, currentPath());
                if (result === false) return;
                if (typeof result === 'string') path = result;
            }

            const {
                route,
                params: routeParams
            } = matchRoute(path);

            if (!route) {
                onError?.({
                    type: 'ROUTE_NOT_FOUND',
                    path
                });
                return;
            }

            setCurrentPath(path);
            setParams(routeParams);
            setQuery(actualType === 'hash' ?
                parseQuery(location.hash.split('?')[1] || '') :
                parseQuery(location.search)
            );

            if (actualType === 'history') {
                const fullPath = base === '/' ? path : base + path;
                if (replace) {
                    history.replaceState({
                        path
                    }, '', fullPath);
                } else {
                    history.pushState({
                        path
                    }, '', fullPath);
                }
            } else {
                // 🔥 FIX: Hash mode - usar replaceState para no llenar historial innecesario
                const hashPath = path.startsWith('/') ? path : '/' + path;
                if (replace) {
                    location.replace('#' + hashPath);
                } else {
                    location.hash = hashPath;
                }
            }

            return route;
        }

        function navigate(to, options = {}) {
            const {
                replace = false
            } = options;
            let finalPath = to;
            if (!finalPath.startsWith('/')) finalPath = '/' + finalPath;

            handleRouteChange(finalPath, replace);
        }

        function back() {
            history.back();
        }

        function forward() {
            history.forward();
        }

        function setupListeners() {
            // 🔥 POPSTATE: Para history mode (y también ayuda en hash)
            const popstateHandler = (e) => {
                log('[useRouter] Popstate:', e.state);

                if (actualType === 'history') {
                    const path = e.state?.path || getInitialPath();
                    const {
                        route,
                        params: p
                    } = matchRoute(path);
                    if (route) {
                        setCurrentPath(path);
                        setParams(p);
                    }
                } else {
                    // 🔥 FIX: En hash mode, también revisar el hash actual
                    let hashPath = location.hash.slice(1) || '/';
                    if (!hashPath.startsWith('/')) hashPath = '/' + hashPath;

                    const {
                        route,
                        params: p
                    } = matchRoute(hashPath);
                    if (route) {
                        setCurrentPath(hashPath);
                        setParams(p);
                    }
                }
            };
            window.addEventListener('popstate', popstateHandler);
            cleanupFns.push(() => window.removeEventListener('popstate', popstateHandler));

            // 🔥 HASHCHANGE: Solo para hash mode - CRÍTICO PARA BOTÓN ATRÁS
            if (actualType === 'hash') {
                const hashHandler = () => {
                    log('[useRouter] Hashchange:', location.hash);
                    let newPath = location.hash.slice(1) || '/';
                    if (!newPath.startsWith('/')) newPath = '/' + newPath;

                    // Solo actualizar si es diferente para evitar loops
                    if (newPath !== currentPath()) {
                        const {
                            route,
                            params: p
                        } = matchRoute(newPath);
                        if (route) {
                            setCurrentPath(newPath);
                            setParams(p);
                        }
                    }
                };
                window.addEventListener('hashchange', hashHandler);
                cleanupFns.push(() => window.removeEventListener('hashchange', hashHandler));
            }

            // Click handler
            const clickHandler = (e) => {
                const link = e.target.closest('a');
                if (!link) return;

                const href = link.getAttribute('href');
                if (!href || href.startsWith('http') || href.startsWith('mailto:')) return;

                e.preventDefault();

                let targetPath;
                if (href.startsWith('#')) {
                    targetPath = href.slice(1) || '/';
                } else {
                    targetPath = href.replace(base, '');
                    if (href.endsWith('.html')) {
                        const fileName = href.split('/').pop().replace('.html', '');
                        targetPath = fileName === 'index' ? '/' : `/${fileName}`;
                    }
                }

                if (!targetPath.startsWith('/')) targetPath = '/' + targetPath;
                navigate(targetPath);
            };

            document.addEventListener('click', clickHandler);
            cleanupFns.push(() => document.removeEventListener('click', clickHandler));
        }

        setupListeners();

        const RouterView = () => {
            const container = document.createElement('div');
            container.style.display = 'contents';

            const updateView = () => {
                const path = currentPath();
                const {
                    route
                } = matchRoute(path);

                if (!route || !route.component) {
                    container.innerHTML = '<div style="padding: 2rem; text-align: center;"><h1>404</h1><p>Página no encontrada</p></div>';
                    return;
                }

                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }

                const result = route.component({
                    params: params(),
                    query: query(),
                    navigate
                });

                if (result instanceof Node) {
                    container.appendChild(result);
                } else {
                    container.textContent = String(result ?? '');
                }
            };

            createEffect(updateView);
            return container;
        };

        const RouterLink = ({
            to,
            className = '',
            activeClass = 'active',
            children
        }) => {
            const isActive = useComputed(() => currentPath() === to);
            const linkClass = useComputed(() =>
                `${className} ${isActive() ? activeClass : ''}`.trim()
            );

            const handleClick = (e) => {
                e.preventDefault();
                navigate(to);
            };

            return html`
            <a href="${actualType === 'hash' ? '#' + to : to}" 
               class="${linkClass}" 
               onclick=${handleClick}>
                ${children}
            </a>
        `;
        };

        return {
            navigate,
            back,
            forward,
            currentPath,
            params,
            query,
            RouterView,
            RouterLink,
            cleanup: () => cleanupFns.forEach(fn => fn()),
            mode: actualType
        };
    }

    function useForm(config = {}) {
        const {
            initialValues = {},
                validate = {},
                onSubmit = () => {},
                validateOnChange = true,
                validateOnBlur = true
        } = config;

        // Signals de estado
        const [values, setValues] = useSignal({
            ...initialValues
        });
        const [errors, setErrors] = useSignal({});
        const [touched, setTouched] = useSignal({});
        const [isSubmitting, setIsSubmitting] = useSignal(false);
        const [isValid, setIsValid] = useSignal(true);

        // Validar campo específico
        const validateField = (name, value) => {
            const validator = validate[name];
            if (!validator) return null;

            // Puede ser función o array de funciones
            const validators = Array.isArray(validator) ? validator : [validator];

            for (const fn of validators) {
                const error = fn(value, values());
                if (error) return error;
            }
            return null;
        };

        // Validar todo el formulario
        const validateAll = () => {
            const newErrors = {};
            let valid = true;

            Object.keys(validate).forEach(field => {
                const error = validateField(field, values()[field]);
                if (error) {
                    newErrors[field] = error;
                    valid = false;
                }
            });

            setErrors(newErrors);
            setIsValid(valid);
            return valid;
        };

        // Handlers
        const handleChange = (e) => {
            const {
                name,
                value,
                type,
                checked
            } = e.target;
            const finalValue = type === 'checkbox' ? checked : value;

            setValues(prev => ({
                ...prev,
                [name]: finalValue
            }));

            if (validateOnChange && touched()[name]) {
                const error = validateField(name, finalValue);
                setErrors(prev => ({
                    ...prev,
                    [name]: error
                }));
                validateAll();
            }
        };

        const handleBlur = (e) => {
            const {
                name,
                value
            } = e.target;
            setTouched(prev => ({
                ...prev,
                [name]: true
            }));

            if (validateOnBlur) {
                const error = validateField(name, value);
                setErrors(prev => ({
                    ...prev,
                    [name]: error
                }));
                validateAll();
            }
        };

        const handleSubmit = async (e) => {
            if (e) e.preventDefault();

            // Marcar todos como touched
            const allTouched = {};
            Object.keys(values()).forEach(key => allTouched[key] = true);
            setTouched(allTouched);

            const valid = validateAll();
            if (!valid) return;

            setIsSubmitting(true);
            try {
                await onSubmit(values());
            } finally {
                setIsSubmitting(false);
            }
        };

        const setValue = (name, value) => {
            setValues(prev => ({
                ...prev,
                [name]: value
            }));
        };

        const reset = () => {
            setValues({
                ...initialValues
            });
            setErrors({});
            setTouched({});
            setIsSubmitting(false);
        };

        // Field component helper
        const register = (name) => ({
            name,
            value: values()[name] ?? '',
            onchange: handleChange,
            onblur: handleBlur,
            'data-error': errors()[name] || '',
            'data-touched': touched()[name] || false
        });

        return {
            values,
            errors,
            touched,
            isSubmitting,
            isValid,
            handleChange,
            handleBlur,
            handleSubmit,
            setValue,
            reset,
            register,
            validateAll
        };
    }

    // Validadores predefinidos
    useForm.validators = {
        required: (msg = 'Campo requerido') => (val) =>
            !val || val.toString().trim() === '' ? msg : null,

        email: (msg = 'Email inválido') => (val) =>
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? msg : null,

        minLength: (min, msg) => (val) =>
            (val?.length || 0) < min ? (msg || `Mínimo ${min} caracteres`) : null,

        maxLength: (max, msg) => (val) =>
            (val?.length || 0) > max ? (msg || `Máximo ${max} caracteres`) : null,

        pattern: (regex, msg) => (val) =>
            !regex.test(val) ? msg : null,

        match: (field, msg) => (val, allValues) =>
            val !== allValues[field] ? (msg || 'Los campos no coinciden') : null
    };

    function useToast() {
        let container = document.getElementById('zdev-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'zdev-toast-container';
            document.body.appendChild(container);
        }

        // 🔥 HELPER FUNCTIONS PARA ICONOS
        function getTypeIcon(type) {
            const icons = {
                success: `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>`,
                error: `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>`,
                warning: `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V9h2v5z"/>
                </svg>`,
                info: `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>`
            };
            return icons[type] || `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 7v10M12 7l-1 10"/>
            </svg>`;
        }

        function getIconBg(type) {
            const colors = {
                success: '#e8f5e9',
                error: '#ffebee',
                warning: '#fff3e0',
                info: '#e3f2fd'
            };
            return colors[type] || '#f5f5f5';
        }

        function getIconColor(type) {
            const colors = {
                success: '#388e3c',
                error: '#d32f2f',
                warning: '#f57c00',
                info: '#1976d2'
            };
            return colors[type] || '#666';
        }

        const spawn = (...args) => {
            let options;
            if (typeof args[0] === 'string') {
                options = {
                    title: args[0],
                    type: args[1] || 'info',
                    ...args[2]
                };
            } else {
                options = args[0] || {};
            }

            const {
                title = '',
                    message = '',
                    type = 'info',
                    position = 'top-right',
                    buttons = [],
                    duration = 4000,
                    closable = true,
                    icon = null // SVG personalizado opcional
            } = options;

            const toast = document.createElement('div');
            toast.className = `zdev-toast zdev-toast--${type}`;
            container.className = `zdev-toast-container zdev-toast--${position}`;

            // 🔥 HEADER: Icono + Título + X
            const header = document.createElement('div');
            header.className = 'zdev-toast-header';
            header.style.cssText = `
                display: flex; 
                align-items: flex-start; 
                gap: 0.75rem;
                padding: 1rem 1rem 0.5rem 1rem;
            `;

            // Icono tipo (o SVG custom)
            const typeIcon = document.createElement('div');
            typeIcon.className = `zdev-toast-icon zdev-toast-icon--${type}`;
            typeIcon.style.cssText = `
                flex-shrink: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                background: ${getIconBg(type)};
                color: ${getIconColor(type)};
                font-size: 18px;
                margin-top: 2px;
            `;

            // Soporte SVG personalizado
            if (icon && typeof icon === 'string' && icon.includes('<svg')) {
                typeIcon.innerHTML = icon;
                typeIcon.style.background = 'transparent';
                typeIcon.style.color = getIconColor(type);
            } else {
                typeIcon.innerHTML = icon || getTypeIcon(type);
            }
            header.appendChild(typeIcon);

            // Título + Subtítulo
            const titleContainer = document.createElement('div');
            titleContainer.style.cssText = 'flex: 1; min-width: 0;'; // min-width:0 evita overflow

            const titleEl = document.createElement('div');
            titleEl.className = 'zdev-toast-title';
            titleEl.style.cssText = `
                font-size: 1rem; 
                font-weight: 600; 
                color: inherit; 
                line-height: 1.3; 
                margin: 0;
                word-break: break-word;
            `;
            titleEl.textContent = String(title || message);

            // Subtítulo
            if (message && message !== title) {
                const subtitleEl = document.createElement('div');
                subtitleEl.className = 'zdev-toast-subtitle';
                subtitleEl.style.cssText = `
                    font-size: 0.875rem; 
                    color: inherit; 
                    opacity: 0.8; 
                    line-height: 1.4; 
                    margin-top: 0.25rem;
                    word-break: break-word;
                `;
                subtitleEl.textContent = String(message);
                titleContainer.appendChild(titleEl);
                titleContainer.appendChild(subtitleEl);
            } else {
                titleContainer.appendChild(titleEl);
            }
            header.appendChild(titleContainer);

            // Botón X alineado
            if (closable) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'zdev-toast-close';
                closeBtn.innerHTML = '✕';
                closeBtn.onclick = () => remove();
                header.appendChild(closeBtn);
            }

            toast.appendChild(header);

            // 🔥 BOTONES (funcionan perfecto)
            if (buttons.length > 0) {
                const actions = document.createElement('div');
                actions.className = 'zdev-toast-actions';

                buttons.forEach(btn => {
                    const b = document.createElement('button');
                    b.className = `zdev-toast-btn zdev-toast-btn--${btn.type || 'primary'}`;

                    if (btn.icon) {
                        const iconEl = document.createElement('span');
                        iconEl.className = 'zdev-toast-btn-icon';
                        iconEl.innerHTML = String(btn.icon);
                        b.appendChild(iconEl);
                    }

                    const labelText = typeof btn.label === 'function' ? btn.label() : String(btn.label);
                    b.appendChild(document.createTextNode(labelText));

                    b.onclick = () => {
                        btn.action?.();
                        if (!btn.keepOpen) remove();
                    };
                    actions.appendChild(b);
                });
                toast.appendChild(actions);
            }

            // 🔥 BARRA DE PROGRESO
            if (duration > 0) {
                const progressBar = document.createElement('div');
                progressBar.className = 'zdev-toast-progress';
                progressBar.style.cssText = `
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    width: 100%;
                    background: rgba(255,255,255,0.3);
                    transform-origin: left;
                    transition: width 0.1s linear;
                    border-radius: 0 0 12px 12px;
                `;
                toast.appendChild(progressBar);
            }

            container.appendChild(toast);

            // 🔥 ANIMACIÓN + PROGRESO PAUSABLE
            requestAnimationFrame(() => {
                toast.classList.add('zdev-toast--show');
            });

            let animationId;
            if (duration > 0) {
                const progressBar = toast.querySelector('.zdev-toast-progress');
                let startTime = Date.now();

                function updateProgress() {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.max(0, 1 - elapsed / duration);
                    progressBar.style.width = `${progress * 100}%`;

                    if (progress > 0) {
                        animationId = requestAnimationFrame(updateProgress);
                    } else {
                        remove();
                    }
                }

                updateProgress();

                // Pausar en hover
                toast.addEventListener('mouseenter', () => {
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                        progressBar.style.transition = 'none';
                    }
                });

                toast.addEventListener('mouseleave', () => {
                    if (duration > 0 && progressBar) {
                        startTime = Date.now() - (1 - parseFloat(progressBar.style.width) / 100) * duration;
                        progressBar.style.transition = 'width 0.1s linear';
                        updateProgress();
                    }
                });
            }

            function remove() {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
                toast.classList.remove('zdev-toast--show');
                toast.addEventListener('transitionend', () => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, {
                    once: true
                });
            }

            return {
                close: remove
            };
        };

        // Métodos rápidos
        ['success', 'error', 'warning', 'info'].forEach(t =>
            spawn[t] = (title, messageOrOpts, opts) => {
                const options = typeof messageOrOpts === 'string' ? {
                    title,
                    message: messageOrOpts,
                    type: t,
                    ...opts
                } : {
                    title,
                    ...messageOrOpts,
                    type: t
                };
                return spawn(options);
            }
        );

        return spawn;
    }

    const toastCSS = `
        /* ===== CONTENEDOR PRINCIPAL ===== */
        .zdev-toast-container { position: fixed; inset: 0; pointer-events: none; z-index: 9999; display: flex; flex-direction: column; gap: 0.75rem; padding: 1.5rem; max-height: 100vh; overflow-y: auto; }

        /* ===== POSICIONES ===== */
        .zdev-toast-container.zdev-toast--top-left { align-items: flex-start; justify-content: flex-start; }
        .zdev-toast-container.zdev-toast--top-center { align-items: center; justify-content: flex-start; }
        .zdev-toast-container.zdev-toast--top-right { align-items: flex-end; justify-content: flex-start; }
        .zdev-toast-container.zdev-toast--bottom-left { align-items: flex-start; justify-content: flex-end; }
        .zdev-toast-container.zdev-toast--bottom-center { align-items: center; justify-content: flex-end; }
        .zdev-toast-container.zdev-toast--bottom-right { align-items: flex-end; justify-content: flex-end; }

        /* ===== TOAST INDIVIDUAL ===== */
        .zdev-toast { min-width: 300px; max-width: 400px; background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); pointer-events: all; opacity: 0; transform: translateY(20px) scale(0.95); transition: all 0.3s ease; overflow: hidden; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
        .zdev-toast--show { opacity: 1; transform: translateY(0) scale(1); }

        /* ===== CONTENIDO ===== */
        .zdev-toast-content { padding: 1rem; font-size: 0.95rem; line-height: 1.4; color: #333; word-break: break-word; }

        /* ===== ACCIONES ===== */
        .zdev-toast-actions { display: flex; gap: 0.5rem; padding: 0 1rem 1rem; justify-content: flex-end; flex-wrap: wrap; border-top: 1px solid rgba(0,0,0,0.08); }

        /* ===== BOTONES ===== */
        .zdev-toast-btn { padding: 0.5rem 1rem; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 0.5rem; min-height: 36px; }
        .zdev-toast-btn-icon { font-size: 1rem; line-height: 1; }

        /* Colores de botones */
        .zdev-toast-btn--primary { background: #2196F3; color: white; }
        .zdev-toast-btn--primary:hover { background: #1976D2; transform: translateY(-1px); }

        .zdev-toast-btn--secondary { background: rgba(0,0,0,0.08); color: #333; }
        .zdev-toast-btn--secondary:hover { background: rgba(0,0,0,0.12); }

        .zdev-toast-btn--success { background: #4CAF50; color: white; }
        .zdev-toast-btn--success:hover { background: #388e3c; }

        .zdev-toast-btn--error { background: #F44336; color: white; }
        .zdev-toast-btn--error:hover { background: #d32f2f; }

        /* ===== BOTÓN DE CERRAR ===== */
        .zdev-toast-close { background: rgba(0,0,0,0.08); border: none; border-radius: 50%; color: inherit; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer; transition: all 0.2s ease; margin-left: 0.5rem; }
        .zdev-toast-close:hover { background: rgba(0,0,0,0.12); transform: scale(1.1); }

        /* ===== COLORES POR TIPO ===== */
        .zdev-toast--info { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-left: 4px solid #2196F3; color: #1976d2; }
        .zdev-toast--success { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 4px solid #4CAF50; color: #388e3c; }
        .zdev-toast--warning { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-left: 4px solid #FF9800; color: #f57c00; }
        .zdev-toast--error { background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-left: 4px solid #F44336; color: #d32f2f; }

        /* ===== TEMA OSCURO ===== */
        [data-theme="dark"] .zdev-toast { background: #2d2d2d; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        [data-theme="dark"] .zdev-toast-content { color: #e0e0e0; }
        [data-theme="dark"] .zdev-toast-actions { border-top-color: rgba(255,255,255,0.08); }
        [data-theme="dark"] .zdev-toast-btn--secondary { background: rgba(255,255,255,0.08); color: #e0e0e0; }
        [data-theme="dark"] .zdev-toast-btn--secondary:hover { background: rgba(255,255,255,0.12); }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
            .zdev-toast { min-width: 280px; max-width: calc(100vw - 3rem); }
        
            .zdev-toast-container { padding: 1rem; }
        }
    `;

    if (!document.getElementById('zdev-toast-styles')) {
        const s = document.createElement('style');
        s.id = 'zdev-toast-styles';
        s.textContent = toastCSS;
        document.head.appendChild(s);
    }


    function useTheme() {
        const saved = localStorage.getItem('theme') || 'light';
        log('[useTheme] Tema inicial desde localStorage:', saved);

        const [theme, setTheme] = useSignal(saved);

        // Aplicar tema INMEDIATAMENTE al body (antes de cualquier render)
        document.body.setAttribute('data-theme', saved);
        log('[useTheme] Tema aplicado al body:', saved);

        // Subscribe para cambios futuros
        const unsubscribe = theme.subscribe(() => {
            const currentTheme = theme();
            log('[useTheme] Tema cambiado a:', currentTheme);
            document.body.setAttribute('data-theme', currentTheme);
            localStorage.setItem('theme', currentTheme);
            log('[useTheme] Tema guardado en localStorage');
        });

        const toggle = () => {
            const newTheme = theme() === 'light' ? 'dark' : 'light';
            log('[useTheme] Toggle tema de', theme(), 'a', newTheme);
            setTheme(newTheme);
        };

        return [theme, toggle];
    }

    function useStorage(key, initial) {
        const stored = localStorage.getItem(key);
        const [value, setValue] = useSignal(stored ? JSON.parse(stored) : initial);
        const setAndStore = v => {
            const newVal = typeof v === 'function' ? v(value()) : v;
            localStorage.setItem(key, JSON.stringify(newVal));
            setValue(newVal);
        };
        return [value, setAndStore];
    }

    window.zDevHooks = {
        useEffect,
        useRouter,
        useForm,
        useToast,
        useTheme,
        useStorage
    };

})();

// 🔥 WEB + DESKTOP

/*export { xuseEffect, xuseRouter, xuseForm, xuseToast, xuseTheme, xuseStorage,
         useFetch, useSessionStorage, useTimeAgo, useIcon, useFavicon, 
         useImage, memo, useReducer, useTimeout, useMedia }
*/

