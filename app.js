// ============================================
// ARCHIVO DE INICIO - Punto de entrada principal
// ============================================
// Inicia el servidor web con la nueva estructura MVC

const { iniciarServidor } = require('./src/server/servidor');

// Configuración por defecto
const PUERTO_DEFAULT = 3000;

// Función principal
async function main() {
    console.log('🔄 Iniciando aplicación...\n');
    
    try {
        // Obtener puerto de argumentos de línea de comandos
        const args = process.argv.slice(2);
        const puertoArg = args.find(arg => arg.startsWith('--puerto='));
        const puerto = puertoArg ? parseInt(puertoArg.split('=')[1]) : PUERTO_DEFAULT;
        
        // Validar puerto
        if (isNaN(puerto) || puerto < 1000 || puerto > 65535) {
            throw new Error(`Puerto inválido: ${puerto}. Debe estar entre 1000 y 65535.`);
        }
        
        // Iniciar servidor
        const servidor = await iniciarServidor(puerto);
        
        console.log('🎉 Aplicación iniciada correctamente');
        console.log(`📖 Documentación: El servidor usa el patrón MVC separando:`);
        console.log(`   • Modelo: src/model/modelo.js (clases de datos)`);
        console.log(`   • Vista: src/view/vista-web.js (HTML/CSS/JS)`);
        console.log(`   • Controlador: src/controller/controlador-web.js (lógica web)`);
        console.log(`   • Servidor: src/server/servidor.js (HTTP server)`);
        
    } catch (error) {
        console.error('❌ Error al iniciar la aplicación:', error.message);
        process.exit(1);
    }
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rechazada no manejada:', reason);
    process.exit(1);
});

// Ejecutar aplicación
if (require.main === module) {
    main();
}

module.exports = { main };