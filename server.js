// =========================
// IMPORTACIONES Y CONFIGURACION BASICA
// =========================

// Express permite crear el servidor HTTP y definir rutas para el juego.
const express = require("express");
// Path ayuda a construir rutas absolutas seguras en Windows, Linux o macOS.
const path = require("path");
// CORS permite aceptar peticiones desde otros origenes cuando sea necesario.
const cors = require("cors");

// Creamos la aplicacion principal del servidor.
const app = express();
// Guardamos el puerto en una constante para no repetir el numero en el archivo.
const PUERTO = 8080;
// Carpeta publica desde la que se sirve todo el frontend.
const PUBLIC_DIR = path.join(__dirname, "public");

/*
CORS (Cross-Origin Resource Sharing):
Permite que tu servidor acepte peticiones desde otros dominios u origenes.
En este proyecto casi todo viaja por el mismo localhost, pero dejarlo activo
evita bloqueos del navegador si pruebas desde otra fuente.
*/
app.use(cors());

/*
express.json():
Convierte automaticamente el body JSON de las peticiones POST en un objeto JS.
Gracias a esto podemos leer req.body.x, req.body.mokepon, req.body.ataques, etc.
*/
app.use(express.json());

// =========================
// ESTADO COMPARTIDO DEL SERVIDOR
// =========================

// Aqui se guardan todos los jugadores conectados mientras el servidor siga encendido.
const jugadores = [];

// Devuelve true cuando el jugador ya esta peleando con alguien distinto.
function estaEnCombateConOtro(jugador, posibleRivalId) {
  return Boolean(jugador?.enemigoId && jugador.enemigoId !== posibleRivalId);
}

// =========================
// MODELOS DEL JUEGO
// =========================

// Representa a un jugador real conectado desde una pestaña del navegador.
class Jugador {
  // Cada jugador nace con un id unico para identificar su sesion.
  constructor(id) {
    // Identificador unico de la pestaña/jugador conectado.
    this.id = id;
    // Guarda con que rival esta peleando este jugador en este momento.
    this.enemigoId = null;
    // Aqui se almacena la secuencia de 5 ataques elegida en una batalla.
    this.ataques = [];
    // Mientras siga activo, este jugador todavia debe aparecer en el mapa.
    this.activo = true;
    // Este flag evita limpiar un combate antes de que ambas sesiones vean el resultado.
    this.resultadoReportado = false;
  }

  // Guarda el mokepon elegido para que el resto de jugadores pueda verlo.
  asignarMokepon(mokepon) {
    this.mokepon = mokepon;
  }

  // Actualiza la posicion actual del jugador dentro del mapa compartido.
  actualizarPosicion(x, y) {
    this.x = x;
    this.y = y;
  }

  // Relaciona a este jugador con el enemigo contra el que va a pelear.
  asignarEnemigo(enemigoId) {
    this.enemigoId = enemigoId;
  }

  // Guarda la lista final de ataques elegidos durante una pelea.
  asignarAtaques(ataques) {
    this.ataques = ataques;
  }

  // Limpia los datos del combate para permitir una pelea nueva.
  resetearCombate() {
    this.enemigoId = null;
    this.ataques = [];
  }

  // Marca al jugador como eliminado del mapa.
  perder() {
    this.activo = false;
  }

  // Marca que esta sesion ya mostro en pantalla el resultado del combate.
  reportarResultado() {
    this.resultadoReportado = true;
  }

  // Reinicia el flag del resultado para que pueda entrar a un combate nuevo.
  limpiarResultadoReportado() {
    this.resultadoReportado = false;
  }
}

// El servidor solo necesita guardar el nombre del mokepon elegido.
class Mokepon {
  constructor(nombre) {
    this.nombre = nombre;
  }
}

// =========================
// MIDDLEWARES Y ARCHIVOS ESTATICOS
// =========================

// Esta carpeta sera publica: desde aqui se sirven HTML, CSS, JS e imagenes.
app.use(express.static(PUBLIC_DIR));

