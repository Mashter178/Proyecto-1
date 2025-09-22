class Liga {
    constructor(nombre, sede,  equipos = []) {
        this.nombre = nombre;
        this.sede = sede;
        this.equipos = equipos; // Cambiar a minúscula
    }
    agregarEquipo(equipo) {
        this.equipos.push(equipo); // Cambiar a minúscula
    }
}

class Equipo {
    constructor(nombre, jugadores = []) {
        this.nombre = nombre;
        this.jugadores = jugadores; // Cambiar a minúscula
    }
    agregarJugador(jugador) {
        this.jugadores.push(jugador); // Cambiar a minúscula y corregir parámetro
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

class Eliminacion {
    constructor() {
        this.diesiseisavos = [];
        this.octavos = [];
        this.cuartos = [];
        this.semifinales = [];
        this.semifinal = []; // Agregar soporte para singular
        this.final = [];
    }
    agregarPartido(fase, partido) {
        if (this[fase]) {
            this[fase].push(partido);
        } else {
            throw new Error(`Fase no válida: "${fase}". Fases válidas: diesiseisavos, octavos, cuartos, semifinales, semifinal, final`);
        }
    }

    // Getter para obtener todos los partidos
    get partidos() {
        return [
            ...this.diesiseisavos,
            ...this.octavos,
            ...this.cuartos,
            ...this.semifinales,
            ...this.semifinal,
            ...this.final
        ];
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