// zdev.all.js - Magic import ALL
(function() {
    const scripts = [
        'zdev-core.js',
        'zdev-hooks.js', 
        'zdev-mobile.js'
    ];
    
    // Carga secuencial automática
    scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;  // Relative o CDN path
        document.head.appendChild(script);
    });
})();