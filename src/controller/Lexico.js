const fs = require('fs');
const path = require('path');

const TipoToken = {
    PALABRA_RESERVADA: 'Palabra Reservada',
    PALABRA_NORMAL: 'Palabra Normal',
    TEXTO: 'Texto',
    NUMERO: 'Número',
    SIMBOLO: 'Símbolo',
    ERROR: 'Error'
};

const PALABRAS_ESPECIALES = ['TORNEO', 'EQUIPOS', 'ELIMINACION', 'cuartos', 'semifinales', 'semifinal', 'final'];
const PALABRAS_NORMALES = ['nombre', 'sede', 'equipos', 'equipo', 'jugador', 'posicion', 'numero', 'edad', 'partido', 'resultado', 'goleador', 'goleadores', 'minuto', 'vs'];

function TokenSimple(texto, tipo, linea, columna) {
    this.texto = texto;
    this.tipo = tipo;
    this.linea = linea;
    this.columna = columna;
}

function ErrorSimple(caracter, problema, linea, columna) {
    this.caracter = caracter;
    this.problema = problema;
    this.linea = linea;
    this.columna = columna;
}

class LexicoSimple {
    constructor() {
        this.texto = '';
        this.posicion = 0;
        this.linea = 1;
        this.columna = 1;
        this.tokens = [];
        this.errores = [];
    }

    analizar(textoCompleto) {
        console.log('🔍 Empezando análisis léxico simple...\n');
        this.texto = textoCompleto;
        this.posicion = 0;
        this.linea = 1;
        this.columna = 1;
        this.tokens = [];
        this.errores = [];
        while (this.posicion < this.texto.length) {
            this.leerSiguienteElemento();
        }
        console.log(`✅ Análisis terminado: ${this.tokens.length} tokens, ${this.errores.length} errores\n`);
        return {
            tokens: this.tokens,
            errores: this.errores,
            tieneErrores: this.errores.length > 0
        };
    }

    leerSiguienteElemento() {
        const caracter = this.caracterActual();
        if (this.esEspacio(caracter)) {
            this.saltarEspacios();
            return;
        }
        if (caracter === '\n') {
            this.linea++;
            this.columna = 1;
            this.posicion++;
            return;
        }
        if (caracter === '"') {
            this.leerTextoEntreComillas();
            return;
        }
        if (this.esNumero(caracter)) {
            this.leerNumeroCompleto();
            return;
        }
        if (this.esSimbolo(caracter)) {
            this.leerSimbolo();
            return;
        }
        if (this.esLetra(caracter)) {
            this.leerPalabraCompleta();
            return;
        }
        this.agregarError(caracter, 'Carácter desconocido');
        this.posicion++;
        this.columna++;
    }

    leerTextoEntreComillas() {
        const inicioLinea = this.linea;
        const inicioColumna = this.columna;
        let textoCompleto = '';
        this.posicion++;
        this.columna++;
        while (this.posicion < this.texto.length) {
            const caracter = this.caracterActual();
            if (caracter === '"') {
                this.posicion++;
                this.columna++;
                this.agregarToken(`"${textoCompleto}"`, TipoToken.TEXTO, inicioLinea, inicioColumna);
                return;
            }
            if (caracter === '\n') {
                this.agregarError('"', 'Texto sin cerrar (falta comilla)');
                return;
            }
            textoCompleto += caracter;
            this.posicion++;
            this.columna++;
        }
        this.agregarError('"', 'Texto sin cerrar al final del archivo');
    }

    leerNumeroCompleto() {
        const inicioLinea = this.linea;
        const inicioColumna = this.columna;
        let numeroCompleto = '';
        while (this.posicion < this.texto.length && this.esNumero(this.caracterActual())) {
            numeroCompleto += this.caracterActual();
            this.posicion++;
            this.columna++;
        }
        this.agregarToken(numeroCompleto, TipoToken.NUMERO, inicioLinea, inicioColumna);
    }

    leerPalabraCompleta() {
        const inicioLinea = this.linea;
        const inicioColumna = this.columna;
        let palabraCompleta = '';
        while (this.posicion < this.texto.length && this.esLetra(this.caracterActual())) {
            palabraCompleta += this.caracterActual();
            this.posicion++;
            this.columna++;
        }
        let tipoPalabra;
        if (PALABRAS_ESPECIALES.includes(palabraCompleta)) {
            tipoPalabra = TipoToken.PALABRA_RESERVADA;
        } else if (PALABRAS_NORMALES.includes(palabraCompleta)) {
            tipoPalabra = TipoToken.PALABRA_NORMAL;
        } else {
            this.agregarError(palabraCompleta, 'Palabra desconocida');
            return;
        }
        this.agregarToken(palabraCompleta, tipoPalabra, inicioLinea, inicioColumna);
    }

    leerSimbolo() {
        const caracter = this.caracterActual();
        this.agregarToken(caracter, TipoToken.SIMBOLO, this.linea, this.columna);
        this.posicion++;
        this.columna++;
    }

    caracterActual() {
        return this.posicion < this.texto.length ? this.texto[this.posicion] : '';
    }

