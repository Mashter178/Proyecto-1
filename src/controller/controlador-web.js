const fs = require('fs');
const path = require('path');
const url = require('url');
const { obtenerArchivosTXT, cargarDatosDesdeArchivo, generarReporteHTMLSimple } = require('./controlador');

class ControladorWeb {
    constructor() {
        this.rutaReports = path.join(__dirname, '../../reports');
    }

    manejarSolicitud(request, response) {
        const urlParsed = url.parse(request.url, true);
        const ruta = urlParsed.pathname;
        console.log(`📥 Solicitud recibida: ${request.method} ${ruta}`);
        try {
            if (ruta === '/' || ruta === '/index.html') {
                this.servirPaginaPrincipal(response);
            } else if (ruta === '/api/archivos') {
                this.obtenerListaArchivos(response);
            } else if (ruta.startsWith('/api/procesar/')) {
                const nombreArchivo = ruta.split('/api/procesar/')[1];
                this.procesarArchivo(nombreArchivo, response);
            } else if (ruta.startsWith('/reports/')) {
                this.servirReporteHTML(ruta, response);
            } else {
                this.responder404(response);
            }
        } catch (error) {
            console.error('❌ Error en controlador web:', error);
            this.responderError(response, error.message);
        }
    }

    servirPaginaPrincipal(response) {
        const VistaWeb = require('../view/vista-web');
        const vista = new VistaWeb();
        const html = vista.generarPaginaPrincipal();
        this.enviarRespuestaHTML(response, html);
    }

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

    procesarArchivo(nombreArchivo, response) {
        try {
            console.log(`🔄 Procesando archivo: ${nombreArchivo}`);
            if (!nombreArchivo || nombreArchivo.trim() === '') {
                throw new Error('Nombre de archivo no válido');
            }
            const datos = cargarDatosDesdeArchivo(nombreArchivo);
            const rutaReporte = generarReporteHTMLSimple(datos, nombreArchivo);
            console.log(`📄 Reporte HTML generado: ${rutaReporte}`);
            const resultado = {
                success: true,
                archivo: nombreArchivo,
                mensaje: 'Archivo procesado exitosamente',
                datos: {
                    liga: datos.liga?.nombre || 'N/A',
                    sede: datos.liga?.sede || 'N/A',
                    equipos: datos.liga?.equipos?.length || 0,
                    jugadores: this.contarJugadores(datos.liga?.equipos || []),
                    partidos: datos.eliminatorias?.partidos?.length || 0
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

    servirReporteHTML(ruta, response) {
        try {
            const nombreArchivo = path.basename(ruta);
            const rutaCompleta = path.join(this.rutaReports, nombreArchivo);
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

    validarNombreArchivo(nombre) {
        return nombre && 
               typeof nombre === 'string' && 
               nombre.trim().length > 0 && 
               nombre.endsWith('.txt');
    }

    obtenerEstadisticas() {
        try {
            const archivos = obtenerArchivosTXT();
            return {
                totalArchivos: archivos.length,
                archivosDisponibles: archivos,
                rutaReports: this.rutaReports,
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

    contarJugadores(equipos) {
        if (!equipos || !Array.isArray(equipos)) return 0;
        return equipos.reduce((total, equipo) => {
            return total + (equipo.jugadores?.length || 0);
        }, 0);
    }
}

module.exports = ControladorWeb;