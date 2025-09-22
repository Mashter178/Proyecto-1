const fs = require('fs');
const path = require('path');
const { Liga, Equipo, Jugador, Eliminacion, Partido } = require('../model/modelo');
const { LexicoSimple } = require('./Lexico');
const GeneradorBracket = require('./Bracket');

// Importar módulos refactorizados
const { parseTorneoSection, parseEquiposSection, parseEliminacionSection } = require('./torneo');
const { calcularEstadisticasTorneo } = require('./estadisticas');
const { generarReporteHTMLSimple, generarReporteTokensHTML, generarReporteErroresHTML } = require('../view/reporte');

/**
 * Obtiene todos los archivos .txt de la carpeta Test
 * @returns {Array} Array de nombres de archivos .txt
 */
function obtenerArchivosTXT(){
  try {
    const carpetaTest = path.join(__dirname, '../../Test');
    const archivos = fs.readdirSync(carpetaTest);
    return archivos.filter(archivo => archivo.endsWith('.txt'));
  } catch (error) {
    console.log('Error: No se pudo leer la carpeta Test:', error.message);
    return [];
  }
}

/**
 * Función principal para cargar y procesar datos de un archivo de torneo
 * @param {string} nombreArchivo - Nombre del archivo a procesar
 * @returns {Object} Objeto con liga, eliminatorias y bracket embebido
 */
function cargarDatosDesdeArchivo(nombreArchivo) {
    console.log(`\n🔄 Procesando archivo: ${nombreArchivo}`);
    const rutaTest = path.join(__dirname, '../../Test');
    const rutaArchivo = path.join(rutaTest, nombreArchivo);
    
    try {
        // Leer archivo
        const contenido = fs.readFileSync(rutaArchivo, 'utf8');
        console.log(`📖 Archivo leído correctamente (${contenido.length} caracteres)`);

        // Análisis léxico
        const analizadorLexico = new LexicoSimple();
        const resultadoLexico = analizadorLexico.analizar(contenido);
        analizadorLexico.mostrarTokens();
        analizadorLexico.mostrarErrores();
        analizadorLexico.guardarReporte(`lexico_${nombreArchivo.replace('.txt', '.txt')}`);

        // Generar reportes léxicos
        try {
            console.log('\n📊 Generando reportes de análisis léxico...');
            const rutaTokens = generarReporteTokensHTML(analizadorLexico.tokens, nombreArchivo);
            console.log(`✅ Reporte de tokens creado: ${rutaTokens}`);
            const rutaErrores = generarReporteErroresHTML(analizadorLexico.errores, nombreArchivo);
            console.log(`✅ Reporte de errores creado: ${rutaErrores}`);
        } catch (error) {
            console.error(`❌ Error al generar reportes léxicos: ${error.message}`);
        }

        if (resultadoLexico.tieneErrores) {
            console.log('\n⚠️  Se encontraron errores léxicos.');
        }

        // Validar estructura del archivo
        const lineas = contenido.split('\n').map(linea => linea.trim()).filter(linea => linea);
        const tieneSeccionTorneo = lineas.some(linea => linea.includes('TORNEO {'));
        const tieneSeccionEquipos = lineas.some(linea => linea.includes('EQUIPOS {'));
        const tieneSeccionEliminacion = lineas.some(linea => linea.includes('ELIMINACION {'));
        
        if (!tieneSeccionTorneo || !tieneSeccionEquipos || !tieneSeccionEliminacion) {
            throw new Error('Estructura de archivo inválida: faltan secciones requeridas');
        }

        // Encontrar índices de secciones
        let indiceTorneo = -1, indiceEquipos = -1, indiceEliminacion = -1;
        for (let i = 0; i < lineas.length; i++) {
            if (lineas[i].includes('TORNEO {')) indiceTorneo = i;
            if (lineas[i].includes('EQUIPOS {')) indiceEquipos = i;
            if (lineas[i].includes('ELIMINACION {')) indiceEliminacion = i;
        }

        // Extraer líneas de cada sección
        const lineasTorneo = lineas.slice(indiceTorneo, indiceEquipos);
        const lineasEquipos = lineas.slice(indiceEquipos, indiceEliminacion);
        const lineasEliminacion = lineas.slice(indiceEliminacion);

        // Parsear secciones usando módulos refactorizados
        const liga = parseTorneoSection(lineasTorneo, contenido);
        const equipos = parseEquiposSection(lineasEquipos);
        const eliminatorias = parseEliminacionSection(lineasEliminacion);

        // Agregar equipos a la liga
        equipos.forEach(equipo => liga.agregarEquipo(equipo));

        // Generar bracket visual
        let bracketEmbebido = '';
        try {
            console.log('\n🎨 Generando bracket visual...');
            const generadorBracket = new GeneradorBracket();
            const rutaBracket = generadorBracket.generarBracketSVG(eliminatorias, liga?.nombre || 'Torneo');
            bracketEmbebido = generadorBracket.generarBracketEmbebido(eliminatorias, liga?.nombre || 'Torneo');
            console.log(`✅ Bracket visual creado: ${rutaBracket}`);
        } catch (error) {
            console.error(`❌ Error al generar bracket: ${error.message}`);
            bracketEmbebido = '<p style="text-align: center; color: #dc3545;">Error al generar bracket visual</p>';
        }

        // Generar reporte HTML principal
        try {
            const rutaHTML = generarReporteHTMLSimple({ liga, eliminatorias, bracketEmbebido }, nombreArchivo);
            console.log(`✅ Reporte HTML creado: ${rutaHTML}`);
        } catch (error) {
            console.error(`❌ Error al generar HTML: ${error.message}`);
        }

        return { liga, eliminatorias, bracketEmbebido };

    } catch (error) {
        console.error(`❌ Error al procesar ${nombreArchivo}:`, error.message);
        throw error;
    }
}

/**
 * Función utilitaria para mostrar datos (debugging)
 * @param {Object} datos - Datos a mostrar
 */
function mostrarDatos(datos) {
    if (!datos) {
        console.log('No hay datos para mostrar');
        return;
    }

    const { liga, eliminatorias } = datos;
    
    if (liga) {
        console.log('\n=== INFORMACIÓN DEL TORNEO ===');
        console.log(`Nombre: ${liga.nombre}`);
        console.log(`Fecha: ${liga.fecha}`);
        console.log(`Género: ${liga.genero}`);
        console.log(`Categoría: ${liga.categoria}`);
        console.log(`Número de equipos: ${liga.equipos.length}`);
        console.log('Equipos:');
        liga.equipos.forEach(equipo => {
            console.log(`  - ${equipo.nombre} (${equipo.jugadores.length} jugadores)`);
        });
    }

    if (eliminatorias) {
        console.log('\n=== ELIMINATORIAS ===');
        console.log(`Total de partidos: ${eliminatorias.partidos.length}`);
        eliminatorias.partidos.forEach(partido => {
            console.log(`${partido.fase}: ${partido.equipo1.nombre} vs ${partido.equipo2.nombre} - ${partido.resultado}`);
        });
    }
}

module.exports = {
  obtenerArchivosTXT,
  cargarDatosDesdeArchivo,
  mostrarDatos,
  calcularEstadisticasTorneo,
  generarReporteHTMLSimple,
  generarReporteTokensHTML,
  generarReporteErroresHTML,
  GeneradorBracket
};