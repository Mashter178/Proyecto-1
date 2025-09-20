// Análisis léxico simple con manejo de errores
const fs = require('fs');
const path = require('path');

// Tipos de tokens básicos
const TokenTypes = {
  // Secciones
  TORNEO: 'TORNEO',
  EQUIPOS: 'EQUIPOS', 
  ELIMINACION: 'ELIMINACION',
  
  // Palabras clave
  PALABRA_CLAVE: 'PALABRA_CLAVE',
  
  // Valores
  TEXTO: 'TEXTO',           // Texto entre comillas
  NUMERO: 'NUMERO',         // Números
  
  // Símbolos
  LLAVE_ABRE: 'LLAVE_ABRE',
  LLAVE_CIERRA: 'LLAVE_CIERRA', // }
  CORCHETE_ABRE: 'CORCHETE_ABRE',   // [
  CORCHETE_CIERRA: 'CORCHETE_CIERRA', // ]
  DOS_PUNTOS: 'DOS_PUNTOS',     // :
  COMA: 'COMA',                 // ,
  PUNTO_COMA: 'PUNTO_COMA',     
  
  // Especiales
  NUEVA_LINEA: 'NUEVA_LINEA',
  FIN_ARCHIVO: 'FIN_ARCHIVO',
  ERROR: 'ERROR'
};

class Token {
  constructor(tipo, valor, linea, columna) {
    this.tipo = tipo;
    this.valor = valor;
    this.linea = linea;
    this.columna = columna;
  }
  
  toString() {
    return `[${this.tipo}] "${this.valor}" (Línea: ${this.linea}, Columna: ${this.columna})`;
  }
}

class ErrorLexico {
  constructor(mensaje, caracter, linea, columna) {
    this.mensaje = mensaje;
    this.caracter = caracter;
    this.linea = linea;
    this.columna = columna;
    this.timestamp = new Date();
  }
  
  toString() {
    return `❌ ERROR LÉXICO - Línea ${this.linea}, Columna ${this.columna}: ${this.mensaje} (Carácter: "${this.caracter}")`;
  }
}

class AnalizadorLexico {
  constructor() {
    this.texto = '';
    this.posicion = 0;
    this.linea = 1;
    this.columna = 1;
    this.tokens = [];
    this.errores = [];
    
    // Palabras clave que reconocemos
    this.palabrasClave = [
      'nombre', 'sede', 'equipos', 'equipo', 'jugador', 
      'posicion', 'Dorsal', 'Edad', 'partido', 'resultado', 
      'goleador', 'minuto', 'cuartos', 'semifinales', 'final',
      'octavos', 'diesiseisavos', 'vs', 'goleadores'
    ];
  }
  
  // Obtener carácter actual
  caracterActual() {
    if (this.posicion >= this.texto.length) {
      return null;
    }
    return this.texto[this.posicion];
  }
  
  // Avanzar al siguiente carácter
  avanzar() {
    if (this.caracterActual() === '\n') {
      this.linea++;
      this.columna = 1;
    } else {
      this.columna++;
    }
    this.posicion++;
  }
  
  // Saltar espacios en blanco (excepto salto de línea)
  saltarEspacios() {
    while (this.caracterActual() && /[ \t\r]/.test(this.caracterActual())) {
      this.avanzar();
    }
  }
  
  // Leer texto entre comillas
  leerTexto() {
    const inicioLinea = this.linea;
    const inicioColumna = this.columna;
    let resultado = '';
    
    this.avanzar(); // Saltar comilla inicial "
    
    while (this.caracterActual() && this.caracterActual() !== '"') {
      resultado += this.caracterActual();
      this.avanzar();
    }
    
    // Verificar que se cerró la comilla
    if (this.caracterActual() === '"') {
      this.avanzar(); // Saltar comilla final
      return new Token(TokenTypes.TEXTO, resultado, inicioLinea, inicioColumna);
    } else {
      // Error: texto sin cerrar
      const error = new ErrorLexico(
        'Texto sin cerrar - falta comilla de cierre',
        '"',
        inicioLinea,
        inicioColumna
      );
      this.errores.push(error);
      return new Token(TokenTypes.ERROR, resultado, inicioLinea, inicioColumna);
    }
  }
  