// =========================
// RUTAS PRINCIPALES DEL FRONTEND
// =========================

// Cuando alguien visita la raiz del sitio, devolvemos el HTML principal.
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// =========================
// RUTAS DEL JUEGO
// =========================

// Guarda la mascota que eligio un jugador al pulsar "Seleccionar".
app.post("/mokepon/:jugadorId", (req, res) => {
  // jugadorId llega en la URL y mokepon llega en el cuerpo JSON del POST.
  const jugadorId = req.params.jugadorId || "";
  const nombre = req.body.mokepon || "";
  const mokepon = new Mokepon(nombre);
  const jugadorIndex = jugadores.findIndex(
    (jugador) => jugadorId === jugador.id,
  );

  // Usamos >= 0 porque findIndex devuelve 0 cuando encuentra al primer elemento.
  if (jugadorIndex >= 0) {
    // Si encontramos al jugador en memoria, le guardamos la mascota seleccionada.
    jugadores[jugadorIndex].asignarMokepon(mokepon);
  }

  res.end();
});

// Recibe la posicion del jugador y responde con enemigos visibles y combate activo.
app.post("/mokepon/:jugadorId/posicion", (req, res) => {
  // En cada ciclo del mapa el frontend manda sus coordenadas actuales.
  const jugadorId = req.params.jugadorId || "";
  const x = req.body.x || 0;
  const y = req.body.y || 0;

  const jugadorIndex = jugadores.findIndex(
    (jugador) => jugadorId === jugador.id,
  );

  if (jugadorIndex >= 0) {
    // Guardamos la ultima posicion conocida de esta sesion.
    jugadores[jugadorIndex].actualizarPosicion(x, y);
  }

  // Los enemigos visibles son los demas jugadores activos que no estan peleando con terceros.
  const enemigos = jugadores.filter(
    (jugador) =>
      jugador.id != jugadorId &&
      jugador.activo !== false &&
      !estaEnCombateConOtro(jugador, jugadorId),
  );
  // Recuperamos al propio jugador para saber si ya estaba peleando con alguien.
  const jugadorActual = jugadores.find((jugador) => jugador.id === jugadorId);

  // Si este jugador ya entro a combate, devolvemos tambien la informacion del rival.
  const combate = jugadorActual?.enemigoId
    ? jugadores.find(
        (jugador) =>
          jugador.id === jugadorActual.enemigoId && jugador.activo !== false,
      ) ||
      null
    : null;

  res.send({
    // enemigos se usa para dibujar rivales en el mapa.
    enemigos,
    // combate se usa para forzar a esta ventana a entrar al mismo combate si el choque lo detecto la otra.
    combate,
  });
});

// Guarda los 5 ataques que el jugador selecciono durante la pelea.
app.post("/mokepon/:jugadorId/ataques", (req, res) => {
  // El frontend envia un arreglo como ["FUEGO", "AGUA", ...].
  const jugadorId = req.params.jugadorId || "";
  const ataques = req.body.ataques || [];

  const jugadorIndex = jugadores.findIndex(
    (jugador) => jugadorId === jugador.id,
  );

  if (jugadorIndex >= 0) {
    // Con esto el servidor ya sabe que este jugador termino su jugada completa.
    jugadores[jugadorIndex].asignarAtaques(ataques);
  }

  res.send({ ok: true });
});

// Devuelve los ataques del rival cuando el rival ya termino su jugada.
app.get("/mokepon/:jugadorId/ataques", (req, res) => {
  const jugadorId = req.params.jugadorId || "";
  const jugador = jugadores.find((item) => item.id === jugadorId);

  // Si este jugador todavia no tiene rival asignado, aun no hay combate listo.
  if (!jugador || !jugador.enemigoId) {
    // Devolvemos un arreglo vacio para que el frontend siga esperando sin romperse.
    return res.send({ ataques: [] });
  }

  const enemigo = jugadores.find((item) => item.id === jugador.enemigoId);

  // Solo devolvemos ataques cuando el enemigo ya envio su lista final.
  if (!enemigo || !enemigo.ataques) {
    return res.send({ ataques: [] });
  }

  // Cuando ya existen 5 ataques, el frontend puede resolver el combate localmente.
  return res.send({
    ataques: enemigo.ataques,
  });
});

