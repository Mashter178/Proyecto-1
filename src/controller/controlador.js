const fs = require('fs');
const path = require('path');
const { Liga, Equipo, Jugador, Eliminacion, Partido } = require('../model/modelo');
const { LexicoSimple } = require('./Lexico'); // ← AGREGAR ESTA LÍNEA

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

function cargarDatosDesdeArchivo(nombreArchivo) {
    console.log(`\n🔄 Procesando archivo: ${nombreArchivo}`);
    
    const rutaTest = path.join(__dirname, '../../Test');
    const rutaArchivo = path.join(rutaTest, nombreArchivo);
    
    try {
        // 1. LEER EL ARCHIVO
        const contenido = fs.readFileSync(rutaArchivo, 'utf8');
        console.log(`📖 Archivo leído correctamente (${contenido.length} caracteres)`);

        // 2. ¡NUEVO! ANÁLISIS LÉXICO PRIMERO
        console.log('\n🔍 PASO 1: Análisis Léxico');
        console.log('='.repeat(50));
        
        const analizadorLexico = new LexicoSimple();
        const resultadoLexico = analizadorLexico.analizar(contenido);
        
        // Mostrar resultados del análisis léxico
        analizadorLexico.mostrarTokens();
        analizadorLexico.mostrarErrores();
        
        // Guardar reporte léxico
        analizadorLexico.guardarReporte(`lexico_${nombreArchivo.replace('.txt', '.txt')}`);
        
        // 3. DECIDIR SI CONTINUAR
        if (resultadoLexico.tieneErrores) {
            console.log('\n⚠️  Se encontraron errores léxicos. ¿Continuar con el procesamiento?');
            console.log('   (En un sistema real, aquí podrías decidir detener el proceso)');
        }

        console.log('\n🔄 PASO 2: Análisis Sintáctico y Procesamiento');
        console.log('='.repeat(50));

        // 4. CONTINUAR CON EL PROCESAMIENTO NORMAL
        const lineas = contenido.split('\n').map(linea => linea.trim()).filter(linea => linea);
        
        // Verificar estructura del archivo
        const tieneSeccionTorneo = lineas.some(linea => linea.includes('TORNEO {'));
        const tieneSeccionEquipos = lineas.some(linea => linea.includes('EQUIPOS {'));
        const tieneSeccionEliminacion = lineas.some(linea => linea.includes('ELIMINACION {'));
        
        if (!tieneSeccionTorneo || !tieneSeccionEquipos || !tieneSeccionEliminacion) {
            throw new Error('Estructura de archivo inválida: faltan secciones requeridas');
        }

        console.log('✅ Estructura del archivo validada');

        // Separar secciones
        let indiceTorneo = -1, indiceEquipos = -1, indiceEliminacion = -1;
        
        for (let i = 0; i < lineas.length; i++) {
            if (lineas[i].includes('TORNEO {')) indiceTorneo = i;
            if (lineas[i].includes('EQUIPOS {')) indiceEquipos = i;
            if (lineas[i].includes('ELIMINACION {')) indiceEliminacion = i;
        }

        const lineasTorneo = lineas.slice(indiceTorneo, indiceEquipos);
        const lineasEquipos = lineas.slice(indiceEquipos, indiceEliminacion);
        const lineasEliminacion = lineas.slice(indiceEliminacion);

        console.log(`📊 Secciones detectadas: Torneo(${lineasTorneo.length}), Equipos(${lineasEquipos.length}), Eliminación(${lineasEliminacion.length})`);

        // Procesar cada sección
        const liga = parseTorneoSection(lineasTorneo, contenido);
        console.log(`🏆 Torneo procesado: ${liga.nombre}`);

        const equipos = parseEquiposSection(lineasEquipos);
        console.log(`⚽ Equipos procesados: ${equipos.length}`);

        const eliminatorias = parseEliminacionSection(lineasEliminacion);
        console.log(`🏅 Eliminatorias procesadas: ${eliminatorias.length}`);

        // Agregar equipos a la liga
        equipos.forEach(equipo => liga.agregarEquipo(equipo));

        console.log(`\n✅ Archivo procesado exitosamente`);
        console.log(`   - Liga: ${liga.nombre} (${liga.sede})`);
        console.log(`   - Equipos: ${liga.equipos.length}`);
        console.log(`   - Jugadores totales: ${liga.equipos.reduce((total, equipo) => total + equipo.jugadores.length, 0)}`);
        console.log(`   - Eliminatorias: ${eliminatorias.length}`);

        return { liga, eliminatorias };

    } catch (error) {
        console.error(`❌ Error al procesar ${nombreArchivo}:`, error.message);
        throw error;
    }
}

