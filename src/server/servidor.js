const http = require('http');
const ControladorWeb = require('../controller/controlador-web');

class Servidor {
    constructor(puerto = 3000) {
        this.puerto = puerto;
        this.servidor = null;
        this.controlador = new ControladorWeb();
        this.estadisticas = {
            solicitudesTotal: 0,
            iniciadoEn: null,
            ultimaSolicitud: null
        };
    }

    iniciar() {
        return new Promise((resolve, reject) => {
            try {
                this.servidor = http.createServer((request, response) => {
                    this.manejarConexion(request, response);
                });
                this.configurarEventos();
                this.servidor.listen(this.puerto, () => {
                    this.estadisticas.iniciadoEn = new Date();
                    this.mostrarBanner();
                    resolve(this.puerto);
                });
            } catch (error) {
                console.error('❌ Error al iniciar servidor:', error);
                reject(error);
            }
        });
    }

    manejarConexion(request, response) {
        this.estadisticas.solicitudesTotal++;
        this.estadisticas.ultimaSolicitud = new Date();
        this.configurarHeadersComunes(response);
        this.logSolicitud(request);

        try {
            this.controlador.manejarSolicitud(request, response);
        } catch (error) {
            console.error('❌ Error en servidor HTTP:', error);
            this.responderErrorServidor(response, error);
        }
    }

    configurarEventos() {
        this.servidor.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Puerto ${this.puerto} ya está en uso`);
                console.log('💡 Intenta con otro puerto o cierra la aplicación que lo está usando');
            } else {
                console.error('❌ Error del servidor:', error);
            }
        });

        this.servidor.on('close', () => {
            console.log('🔴 Servidor cerrado');
        });

        process.on('SIGINT', () => {
            console.log('\n🔄 Cerrando servidor...');
            this.detener();
        });

        process.on('SIGTERM', () => {
            console.log('\n🔄 Cerrando servidor...');
            this.detener();
        });
    }

    configurarHeadersComunes(response) {
        response.setHeader('X-Powered-By', 'Node.js Custom Server');
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('X-Frame-Options', 'DENY');
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    logSolicitud(request) {
        const timestamp = new Date().toISOString();
        const metodo = request.method;
        const url = request.url;
        const ip = request.connection.remoteAddress || 'unknown';
        console.log(`📥 [${timestamp}] ${metodo} ${url} - ${ip}`);
    }

    responderErrorServidor(response, error) {
        const errorResponse = {
            success: false,
            error: 'Error interno del servidor',
            message: 'Ha ocurrido un error inesperado',
            timestamp: new Date().toISOString()
        };

        try {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(errorResponse));
        } catch (writeError) {
            console.error('❌ Error al escribir respuesta de error:', writeError);
            response.end('Error interno del servidor');
        }
    }

    detener() {
        return new Promise((resolve) => {
            if (this.servidor) {
                this.servidor.close(() => {
                    console.log('✅ Servidor detenido correctamente');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    obtenerEstadisticas() {
        const tiempoActivo = this.estadisticas.iniciadoEn 
            ? Date.now() - this.estadisticas.iniciadoEn.getTime()
            : 0;

        return {
            puerto: this.puerto,
            activo: !!this.servidor,
            iniciadoEn: this.estadisticas.iniciadoEn,
            tiempoActivoMs: tiempoActivo,
            solicitudesTotal: this.estadisticas.solicitudesTotal,
            ultimaSolicitud: this.estadisticas.ultimaSolicitud,
            memoria: process.memoryUsage(),
            version: process.version
        };
    }

    mostrarBanner() {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 SERVIDOR WEB INICIADO CORRECTAMENTE');
        console.log('='.repeat(60));
        console.log(`📡 Puerto: ${this.puerto}`);
        console.log(`🌐 URL: http://localhost:${this.puerto}`);
        console.log(`⏰ Iniciado: ${this.estadisticas.iniciadoEn.toLocaleString()}`);
        console.log(`📊 Node.js: ${process.version}`);
        console.log(`💾 Memoria: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
        console.log('='.repeat(60));
        console.log('💡 Abre tu navegador y ve a la URL para usar la aplicación');
        console.log('🔴 Presiona Ctrl+C para detener el servidor');
        console.log('='.repeat(60) + '\n');
    }

    obtenerInfo() {
        return {
            nombre: 'Servidor de Análisis de Torneos',
            version: '1.0.0',
            puerto: this.puerto,
            tecnologia: 'Node.js HTTP Server',
            patron: 'MVC (Model-View-Controller)',
            estadisticas: this.obtenerEstadisticas()
        };
    }
}

// Exportar para uso como módulo
module.exports = { Servidor, iniciarServidor };

// Ejecución directa
if (require.main === module) {
    const args = process.argv.slice(2);
    const puertoArg = args.find(arg => arg.startsWith('--puerto='));
    const puerto = puertoArg ? parseInt(puertoArg.split('=')[1]) : 3000;
    iniciarServidor(puerto);
}

async function iniciarServidor(puerto = 3001) {
    console.log('🔄 Iniciando servidor...\n');
    try {
        const servidor = new Servidor(puerto);
        await servidor.iniciar();
        return servidor;
    } catch (error) {
        console.error('❌ No se pudo iniciar el servidor:', error.message);
        if (error.code === 'EADDRINUSE') {
            console.log(`💡 Prueba con otro puerto: node servidor.js --puerto ${puerto + 1}`);
        }
        process.exit(1);
    }
}