// Guarda el resultado final de un combate para sincronizar ambas pestañas.
app.post("/mokepon/:jugadorId/resultado", (req, res) => {
  // El resultado llega como "ganador", "perdedor" o "empate".
  const jugadorId = req.params.jugadorId || "";
  const resultado = req.body.resultado || "";
  const jugador = jugadores.find((item) => item.id === jugadorId);

  if (!jugador) {
    return res.status(404).send({ ok: false });
  }

  const enemigo = jugadores.find((item) => item.id === jugador.enemigoId);

  // Si pierde, deja de aparecer en el mapa para los demas jugadores.
  if (resultado === "perdedor") {
    jugador.perder();
  }

  // Marcamos que esta sesion ya mostro su resultado.
  // Esto evita limpiar demasiado pronto el combate mientras la otra pestaña aun esta leyendo datos.
  jugador.reportarResultado();

  // Solo limpiamos el combate cuando ambas sesiones ya llegaron al final.
  if (enemigo && enemigo.resultadoReportado) {
    // Limpiamos en ambos lados para permitir seguir jugando o empezar una partida nueva.
    jugador.resetearCombate();
    jugador.limpiarResultadoReportado();
    enemigo.resetearCombate();
    enemigo.limpiarResultadoReportado();
  }

  return res.send({ ok: true });
});

// Enlaza a dos jugadores cuando chocan en el mapa y comienza la pelea sincronizada.
app.post("/mokepon/:jugadorId/colision", (req, res) => {
  // El frontend llama esta ruta cuando detecta un choque de cajas en el mapa.
  const jugadorId = req.params.jugadorId || "";
  const enemigoId = req.body.enemigoId || "";

  const jugador = jugadores.find((item) => item.id === jugadorId);
  const enemigo = jugadores.find((item) => item.id === enemigoId);

  if (!jugador || !enemigo) {
    return res.status(404).send({ ok: false });
  }

  // Un jugador derrotado o inexistente no puede entrar a una nueva colision.
  if (jugador.activo === false || enemigo.activo === false) {
    return res.status(409).send({ ok: false, motivo: "jugador-inactivo" });
  }

  // Si alguno de los dos ya esta peleando con otra persona, bloqueamos la entrada del tercero.
  if (
    estaEnCombateConOtro(jugador, enemigoId) ||
    estaEnCombateConOtro(enemigo, jugadorId)
  ) {
    return res.status(409).send({ ok: false, motivo: "combate-ocupado" });
  }

  // Guardamos la relacion en ambos jugadores para que las dos ventanas entren al mismo combate.
  // Desde este momento ambos jugadores quedan "enlazados" hasta que el combate termine.
  jugador.asignarEnemigo(enemigoId);
  enemigo.asignarEnemigo(jugadorId);

  return res.send({ ok: true });
});

// Crea un nuevo jugador y devuelve su id unico al navegador.
app.get("/unirse", (req, res) => {
  // Cada pestaña debe recibir un id distinto, por eso evitamos que se guarde esta respuesta en cache.
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const id = `${Math.random()}`;
  // Creamos el jugador apenas se une. Aun no tiene mokepon ni posicion definida.
  const jugador = new Jugador(id);
  // El arreglo jugadores es la "memoria viva" del servidor durante la ejecucion.
  jugadores.push(jugador);
  res.send(id);
});

// =========================
// INICIO DEL SERVIDOR
// =========================

// Levantamos el servidor y dejamos visible la URL correcta de acceso.
app.listen(PUERTO, () => {
  console.log(`Servidor funcionando en http://localhost:${PUERTO}`);
});
