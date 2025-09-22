function calcularEstadisticasTorneo(datos) {
    if (!datos) return null;
    
    const { liga, eliminatorias } = datos;
    if (!liga?.equipos) return null;
    
    const estadisticasEquipos = liga.equipos.map(equipo => {
        const stats = {
            nombre: equipo.nombre,
            jugadores: equipo.jugadores?.length || 0,
            partidos: 0,
            ganados: 0,
            perdidos: 0,
            golesFavor: 0,
            golesContra: 0,
            diferencia: 0,
            faseActual: 'Eliminado',
            ultimoPartido: null
        };
        
        if (eliminatorias?.partidos) {
            eliminatorias.partidos.forEach(partido => {
                if (partido.equipo1.nombre === equipo.nombre || partido.equipo2.nombre === equipo.nombre) {
                    stats.partidos++;
                    stats.ultimoPartido = partido;
                    if (partido.resultado && partido.resultado !== 'Pendiente') {
                        const [goles1, goles2] = partido.resultado.split('-').map(g => parseInt(g));
                        if (partido.equipo1.nombre === equipo.nombre) {
                            stats.golesFavor += goles1;
                            stats.golesContra += goles2;
                            if (goles1 > goles2) {
                                stats.ganados++;
                                stats.faseActual = determinarSiguienteFase(partido.fase);
                            } else {
                                stats.perdidos++;
                            }
                        } else {
                            stats.golesFavor += goles2;
                            stats.golesContra += goles1;
                            if (goles2 > goles1) {
                                stats.ganados++;
                                stats.faseActual = determinarSiguienteFase(partido.fase);
                            } else {
                                stats.perdidos++;
                            }
                        }
                    }
                }
            });
        }
        
        stats.diferencia = stats.golesFavor - stats.golesContra;
        return stats;
    });

    const goleadores = [];
    if (eliminatorias?.partidos) {
        eliminatorias.partidos.forEach(partido => {
            if (partido.goleadores) {
                partido.goleadores.forEach(gol => {
                    const goleadorExistente = goleadores.find(g => g.nombre === gol.jugador.nombre);
                    if (goleadorExistente) {
                        goleadorExistente.goles++;
                        goleadorExistente.partidos.push({
                            partido: `${partido.equipo1.nombre} vs ${partido.equipo2.nombre}`,
                            minuto: gol.minuto,
                            fase: partido.fase
                        });
                    } else {
                        goleadores.push({
                            nombre: gol.jugador.nombre,
                            goles: 1,
                            partidos: [{
                                partido: `${partido.equipo1.nombre} vs ${partido.equipo2.nombre}`,
                                minuto: gol.minuto,
                                fase: partido.fase
                            }]
                        });
                    }
                });
            }
        });
    }

    goleadores.sort((a, b) => b.goles - a.goles);

    const proximosEnfrentamientos = determinarProximosPartidos(estadisticasEquipos, eliminatorias);

    return {
        equipos: estadisticasEquipos,
        goleadores,
        proximosEnfrentamientos,
        informacionGeneral: {
            totalEquipos: liga.equipos.length,
            totalJugadores: liga.equipos.reduce((total, equipo) => total + (equipo.jugadores?.length || 0), 0),
            partidosJugados: eliminatorias?.partidos?.filter(p => p.resultado && p.resultado !== 'Pendiente').length || 0,
            totalGoles: goleadores.reduce((total, g) => total + g.goles, 0),
            fases: ['cuartos', 'semifinal', 'final']
        }
    };
}

function determinarSiguienteFase(faseActual) {
    const fases = {
        'cuartos': 'Semifinal',
        'semifinal': 'Final',
        'final': 'Campeón'
    };
    return fases[faseActual] || 'Clasificado';
}

function determinarProximosPartidos(equipos, eliminacion) {
    const proximosPartidos = [];
    const ganadoreCuartos = equipos.filter(eq => eq.faseActual === 'Semifinal');
    if (ganadoreCuartos.length >= 2 && eliminacion.semifinal.length === 0) {
        for (let i = 0; i < ganadoreCuartos.length; i += 2) {
            if (ganadoreCuartos[i + 1]) {
                proximosPartidos.push({
                    fase: 'Semifinal',
                    equipo1: ganadoreCuartos[i].nombre,
                    equipo2: ganadoreCuartos[i + 1].nombre,
                    tipo: 'Próximo partido'
                });
            }
        }
    }
    const ganadoressemifinal = equipos.filter(eq => eq.faseActual === 'Final');
    if (ganadoressemifinal.length === 2 && eliminacion.final.length === 0) {
        proximosPartidos.push({
            fase: 'Final',
            equipo1: ganadoressemifinal[0].nombre,
            equipo2: ganadoressemifinal[1].nombre,
            tipo: 'Final del torneo'
        });
    }
    return proximosPartidos;
}

function calcularPromedioEdad(equipos) {
    if (!equipos || equipos.length === 0) return 0;
    
    let totalEdad = 0;
    let totalJugadores = 0;
    
    equipos.forEach(equipo => {
        if (equipo.jugadores) {
            equipo.jugadores.forEach(jugador => {
                totalEdad += jugador.edad;
                totalJugadores++;
            });
        }
    });
    
    return totalJugadores > 0 ? Math.round(totalEdad / totalJugadores) : 0;
}

function calcularPromedioEdadEquipo(jugadores) {
    if (!jugadores || jugadores.length === 0) return 0;
    const totalEdad = jugadores.reduce((sum, jugador) => sum + jugador.edad, 0);
    return Math.round(totalEdad / jugadores.length);
}

function calcularTotalGoles(eliminatorias) {
    if (!eliminatorias?.partidos) return 0;
    
    return eliminatorias.partidos.reduce((total, partido) => {
        if (partido.resultado && partido.resultado !== 'Pendiente') {
            const goles = partido.resultado.split('-');
            if (goles.length === 2) {
                return total + parseInt(goles[0]) + parseInt(goles[1]);
            }
        }
        return total;
    }, 0);
}

function obtenerFaseActualTorneo(eliminatorias) {
    if (!eliminatorias?.partidos) return 'No iniciado';
    
    const partidosCompletados = eliminatorias.partidos.filter(p => p.resultado && p.resultado !== 'Pendiente');
    const totalPartidos = eliminatorias.partidos.length;
    
    if (partidosCompletados.length === 0) return 'No iniciado';
    if (partidosCompletados.length === totalPartidos) return 'Torneo Finalizado';
    
    const fasesCompletadas = partidosCompletados.map(p => p.fase);
    if (fasesCompletadas.includes('final')) return 'Final';
    if (fasesCompletadas.includes('semifinal')) return 'Semifinal';
    if (fasesCompletadas.includes('cuartos')) return 'Cuartos de Final';
    
    return 'En Progreso';
}

module.exports = {
    calcularEstadisticasTorneo,
    determinarSiguienteFase,
    determinarProximosPartidos,
    calcularPromedioEdad,
    calcularPromedioEdadEquipo,
    calcularTotalGoles,
    obtenerFaseActualTorneo
};