const readline = require('readline');
const { cargarDatosDesdeArchivo, mostrarDatos, obtenerArchivosTXT } = require('../controller/controlador');

const archivos = obtenerArchivosTXT();

console.log('📁 Archivos TXT disponibles:');
archivos.forEach((archivo, index) => {
    console.log(`${index + 1}. ${archivo}`);
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\nSeleccione el número del archivo TXT que desea cargar: ', (respuesta) => {
    const indice = parseInt(respuesta) - 1;
    if (indice >= 0 && indice < archivos.length) {
        const archivoSeleccionado = archivos[indice];
        console.log(`\n🔄 Cargando datos de ${archivoSeleccionado}...\n`);
        const datos = cargarDatosDesdeArchivo(archivoSeleccionado);
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
