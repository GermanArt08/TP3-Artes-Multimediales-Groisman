# TP3 Artes Multimediales 1, cátedra Groisman TM

## Juan Carol Lugones
## Germán Zariz LÜchter

# Ramificaciones aleatorias

Experimento visual inspirado en la agregación limitada por difusión (DLA). La semilla comienza blanca en el centro; muchos caminantes se mueven al azar y se adhieren al tocar la estructura. El fondo es negro y el color pasa de rojo a naranja y amarillo a medida que crece.

## Archivos

- `index.html`: estructura de la página y controles.
- `estilos.css`: presentación visual.
- `animacion.js`: movimiento, crecimiento, dibujo y controles de la animación.

## Uso

Abrir el GitHub Pages (https://germanart08.github.io/TP3-Artes-Multimediales-Groisman/). Presioná **Iniciar animación** para comenzar, **Pausar** para detener temporalmente el crecimiento, **Continuar** para retomarlo y **Reiniciar** para borrar la estructura y comenzar otra automáticamente.

Las partículas miden 10 píxeles. La flecha muestra el próximo paso aleatorio de cada caminante hasta que tres partículas se adhieren a la semilla; después desaparece y el crecimiento acelera gradualmente. La animación termina cuando la ramificación toca al menos una vez los cuatro bordes del lienzo. No requiere bibliotecas ni servicios externos.
