// zdev-mobile.js v2.1 - FIXED TOTAL
(function() {
    const log = (...args) => window.ZDEV_DEBUG && console.log('%c[zDevMobile]', 'color: #10b981', ...args);

    // Core access
    const Core = window.zDevCore;
    if (!Core) return console.error('❌ Carga zdev-core.js PRIMERO');

    const {
        useSignal,
        useState,
        useComputed,
        createEffect,
        html,
        List
    } = Core;

    // ✅ useStyle CORREGIDO
    let styleCounter = 0;

    function useStyle(css) {
        createEffect(() => {
            const id = `zdev-style-${styleCounter++}`;
            let styleEl = document.getElementById(id);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = id;
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = css;
            log('[useStyle] ✅', id);
        });
    }

    // ✅ useDebounce CORREGIDO
    function useDebounce(value, delay) {
        const [debounced, setDebounced] = useSignal(value());
        let timeout;
        createEffect(() => {
            clearTimeout(timeout);
            timeout = setTimeout(() => setDebounced(value()), delay);
        });
        return debounced;
    }

    // 🔥 useSwipe TOTALMENTE CORREGIDO (SIN useToast)
    function useSwipe(userId, options = {}) {
        const {
            leftActions = [], rightActions = [], threshold = 60, maxSwipe = 80,
                vibrate = true, preventAccidental = true, cardConfig = {},
                // 🔥 NUEVO: Delay antes de activar swipe
                touchDelay = 150 // ms antes de capturar swipe
        } = options;

        const [swipeState, setSwipeState] = useState(null);
        const [swipeProgress, setSwipeProgress] = useState(0);

        // 🔥 TOUCH TIMERS
        let startX = 0,
            currentX = 0,
            isDragging = false,
            dragStartTime = 0,
            touchTimeout = null,
            isLongPress = false;

        const finalCardConfig = {
            lightBg: 'white',
            darkBg: '#2d2d2d',
            padding: '1rem',
            borderRadius: '12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            textColor: '#1f2937',
            ...cardConfig
        };

        const cardClassName = `zdev-swipe-card-${userId}`;

        // 🔥 CSS - SCROLL VERTICAL PRIMERO
        createEffect(() => {
            const cssId = `zdev-swipe-card-${userId}`;
            let styleEl = document.getElementById(cssId);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = cssId;
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = `
            .${cardClassName} {
                position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                background: ${finalCardConfig.lightBg}; color: ${finalCardConfig.textColor};
                border-radius: ${finalCardConfig.borderRadius}; padding: ${finalCardConfig.padding};
                box-shadow: ${finalCardConfig.boxShadow}; transition: ${finalCardConfig.transition};
                cursor: grab; user-select: none; 
                /* 🔥 SCROLL VERTICAL PRIMERO */
                touch-action: pan-y pinch-zoom; 
                z-index: 2;
            }
            [data-theme="dark"] .${cardClassName} { background: ${finalCardConfig.darkBg}; }
            .${cardClassName}.swiping { 
                cursor: grabbing; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                touch-action: pan-x pan-y pinch-zoom;
            }
            .${cardClassName}.swipe-left { transform: translateX(-${maxSwipe}px); }
            .${cardClassName}.swipe-right { transform: translateX(${maxSwipe}px); }
        `;
        });

        // 🔥 GLOBAL CSS - TU VERSION
        if (!document.getElementById('zdev-swipe-global')) {
            const globalStyle = document.createElement('style');
            globalStyle.id = 'zdev-swipe-global';
            globalStyle.textContent = `
            .zdev-swipe-container {
                position: relative; /*overflow: hidden;*/ margin-bottom: .75rem; height: 72px;
                /* 🔥 SCROLL VERTICAL SIEMPRE */
                touch-action: pan-y pinch-zoom;
            }
            .zdev-swipe-actions {
                position: absolute; top: 0; height: 100%; display: flex;
                align-items: center; gap: 8px; padding: 0 12px; z-index: 3;
                pointer-events: none;
            }
            .zdev-swipe-actions.left { left: 0; }
            .zdev-swipe-actions.right { right: 0; }
            .zdev-swipe-action-btn {
                width: 52px; height: 52px; border-radius: 50%; display: flex;
                align-items: center; justify-content: center; color: white;
                font-size: 20px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,.2);
                transition: all .2s; pointer-events: auto; cursor: pointer;
                border: none; background: #666;
            }
            .zdev-swipe-action-btn:hover { transform: scale(1.1); }
        `;
            document.head.appendChild(globalStyle);
        }

        // 🔥 HANDLER TOUCH START - DELAY + SCROLL CHECK
        const handleTouchStart = (e) => {
            // 🔥 NO PREVENIR INMEDIATAMENTE - permite scroll vertical
            const touch = e.touches[0];
            startX = touch.clientX;
            dragStartTime = Date.now();

            // 🔥 DELAY para detectar long press vs scroll rápido
            touchTimeout = setTimeout(() => {
                isLongPress = true;
                isDragging = true;
                e.preventDefault(); // Solo AHORA previene scroll
                setSwipeState('none');
                setSwipeProgress(0);
            }, touchDelay);
        };

        const handleTouchMove = (e) => {
            // 🔥 Si es scroll vertical RÁPIDO → cancelar swipe
            if (!isDragging || !isLongPress) {
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - startX);
                const deltaY = Math.abs(touch.clientY - e.touches[0].clientY);

                // 🔥 Scroll vertical > horizontal = cancelar
                if (deltaY > deltaX || Date.now() - dragStartTime < touchDelay) {
                    clearTimeout(touchTimeout);
                    return; // Deja que el scroll natural funcione
                }
            }

            if (!isDragging) return;
            e.preventDefault();

            currentX = e.touches[0].clientX - startX;
            const absX = Math.abs(currentX);
            const limitedX = Math.max(-maxSwipe, Math.min(maxSwipe, currentX));
            const card = e.currentTarget;
            card.style.transform = `translateX(${limitedX}px)`;

            const progress = Math.min(absX / threshold, 1);
            setSwipeProgress(progress);

            let state = null;
            if (currentX > 20 && rightActions.length) state = 'right';
            else if (currentX < -20 && leftActions.length) state = 'left';
            setSwipeState(state);

            if (absX >= threshold && !card.dataset.vibrated && vibrate) {
                card.dataset.vibrated = 'true';
                navigator.vibrate?.(10);
            }
        };

        const handleTouchEnd = (e) => {
            clearTimeout(touchTimeout);

            if (!isDragging) {
                isLongPress = false;
                return;
            }

            isDragging = false;
            isLongPress = false;
            const card = e.currentTarget;
            card.style.transform = '';
            delete card.dataset.vibrated;

            const absX = Math.abs(currentX);
            const state = swipeState();
            const shouldExecute = absX >= threshold &&
                (!preventAccidental || (absX >= threshold * 3 && Date.now() - dragStartTime > 350));

            if (shouldExecute && state) {
                executeAction(state);
            } else {
                setSwipeState(null);
                setSwipeProgress(0);
            }
            startX = currentX = 0;
        };

        // 🔥 FIXED executeAction + CLICK
        function executeAction(side) {
            const actions = side === 'left' ? rightActions : leftActions;

            if (actions.length === 1) {
                console.log('⚡ SINGLE:', actions[0].label);
                actions[0].action(userId);
            } else if (actions.length === 2) {
                console.log('🍽️ MENU 2:', actions.map(a => a.label));
            }

            // Reset después de delay
            setTimeout(() => {
                setSwipeState(null);
                setSwipeProgress(0);
            }, actions.length === 1 ? 200 : 4000);
        }

        const handleMouseDown = handleTouchStart;
        const handleMouseMove = handleTouchMove;
        const handleMouseUp = handleTouchEnd;
        const handleMouseLeave = handleMouseUp;

        // 🔥 TUS ESTILOS DINÁMICOS (perfectos)
        const leftActionsStyle = useComputed(() => {
            let progress = swipeProgress();
            let show = swipeState() === 'right';
            return `
            opacity: ${show ? progress : 0};
            transform: scale(${show ? progress : 0.6});
            pointer-events: ${show ? 'auto' : 'none'};
            z-index: ${(show && progress >= 0.9) ? 3 : 1};
        `;
        });

        const rightActionsStyle = useComputed(() => {
            let progress = swipeProgress();
            let show = swipeState() === 'left';
            return `
            opacity: ${show ? progress : 0};
            transform: scale(${show ? progress : 0.6});
            pointer-events: ${show ? 'auto' : 'none'};
            z-index: ${(show && progress >= 0.9) ? 3 : 1};
        `;
        });

        const cardClasses = useComputed(() => {
            const state = swipeState();
            let cls = cardClassName;
            if (state === 'left') cls += ' swipe-left';
            if (state === 'right') cls += ' swipe-right';
            if (state && state !== 'none') cls += ' swiping';
            return cls;
        });

        const renderActions = (actions, side, style) => {
            if (!actions.length) return null;
            return html`
            <div class="zdev-swipe-actions ${side}" style="${style}">
                ${List(actions.slice(0, 2), (action) => html`
                    <div 
                        class="zdev-swipe-action-btn ${action.type || side}-btn"
                        onclick=${(e) => {
                            console.log('🔥 CLICK:', action.icon, action.label);
                            e.stopPropagation();
                            e.preventDefault();
                            action.action(userId);
                            setSwipeState(null);
                            setSwipeProgress(0);
                        }}
                        title="${action.icon} ${action.label}"
                    >
                        ${action.icon}
                    </div>
                `, (action) => `${action.label}-${userId}`)}
            </div>
        `;
        };

        return {
            ontouchstart: handleTouchStart,
            ontouchmove: handleTouchMove,
            ontouchend: handleTouchEnd,
            onmousedown: handleMouseDown,
            onmousemove: handleMouseMove,
            onmouseup: handleMouseUp,
            onmouseleave: handleMouseLeave,
            cardClasses,
            cardClassName,
            leftActions: renderActions(leftActions, 'left', leftActionsStyle),
            rightActions: renderActions(rightActions, 'right', rightActionsStyle)
        };
    }

    // ✅ useClickOutside SIMPLIFICADO
    function useClickOutside(selector, callback) {
        createEffect(() => {
            const handleClick = (e) => {
                const el = document.querySelector(selector);
                if (el && !el.contains(e.target)) callback();
            };
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        });
    }

    // ✅ useDevice
    function useDevice(breakpoint = 768) {
        const [isMobile] = useSignal(window.innerWidth <= breakpoint);
        createEffect(() => {
            const handler = () => isMobile(window.innerWidth <= breakpoint);
            window.addEventListener('resize', handler);
            return () => window.removeEventListener('resize', handler);
        });
        return isMobile;
    }

    function usePullToRefresh(callback) {
        const [refreshing, setRefreshing] = useSignal(false);

        createEffect(() => {
            let startY = 0;
            let pulling = false;

            const handleTouchStart = (e) => {
                startY = e.touches[0].clientY;
            };

            const handleTouchMove = (e) => {
                const currentY = e.touches[0].clientY;
                const deltaY = currentY - startY;

                if (deltaY > 60 && !refreshing()) {
                    setRefreshing(true);
                    callback().finally(() => setRefreshing(false));
                }
            };

            document.addEventListener('touchstart', handleTouchStart);
            document.addEventListener('touchmove', handleTouchMove);

            return () => {
                document.removeEventListener('touchstart', handleTouchStart);
                document.removeEventListener('touchmove', handleTouchMove);
            };
        });

        return refreshing;
    }

    // Exposición FINAL
    window.zDevMobile = {
        useSwipe,
        useStyle,
        useDebounce,
        useClickOutside,
        useDevice,
        usePullToRefresh
    };

    log('✅ zDev Mobile v2.1 - Listo!');
})();


// Más hooks mobile: useBattery, useNetworkStatus, etc.