const lienzo = document.querySelector("#lienzo");
const contexto = lienzo.getContext("2d");
const botonIniciar = document.querySelector("#iniciar");
const botonReiniciar = document.querySelector("#reiniciar");
const botonPausar = document.querySelector("#pausar");
const textoEstado = document.querySelector("#estado");

const tamanoCelda = 10;
const caminantesIniciales = 28;
const caminantesMaximos = 500;
const direcciones = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
];

let anchoLienzo = 0;
let altoLienzo = 0;
let columnas = 0;
let filas = 0;
let centroX = 0;
let centroY = 0;
let maximoCrecimiento = 0;
let ocupacion;
let colores;
let particulas = [];
let caminantes = [];
let radioRamificacion = 0;
let cantidadParticulas = 0;
let estadoAnimacion = "inactiva";
let ultimoFotograma = 0;
let tiempoAcumulado = 0;
let fotogramaPendiente = null;
let bordesTocados = {
    izquierda: false,
    derecha: false,
    arriba: false,
    abajo: false
};

function prepararLienzo() {
    const rectangulo = lienzo.getBoundingClientRect();
    const escala = window.devicePixelRatio || 1;

    anchoLienzo = rectangulo.width;
    altoLienzo = rectangulo.height;
    lienzo.width = Math.floor(anchoLienzo * escala);
    lienzo.height = Math.floor(altoLienzo * escala);
    contexto.setTransform(escala, 0, 0, escala, 0, 0);

    columnas = Math.max(3, Math.floor(anchoLienzo / tamanoCelda));
    filas = Math.max(3, Math.floor(altoLienzo / tamanoCelda));
    centroX = Math.floor(columnas / 2);
    centroY = Math.floor(filas / 2);
    maximoCrecimiento = Math.min(
        centroX,
        columnas - 1 - centroX,
        centroY,
        filas - 1 - centroY
    );
}

function iniciarNuevaRamificacion() {
    ocupacion = new Uint8Array(columnas * filas);
    colores = new Array(columnas * filas);
    particulas = [];
    caminantes = [];
    radioRamificacion = 0;
    cantidadParticulas = 1;
    tiempoAcumulado = 0;
    ultimoFotograma = 0;
    bordesTocados = {
        izquierda: false,
        derecha: false,
        arriba: false,
        abajo: false
    };

    const indiceCentro = obtenerIndice(centroX, centroY);
    ocupacion[indiceCentro] = 1;
    colores[indiceCentro] = "#ffffff";
    particulas.push({ x: centroX, y: centroY, color: colores[indiceCentro] });

    for (let i = 0; i < caminantesIniciales; i++) {
        caminantes.push(crearParticula());
    }
    dibujarEscena();
}

function obtenerIndice(x, y) {
    return y * columnas + x;
}

function crearParticula() {
    const radioSalida = Math.max(4, radioRamificacion + 4);
    const angulo = Math.random() * Math.PI * 2;
    const x = Math.min(
        columnas - 2,
        Math.max(1, Math.round(centroX + Math.cos(angulo) * radioSalida))
    );
    const y = Math.min(
        filas - 2,
        Math.max(1, Math.round(centroY + Math.sin(angulo) * radioSalida))
    );

    return {
        x: x,
        y: y,
        direccion: Math.floor(Math.random() * direcciones.length)
    };
}

function estaJuntoALaRamificacion(x, y) {
    return (x + 1 < columnas && ocupacion[obtenerIndice(x + 1, y)] === 1)
        || (x - 1 >= 0 && ocupacion[obtenerIndice(x - 1, y)] === 1)
        || (y + 1 < filas && ocupacion[obtenerIndice(x, y + 1)] === 1)
        || (y - 1 >= 0 && ocupacion[obtenerIndice(x, y - 1)] === 1);
}

function avanzarCaminante(caminante) {
    const direccion = direcciones[caminante.direccion];
    caminante.x += direccion.x;
    caminante.y += direccion.y;

    if (
        caminante.x < 0
        || caminante.x >= columnas
        || caminante.y < 0
        || caminante.y >= filas
    ) {
        return false;
    }

    const indice = obtenerIndice(caminante.x, caminante.y);
    if (ocupacion[indice] === 1) {
        return false;
    }

    if (estaJuntoALaRamificacion(caminante.x, caminante.y)) {
        adherirParticula(caminante);
        return false;
    }

    if (
        caminante.x === 0
        || caminante.x === columnas - 1
        || caminante.y === 0
        || caminante.y === filas - 1
    ) {
        return false;
    }

    const distanciaAlCentro = Math.hypot(
        caminante.x - centroX,
        caminante.y - centroY
    );
    if (distanciaAlCentro > radioRamificacion + 24) {
        return false;
    }

    caminante.direccion = Math.floor(Math.random() * direcciones.length);
    return true;
}

