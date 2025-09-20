const fs = require('fs');
const path = require('path');

// === 1. DEFINIR QUÉ TIPOS DE "COSAS" PODEMOS ENCONTRAR ===
const TipoToken = {
    PALABRA_RESERVADA: 'Palabra Reservada',    // TORNEO, EQUIPOS, ELIMINACION
    PALABRA_NORMAL: 'Palabra Normal',          // nombre, equipo, jugador
    TEXTO: 'Texto',                           // "Barcelona", "Messi"
    NUMERO: 'Número',                         // 25, 10, 3
    SIMBOLO: 'Símbolo',                       // {, }, [, ], :, ,
    ERROR: 'Error'                            // Cualquier cosa rara
};

// === 2. LISTA DE PALABRAS ESPECIALES ===
const PALABRAS_ESPECIALES = ['TORNEO', 'EQUIPOS', 'ELIMINACION', 'cuartos', 'semifinales', 'final'];
const PALABRAS_NORMALES = ['nombre', 'sede', 'equipo', 'jugador', 'posicion', 'numero', 'edad', 'partido', 'resultado', 'goleador', 'minuto'];

// === 3. CLASE PARA GUARDAR UN "PEDACITO" DEL TEXTO ===
// TokenSimple como función constructora
function TokenSimple(texto, tipo, linea, columna) {
    this.texto = texto;        // Lo que encontramos: "TORNEO", "25", "{"
    this.tipo = tipo;          // Qué tipo es: "Palabra Reservada", "Número"
    this.linea = linea;        // En qué línea está
    this.columna = columna;    // En qué columna está
}

// === 4. CLASE PARA GUARDAR ERRORES ===
function ErrorSimple(caracter, problema, linea, columna) {
    this.caracter = caracter;  // El carácter problemático
    this.problema = problema;  // Qué está mal
    this.linea = linea;        // Dónde está
    this.columna = columna;    // Posición exacta
}

// === 5. EL ANALIZADOR (LA PARTE PRINCIPAL) ===
class LexicoSimple {
    constructor() {
        this.texto = '';           // El texto que vamos a analizar
        this.posicion = 0;         // Dónde estamos leyendo
        this.linea = 1;            // Qué línea estamos leyendo
        this.columna = 1;          // Qué columna estamos leyendo
        this.tokens = [];          // Lista de "pedacitos" encontrados
        this.errores = [];         // Lista de errores encontrados
    }

