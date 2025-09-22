function generarBracketHTML(eliminatorias) {
    if (!eliminatorias?.partidos) {
        return '<p>No hay información de eliminatorias disponible</p>';
    }

    const fases = {
        cuartos: [],
        semifinal: [],
        final: []
    };

    eliminatorias.partidos.forEach(partido => {
        if (partido.fase && fases[partido.fase]) {
            fases[partido.fase].push(partido);
        }
    });

    let html = '<div class="bracket">';
    Object.keys(fases).forEach(fase => {
        if (fases[fase].length > 0) {
            html += `
                <div class="fase">
                    <h4>${fase.charAt(0).toUpperCase() + fase.slice(1)}</h4>
                    <div class="partidos-fase">
            `;
            fases[fase].forEach(partido => {
                const [goles1, goles2] = partido.resultado && partido.resultado !== 'Pendiente' 
                    ? partido.resultado.split('-').map(g => parseInt(g))
                    : [0, 0];
                const equipo1Ganador = goles1 > goles2;
                const equipo2Ganador = goles2 > goles1;
                html += `
                    <div class="partido-bracket">
                        <div class="${equipo1Ganador ? 'equipo-ganador' : ''}">${partido.equipo1.nombre} ${goles1}</div>
                        <div style="text-align: center; color: #666; margin: 2px 0;">vs</div>
                        <div class="${equipo2Ganador ? 'equipo-ganador' : ''}">${partido.equipo2.nombre} ${goles2}</div>
                        ${partido.resultado === 'Pendiente' ? '<div style="color: #ffc107; font-style: italic;">Pendiente</div>' : ''}
                    </div>
                `;
            });
            html += '</div></div>';
        }
    });
    html += '</div>';
    return html;
}

function generarTablaEstadisticasEquipos(equipos) {
    if (!equipos || equipos.length === 0) {
        return '<p>No hay estadísticas de equipos disponibles</p>';
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Equipo</th>
                    <th>Partidos</th>
                    <th>Ganados</th>
                    <th>Perdidos</th>
                    <th>Goles a Favor</th>
                    <th>Goles en Contra</th>
                    <th>Diferencia</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;

    equipos.forEach(equipo => {
        html += `
            <tr>
                <td><strong>${equipo.nombre}</strong></td>
                <td>${equipo.partidos}</td>
                <td><span class="badge badge-success">${equipo.ganados}</span></td>
                <td><span class="badge badge-danger">${equipo.perdidos}</span></td>
                <td>${equipo.golesFavor}</td>
                <td>${equipo.golesContra}</td>
                <td style="color: ${equipo.diferencia >= 0 ? '#28a745' : '#dc3545'}">
                    ${equipo.diferencia >= 0 ? '+' : ''}${equipo.diferencia}
                </td>
                <td>
                    <span class="badge ${equipo.faseActual === 'Eliminado' ? 'badge-danger' : 'badge-success'}">
                        ${equipo.faseActual}
                    </span>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    return html;
}

function generarTablaGoleadores(goleadores) {
    if (!goleadores || goleadores.length === 0) {
        return '<p>No hay goleadores registrados</p>';
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Posición</th>
                    <th>Jugador</th>
                    <th>Goles</th>
                    <th>Partidos</th>
                </tr>
            </thead>
            <tbody>
    `;

    goleadores.forEach((goleador, index) => {
        const esLider = index === 0;
        let medalla = '';
        if (index === 0) {
            medalla = ' 🥇';
        } else if (index === 1) {
            medalla = ' 🥈';
        } else if (index === 2) {
            medalla = ' 🥉';
        }
        html += `
            <tr class="${esLider ? 'goleador-top' : ''}">
                <td>
                    <strong>${index + 1}°</strong>
                    ${medalla}
                </td>
                <td><strong>${goleador.nombre}</strong></td>
                <td>
                    <span class="badge badge-success" style="font-size: 1.1em;">
                        ⚽ ${goleador.goles}
                    </span>
                </td>
                <td>
                    <details>
                        <summary style="cursor: pointer;">${goleador.partidos.length} partido(s)</summary>
                        <div style="margin-top: 5px;">
                            ${goleador.partidos.map(partido => 
                                `<div style="font-size: 0.9em; color: #666; margin: 2px 0;">
                                    ${partido.partido} (min ${partido.minuto})
                                </div>`
                            ).join('')}
                        </div>
                    </details>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    return html;
}

function obtenerDescripcionToken(token) {
    const descripciones = {
        'Palabra Reservada': 'Palabra clave del lenguaje de torneos',
        'Palabra Normal': 'Identificador o palabra común',
        'Texto': 'Cadena de texto entre comillas',
        'Número': 'Valor numérico entero',
        'Símbolo': 'Carácter especial de delimitación',
        'Error': 'Token no reconocido'
    };
    return descripciones[token.tipo] || 'Tipo de token no reconocido';
}

function mostrarDatos(datos) {
    if (!datos) {
        console.log('❌ No hay datos para mostrar');
        return;
    }

    const { liga, eliminatorias } = datos;

    console.log('\n=== INFORMACIÓN DEL TORNEO ===');
    console.log(`📋 Torneo: ${liga?.nombre || 'N/A'}`);
    console.log(`📍 Sede: ${liga?.sede || 'N/A'}`);
    console.log(`👥 Equipos: ${liga?.equipos?.length || 0}`);

    if (liga?.equipos && liga.equipos.length > 0) {
        console.log('\n=== EQUIPOS PARTICIPANTES ===');
        liga.equipos.forEach((equipo, index) => {
            console.log(`${index + 1}. ${equipo.nombre} (${equipo.jugadores?.length || 0} jugadores)`);
        });
    }

    if (eliminatorias?.partidos && eliminatorias.partidos.length > 0) {
        console.log('\n=== PARTIDOS DE ELIMINACIÓN ===');
        eliminatorias.partidos.forEach((partido, index) => {
            console.log(`${index + 1}. ${partido.equipo1.nombre} vs ${partido.equipo2.nombre}`);
            console.log(`   Resultado: ${partido.resultado || 'Pendiente'}`);
            console.log(`   Fase: ${partido.fase || 'N/A'}`);
        });
    }
}

module.exports = {
    generarBracketHTML,
    generarTablaEstadisticasEquipos,
    generarTablaGoleadores,
    obtenerDescripcionToken,
    mostrarDatos
};