function adherirParticula(caminante) {
    const x = caminante.x;
    const y = caminante.y;
    const indice = obtenerIndice(x, y);
    const distanciaAlCentro = Math.hypot(x - centroX, y - centroY);

    ocupacion[indice] = 1;
    colores[indice] = colorDeCrecimiento(distanciaAlCentro);
    particulas.push({ x: x, y: y, color: colores[indice] });
    cantidadParticulas++;

    if (distanciaAlCentro > radioRamificacion) {
        radioRamificacion = distanciaAlCentro;
    }

    if (x === 0) bordesTocados.izquierda = true;
    if (x === columnas - 1) bordesTocados.derecha = true;
    if (y === 0) bordesTocados.arriba = true;
    if (y === filas - 1) bordesTocados.abajo = true;

    if (llegoALosCuatroBordes()) {
        finalizarAnimacion();
    }
}

function colorDeCrecimiento(radio) {
    const avance = Math.min(1, radio / Math.max(1, maximoCrecimiento));

    if (avance < 0.5) {
        const mezcla = avance * 2;
        const verde = Math.round(35 + mezcla * 105);
        return "rgb(255, " + verde + ", 18)";
    }

    const mezcla = (avance - 0.5) * 2;
    const verde = Math.round(140 + mezcla * 75);
    const azul = Math.round(18 + mezcla * 5);
    return "rgb(255, " + verde + ", " + azul + ")";
}

function demoraPorMovimiento() {
    const uniones = cantidadParticulas - 1;
    if (uniones < 3) {
        return 500;
    }

    const avance = Math.min(1, (uniones - 2) / 200);
    return (500 - avance * 495) / 4;
}

function animar(marcaDeTiempo) {
    fotogramaPendiente = null;

    if (estadoAnimacion !== "activa") {
        return;
    }

    if (ultimoFotograma === 0) {
        ultimoFotograma = marcaDeTiempo;
    }

    const tiempoRealTranscurrido = marcaDeTiempo - ultimoFotograma;
    ultimoFotograma = marcaDeTiempo;
    const tiempoTranscurrido = Math.min(tiempoRealTranscurrido, 100);
    tiempoAcumulado += tiempoTranscurrido;

    let demora = demoraPorMovimiento();
    let movimientos = 0;

    while (
        tiempoAcumulado >= demora
        && movimientos < 20
        && estadoAnimacion === "activa"
    ) {
        moverCaminantes();
        tiempoAcumulado -= demora;
        demora = demoraPorMovimiento();
        tiempoAcumulado = Math.max(0, tiempoAcumulado);
        actualizarCantidadCaminantes();
        movimientos++;
    }

    dibujarEscena();

    if (estadoAnimacion === "activa") {
        programarFotograma();
    }
}

function moverCaminantes() {
    for (let i = 0; i < caminantes.length; i++) {
        const sigueActivo = avanzarCaminante(caminantes[i]);

        if (estadoAnimacion !== "activa") {
            caminantes.length = 0;
            return;
        }

        if (!sigueActivo) {
            caminantes[i] = crearParticula();
        }
    }
}

function actualizarCantidadCaminantes() {
    const avance = Math.min(1, (cantidadParticulas - 1) / 500);
    const cantidadDeseada = Math.round(
        caminantesIniciales + avance * (caminantesMaximos - caminantesIniciales)
    );

    while (caminantes.length < cantidadDeseada) {
        caminantes.push(crearParticula());
    }
}

function finalizarAnimacion() {
    estadoAnimacion = "terminada";
    botonPausar.innerText = "Pausar";
    textoEstado.innerText = "La ramificación llegó a los cuatro bordes del lienzo.";
    caminantes = [];
}

function llegoALosCuatroBordes() {
    return bordesTocados.izquierda
        && bordesTocados.derecha
        && bordesTocados.arriba
        && bordesTocados.abajo;
}

function programarFotograma() {
    if (estadoAnimacion === "activa" && fotogramaPendiente === null) {
        fotogramaPendiente = requestAnimationFrame(animar);
    }
}

function cancelarFotograma() {
    if (fotogramaPendiente !== null) {
        cancelAnimationFrame(fotogramaPendiente);
        fotogramaPendiente = null;
    }
}