    esEspacio(caracter) {
        return caracter === ' ' || caracter === '\t' || caracter === '\r';
    }

    esNumero(caracter) {
        return caracter >= '0' && caracter <= '9';
    }

    esLetra(caracter) {
        return (caracter >= 'a' && caracter <= 'z') ||
               (caracter >= 'A' && caracter <= 'Z') ||
               caracter === 'ñ' || caracter === 'Ñ';
    }

    esSimbolo(caracter) {
        return ['{', '}', '[', ']', ':', ','].includes(caracter);
    }

    saltarEspacios() {
        while (this.posicion < this.texto.length && this.esEspacio(this.caracterActual())) {
            this.posicion++;
            this.columna++;
        }
    }

    agregarToken(texto, tipo, linea, columna) {
        this.tokens.push(new TokenSimple(texto, tipo, linea, columna));
        console.log(`✅ Token encontrado: "${texto}" (${tipo}) en línea ${linea}, columna ${columna}`);
    }

    agregarError(caracter, problema) {
        this.errores.push(new ErrorSimple(caracter, problema, this.linea, this.columna));
        console.log(`❌ Error encontrado: "${caracter}" (${problema}) en línea ${this.linea}, columna ${this.columna}`);
    }

    mostrarTokens() {
        console.log('\n📋 TOKENS ENCONTRADOS:');
        console.log('='.repeat(60));
        console.log('No. | Texto         | Tipo             | Línea | Columna');
        console.log('-'.repeat(60));
        this.tokens.forEach((token, index) => {
            const num = (index + 1).toString().padStart(3);
            const texto = token.texto.padEnd(13);
            const tipo = token.tipo.padEnd(16);
            console.log(`${num} | ${texto} | ${tipo} | ${token.linea.toString().padStart(5)} | ${token.columna.toString().padStart(7)}`);
        });
        console.log('='.repeat(60));
        console.log(`Total: ${this.tokens.length} tokens\n`);
    }

    mostrarErrores() {
        if (this.errores.length === 0) {
            console.log('✅ No se encontraron errores\n');
            return;
        }
        console.log('\n❌ ERRORES ENCONTRADOS:');
        console.log('='.repeat(50));
        console.log('No. | Carácter | Problema        | Línea | Columna');
        console.log('-'.repeat(50));
        this.errores.forEach((error, index) => {
            const num = (index + 1).toString().padStart(3);
            const caracter = error.caracter.padEnd(8);
            const problema = error.problema.padEnd(15);
            console.log(`${num} | ${caracter} | ${problema} | ${error.linea.toString().padStart(5)} | ${error.columna.toString().padStart(7)}`);
        });
        console.log('='.repeat(50));
        console.log(`Total: ${this.errores.length} errores\n`);
    }

    guardarReporte(nombreArchivo) {
        const carpetaReports = path.join(__dirname, '../../reports');
        if (!fs.existsSync(carpetaReports)) {
            fs.mkdirSync(carpetaReports, { recursive: true });
        }
        const rutaArchivo = path.join(carpetaReports, nombreArchivo);
        let reporte = '';
        reporte += `REPORTE DE ANÁLISIS LÉXICO SIMPLE\n`;
        reporte += `==================================\n`;
        reporte += `Fecha: ${new Date().toLocaleString()}\n`;
        reporte += `Archivo: ${nombreArchivo}\n\n`;
        reporte += `TOKENS ENCONTRADOS\n`;
        reporte += `==================\n`;
        reporte += `No. | Texto         | Tipo             | Línea | Columna\n`;
        reporte += `-`.repeat(60) + `\n`;
        this.tokens.forEach((token, index) => {
            const num = (index + 1).toString().padStart(3);
            const texto = token.texto.padEnd(13);
            const tipo = token.tipo.padEnd(16);
            reporte += `${num} | ${texto} | ${tipo} | ${token.linea.toString().padStart(5)} | ${token.columna.toString().padStart(7)}\n`;
        });
        reporte += `\nTotal de tokens: ${this.tokens.length}\n\n`;
        if (this.errores.length > 0) {
            reporte += `ERRORES ENCONTRADOS\n`;
            reporte += `===================\n`;
            reporte += `No. | Carácter | Problema        | Línea | Columna\n`;
            reporte += `-`.repeat(50) + `\n`;
            this.errores.forEach((error, index) => {
                const num = (index + 1).toString().padStart(3);
                const caracter = error.caracter.padEnd(8);
                const problema = error.problema.padEnd(15);
                reporte += `${num} | ${caracter} | ${problema} | ${error.linea.toString().padStart(5)} | ${error.columna.toString().padStart(7)}\n`;
            });
            reporte += `\nTotal de errores: ${this.errores.length}\n`;
        } else {
            reporte += `ERRORES\n`;
            reporte += `=======\n`;
            reporte += `✅ No se encontraron errores\n`;
        }
        fs.writeFileSync(rutaArchivo, reporte, 'utf8');
        console.log(`📄 Reporte guardado en: ${rutaArchivo}`);
    }
}

module.exports = {
    LexicoSimple,
    TokenSimple,
    ErrorSimple,
    TipoToken
};