  // Leer número
  leerNumero() {
    const inicioLinea = this.linea;
    const inicioColumna = this.columna;
    let resultado = '';
    
    while (this.caracterActual() && /\d/.test(this.caracterActual())) {
      resultado += this.caracterActual();
      this.avanzar();
    }
    
    const numero = parseInt(resultado);
    if (isNaN(numero)) {
      const error = new ErrorLexico(
        'Número mal formado',
        resultado,
        inicioLinea,
        inicioColumna
      );
      this.errores.push(error);
      return new Token(TokenTypes.ERROR, resultado, inicioLinea, inicioColumna);
    }
    
    return new Token(TokenTypes.NUMERO, numero, inicioLinea, inicioColumna);
  }
  
  // Leer palabra (identificador o palabra clave)
  leerPalabra() {
    const inicioLinea = this.linea;
    const inicioColumna = this.columna;
    let resultado = '';
    
    while (this.caracterActual() && /[a-zA-ZÁ-ÿ]/.test(this.caracterActual())) {
      resultado += this.caracterActual();
      this.avanzar();
    }
    
    // Verificar si es una sección especial
    if (resultado === 'TORNEO') {
      return new Token(TokenTypes.TORNEO, resultado, inicioLinea, inicioColumna);
    }
    if (resultado === 'EQUIPOS') {
      return new Token(TokenTypes.EQUIPOS, resultado, inicioLinea, inicioColumna);
    }
    if (resultado === 'ELIMINACION') {
      return new Token(TokenTypes.ELIMINACION, resultado, inicioLinea, inicioColumna);
    }
    
    // Verificar si es palabra clave conocida
    if (this.palabrasClave.includes(resultado)) {
      return new Token(TokenTypes.PALABRA_CLAVE, resultado, inicioLinea, inicioColumna);
    }
    
    // Si no es palabra clave conocida, reportar como error
    const error = new ErrorLexico(
      `Palabra no reconocida: "${resultado}"`,
      resultado,
      inicioLinea,
      inicioColumna
    );
    this.errores.push(error);
    return new Token(TokenTypes.ERROR, resultado, inicioLinea, inicioColumna);
  }
  
  // Analizar texto
  analizar(texto) {
    this.texto = texto;
    this.posicion = 0;
    this.linea = 1;
    this.columna = 1;
    this.tokens = [];
    this.errores = [];
    
    while (this.caracterActual()) {
      const inicioLinea = this.linea;
      const inicioColumna = this.columna;
      const caracter = this.caracterActual();
      
      // Saltar espacios
      if (/[ \t\r]/.test(caracter)) {
        this.saltarEspacios();
        continue;
      }
      
      // Nueva línea
      if (caracter === '\n') {
        this.tokens.push(new Token(TokenTypes.NUEVA_LINEA, '\\n', inicioLinea, inicioColumna));
        this.avanzar();
        continue;
      }
      
      // Texto entre comillas
      if (caracter === '"') {
        const token = this.leerTexto();
        this.tokens.push(token);
        continue;
      }
      
      // Números
      if (/\d/.test(caracter)) {
        const token = this.leerNumero();
        this.tokens.push(token);
        continue;
      }
      
      // Letras (palabras)
      if (/[a-zA-ZÁ-ÿ]/.test(caracter)) {
        const token = this.leerPalabra();
        this.tokens.push(token);
        continue;
      }
      
      // Símbolos conocidos
      const simbolos = {
        '{': TokenTypes.LLAVE_ABRE,
        '}': TokenTypes.LLAVE_CIERRA,
        '[': TokenTypes.CORCHETE_ABRE,
        ']': TokenTypes.CORCHETE_CIERRA,
        ':': TokenTypes.DOS_PUNTOS,
        ',': TokenTypes.COMA,
        ';': TokenTypes.PUNTO_COMA
      };
      
      if (simbolos[caracter]) {
        this.tokens.push(new Token(simbolos[caracter], caracter, inicioLinea, inicioColumna));
        this.avanzar();
        continue;
      }
      
      // Carácter no reconocido - ERROR
      const error = new ErrorLexico(
        `Carácter no reconocido`,
        caracter,
        inicioLinea,
        inicioColumna
      );
      this.errores.push(error);
      this.tokens.push(new Token(TokenTypes.ERROR, caracter, inicioLinea, inicioColumna));
      this.avanzar();
    }
    
    // Agregar token de fin de archivo
    this.tokens.push(new Token(TokenTypes.FIN_ARCHIVO, null, this.linea, this.columna));
    
    return {
      tokens: this.tokens,
      errores: this.errores,
      tieneErrores: this.errores.length > 0
    };
  }
  
