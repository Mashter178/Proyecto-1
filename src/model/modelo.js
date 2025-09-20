class Liga {
    constructor(nombre, sede,  Equipos = []) {
        this.nombre = nombre;
        this.sede = sede;
        this.Equipos = Equipos;
    }
    agregarEquipo(equipo) {
        this.Equipos.push(equipo);
    }
}

class Equipo {
    constructor(nombre, Jugadores = []) {
        this.nombre = nombre;
        this.Jugadores = Jugadores;
    }
    agregarJugador(jugadores) {
        this.Jugadores.push(jugadores);
    }
}

function Jugador(nombre, posicion, dorsal, edad) {
    return {
        nombre,
        posicion,
        dorsal,
        edad
    };
}

//-----------------------------------------------------------------

class Eliminacion {
    constructor() {
        this.diesiseisavos = [];
        this.octavos = [];
        this.cuartos = [];
        this.semifinales = [];
        this.final = [];
    }
    agregarPartido(fase, partido) {
        if (this[fase]) {
            this[fase].push(partido);
        } else {
            throw new Error('Fase no válida');
        }
    }
}

class Partido {
    constructor(equipo1, equipo2, resultado, goleadores = []) {
        this.equipo1 = equipo1;
        this.equipo2 = equipo2;
        this.resultado = resultado; // Ejemplo: "2-1"
        this.goleadores = goleadores; // Array de objetos {jugador, minuto}
    }
    agregarGoleador(jugador, minuto) {
        this.goleadores.push({ jugador, minuto });
    }
}

module.exports = {
    Liga,
    Equipo,
    Jugador,
    Eliminacion,
    Partido
};