    // === MÉTODO PRINCIPAL: ANALIZAR TODO EL TEXTO ===
    analizar(textoCompleto) {
        console.log('🔍 Empezando análisis léxico simple...\n');
        
        this.texto = textoCompleto;
        this.posicion = 0;
        this.linea = 1;
        this.columna = 1;
        this.tokens = [];
        this.errores = [];

        // Leer carácter por carácter hasta el final
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

    // === DECIDIR QUÉ HACER CON CADA CARÁCTER ===
    leerSiguienteElemento() {
        const caracter = this.caracterActual();

        // ¿Es un espacio? → Saltarlo
        if (this.esEspacio(caracter)) {
            this.saltarEspacios();
            return;
        }

        // ¿Es un salto de línea? → Contar la línea
        if (caracter === '\n') {
            this.linea++;
            this.columna = 1;
            this.posicion++;
            return;
        }

        // ¿Es una comilla? → Leer texto entre comillas
        if (caracter === '"') {
            this.leerTextoEntreComillas();
            return;
        }

        // ¿Es un número? → Leer el número completo
        if (this.esNumero(caracter)) {
            this.leerNumeroCompleto();
            return;
        }

        // ¿Es un símbolo? → Leer el símbolo
        if (this.esSimbolo(caracter)) {
            this.leerSimbolo();
            return;
        }

        // ¿Es una letra? → Leer la palabra completa
        if (this.esLetra(caracter)) {
            this.leerPalabraCompleta();
            return;
        }

        // ¡No sabemos qué es! → Error
        this.agregarError(caracter, 'Carácter desconocido');
        this.posicion++;
        this.columna++;
    }

    // === LEER TEXTO ENTRE COMILLAS: "Barcelona" ===
    leerTextoEntreComillas() {
        const inicioLinea = this.linea;
        const inicioColumna = this.columna;
        let textoCompleto = '';
        
        this.posicion++; // Saltar la primera comilla
        this.columna++;

        // Leer hasta encontrar la comilla de cierre
        while (this.posicion < this.texto.length) {
            const caracter = this.caracterActual();
            
            if (caracter === '"') {
                // ¡Encontramos la comilla de cierre!
                this.posicion++; // Saltar la comilla final
                this.columna++;
                this.agregarToken(`"${textoCompleto}"`, TipoToken.TEXTO, inicioLinea, inicioColumna);
                return;
            }
            
            if (caracter === '\n') {
                // ¡Error! No puede haber salto de línea dentro del texto
                this.agregarError('"', 'Texto sin cerrar (falta comilla)');
                return;
            }
            
            textoCompleto += caracter;
            this.posicion++;
            this.columna++;
        }

        // Si llegamos aquí, se acabó el archivo sin cerrar la comilla
        this.agregarError('"', 'Texto sin cerrar al final del archivo');
    }

    // === LEER NÚMEROS: 25, 10, 3 ===
    leerNumeroCompleto() {
        const inicioLinea = this.linea;
        const inicioColumna = this.columna;
        let numeroCompleto = '';

        // Leer todos los dígitos seguidos
        while (this.posicion < this.texto.length && this.esNumero(this.caracterActual())) {
            numeroCompleto += this.caracterActual();
            this.posicion++;
            this.columna++;
        }

        this.agregarToken(numeroCompleto, TipoToken.NUMERO, inicioLinea, inicioColumna);
    }

    // === LEER PALABRAS: TORNEO, equipo, nombre ===
    leerPalabraCompleta() {
        const inicioLinea = this.linea;
        const inicioColumna = this.columna;
        let palabraCompleta = '';

        // Leer todas las letras seguidas
        while (this.posicion < this.texto.length && this.esLetra(this.caracterActual())) {
            palabraCompleta += this.caracterActual();
            this.posicion++;
            this.columna++;
        }

        // Decidir qué tipo de palabra es
        let tipoPalabra;
        if (PALABRAS_ESPECIALES.includes(palabraCompleta)) {
            tipoPalabra = TipoToken.PALABRA_RESERVADA;
        } else if (PALABRAS_NORMALES.includes(palabraCompleta)) {
            tipoPalabra = TipoToken.PALABRA_NORMAL;
        } else {
            // No reconocemos esta palabra
            this.agregarError(palabraCompleta, 'Palabra desconocida');
            return;
        }

        this.agregarToken(palabraCompleta, tipoPalabra, inicioLinea, inicioColumna);
    }

    // === LEER SÍMBOLOS: {, }, [, ], :, , ===
    leerSimbolo() {
        const caracter = this.caracterActual();
        this.agregarToken(caracter, TipoToken.SIMBOLO, this.linea, this.columna);
        this.posicion++;
        this.columna++;
    }

    // === MÉTODOS DE AYUDA ===
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

    // === MOSTRAR RESULTADOS DE FORMA SIMPLE ===
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

    // === MÉTODO PARA GENERAR REPORTE EN ARCHIVO ===
    guardarReporte(nombreArchivo) {
        const carpetaReportes = path.join(__dirname, '../../reportes');
        if (!fs.existsSync(carpetaReportes)) {
            fs.mkdirSync(carpetaReportes, { recursive: true });
        }

        const rutaArchivo = path.join(carpetaReportes, nombreArchivo);
        let reporte = '';

        // Encabezado
        reporte += `REPORTE DE ANÁLISIS LÉXICO SIMPLE\n`;
        reporte += `==================================\n`;
        reporte += `Fecha: ${new Date().toLocaleString()}\n`;
        reporte += `Archivo: ${nombreArchivo}\n\n`;

        // Tabla de tokens
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

        // Tabla de errores
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