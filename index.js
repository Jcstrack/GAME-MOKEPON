// Cargamos Express para poder crear un servidor web con Node.js.
const express = require("express");
// Cargamos path para construir rutas absolutas de forma segura en cualquier sistema operativo.
const path = require("path");

// Importas el middleware CORS
const cors = require("cors");

// Creamos la aplicacion principal que manejara rutas, archivos y respuestas HTTP.
const app = express();
// Guardamos el puerto en una constante para reutilizarlo sin repetir el numero.
const PUERTO = 8080;

/*
CORS (Cross-Origin Resource Sharing):
Permite que tu servidor acepte peticiones desde otros dominios (orígenes).

👉 Por defecto, el navegador BLOQUEA solicitudes entre distintos dominios
   (por seguridad), por ejemplo:
   - Frontend: http://localhost:3000
   - Backend:  http://localhost:8080

👉 Sin CORS:
   El navegador impide que el frontend consuma tu API.

👉 Con CORS:
   El servidor responde con headers especiales diciendo:
   "Sí, este origen tiene permiso para acceder".
*/
app.use(cors());

/*
express.json():

Middleware que le dice a Express:
"Convierte automáticamente el body de las peticiones en formato JSON a un objeto JS".
👉 Funciona principalmente con:
   - POST
   - PUT
   - PATCH
*/
app.use(express.json());

// Este arreglo almacenara los jugadores que se vayan uniendo a la partida.
const jugadores = [];

// Esta clase representa a cada jugador que entra al servidor.
//====================================
class Jugador {
  // El constructor recibe el id unico que luego usaremos para identificar al jugador.
  constructor(id) {
    // Guardamos el id dentro del objeto para conservarlo mientras el jugador exista.
    this.id = id;
    // Guardamos con que enemigo entro en combate para poder sincronizar ambas ventanas.
    this.enemigoId = null;
    // Aqui almacenaremos la secuencia de ataques que el jugador elija durante la batalla.
    this.ataques = [];
    // Mientras el jugador siga activo, debe aparecer en el mapa para el resto.
    this.activo = true;
    // Este flag nos dice si esta sesion ya mostro su resultado final al jugador.
    this.resultadoReportado = false;
  }

  asignarMokepon(mokepon) {
    this.mokepon = mokepon;
  }

  actualizarPosicion(x, y) {
    this.x = x;
    this.y = y;
  }

  asignarEnemigo(enemigoId) {
    this.enemigoId = enemigoId;
  }

  asignarAtaques(ataques) {
    this.ataques = ataques;
  }

  resetearCombate() {
    this.enemigoId = null;
    this.ataques = [];
  }

  perder() {
    this.activo = false;
  }

  reportarResultado() {
    this.resultadoReportado = true;
  }

  limpiarResultadoReportado() {
    this.resultadoReportado = false;
  }
}

class Mokepon {
  constructor(nombre) {
    this.nombre = nombre;
  }
}
//====================================

// Servimos todos los archivos estaticos de esta carpeta: HTML, CSS, JS e imagenes.
app.use(express.static(__dirname));

// Cuando alguien entre a la raiz del sitio, enviaremos el archivo principal del juego.
app.get("/", (req, res) => {
  // path.join une la carpeta actual con el nombre del archivo para formar una ruta valida.
  res.sendFile(path.join(__dirname, "mokepon.html"));
});

app.post("/mokepon/:jugadorId", (req, res) => {
  const jugadorId = req.params.jugadorId || "";
  const nombre = req.body.mokepon || "";
  const mokepon = new Mokepon(nombre);
  const jugadorIndex = jugadores.findIndex(
    (jugador) => jugadorId === jugador.id,
  );

  // Usamos >= 0 porque findIndex devuelve 0 cuando encuentra al primer jugador del arreglo.
  if (jugadorIndex >= 0) {
    jugadores[jugadorIndex].asignarMokepon(mokepon);
  }
  console.log(jugadores);
  console.log(jugadorId);

  res.end();
});

app.post("/mokepon/:jugadorId/posicion", (req, res) => {
  const jugadorId = req.params.jugadorId || "";
  const x = req.body.x || 0;
  const y = req.body.y || 0;

  const jugadorIndex = jugadores.findIndex(
    (jugador) => jugadorId === jugador.id,
  );

  // Usamos >= 0 porque findIndex devuelve 0 cuando encuentra al primer jugador del arreglo.
  if (jugadorIndex >= 0) {
    jugadores[jugadorIndex].actualizarPosicion(x, y);
  }

  const enemigos = jugadores.filter(
    (jugador) => jugador.id != jugadorId && jugador.activo !== false,
  );
  const jugadorActual = jugadores.find((jugador) => jugador.id === jugadorId);
  const combate = jugadorActual?.enemigoId
    ? jugadores.find(
        (jugador) =>
          jugador.id === jugadorActual.enemigoId && jugador.activo !== false,
      ) ||
      null
    : null;

  res.send({
    enemigos,
    combate,
  });
});

