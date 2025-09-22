const { Liga, Equipo, Jugador, Eliminacion, Partido } = require('../model/modelo');

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
      let partidoInfo = linea.match(/"([^"]+) vs ([^"]+)"/);
      if (!partidoInfo) {
        partidoInfo = linea.match(/"([^"]+)" vs "([^"]+)"/);
      }
      if (partidoInfo) {
        const equipo1 = new Equipo(partidoInfo[1]);
        const equipo2 = new Equipo(partidoInfo[2]);
        partidoActual = new Partido(equipo1, equipo2, '');
        partidoActual.fase = faseActual;
      }
    } else if (linea.includes('resultado:') && partidoActual) {
      const resultado = linea.match(/"([^"]+)"/)[1];
      partidoActual.resultado = resultado;
      const golesMatch = resultado.match(/(\d+)-(\d+)/);
      if (golesMatch) {
        partidoActual.goles1 = parseInt(golesMatch[1]);
        partidoActual.goles2 = parseInt(golesMatch[2]);
      } else {
        partidoActual.goles1 = 0;
        partidoActual.goles2 = 0;
      }
    } else if (linea.includes('goleador:') && partidoActual) {
      const nombreGoleador = linea.match(/"([^"]+)"/)[1];
      const minuto = parseInt(linea.match(/minuto: (\d+)/)[1]);
      const goleador = new Jugador(nombreGoleador, '', '', '');
      partidoActual.agregarGoleador(goleador, minuto);
    }
    if ((linea.includes('],') || linea.includes('}')) && partidoActual && faseActual) {
      eliminacion.agregarPartido(faseActual, partidoActual);
      partidoActual = null;
    }
  }
  return eliminacion;
}

module.exports = {
  parseTorneoSection,
  parseEquiposSection,
  parseEliminacionSection
};