const { iniciarServidor } = require("./src/server/servidor");

const PUERTO_DEFAULT = 3001;

async function main() {
    console.log(" Iniciando aplicación...");
    
    try {
        const args = process.argv.slice(2);
        const puertoArg = args.find(arg => arg.startsWith("--puerto="));
        const puerto = puertoArg ? parseInt(puertoArg.split("=")[1]) : PUERTO_DEFAULT;
        
        if (isNaN(puerto) || puerto < 1000 || puerto > 65535) {
            throw new Error(`Puerto inválido: ${puerto}. Debe estar entre 1000 y 65535.`);
        }
        
        await iniciarServidor(puerto);
        console.log("Aplicación iniciada correctamente");
        
    } catch (error) {
        console.error(" Error al iniciar la aplicación:", error.message);
        process.exit(1);
    }
}

process.on("uncaughtException", (error) => {
    console.error(" Error no capturado:", error);
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error(" Promise rechazada no manejada:", reason);
    process.exit(1);
});

if (require.main === module) {
    main();
}

module.exports = { main };