app.post("/mokepon/:jugadorId/ataques", (req, res) => {
  const jugadorId = req.params.jugadorId || "";
  // Los ataques llegan en el body del POST, no en los params de la URL.
  const ataques = req.body.ataques || [];

  const jugadorIndex = jugadores.findIndex(
    (jugador) => jugadorId === jugador.id,
  );

  // Usamos >= 0 porque findIndex devuelve 0 cuando encuentra al primer jugador del arreglo.
  if (jugadorIndex >= 0) {
    jugadores[jugadorIndex].asignarAtaques(ataques);
  }

  res.send({ ok: true });
});

app.get("/mokepon/:jugadorId/ataques", (req, res) => {
  const jugadorId = req.params.jugadorId || "";
  const jugador = jugadores.find((item) => item.id === jugadorId);

  // Si este jugador aun no tiene enemigo asignado, todavia no hay nada que devolver.
  if (!jugador || !jugador.enemigoId) {
    return res.send({ ataques: [] });
  }

  const enemigo = jugadores.find((item) => item.id === jugador.enemigoId);

  // Solo devolvemos ataques cuando el enemigo ya los haya elegido.
  if (!enemigo || !enemigo.ataques) {
    return res.send({ ataques: [] });
  }

  return res.send({
    ataques: enemigo.ataques,
  });
});

app.post("/mokepon/:jugadorId/resultado", (req, res) => {
  const jugadorId = req.params.jugadorId || "";
  const resultado = req.body.resultado || "";
  const jugador = jugadores.find((item) => item.id === jugadorId);

  if (!jugador) {
    return res.status(404).send({ ok: false });
  }

  const enemigo = jugadores.find((item) => item.id === jugador.enemigoId);

  // Si este jugador perdio, deja de aparecer para el resto en el mapa.
  if (resultado === "perdedor") {
    jugador.perder();
  }

  // Marcamos que esta sesion ya mostro su resultado. No limpiamos inmediatamente porque
  // la otra pestaña todavia puede estar esperando para leer los ataques finales.
  jugador.reportarResultado();

  // Solo cuando ambas sesiones ya reportaron su resultado podemos limpiar el combate.
  if (enemigo && enemigo.resultadoReportado) {
    jugador.resetearCombate();
    jugador.limpiarResultadoReportado();
    enemigo.resetearCombate();
    enemigo.limpiarResultadoReportado();
  }

  return res.send({ ok: true });
});

app.post("/mokepon/:jugadorId/colision", (req, res) => {
  const jugadorId = req.params.jugadorId || "";
  const enemigoId = req.body.enemigoId || "";

  const jugador = jugadores.find((item) => item.id === jugadorId);
  const enemigo = jugadores.find((item) => item.id === enemigoId);

  if (!jugador || !enemigo) {
    return res.status(404).send({ ok: false });
  }

  // Guardamos la relacion en ambos jugadores para que ambas sesiones sepan que ya entro el combate.
  jugador.asignarEnemigo(enemigoId);
  enemigo.asignarEnemigo(jugadorId);

  return res.send({ ok: true });
});

// Esta ruta crea un nuevo jugador cuando el frontend hace la peticion para unirse.
app.get("/unirse", (req, res) => {
  // Evitamos que el navegador guarde en cache esta respuesta porque cada pestaña debe recibir un id distinto
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Generamos un id simple como texto para distinguir a cada jugador.
  const id = `${Math.random()}`;
  // Creamos una instancia del jugador con ese id.
  const jugador = new Jugador(id);
  // Guardamos el jugador en memoria para tener registro de los conectados.
  jugadores.push(jugador);
  // Enviamos el id al navegador para confirmar que la conexion con el servidor funciono.
  res.send(id);
});

// Iniciamos el servidor para que quede escuchando peticiones en el puerto configurado.
app.listen(PUERTO, () => {
  // Mostramos la URL exacta que debes abrir en el navegador para entrar al juego correctamente.
  console.log(`Servidor funcionando en http://localhost:${PUERTO}`);
});