function parseTorneoSection(lineas, contenido) {
  let liga = null;
  for (const linea of lineas) {
    if (linea.includes('nombre:')) {
      const nombre = linea.match(/"([^"]+)"/)[1];
      const sede = contenido.match(/sede: "([^"]+)"/)[1];
      liga = new Liga(nombre, sede);
      break;
    }
  }
  return liga;
}

function parseEquiposSection(lineas) {
  const equipos = [];
  let equipoActual = null;
  for (const linea of lineas) {
    if (linea.includes('equipo:')) {
      const nombreEquipo = linea.match(/"([^"]+)"/)[1];
      equipoActual = new Equipo(nombreEquipo);
      equipos.push(equipoActual);
    } else if (linea.includes('jugador:') && equipoActual) {
      const nombreJugador = linea.match(/"([^"]+)"/)[1];
      const posicion = linea.match(/posicion: "([^"]+)"/)[1];
      const dorsalMatch = linea.match(/(?:Dorsal|numero): (\d+)/);
      const dorsal = dorsalMatch ? parseInt(dorsalMatch[1]) : 0;
      const edad = parseInt(linea.match(/edad: (\d+)/)[1]);
      const jugador = new Jugador(nombreJugador, posicion, dorsal, edad);
      equipoActual.agregarJugador(jugador);
    }
  }
  return equipos;
}

function parseEliminacionSection(lineas) {
  const eliminacion = new Eliminacion();
  let faseActual = '';
  let partidoActual = null;
  for (const linea of lineas) {
    if (linea.includes('cuartos:')) {
      faseActual = 'cuartos';
    } else if (linea.includes('semifinal:')) {
      faseActual = 'semifinal';
    } else if (linea.includes('final:')) {
      faseActual = 'final';
    } else if (linea.includes('partido:') && faseActual) {
      // Manejar ambos formatos: "equipo1 vs equipo2" y "equipo1" vs "equipo2"
      let partidoInfo = linea.match(/"([^"]+) vs ([^"]+)"/);
      if (!partidoInfo) {
        partidoInfo = linea.match(/"([^"]+)" vs "([^"]+)"/);
      }
      if (partidoInfo) {
        const equipo1 = new Equipo(partidoInfo[1]);
        const equipo2 = new Equipo(partidoInfo[2]);
        partidoActual = new Partido(equipo1, equipo2, '');
      }
    } else if (linea.includes('resultado:') && partidoActual) {
      const resultado = linea.match(/"([^"]+)"/)[1];
      partidoActual.resultado = resultado;
    } else if (linea.includes('goleador:') && partidoActual) {
      const nombreGoleador = linea.match(/"([^"]+)"/)[1];
      const minuto = parseInt(linea.match(/minuto: (\d+)/)[1]);
      const goleador = new Jugador(nombreGoleador, '', '', '');
      partidoActual.agregarGoleador(goleador, minuto);
    }
    // Detectar fin de partido
    if ((linea.includes('],') || linea.includes('}')) && partidoActual && faseActual) {
      eliminacion.agregarPartido(faseActual, partidoActual);
      partidoActual = null;
    }
  }
  return eliminacion;
}

// Función para mostrar los datos cargados
function mostrarDatos(datos) {
  if (!datos) {
    console.log('❌ No hay datos para mostrar');
    return;
  }
  
  const { liga, equipos, eliminacion } = datos;
  
  console.log('\n=== INFORMACIÓN DEL TORNEO ===');
  console.log(`🏆 ${liga.nombre}`);
  console.log(`🏟️ Sede: ${liga.sede}`);
  
  console.log('\n=== EQUIPOS ===');
  equipos.forEach((equipo, index) => {
    console.log(`${index + 1}. ${equipo.nombre}`);
    equipo.Jugadores.forEach(jugador => {
      console.log(`   👤 ${jugador.nombre} - ${jugador.posicion} (#${jugador.dorsal}, ${jugador.edad} años)`);
    });
  });
  
  console.log('\n=== ELIMINATORIAS ===');
  ['cuartos', 'semifinales', 'final'].forEach(fase => {
    if (eliminacion[fase].length > 0) {
      console.log(`\n📅 ${fase.toUpperCase()}:`);
      eliminacion[fase].forEach((partido, index) => {
        console.log(`  ${index + 1}. ${partido.equipo1.nombre} vs ${partido.equipo2.nombre} - ${partido.resultado}`);
        if (partido.goleadores.length > 0) {
          console.log('     ⚽ Goleadores:');
          partido.goleadores.forEach(gol => {
            console.log(`       - ${gol.jugador.nombre} (min ${gol.minuto})`);
          });
        }
      });
    }
  });
}

module.exports = {
  obtenerArchivosTXT,
  cargarDatosDesdeArchivo,
  mostrarDatos
};