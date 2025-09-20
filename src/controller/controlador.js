const fs = require('fs');
const path = require('path');
const { Liga, Equipo, Jugador, Eliminacion, Partido } = require('../model/modelo');

// Función principal para obtener archivos TXT
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
      // Manejar tanto 'Dorsal' como 'numero' 
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
    } else if (linea.includes('semifinales:') || linea.includes('semifinal:')) {
      faseActual = 'semifinales';
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

function cargarDatosDesdeArchivo(nombreArchivo) {
  try {
    const rutaArchivo = path.join(__dirname, '../../Test', nombreArchivo);
    const contenido = fs.readFileSync(rutaArchivo, 'utf8');
    const lineas = contenido.split('\n').map(l => l.trim());

    console.log(`🔄 Procesando archivo TXT: ${nombreArchivo}`);

    // Detectar secciones
    let seccionIndices = {};
    lineas.forEach((linea, idx) => {
      if (linea.startsWith('TORNEO {')) seccionIndices.torneo = idx;
      if (linea.startsWith('EQUIPOS {')) seccionIndices.equipos = idx;
      if (linea.startsWith('ELIMINACION {')) seccionIndices.eliminacion = idx;
    });

    if (seccionIndices.torneo === undefined || seccionIndices.equipos === undefined || seccionIndices.eliminacion === undefined) {
      console.log('❌ Error: No se encontraron todas las secciones requeridas');
      return null;
    }

    const torneoLines = lineas.slice(
      seccionIndices.torneo + 1,
      seccionIndices.equipos
    );
    const equiposLines = lineas.slice(
      seccionIndices.equipos + 1,
      seccionIndices.eliminacion
    );
    const eliminacionLines = lineas.slice(
      seccionIndices.eliminacion + 1
    );

    const liga = parseTorneoSection(torneoLines, contenido);
    const equipos = parseEquiposSection(equiposLines);
    const eliminacion = parseEliminacionSection(eliminacionLines);

    // Agregar equipos a la liga
    if (liga) {
      equipos.forEach(equipo => liga.agregarEquipo(equipo));
    }

    console.log('✅ Datos cargados exitosamente desde archivo TXT');
    console.log(`📊 Liga: ${liga ? liga.nombre : 'N/A'}`);
    console.log(`🏟️ Sede: ${liga ? liga.sede : 'N/A'}`);
    console.log(`⚽ Equipos: ${equipos.length}`);
    console.log(`🏆 Fases cargadas: cuartos (${eliminacion.cuartos.length}), semifinales (${eliminacion.semifinales.length}), final (${eliminacion.final.length})`);

    return { liga, equipos, eliminacion };

  } catch (error) {
    console.log('❌ Error al cargar el archivo TXT:', error.message);
    console.log('❌ Detalle del error:', error.stack);
    return null;
  }
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