  // Mostrar tokens
  mostrarTokens() {
    console.log('\n📋 TOKENS ENCONTRADOS:');
    console.log('='.repeat(50));
    this.tokens.forEach((token, index) => {
      if (token.tipo !== TokenTypes.NUEVA_LINEA) {
        const color = token.tipo === TokenTypes.ERROR ? '❌' : '✅';
        console.log(`${index.toString().padStart(3)}: ${color} ${token.toString()}`);
      }
    });
  }
  
  // Mostrar errores
  mostrarErrores() {
    if (this.errores.length === 0) {
      console.log('\n✅ NO SE ENCONTRARON ERRORES LÉXICOS');
      return;
    }
    
    console.log(`\n❌ SE ENCONTRARON ${this.errores.length} ERRORES LÉXICOS:`);
    console.log('='.repeat(50));
    this.errores.forEach((error, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${error.toString()}`);
    });
  }
  
  // Guardar errores en archivo
  guardarErrores(nombreArchivo = 'errores_lexicos.txt') {
    if (this.errores.length === 0) {
      console.log('✅ No hay errores que guardar');
      return false;
    }
    
    try {
      const carpetaErrores = path.join(__dirname, 'errores');
      if (!fs.existsSync(carpetaErrores)) {
        fs.mkdirSync(carpetaErrores);
      }
      
      let contenido = `REPORTE DE ERRORES LÉXICOS\n`;
      contenido += `Fecha: ${new Date().toLocaleString()}\n`;
      contenido += `Total de errores: ${this.errores.length}\n`;
      contenido += `${'='.repeat(50)}\n\n`;
      
      this.errores.forEach((error, index) => {
        contenido += `${index + 1}. ${error.toString()}\n`;
      });
      
      const rutaCompleta = path.join(carpetaErrores, nombreArchivo);
      fs.writeFileSync(rutaCompleta, contenido, 'utf8');
      
      console.log(`💾 Errores guardados en: ${rutaCompleta}`);
      return true;
    } catch (error) {
      console.log('❌ Error al guardar los errores:', error.message);
      return false;
    }
  }
  
  // Obtener estadísticas
  obtenerEstadisticas() {
    const stats = {
      totalTokens: this.tokens.length,
      tokensValidos: this.tokens.filter(t => t.tipo !== TokenTypes.ERROR).length,
      tokensError: this.tokens.filter(t => t.tipo === TokenTypes.ERROR).length,
      totalErrores: this.errores.length,
      lineasProcesadas: this.linea - 1
    };
    
    console.log('\n📊 ESTADÍSTICAS DEL ANÁLISIS:');
    console.log('='.repeat(30));
    console.log(`📄 Líneas procesadas: ${stats.lineasProcesadas}`);
    console.log(`🔍 Total de tokens: ${stats.totalTokens}`);
    console.log(`✅ Tokens válidos: ${stats.tokensValidos}`);
    console.log(`❌ Tokens con error: ${stats.tokensError}`);
    console.log(`🚨 Total de errores: ${stats.totalErrores}`);
    
    return stats;
  }
}

module.exports = {
  TokenTypes,
  Token,
  ErrorLexico,
  AnalizadorLexico
};
