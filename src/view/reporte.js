const fs = require('fs');
const path = require('path');

function generarReporteHTMLSimple(datos, nombreArchivo) {
    try {
        const { liga, eliminatorias, bracketEmbebido } = datos;
        const { calcularEstadisticasTorneo, calcularPromedioEdad, calcularTotalGoles, 
                        calcularPromedioEdadEquipo, obtenerFaseActualTorneo } = require('../controller/estadisticas');
        const { generarBracketHTML, generarTablaEstadisticasEquipos, 
                        generarTablaGoleadores } = require('../utils/helpers');
        const estadisticas = calcularEstadisticasTorneo(datos);
        const totalJugadores = liga?.equipos?.reduce((total, equipo) => total + (equipo.jugadores?.length || 0), 0) || 0;
        const promedioEdad = calcularPromedioEdad(liga?.equipos || []);
        const totalGoles = calcularTotalGoles(eliminatorias);
        const promedioGolesPorPartido = eliminatorias?.partidos?.length > 0 ? (totalGoles / eliminatorias.partidos.length).toFixed(1) : 0;
        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte Completo - ${liga?.nombre || 'Torneo'}</title>
        <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        line-height: 1.6; 
                        color: #333; 
                        background: #f5f5f5; 
                        padding: 20px; 
                }
                .container { 
                        max-width: 1200px; 
                        margin: 0 auto; 
                        background: white; 
                        padding: 30px; 
                        border-radius: 10px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                }
                .header { 
                        text-align: center; 
                        margin-bottom: 40px; 
                        padding: 20px; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        border-radius: 10px; 
                }
                .header h1 { font-size: 2.5em; margin-bottom: 10px; }
                .section { 
                        margin-bottom: 40px; 
                        background: #fafafa; 
                        padding: 25px; 
                        border-radius: 8px; 
                        border: 1px solid #e0e0e0; 
                }
                .section h2 { 
                        color: #4a4a4a; 
                        margin-bottom: 20px; 
                        font-size: 1.8em; 
                        border-bottom: 3px solid #667eea; 
                        padding-bottom: 10px; 
                }
                .stats-grid { 
                        display: grid; 
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                        gap: 15px; 
                        margin-bottom: 25px; 
                }
                .stat-card { 
                        background: white; 
                        padding: 20px; 
                        border-radius: 8px; 
                        text-align: center; 
                        border: 1px solid #e0e0e0; 
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
                }
                .stat-value { 
                        font-size: 2.2em; 
                        font-weight: bold; 
                        color: #667eea; 
                        display: block; 
                }
                .stat-label { 
                        color: #666; 
                        font-size: 0.9em; 
                        margin-top: 5px; 
                }
                table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 20px; 
                        background: white; 
                        border-radius: 8px; 
                        overflow: hidden; 
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
                }
                th, td { 
                        padding: 12px; 
                        text-align: left; 
                        border-bottom: 1px solid #ddd; 
                }
                th { 
                        background: #667eea; 
                        color: white; 
                        font-weight: 600; 
                }
                tr:hover { background-color: #f8f9fa; }
                .bracket { 
                        display: flex; 
                        justify-content: space-around; 
                        align-items: center; 
                        margin: 20px 0; 
                        flex-wrap: wrap; 
                }
                .fase { 
                        text-align: center; 
                        margin: 10px; 
                        min-width: 200px; 
                }
                .fase h4 { 
                        background: #667eea; 
                        color: white; 
                        padding: 10px; 
                        border-radius: 5px 5px 0 0; 
                        margin: 0; 
                }
                .partidos-fase { 
                        background: white; 
                        border: 2px solid #667eea; 
                        border-radius: 0 0 5px 5px; 
                        padding: 15px; 
                }
                .partido-bracket { 
                        margin: 8px 0; 
                        padding: 8px; 
                        background: #f8f9fa; 
                        border-radius: 4px; 
                        border-left: 4px solid #28a745; 
                }
                .equipo-ganador { 
                        font-weight: bold; 
                        color: #28a745; 
                }
                .equipos-grid { 
                        display: grid; 
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                        gap: 20px; 
                }
                .equipo-card { 
                        background: white; 
                        padding: 20px; 
                        border-radius: 8px; 
                        border: 1px solid #e0e0e0; 
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
                }
                .equipo-card h3 { 
                        color: #667eea; 
                        margin-bottom: 15px; 
                        font-size: 1.3em; 
                }
                .badge { 
                        display: inline-block; 
                        padding: 4px 8px; 
                        border-radius: 12px; 
                        font-size: 0.8em; 
                        font-weight: bold; 
                        margin: 2px; 
                }
                .badge-success { background: #d4edda; color: #155724; }
                .badge-danger { background: #f8d7da; color: #721c24; }
                .badge-warning { background: #fff3cd; color: #856404; }
                .goleador-top { 
                        background: linear-gradient(45deg, #ffd700, #ffed4e); 
                        border: 2px solid #ffd700; 
                }
                footer { 
                        margin-top: 40px; 
                        text-align: center; 
                        color: #666; 
                        border-top: 2px solid #e0e0e0; 
                        padding-top: 20px; 
                }
                @media print { 
                        body { background: white; padding: 0; }
                        .container { box-shadow: none; }
                        .section { break-inside: avoid; }
                }
                @media (max-width: 768px) {
                        .bracket { flex-direction: column; }
                        .stats-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
                }
        </style>
</head>
<body>
        <div class="container">
                <div class="header">
                        <h1>🏆 ${liga?.nombre || 'Torneo'}</h1>
                        <p><strong>📍 Sede:</strong> ${liga?.sede || 'N/A'}</p>
                        <p><strong>📅 Fecha del reporte:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                </div>
                <div class="section">
                        <h2>📊 Resumen General del Torneo</h2>
                        <div class="stats-grid">
                                <div class="stat-card">
                                        <span class="stat-value">${liga?.equipos?.length || 0}</span>
                                        <div class="stat-label">Equipos Participantes</div>
                                </div>
                                <div class="stat-card">
                                        <span class="stat-value">${totalJugadores}</span>
                                        <div class="stat-label">Total Jugadores</div>
                                </div>
                                <div class="stat-card">
                                        <span class="stat-value">${eliminatorias?.partidos?.length || 0}</span>
                                        <div class="stat-label">Partidos Jugados</div>
                                </div>
                                <div class="stat-card">
                                        <span class="stat-value">${totalGoles}</span>
                                        <div class="stat-label">Total de Goles</div>
                                </div>
                                <div class="stat-card">
                                        <span class="stat-value">${promedioGolesPorPartido}</span>
                                        <div class="stat-label">Promedio Goles/Partido</div>
                                </div>
                                <div class="stat-card">
                                        <span class="stat-value">${promedioEdad}</span>
                                        <div class="stat-label">Edad Promedio</div>
                                </div>
                        </div>
                </div>
                <div class="section">
                        <h2>📈 Estadísticas Completas del Torneo</h2>
                        <table style="margin-bottom: 20px;">
                                <thead>
                                        <tr>
                                                <th style="background: #667eea; color: white;">Estadística</th>
                                                <th style="background: #667eea; color: white;">Valor</th>
                                        </tr>
                                </thead>
                                <tbody>
                                        <tr>
                                                <td><strong>Nombre del Torneo</strong></td>
                                                <td>${liga?.nombre || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                                <td><strong>Sede</strong></td>
                                                <td>${liga?.sede || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                                <td><strong>Equipos Participantes</strong></td>
                                                <td>${liga?.equipos?.length || 0}</td>
                                        </tr>
                                        <tr>
                                                <td><strong>Total de Partidos Programados</strong></td>
                                                <td>${eliminatorias?.partidos?.length || 0}</td>
                                        </tr>
                                        <tr>
                                                <td><strong>Partidos Completados</strong></td>
                                                <td>${eliminatorias?.partidos?.filter(p => p.resultado && p.resultado !== 'Pendiente').length || 0}</td>
                                        </tr>
                                        <tr>
                                                <td><strong>Total de Goles</strong></td>
                                                <td>${totalGoles}</td>
                                        </tr>
                                        <tr>
                                                <td><strong>Promedio de Goles por Partido</strong></td>
                                                <td>${promedioGolesPorPartido}</td>
                                        </tr>
                                        <tr>
                                                <td><strong>Edad Promedio de Jugadores</strong></td>
                                                <td>${promedioEdad} años</td>
                                        </tr>
                                        <tr>
                                                <td><strong>Fase Actual</strong></td>
                                                <td>${obtenerFaseActualTorneo(eliminatorias)}</td>
                                        </tr>
                                </tbody>
                        </table>
                </div>
                <div class="section">
                        <h2>🏟️ Bracket de Eliminación</h2>
                        ${generarBracketHTML(eliminatorias)}
                </div>
                <div class="section">
                        <h2>📈 Estadísticas por Equipo</h2>
                        ${generarTablaEstadisticasEquipos(estadisticas?.equipos || [])}
                </div>
                <div class="section">
                        <h2>⚽ Tabla de Goleadores</h2>
                        ${generarTablaGoleadores(estadisticas?.goleadores || [])}
                </div>
                <div class="section">
                        <h2>👥 Equipos Participantes</h2>
                        <div class="equipos-grid">
                                ${liga?.equipos?.map(equipo => `
                                        <div class="equipo-card">
                                                <h3>${equipo.nombre}</h3>
                                                <p><strong>Jugadores:</strong> ${equipo.jugadores?.length || 0}</p>
                                                <p><strong>Edad Promedio:</strong> ${calcularPromedioEdadEquipo(equipo.jugadores || [])} años</p>
                                                <details style="margin-top: 10px;">
                                                        <summary style="cursor: pointer; font-weight: bold;">👥 Ver plantilla completa</summary>
                                                        <div style="margin-top: 10px;">
                                                                ${equipo.jugadores?.map(jugador => `
                                                                        <div style="padding: 5px; border-bottom: 1px solid #eee;">
                                                                                <strong>${jugador.nombre}</strong> 
                                                                                <span class="badge badge-warning">#${jugador.dorsal || 'N/A'}</span>
                                                                                <span class="badge badge-info" style="background: #d1ecf1; color: #0c5460;">${jugador.posicion || 'Sin posición'}</span>
                                                                                <span style="color: #666;">(${jugador.edad || 'N/A'} años)</span>
                                                                        </div>
                                                                `).join('') || '<p>No hay jugadores registrados</p>'}
                                                        </div>
                                                </details>
                                        </div>
                                `).join('') || '<p>No hay equipos registrados</p>'}
                        </div>
                </div>
                <div style="background: white; padding: 20px; border-radius: 10px; margin: 30px 0; border: 2px solid #9C27B0; text-align: center;">
                        <h2 style="color: #9C27B0; margin-bottom: 20px;">🏆 Bracket del Torneo</h2>
                        <div style="overflow-x: auto; max-width: 100%;">
                                ${bracketEmbebido || '<p style="color: #dc3545;">Bracket no disponible</p>'}
                        </div>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 30px 0; border: 2px solid #007bff;">
                        <h2 style="color: #007bff; margin-bottom: 15px;">📊 Análisis Léxico</h2>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                                <a href="/reports/tokens_${nombreArchivo.replace('.txt', '.html')}" 
                                     style="display: block; padding: 15px; background: #007bff; color: white; text-decoration: none; border-radius: 8px; text-align: center; font-weight: bold; transition: background 0.3s ease;">
                                        🔍 Ver Análisis de Tokens
                                </a>
                                <a href="/reports/errores_${nombreArchivo.replace('.txt', '.html')}" 
                                     style="display: block; padding: 15px; background: #dc3545; color: white; text-decoration: none; border-radius: 8px; text-align: center; font-weight: bold; transition: background 0.3s ease;">
                                        ❌ Ver Errores Léxicos
                                </a>
                        </div>
                        <p style="text-align: center; margin-top: 15px; color: #6c757d; font-size: 0.9em;">
                                Haz clic en los enlaces para ver reportes detallados del análisis léxico
                        </p>
                </div>
                <footer>
                        <p><strong>Reporte Completo del Torneo</strong></p>
                        <p>Gestión de Torneos</p>
                </footer>
        </div>
</body>
</html>`;
        const carpetaReports = path.join(__dirname, '../../reports');
        if (!fs.existsSync(carpetaReports)) {
            fs.mkdirSync(carpetaReports, { recursive: true });
        }
        const nombreHTML = `reporte_${nombreArchivo.replace('.txt', '.html')}`;
        const rutaCompleta = path.join(carpetaReports, nombreHTML);
        fs.writeFileSync(rutaCompleta, html, 'utf8');
        return rutaCompleta;
    } catch (error) {
        console.error('Error al generar HTML:', error);
        throw error;
    }
}

function generarReporteTokensHTML(tokens, nombreArchivo) {
    try {
        const { obtenerDescripcionToken } = require('../utils/helpers');
        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Análisis de Tokens - ${nombreArchivo}</title>
        <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        line-height: 1.6; 
                        color: #333; 
                        background: #f8f9fa; 
                        padding: 20px; 
                }
                .container { 
                        max-width: 1400px; 
                        margin: 0 auto; 
                        background: white; 
                        padding: 30px; 
                        border-radius: 10px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                }
                .header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                        padding: 20px; 
                        background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                        color: white; 
                        border-radius: 10px; 
                }
                .header h1 { font-size: 2.2em; margin-bottom: 10px; }
                .stats { 
                        display: grid; 
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                        gap: 15px; 
                        margin-bottom: 30px; 
                }
                .stat-card { 
                        background: #f8f9fa; 
                        padding: 15px; 
                        border-radius: 8px; 
                        text-align: center; 
                        border: 1px solid #e9ecef; 
                }
                .stat-value { 
                        font-size: 1.8em; 
                        font-weight: bold; 
                        color: #28a745; 
                }
                table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 20px; 
                        font-size: 0.95em; 
                }
                th, td { 
                        padding: 10px; 
                        text-align: left; 
                        border-bottom: 1px solid #dee2e6; 
                }
                th { 
                        background: #28a745; 
                        color: white; 
                        font-weight: 600; 
                        position: sticky; 
                        top: 0; 
                }
                tr:hover { background-color: #f8f9fa; }
                .token-reservada { background: #d4edda; color: #155724; }
                .token-normal { background: #d1ecf1; color: #0c5460; }
                .token-texto { background: #fff3cd; color: #856404; }
                .token-numero { background: #f8d7da; color: #721c24; }
                .token-simbolo { background: #e2e3e5; color: #383d41; }
                .token-error { background: #f5c6cb; color: #721c24; }
                .badge { 
                        padding: 4px 8px; 
                        border-radius: 12px; 
                        font-size: 0.8em; 
                        font-weight: bold; 
                }
                .back-link {
                        display: inline-block;
                        margin-bottom: 20px;
                        padding: 10px 15px;
                        background: #007bff;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                }
                .back-link:hover { background: #0056b3; }
                footer { 
                        margin-top: 30px; 
                        text-align: center; 
                        color: #6c757d; 
                        border-top: 1px solid #dee2e6; 
                        padding-top: 15px; 
                }
                @media print { 
                        body { background: white; padding: 0; }
                        .container { box-shadow: none; }
                        .back-link { display: none; }
                }
        </style>
</head>
<body>
        <div class="container">
                <a href="/reports/reporte_${nombreArchivo.replace('.txt', '.html')}" class="back-link">← Volver al Reporte Principal</a>
                <div class="header">
                        <h1>🔍 Análisis de Tokens</h1>
                        <p><strong>Archivo:</strong> ${nombreArchivo}</p>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                </div>
                <div class="stats">
                        <div class="stat-card">
                                <div class="stat-value">${tokens.length}</div>
                                <div>Total de Tokens</div>
                        </div>
                        <div class="stat-card">
                                <div class="stat-value">${tokens.filter(t => t.tipo === 'Palabra Reservada').length}</div>
                                <div>Palabras Reservadas</div>
                        </div>
                        <div class="stat-card">
                                <div class="stat-value">${tokens.filter(t => t.tipo === 'Texto').length}</div>
                                <div>Textos</div>
                        </div>
                        <div class="stat-card">
                                <div class="stat-value">${tokens.filter(t => t.tipo === 'Número').length}</div>
                                <div>Números</div>
                        </div>
                        <div class="stat-card">
                                <div class="stat-value">${tokens.filter(t => t.tipo === 'Símbolo').length}</div>
                                <div>Símbolos</div>
                        </div>
                </div>
                <table>
                        <thead>
                                <tr>
                                        <th style="width: 60px;">No.</th>
                                        <th style="width: 150px;">Lexema</th>
                                        <th style="width: 150px;">Tipo</th>
                                        <th>Descripción</th>
                                        <th style="width: 80px;">Línea</th>
                                        <th style="width: 80px;">Columna</th>
                                </tr>
                        </thead>
                        <tbody>
                                ${tokens.map((token, index) => {
                                        const tipoClass = token.tipo.toLowerCase().replace(' ', '-').replace('ñ', 'n');
                                        const descripcion = obtenerDescripcionToken(token);
                                        return `
                                                <tr>
                                                        <td><strong>${index + 1}</strong></td>
                                                        <td><code>${token.texto}</code></td>
                                                        <td><span class="badge token-${tipoClass}">${token.tipo}</span></td>
                                                        <td>${descripcion}</td>
                                                        <td style="text-align: center;">${token.linea}</td>
                                                        <td style="text-align: center;">${token.columna}</td>
                                                </tr>
                                        `;
                                }).join('')}
                        </tbody>
                </table>
                <footer>
                        <p><strong>Análisis Léxico Completo</strong></p>
                        <p>Generado el ${new Date().toLocaleString('es-ES')}</p>
                </footer>
        </div>
</body>
</html>`;
        const carpetaReports = path.join(__dirname, '../../reports');
        if (!fs.existsSync(carpetaReports)) {
            fs.mkdirSync(carpetaReports, { recursive: true });
        }
        const nombreHTML = `tokens_${nombreArchivo.replace('.txt', '.html')}`;
        const rutaCompleta = path.join(carpetaReports, nombreHTML);
        fs.writeFileSync(rutaCompleta, html, 'utf8');
        return rutaCompleta;
    } catch (error) {
        console.error('Error al generar reporte de tokens:', error);
        throw error;
    }
}

function generarReporteErroresHTML(errores, nombreArchivo) {
    try {
        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Errores Léxicos - ${nombreArchivo}</title>
        <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        line-height: 1.6; 
                        color: #333; 
                        background: #f8f9fa; 
                        padding: 20px; 
                }
                .container { 
                        max-width: 1200px; 
                        margin: 0 auto; 
                        background: white; 
                        padding: 30px; 
                        border-radius: 10px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                }
                .header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                        padding: 20px; 
                        background: ${errores.length > 0 ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'}; 
                        color: white; 
                        border-radius: 10px; 
                }
                .header h1 { font-size: 2.2em; margin-bottom: 10px; }
                .stats { 
                        display: grid; 
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                        gap: 15px; 
                        margin-bottom: 30px; 
                }
                .stat-card { 
                        background: #f8f9fa; 
                        padding: 15px; 
                        border-radius: 8px; 
                        text-align: center; 
                        border: 1px solid #e9ecef; 
                }
                .stat-value { 
                        font-size: 1.8em; 
                        font-weight: bold; 
                        color: ${errores.length > 0 ? '#dc3545' : '#28a745'}; 
                }
                table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 20px; 
                        font-size: 0.95em; 
                }
                th, td { 
                        padding: 12px; 
                        text-align: left; 
                        border-bottom: 1px solid #dee2e6; 
                }
                th { 
                        background: ${errores.length > 0 ? '#dc3545' : '#28a745'}; 
                        color: white; 
                        font-weight: 600; 
                }
                tr:hover { background-color: #f8f9fa; }
                .error-row { background-color: #f8d7da; }
                .success-message { 
                        text-align: center; 
                        padding: 40px; 
                        color: #28a745; 
                        font-size: 1.2em; 
                }
                .success-icon { 
                        font-size: 4em; 
                        margin-bottom: 20px; 
                }
                .back-link {
                        display: inline-block;
                        margin-bottom: 20px;
                        padding: 10px 15px;
                        background: #007bff;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                }
                .back-link:hover { background: #0056b3; }
                footer { 
                        margin-top: 30px; 
                        text-align: center; 
                        color: #6c757d; 
                        border-top: 1px solid #dee2e6; 
                        padding-top: 15px; 
                }
                @media print { 
                        body { background: white; padding: 0; }
                        .container { box-shadow: none; }
                        .back-link { display: none; }
                }
        </style>
</head>
<body>
        <div class="container">
                <a href="/reports/reporte_${nombreArchivo.replace('.txt', '.html')}" class="back-link">← Volver al Reporte Principal</a>
                <div class="header">
                        <h1>${errores.length > 0 ? '❌' : '✅'} Análisis de Errores Léxicos</h1>
                        <p><strong>Archivo:</strong> ${nombreArchivo}</p>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                </div>
                <div class="stats">
                        <div class="stat-card">
                                <div class="stat-value">${errores.length}</div>
                                <div>Total de Errores</div>
                        </div>
                        <div class="stat-card">
                                <div class="stat-value">${errores.length > 0 ? 'FALLIDO' : 'EXITOSO'}</div>
                                <div>Estado del Análisis</div>
                        </div>
                </div>
                ${errores.length === 0 ? `
                        <div class="success-message">
                                <div class="success-icon">✅</div>
                                <h2>¡Análisis Léxico Exitoso!</h2>
                                <p>No se encontraron errores léxicos en el archivo.</p>
                                <p>Todos los tokens fueron reconocidos correctamente.</p>
                        </div>
                ` : `
                        <table>
                                <thead>
                                        <tr>
                                                <th style="width: 60px;">No.</th>
                                                <th style="width: 100px;">Lexema</th>
                                                <th style="width: 120px;">Tipo</th>
                                                <th>Descripción</th>
                                                <th style="width: 80px;">Línea</th>
                                                <th style="width: 80px;">Columna</th>
                                        </tr>
                                </thead>
                                <tbody>
                                        ${errores.map((error, index) => `
                                                <tr class="error-row">
                                                        <td><strong>${index + 1}</strong></td>
                                                        <td><code>${error.caracter}</code></td>
                                                        <td><span style="background: #f5c6cb; color: #721c24; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">Error Léxico</span></td>
                                                        <td>${error.problema}</td>
                                                        <td style="text-align: center;">${error.linea}</td>
                                                        <td style="text-align: center;">${error.columna}</td>
                                                </tr>
                                        `).join('')}
                                </tbody>
                        </table>
                `}
                <footer>
                        <p><strong>Análisis de Errores Léxicos</strong></p>
                        <p>Generado el ${new Date().toLocaleString('es-ES')}</p>
                </footer>
        </div>
</body>
</html>`;
        const carpetaReports = path.join(__dirname, '../../reports');
        if (!fs.existsSync(carpetaReports)) {
            fs.mkdirSync(carpetaReports, { recursive: true });
        }
        const nombreHTML = `errores_${nombreArchivo.replace('.txt', '.html')}`;
        const rutaCompleta = path.join(carpetaReports, nombreHTML);
        fs.writeFileSync(rutaCompleta, html, 'utf8');
        return rutaCompleta;
    } catch (error) {
        console.error('Error al generar reporte de errores:', error);
        throw error;
    }
}

module.exports = {
    generarReporteHTMLSimple,
    generarReporteTokensHTML,
    generarReporteErroresHTML
};
