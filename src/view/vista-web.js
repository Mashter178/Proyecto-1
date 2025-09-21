// ============================================
// VISTA WEB - Solo generación de HTML/CSS/JS
// ============================================
// Responsabilidad única: Generar interfaz de usuario
// No contiene lógica de negocio

class VistaWeb {
    constructor() {
        this.titulo = '🏆 Analizador de Torneos';
        this.descripcion = 'Sistema de análisis léxico y procesamiento de datos deportivos';
    }

    // === GENERAR PÁGINA PRINCIPAL COMPLETA ===
    generarPaginaPrincipal() {
        return `<!DOCTYPE html>
<html lang="es">
<head>
    ${this.generarHead()}
    ${this.generarEstilos()}
</head>
<body>
    <div class="container">
        ${this.generarHeader()}
        ${this.generarPanelControl()}
        ${this.generarAreaResultados()}
    </div>
    
    ${this.generarJavaScript()}
</body>
</html>`;
    }

    // === SECCIÓN HEAD ===
    generarHead() {
        return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.titulo}</title>
    <meta name="description" content="${this.descripcion}">
    <meta name="author" content="Sistema de Análisis de Torneos">`;
    }

    // === ESTILOS CSS ===
    generarEstilos() {
        return `
    <style>
        /* === ESTILOS GLOBALES === */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        /* === HEADER === */
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        /* === PANEL DE CONTROL === */
        .control-panel {
            background: #f8fafc;
            padding: 30px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .control-panel h3 {
            color: #374151;
            margin-bottom: 20px;
            font-size: 1.3rem;
        }
        
        .form-group {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        select {
            flex: 1;
            min-width: 250px;
            padding: 12px 15px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            font-size: 16px;
            background: white;
            transition: border-color 0.3s ease;
        }
        
        select:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        
        button {
            padding: 12px 25px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        }
        
        .btn-secondary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
        }
        
        button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        /* === ÁREA DE RESULTADOS === */
        .results-area {
            padding: 30px;
            min-height: 200px;
        }
        
        .loading {
            display: none;
            text-align: center;
            padding: 40px;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #2563eb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            color: #6b7280;
            font-size: 18px;
        }
        
        .resultado {
            display: none;
            animation: fadeIn 0.5s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .alert {
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            font-weight: 500;
        }
        
        .alert-error {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }
        
        .alert-success {
            background: #f0fdf4;
            color: #16a34a;
            border: 1px solid #bbf7d0;
        }
        
        .alert-info {
            background: #eff6ff;
            color: #2563eb;
            border: 1px solid #bfdbfe;
        }
        
        .datos-procesados {
            background: #f8fafc;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .datos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .dato-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .dato-valor {
            font-size: 2rem;
            font-weight: bold;
            color: #2563eb;
        }
        
        .dato-label {
            font-size: 0.9rem;
            color: #6b7280;
            margin-top: 5px;
        }
        
        /* === RESPONSIVE === */
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 10px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .control-panel {
                padding: 20px;
            }
            
            .form-group {
                flex-direction: column;
                align-items: stretch;
            }
            
            select, button {
                width: 100%;
            }
            
            .datos-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>`;
    }

    // === HEADER === 
    generarHeader() {
        return `
        <div class="header">
            <h1>${this.titulo}</h1>
            <p>${this.descripcion}</p>
        </div>`;
    }

    // === PANEL DE CONTROL ===
    generarPanelControl() {
        return `
        <div class="control-panel">
            <h3>📁 Seleccionar Archivo para Procesar</h3>
            <div class="form-group">
                <select id="archivoSelect">
                    <option value="">Cargando archivos...</option>
                </select>
                <button id="procesarBtn" class="btn-primary" onclick="procesarArchivo()" disabled>
                    🔄 Procesar Archivo
                </button>
                <button id="verReporteBtn" class="btn-secondary" onclick="verReporte()" disabled>
                    📊 Ver Reporte HTML
                </button>
            </div>
        </div>`;
    }

    // === ÁREA DE RESULTADOS ===
    generarAreaResultados() {
        return `
        <div class="results-area">
            <div id="loading" class="loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">⏳ Procesando archivo... Por favor espera...</div>
            </div>

            <div id="resultado" class="resultado">
                <!-- Aquí aparecerán los resultados -->
            </div>
        </div>`;
    }

    // === JAVASCRIPT DEL CLIENTE ===
    generarJavaScript() {
        return `
    <script>
        // === VARIABLES GLOBALES ===
        let archivoSeleccionado = '';
        let ultimoProcesamiento = null;
        
        // === INICIALIZACIÓN ===
        window.onload = function() {
            console.log('🚀 Iniciando aplicación web...');
            cargarListaArchivos();
            configurarEventos();
        };
        
        // === CONFIGURAR EVENTOS ===
        function configurarEventos() {
            const select = document.getElementById('archivoSelect');
            select.onchange = manejarSeleccionArchivo;
            
            // Teclas de acceso rápido
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'Enter') {
                    procesarArchivo();
                }
            });
        }
        
        // === CARGAR LISTA DE ARCHIVOS ===
        function cargarListaArchivos() {
            console.log('📂 Cargando lista de archivos...');
            
            fetch('/api/archivos')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error ' + response.status + ': ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        mostrarArchivosEnSelect(data.archivos);
                    } else {
                        throw new Error(data.error || 'Error desconocido');
                    }
                })
                .catch(error => {
                    console.error('❌ Error al cargar archivos:', error);
                    mostrarError('Error al cargar archivos: ' + error.message);
                    
                    // Mostrar select vacío con mensaje de error
                    const select = document.getElementById('archivoSelect');
                    select.innerHTML = '<option value="">Error al cargar archivos</option>';
                });
        }
        
        // === MOSTRAR ARCHIVOS EN SELECT ===
        function mostrarArchivosEnSelect(archivos) {
            const select = document.getElementById('archivoSelect');
            select.innerHTML = '<option value="">Selecciona un archivo...</option>';
            
            if (archivos.length === 0) {
                select.innerHTML = '<option value="">No hay archivos .txt disponibles</option>';
                return;
            }
            
            archivos.forEach(archivo => {
                const option = document.createElement('option');
                option.value = archivo;
                option.textContent = archivo;
                select.appendChild(option);
            });
            
            console.log('✅ Archivos cargados:', archivos.length);
        }
        
        // === MANEJAR SELECCIÓN DE ARCHIVO ===
        function manejarSeleccionArchivo() {
            const select = document.getElementById('archivoSelect');
            archivoSeleccionado = select.value;
            
            const procesarBtn = document.getElementById('procesarBtn');
            const verReporteBtn = document.getElementById('verReporteBtn');
            
            procesarBtn.disabled = !archivoSeleccionado;
            verReporteBtn.disabled = !archivoSeleccionado;
            
            if (archivoSeleccionado) {
                console.log('📄 Archivo seleccionado:', archivoSeleccionado);
                ocultarResultado();
            }
        }
        
        // === PROCESAR ARCHIVO ===
        function procesarArchivo() {
            if (!archivoSeleccionado) {
                mostrarError('Por favor selecciona un archivo');
                return;
            }
            
            console.log('🔄 Iniciando procesamiento de:', archivoSeleccionado);
            mostrarLoading(true);
            ocultarResultado();
            
            const tiempoInicio = Date.now();
            
            fetch('/api/procesar/' + encodeURIComponent(archivoSeleccionado))
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error ' + response.status + ': ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    const tiempoTotal = Date.now() - tiempoInicio;
                    mostrarLoading(false);
                    
                    if (data.success) {
                        ultimoProcesamiento = data;
                        mostrarResultadoExitoso(data, tiempoTotal);
                        habilitarVerReporte(true);
                    } else {
                        throw new Error(data.error || 'Error desconocido en el procesamiento');
                    }
                })
                .catch(error => {
                    mostrarLoading(false);
                    console.error('❌ Error al procesar:', error);
                    mostrarError('Error al procesar archivo: ' + error.message);
                    habilitarVerReporte(false);
                });
        }
        
        // === VER REPORTE HTML ===
        function verReporte() {
            if (!ultimoProcesamiento) {
                mostrarError('Por favor procesa un archivo primero');
                return;
            }
            
            const urlReporte = '/reportes-html/' + ultimoProcesamiento.reporteHTML;
            console.log('📊 Abriendo reporte:', urlReporte);
            
            // Abrir en nueva ventana
            const ventana = window.open(urlReporte, '_blank');
            
            if (!ventana) {
                mostrarError('No se pudo abrir el reporte. Verifica que los pop-ups estén permitidos.');
            }
        }
        
        // === UTILIDADES DE INTERFAZ ===
        function mostrarLoading(mostrar) {
            const loading = document.getElementById('loading');
            loading.style.display = mostrar ? 'block' : 'none';
        }
        
        function ocultarResultado() {
            const resultado = document.getElementById('resultado');
            resultado.style.display = 'none';
        }
        
        function mostrarError(mensaje) {
            const resultado = document.getElementById('resultado');
            resultado.innerHTML = '<div class="alert alert-error">❌ ' + mensaje + '</div>';
            resultado.style.display = 'block';
        }
        
        function mostrarResultadoExitoso(data, tiempo) {
            const html = \`
                <div class="alert alert-success">
                    ✅ Archivo procesado exitosamente en \${tiempo}ms
                </div>
                
                <div class="datos-procesados">
                    <h4>📊 Datos Procesados: \${data.archivo}</h4>
                    <div class="datos-grid">
                        <div class="dato-item">
                            <div class="dato-valor">\${data.datos.equipos}</div>
                            <div class="dato-label">Equipos</div>
                        </div>
                        <div class="dato-item">
                            <div class="dato-valor">\${data.datos.jugadores}</div>
                            <div class="dato-label">Jugadores</div>
                        </div>
                        <div class="dato-item">
                            <div class="dato-valor">\${data.datos.partidos}</div>
                            <div class="dato-label">Partidos</div>
                        </div>
                    </div>
                    
                    <div class="alert alert-info" style="margin-top: 20px;">
                        🏆 Liga: <strong>\${data.datos.liga}</strong><br>
                        📍 Sede: <strong>\${data.datos.sede}</strong>
                    </div>
                </div>
            \`;
            
            const resultado = document.getElementById('resultado');
            resultado.innerHTML = html;
            resultado.style.display = 'block';
        }
        
        function habilitarVerReporte(habilitar) {
            const btn = document.getElementById('verReporteBtn');
            btn.disabled = !habilitar;
        }
        
        // === UTILIDADES ADICIONALES ===
        function formatearTiempo(ms) {
            if (ms < 1000) return ms + 'ms';
            return (ms / 1000).toFixed(1) + 's';
        }
        
        console.log('📱 JavaScript de la vista cargado correctamente');
    </script>`;
    }

    // === GENERAR PÁGINAS ESPECÍFICAS ===
    generarPaginaError(codigo, mensaje) {
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Error ${codigo}</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #dc2626; font-size: 3rem; margin-bottom: 20px; }
        .mensaje { font-size: 1.2rem; color: #6b7280; }
        .enlace { margin-top: 30px; }
        .enlace a { color: #2563eb; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="error">${codigo}</div>
    <div class="mensaje">${mensaje}</div>
    <div class="enlace">
        <a href="/">← Volver al inicio</a>
    </div>
</body>
</html>`;
    }
}

module.exports = VistaWeb;