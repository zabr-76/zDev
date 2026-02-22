// dist/zdev.all.js - 🎯 SINGLE IMPORT (TU estilo)
(function() {
    // Carga secuencial automática
    const scripts = [
        'https://cdn.jsdelivr.net/gh/zabr-76/zDev@latest/dist/zdev-core.js',
        'https://cdn.jsdelivr.net/gh/zabr-76/zDev@latest/dist/zdev-hooks.js',
        'https://cdn.jsdelivr.net/gh/zabr-76/zDev@latest/dist/zdev-mobile.js'
    ];
    
    let loaded = 0;
    const total = scripts.length;
    
    const onLoad = () => {
        loaded++;
        if (loaded === total) {
            // 🔥 COMBINA TODO (como sugirió tu compañero)
            window.zDev = {
                ...window.zDevCore,
                ...window.zDevHooks,
                ...window.zDevMobile
            };
            
            // Backward compatibility
            window.zDevCore = window.zDev;
            window.zDevHooks = window.zDev;
            window.zDevMobile = window.zDev;
            
            console.log('🚀 zDev ALL loaded:', Object.keys(window.zDev));
        }
    };
    
    scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = onLoad;
        document.head.appendChild(script);
    });
})();