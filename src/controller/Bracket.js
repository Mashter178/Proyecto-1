const fs = require('fs');
const path = require('path');

class GeneradorBracket {
    constructor() {
        this.anchoCaja = 140;
        this.altoCaja = 65;
        this.espacioX = 200;
        this.espacioY = 120;
        this.colores = {
            ganador: '#4CAF50',
            perdedor: '#F44336',
            pendiente: '#FFC107',
            titulo: '#FF6F00',
            final: '#9C27B0',
            fondo: '#F5F5F5'
        };
    }

    generarBracketSVG(eliminatorias, nombreTorneo) {
        try {
            const svg = this.crearEstructuraSVG(eliminatorias, nombreTorneo);
            const carpetaReports = path.join(__dirname, '../../reports');
            if (!fs.existsSync(carpetaReports)) {
                fs.mkdirSync(carpetaReports, { recursive: true });
            }
            const nombreArchivo = `bracket_${nombreTorneo.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
            const rutaCompleta = path.join(carpetaReports, nombreArchivo);
            fs.writeFileSync(rutaCompleta, svg, 'utf8');
            return rutaCompleta;
        } catch (error) {
            throw error;
        }
    }

    generarBracketEmbebido(eliminatorias, nombreTorneo) {
        try {
            return this.crearEstructuraSVG(eliminatorias, nombreTorneo);
        } catch (error) {
            return '<p>Error al generar bracket</p>';
        }
    }

    crearEstructuraSVG(eliminatorias, nombreTorneo) {
        const partidos = this.organizarPartidosPorFase(eliminatorias);
        const { ancho, alto } = this.calcularDimensiones(partidos);

        let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${ancho}" height="${alto}" xmlns="http://www.w3.org/2000/svg" style="background: ${this.colores.fondo};">
    <defs>
        <style>
            .titulo { 
                font-family: 'Arial Black', Arial, sans-serif; 
                font-size: 20px; 
                font-weight: bold; 
                text-anchor: middle; 
                fill: white;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .fase { 
                font-family: Arial, sans-serif; 
                font-size: 16px; 
                font-weight: bold; 
                text-anchor: middle; 
                fill: #333;
            }
            .equipo { 
                font-family: Arial, sans-serif; 
                font-size: 11px; 
                text-anchor: middle; 
                font-weight: bold;
                fill: white;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            }
            .resultado { 
                font-family: Arial, sans-serif; 
                font-size: 12px; 
                text-anchor: middle; 
                font-weight: bold;
                fill: white;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            }
            .caja { 
                stroke: #333; 
                stroke-width: 2; 
                fill-opacity: 0.9;
                filter: drop-shadow(3px 3px 6px rgba(0,0,0,0.2));
            }
            .linea { 
                stroke: #333; 
                stroke-width: 3; 
                fill: none;
                opacity: 0.7;
            }
        </style>
        <linearGradient id="tituloGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#FF6F00;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FF8F00;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="finalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#9C27B0;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#E91E63;stop-opacity:1" />
        </linearGradient>
    </defs>`;

        svg += this.generarTitulo(nombreTorneo, ancho);

        let offsetY = 140;
        const fasesOrdenadas = this.ordenarFases(partidos);

        fasesOrdenadas.forEach((faseInfo, indice) => {
            if (faseInfo.partidos.length > 0) {
                svg += this.generarFase(faseInfo.nombre, faseInfo.partidos, offsetY, ancho, indice);
                if (indice < fasesOrdenadas.length - 1) {
                    const siguienteFase = fasesOrdenadas[indice + 1];
                    if (siguienteFase && siguienteFase.partidos.length > 0) {
                        svg += this.generarConexionesFase(faseInfo.partidos, offsetY, ancho);
                    }
                }
                offsetY += 200;
            }
        });

        svg += '</svg>';
        return svg;
    }

    ordenarFases(partidos) {
        const fases = [];
        const partidosSemis = [...(partidos.semifinales || []), ...(partidos.semifinal || [])];
        if (partidos.cuartos && partidos.cuartos.length > 0) {
            fases.push({ nombre: 'cuartos', partidos: partidos.cuartos });
        }
        if (partidosSemis.length > 0) {
            fases.push({ nombre: 'semifinal', partidos: partidosSemis });
        }
        if (partidos.final && partidos.final.length > 0) {
            fases.push({ nombre: 'final', partidos: partidos.final });
        }
        return fases;
    }

    generarConexionesFase(partidosActuales, offsetY, anchoTotal) {
        let svg = '';
        const partidosPorFila = partidosActuales.length;
        const espacioDisponible = anchoTotal - 200;
        const espacioEntrePartidos = espacioDisponible / (partidosPorFila + 1);

        partidosActuales.forEach((partido, indice) => {
            const x = 100 + espacioEntrePartidos * (indice + 1) - this.anchoCaja/2;
            const y = offsetY + 20;
            svg += this.generarConexion(x, y, offsetY, anchoTotal, indice, partidosPorFila);
        });

        return svg;
    }

    organizarPartidosPorFase(eliminatorias) {
        const partidos = {
            cuartos: [],
            semifinales: [],
            semifinal: [],
            final: []
        };

        if (eliminatorias?.partidos) {
            eliminatorias.partidos.forEach((partido) => {
                if (partido.fase && partidos[partido.fase]) {
                    partidos[partido.fase].push(partido);
                }
            });
        }
        return partidos;
    }

    calcularDimensiones(partidos) {
        const maxPartidosPorFase = Math.max(
            partidos.cuartos?.length || 0,
            partidos.semifinales?.length || 0,
            partidos.final?.length || 0
        );
        const ancho = Math.max(800, maxPartidosPorFase * this.espacioX + 200);
        const alto = 600;
        return { ancho, alto };
    }

    generarTitulo(nombreTorneo, ancho) {
        return `
    <ellipse cx="${ancho/2}" cy="50" rx="250" ry="35" fill="url(#tituloGradient)" class="caja"/>
    <text x="${ancho/2}" y="58" class="titulo">${nombreTorneo}</text>`;
    }

    generarFase(nombreFase, partidos, offsetY, anchoTotal, indiceFase) {
        let svg = `
    <rect x="50" y="${offsetY - 30}" width="${anchoTotal - 100}" height="140" 
          fill="#f0f0f0" stroke="#ccc" stroke-width="1" rx="10"/>
    <text x="${anchoTotal/2}" y="${offsetY - 10}" class="fase">${this.formatearNombreFase(nombreFase)}</text>`;

        const partidosPorFila = partidos.length;
        const espacioDisponible = anchoTotal - 200;
        const espacioEntrePartidos = espacioDisponible / (partidosPorFila + 1);

        partidos.forEach((partido, indice) => {
            const x = 100 + espacioEntrePartidos * (indice + 1) - this.anchoCaja/2;
            const y = offsetY + 20;
            svg += this.generarPartido(partido, x, y, indiceFase);
            if (indiceFase < 2) {
                svg += this.generarConexion(x, y, offsetY, anchoTotal, indice, partidosPorFila);
            }
        });

        return svg;
    }

    generarPartido(partido, x, y, indiceFase) {
        const esPartidoFinal = indiceFase === 2;
        const colorFondo = esPartidoFinal ? this.colores.final : '#fff';
        const nombreEquipo1 = typeof partido.equipo1 === 'object' ? partido.equipo1.nombre : partido.equipo1;
        const nombreEquipo2 = typeof partido.equipo2 === 'object' ? partido.equipo2.nombre : partido.equipo2;

        let svg = `
    <rect x="${x}" y="${y}" width="${this.anchoCaja}" height="${this.altoCaja}" 
          fill="${colorFondo}" class="caja" rx="5"/>`;

        const colorEquipo1 = this.obtenerColorEquipo(partido, nombreEquipo1);
        svg += `
    <rect x="${x + 3}" y="${y + 3}" width="${this.anchoCaja - 6}" height="22" 
          fill="${colorEquipo1}" stroke="none" rx="3"/>
    <text x="${x + this.anchoCaja/2}" y="${y + 17}" class="equipo">${this.truncarTexto(nombreEquipo1, 15)}</text>
    <text x="${x + this.anchoCaja - 10}" y="${y + 17}" class="resultado" font-weight="bold">${this.mostrarGoles(partido.goles1, partido.resultado)}</text>`;

        const colorEquipo2 = this.obtenerColorEquipo(partido, nombreEquipo2);
        svg += `
    <rect x="${x + 3}" y="${y + 32}" width="${this.anchoCaja - 6}" height="22" 
          fill="${colorEquipo2}" stroke="none" rx="3"/>
    <text x="${x + this.anchoCaja/2}" y="${y + 46}" class="equipo">${this.truncarTexto(nombreEquipo2, 15)}</text>
    <text x="${x + this.anchoCaja - 10}" y="${y + 46}" class="resultado" font-weight="bold">${this.mostrarGoles(partido.goles2, partido.resultado)}</text>`;

        const estado = this.obtenerEstadoPartido(partido);
        if (estado === 'TBD') {
            svg += `
    <text x="${x + this.anchoCaja/2}" y="${y + 58}" class="resultado" fill="#666" style="font-style: italic;">Pendiente</text>`;
        } else if (esPartidoFinal && estado !== 'TBD') {
            const ganador = this.determinarGanador(partido);
            if (ganador !== 'TBD' && ganador !== 'Empate') {
                svg += `
    <text x="${x + this.anchoCaja/2}" y="${y + 58}" class="resultado" fill="#000" font-weight="bold">🏆 CAMPEÓN</text>`;
            }
        }

        return svg;
    }

    generarConexion(xPartido, yPartido, offsetY, anchoTotal, indicePartido, totalPartidos) {
        const xCentro = xPartido + this.anchoCaja/2;
        const yInicio = yPartido + this.altoCaja;
        const yFin = offsetY + 200 + 20;
        const partidosEnSiguienteFase = Math.ceil(totalPartidos / 2);
        const indiceDestino = Math.floor(indicePartido / 2);
        const espacioDisponible = anchoTotal - 200;
        const espacioEntrePartidos = espacioDisponible / (partidosEnSiguienteFase + 1);
        const xDestino = 100 + espacioEntrePartidos * (indiceDestino + 1);

        return `
    <path d="M ${xCentro} ${yInicio} L ${xCentro} ${yInicio + 30} L ${xDestino} ${yInicio + 30} L ${xDestino} ${yFin}" 
          class="linea" marker-end="url(#arrow)"/>
    <text x="${xCentro + 10}" y="${yInicio + 20}" class="resultado" fill="#666">Ganador</text>`;
    }

    obtenerColorEquipo(partido, nombreEquipo) {
        const ganador = this.determinarGanador(partido);
        if (ganador === 'TBD') {
            return this.colores.pendiente;
        } else if (ganador === nombreEquipo) {
            return this.colores.ganador;
        } else {
            return this.colores.perdedor;
        }
    }

    determinarGanador(partido) {
        if (!partido.goles1 && !partido.goles2) return 'TBD';
        const goles1 = parseInt(partido.goles1) || 0;
        const goles2 = parseInt(partido.goles2) || 0;
        const nombreEquipo1 = typeof partido.equipo1 === 'object' ? partido.equipo1.nombre : partido.equipo1;
        const nombreEquipo2 = typeof partido.equipo2 === 'object' ? partido.equipo2.nombre : partido.equipo2;
        if (goles1 > goles2) return nombreEquipo1;
        if (goles2 > goles1) return nombreEquipo2;
        return 'Empate';
    }

    obtenerEstadoPartido(partido) {
        if (!partido.goles1 && !partido.goles2) return 'TBD';
        return 'Jugado';
    }

    formatearNombreFase(fase) {
        const nombres = {
            'cuartos': 'Cuartos de Final',
            'semifinales': 'Semifinal',
            'semifinal': 'Semifinal',
            'final': 'Final'
        };
        return nombres[fase] || fase;
    }

    truncarTexto(texto, maxLength) {
        if (texto.length <= maxLength) return texto;
        return texto.substring(0, maxLength - 3) + '...';
    }

    mostrarGoles(goles, resultado) {
        if (!resultado || resultado === 'Pendiente' || resultado === '') {
            return '-';
        }
        if (goles !== undefined && goles !== null) {
            return goles;
        }
        return 0;
    }
}

module.exports = GeneradorBracket;
