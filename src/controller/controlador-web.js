// ============================================
// CONTROLADOR WEB - Lógica de negocio web
// ============================================
// Maneja todas las rutas y procesamiento web
// Separa la lógica de negocio de la vista

const fs = require('fs');
const path = require('path');
const url = require('url');

// Importar funciones del controlador principal
const { obtenerArchivosTXT, cargarDatosDesdeArchivo } = require('./controlador');

class ControladorWeb {
    constructor() {
        // Configuración del controlador web
        this.rutaReportes = path.join(__dirname, '../../reportes-html');
    }

    // === ENRUTADOR PRINCIPAL ===
    manejarSolicitud(request, response) {
        const urlParsed = url.parse(request.url, true);
        const ruta = urlParsed.pathname;
        
        console.log(`📥 Solicitud recibida: ${request.method} ${ruta}`);

        try {
            // Sistema de enrutamiento
            if (ruta === '/' || ruta === '/index.html') {
                this.servirPaginaPrincipal(response);
            } else if (ruta === '/api/archivos') {
                this.obtenerListaArchivos(response);
            } else if (ruta.startsWith('/api/procesar/')) {
                const nombreArchivo = ruta.split('/api/procesar/')[1];
                this.procesarArchivo(nombreArchivo, response);
            } else if (ruta.startsWith('/reportes-html/')) {
                this.servirReporteHTML(ruta, response);
            } else {
                this.responder404(response);
            }
        } catch (error) {
            console.error('❌ Error en controlador web:', error);
            this.responderError(response, error.message);
        }
    }

    // === RUTA: PÁGINA PRINCIPAL ===
    servirPaginaPrincipal(response) {
        // Delegar a la vista para generar HTML
        const VistaWeb = require('../view/vista-web');
        const vista = new VistaWeb();
        const html = vista.generarPaginaPrincipal();
        
        this.enviarRespuestaHTML(response, html);
    }

    // === API: OBTENER LISTA DE ARCHIVOS ===
    obtenerListaArchivos(response) {
        try {
            console.log('📂 Obteniendo lista de archivos...');
            const archivos = obtenerArchivosTXT();
            
            const resultado = {
                success: true,
                archivos: archivos,
                total: archivos.length
            };
            
            this.enviarRespuestaJSON(response, resultado);
            
        } catch (error) {
            console.error('❌ Error al obtener archivos:', error);
            this.responderError(response, 'Error al obtener archivos: ' + error.message);
        }
    }

    // === API: PROCESAR ARCHIVO ===
    procesarArchivo(nombreArchivo, response) {
        try {
            console.log(`🔄 Procesando archivo: ${nombreArchivo}`);
            
            // Validar nombre de archivo
            if (!nombreArchivo || nombreArchivo.trim() === '') {
                throw new Error('Nombre de archivo no válido');
            }

            // Procesar usando el controlador principal
            const datos = cargarDatosDesdeArchivo(nombreArchivo);
            
            // Preparar respuesta con estadísticas
            const resultado = {
                success: true,
                archivo: nombreArchivo,
                mensaje: 'Archivo procesado exitosamente',
                datos: {
                    liga: datos.liga.nombre,
                    sede: datos.liga.sede,
                    equipos: datos.liga.equipos.length,
                    jugadores: this.contarJugadores(datos.liga.equipos),
                    partidos: datos.eliminacion ? datos.eliminacion.partidos.length : 0
                },
                reporteHTML: `reporte_${nombreArchivo.replace('.txt', '.html')}`,
                timestamp: new Date().toISOString()
            };
            
            this.enviarRespuestaJSON(response, resultado);
            
        } catch (error) {
            console.error(`❌ Error al procesar ${nombreArchivo}:`, error);
            this.responderError(response, 'Error al procesar archivo: ' + error.message);
        }
    }

    // === SERVIR REPORTES HTML GENERADOS ===
    servirReporteHTML(ruta, response) {
        try {
            const nombreArchivo = path.basename(ruta);
            const rutaCompleta = path.join(this.rutaReportes, nombreArchivo);
            
            console.log(`📄 Sirviendo reporte: ${rutaCompleta}`);
            
            if (fs.existsSync(rutaCompleta)) {
                const contenido = fs.readFileSync(rutaCompleta, 'utf8');
                this.enviarRespuestaHTML(response, contenido);
            } else {
                console.log(`❌ Reporte no encontrado: ${rutaCompleta}`);
                this.responder404(response, 'Reporte HTML no encontrado');
            }
            
        } catch (error) {
            console.error('❌ Error al servir reporte:', error);
            this.responderError(response, 'Error al servir reporte: ' + error.message);
        }
    }

    // === UTILIDADES DE RESPUESTA ===
    enviarRespuestaHTML(response, html) {
        response.writeHead(200, { 
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache'
        });
        response.end(html);
    }

    enviarRespuestaJSON(response, datos) {
        const json = JSON.stringify(datos, null, 2);
        response.writeHead(200, { 
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
        });
        response.end(json);
    }

    responder404(response, mensaje = 'Página no encontrada') {
        const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>404 - No encontrado</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { color: #dc2626; }
            </style>
        </head>
        <body>
            <h1 class="error">404 - ${mensaje}</h1>
            <p><a href="/">← Volver al inicio</a></p>
        </body>
        </html>`;
        
        response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(html);
    }

    responderError(response, mensaje) {
        const error = { 
            success: false, 
            error: mensaje,
            timestamp: new Date().toISOString()
        };
        
        response.writeHead(500, { 
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        });
        response.end(JSON.stringify(error, null, 2));
    }

    // === MÉTODOS AUXILIARES ===
    contarJugadores(equipos) {
        return equipos.reduce((total, equipo) => total + equipo.jugadores.length, 0);
    }

    validarNombreArchivo(nombre) {
        return nombre && 
               typeof nombre === 'string' && 
               nombre.trim().length > 0 && 
               nombre.endsWith('.txt');
    }

    // === INFORMACIÓN DEL SISTEMA ===
    obtenerEstadisticas() {
        try {
            const archivos = obtenerArchivosTXT();
            return {
                totalArchivos: archivos.length,
                archivosDisponibles: archivos,
                rutaReportes: this.rutaReportes,
                servidor: 'Node.js',
                version: process.version
            };
        } catch (error) {
            return {
                error: 'No se pudieron obtener estadísticas',
                detalle: error.message
            };
        }
    }
}

module.exports = ControladorWeb;