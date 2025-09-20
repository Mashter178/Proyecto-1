const readline = require('readline');
const { cargarDatosDesdeCSV, mostrarDatos, obtenerArchivosCSV } = require('../controller/controlador');

const archivos = obtenerArchivosCSV();

console.log('📁 Archivos CSV disponibles:');
archivos.forEach((archivo, index) => {
    console.log(`${index + 1}. ${archivo}`);
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\nSeleccione el número del archivo CSV que desea cargar: ', (respuesta) => {
    const indice = parseInt(respuesta) - 1;
    if (indice >= 0 && indice < archivos.length) {
        const archivoSeleccionado = archivos[indice];
        console.log(`\n🔄 Cargando datos de ${archivoSeleccionado}...\n`);
        const datos = cargarDatosDesdeCSV(archivoSeleccionado);
        if (datos) {
            mostrarDatos(datos);
        } else {
            console.log('❌ No se pudieron cargar los datos');
        }
    } else {
        console.log('❌ Selección inválida');
    }
    rl.close();
});
