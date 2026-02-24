import axios from 'axios';

const URL = `https://${process.env.REPLIT_DEV_DOMAIN}/ping`;
let firstPing = true;

console.log(`🚀 Sistema de Auto-Ping iniciado para: ${URL}`);

// Función para el ping continuo y reinicio proactivo
const startPing = () => {
    setInterval(async () => {
        try {
            // Ping interno
            await axios.get(URL);
            
            // Ping externo para asegurar que la red externa vea tráfico
            // Usamos una URL muy ligera y confiable
            await axios.get('https://www.google.com/favicon.ico').catch(() => {});

            if (firstPing) {
                console.log(`📡 Sistema de supervivencia 24/7 activo.`);
                console.log(`🌐 Monitoreando: ${URL}`);
                firstPing = false;
            }

            const uptime = process.uptime();
            if (uptime > 43200) { 
                console.log('🔄 Reinicio preventivo programado (12h)...');
                process.exit(0);
            }
        } catch (error) {
            // Re-intentar inmediatamente si falla
        }
    }, 60000); // Reducido a 1 minuto para mayor agresividad
};

// Manejo de señales para reinicio preventivo con inteligencia avanzada
const handleShutdown = () => {
    // Escuchar múltiples señales de terminación
    ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGQUIT'].forEach(signal => {
        process.on(signal, async () => {
            console.log(`⚠️ Alerta: Señal ${signal} detectada. El sistema está intentando apagar el bot.`);
            console.log('🔄 Iniciando secuencia de guardado y reinicio rápido...');
            
            // Intentar cerrar conexiones de forma segura pero rápida
            try {
                // Si el pool de la DB existe, intentar cerrarlo (con timeout corto)
                if (typeof pool !== 'undefined' && pool.end) {
                    await Promise.race([
                        pool.end(),
                        new Promise(resolve => setTimeout(resolve, 500))
                    ]);
                }
            } catch (e) {}
            
            console.log('🚀 Reiniciando ahora mismo...');
            process.exit(0); // Salida 0 le dice al orquestador que debe reiniciar el proceso
        });
    });

    // Detectar cuando el bucle de eventos se queda colgado (posible congelamiento)
    let lastTick = Date.now();
    setInterval(() => {
        const now = Date.now();
        if (now - lastTick > 3000) { // Si pasan más de 3 segundos entre ticks
            console.warn('⚡ Advertencia: Retraso en el bucle de eventos detectado. Posible inestabilidad.');
        }
        lastTick = now;
    }, 1000);
};

startPing();
handleShutdown();