function dibujarEscena() {
    contexto.fillStyle = "#000000";
    contexto.fillRect(0, 0, anchoLienzo, altoLienzo);

    for (let i = 0; i < particulas.length; i++) {
        const particula = particulas[i];
        contexto.fillStyle = particula.color;
        contexto.fillRect(
            particula.x * tamanoCelda,
            particula.y * tamanoCelda,
            tamanoCelda,
            tamanoCelda
        );
    }

    if (estadoAnimacion === "activa" || estadoAnimacion === "pausada") {
        for (let i = 0; i < caminantes.length; i++) {
            dibujarCaminante(caminantes[i]);
        }
    }
}

function dibujarCaminante(caminante) {
    const x = (caminante.x + 0.5) * tamanoCelda;
    const y = (caminante.y + 0.5) * tamanoCelda;

    contexto.fillStyle = "#fff3b0";
    contexto.beginPath();
    contexto.arc(x, y, tamanoCelda * 0.65, 0, Math.PI * 2);
    contexto.fill();

    if (cantidadParticulas >= 4) {
        return;
    }

    const direccion = direcciones[caminante.direccion];
    const inicioX = x + direccion.x * tamanoCelda * 1.2;
    const inicioY = y + direccion.y * tamanoCelda * 1.2;
    const finalX = x + direccion.x * tamanoCelda * 3.3;
    const finalY = y + direccion.y * tamanoCelda * 3.3;

    contexto.strokeStyle = "#fff3b0";
    contexto.lineWidth = 1.5;
    contexto.beginPath();
    contexto.moveTo(inicioX, inicioY);
    contexto.lineTo(finalX, finalY);
    contexto.stroke();

    contexto.beginPath();
    contexto.moveTo(finalX, finalY);
    contexto.lineTo(
        finalX - direccion.x * tamanoCelda * 1.2 + direccion.y * tamanoCelda * 0.7,
        finalY - direccion.y * tamanoCelda * 1.2 - direccion.x * tamanoCelda * 0.7
    );
    contexto.lineTo(
        finalX - direccion.x * tamanoCelda * 1.2 - direccion.y * tamanoCelda * 0.7,
        finalY - direccion.y * tamanoCelda * 1.2 + direccion.x * tamanoCelda * 0.7
    );
    contexto.closePath();
    contexto.fillStyle = "#fff3b0";
    contexto.fill();
}

function actualizarTextoPausa() {
    if (estadoAnimacion === "activa") {
        botonPausar.innerText = "Pausar";
        textoEstado.innerText = "La ramificación está creciendo. La velocidad aumenta con su expansión.";
    } else if (estadoAnimacion === "pausada") {
        botonPausar.innerText = "Continuar";
        textoEstado.innerText = "Animación pausada.";
    }
}

botonIniciar.addEventListener("click", function () {
    if (estadoAnimacion === "inactiva") {
        estadoAnimacion = "activa";
        actualizarTextoPausa();
        ultimoFotograma = 0;
        programarFotograma();
    } else if (estadoAnimacion === "terminada") {
        textoEstado.innerText = "La ramificación terminó. Presioná Reiniciar para empezar otra.";
    }
});

botonReiniciar.addEventListener("click", function () {
    cancelarFotograma();
    prepararLienzo();
    iniciarNuevaRamificacion();
    estadoAnimacion = "activa";
    actualizarTextoPausa();
    programarFotograma();
});

botonPausar.addEventListener("click", function () {
    if (estadoAnimacion === "activa") {
        estadoAnimacion = "pausada";
        cancelarFotograma();
        actualizarTextoPausa();
        dibujarEscena();
    } else if (estadoAnimacion === "pausada") {
        estadoAnimacion = "activa";
        ultimoFotograma = 0;
        actualizarTextoPausa();
        programarFotograma();
    }
});

window.addEventListener("resize", function () {
    const estadoAnterior = estadoAnimacion;
    prepararLienzo();
    iniciarNuevaRamificacion();

    if (estadoAnterior === "terminada") {
        estadoAnimacion = "inactiva";
        textoEstado.innerText = "Presioná Iniciar animación para comenzar.";
        botonPausar.innerText = "Pausar";
    } else {
        estadoAnimacion = estadoAnterior;
        if (estadoAnimacion === "activa") {
            actualizarTextoPausa();
            programarFotograma();
        } else if (estadoAnimacion === "pausada") {
            actualizarTextoPausa();
            dibujarEscena();
        }
    }
});

prepararLienzo();
iniciarNuevaRamificacion();
