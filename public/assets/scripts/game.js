/*
FLUJO GENERAL DEL FRONTEND
1. El jugador entra al juego y se une al servidor con /unirse.
2. Elige una mascota y la enviamos al backend.
3. En el mapa enviamos posicion constantemente y dibujamos enemigos recibidos del servidor.
4. Si dos jugadores colisionan, ambos entran al mismo combate.
5. Cada jugador envia sus 5 ataques y espera al rival.
6. Cuando ambos terminan, se resuelve el combate y se muestra el resultado.
*/

/// =========================
/// VARIABLES GLOBALES Y REFERENCIAS DEL DOM
/// =========================

// Secciones principales de la interfaz
const sectionMascota = $("#seleccionar-mascota");
const sectionAtaques = $("#seleccionar-ataque");
const sectionReiniciar = $("#reiniciar");

// Contenedores donde se insertan tarjetas y botones dinámicamente
const contenedorTarjetas = $("#contenedor-tarjetas");
const contenedorAtaques = $("#contenedor-ataques");

// Botones fijos del juego
const botonMascota = $("#boton-mascota");
const botonContinuar = $("#boton-continuar");
const botonReiniciar = $("#boton-reiniciar");
const mensajeFinalElem = $("#mensaje-final");

// Elementos donde se muestran datos del jugador y enemigo
const spanMascotaJugador = $("#mascota-jugador");
const spanMascotaEnemigo = $("#mascota-enemigo");
const ataqueJugadorElem = $("#ataques-del-jugador");
const ataqueEnemigoElem = $("#ataques-del-enemigo");
const ataquesSection = $("#ataques");
const victoriasJugadorElem = $("#vidas-jugador");
const victoriasEnemigoElem = $("#vidas-enemigo");

// Referencias a la seccion del mapa y al canvas donde se dibuja todo
const sectionVerMapa = $("#ver-mapa");
const mapa = $("#mapa");

// Arreglos que guardan la secuencia de ataques elegidos
let ataqueJugador = [];
let ataqueEnemigo = [];

// Aqui se guardaran los ataques base del mokepon enemigo dentro de un combate
let ataqueMokeponEnemigo;

// Variables para construir HTML dinámico
let opcionDeMokepones;
let opcionDeAtaques;

// Inputs radio de las mascotas
let inputHipodoge;
let inputCapipepo;
let inputRatigueya;

// Aqui se guardan todos los botones de ataque generados dinamicamente
let botones = [];

// Guarda la mascota elegida por el jugador
let mascotaJugador;
// Guarda el id que devuelve el backend cuando este navegador se une al juego
let jugadorId = null;
let enemigoId = null;
// Guarda la promesa del fetch inicial para poder esperar el id antes de enviar el mokepon
let promesaJugadorId = null;

// Marcador local del combate actual
let victoriaJugador = 0;
let victoriaEnemigo = 0;

// Arreglo principal que guarda todos los mokepones
let mokepones = [];
// Aqui guardaremos los mokepones enemigos recibidos desde el backend para dibujarlos en el mapa
let mokeponesEnemigos = [];
// Este flag evita que el combate se abra varias veces o solo se inicie localmente sin control.
let combateIniciado = false;
// Evita enviar varias solicitudes de colision mientras el servidor aun esta respondiendo.
let colisionEnProceso = false;

// Contexto 2D del canvas, necesario para dibujar el mapa y los personajes
let lienzo = mapa.getContext("2d");
// Intervalo principal del mapa
let intervalo;
// Intervalo que consulta si el rival ya envio sus 5 ataques
let intervaloAtaques = null;
// Intervalo que revisa si despues de una victoria todavia hay enemigos vivos
let intervaloContinuar = null;

// Creamos la imagen de fondo que se dibujara dentro del canvas del mapa
let mapaBackground = new Image();
// La ruta absoluta evita errores al cargar imagenes desde la nueva estructura public/assets.
mapaBackground.src = "/assets/images/mokemap.png";

// Ajustamos el tamaño del mapa para que no crezca demasiado en pantallas grandes.
let alturaQueBuscamos;
let anchoDelMapa = window.innerWidth - 20;
const anchoMaximoDelMapa = 350;

if (anchoDelMapa > anchoMaximoDelMapa) {
  anchoDelMapa = anchoMaximoDelMapa - 20;
}

alturaQueBuscamos = (anchoDelMapa * 600) / 800;

mapa.width = anchoDelMapa;
mapa.height = alturaQueBuscamos;

/// =========================
/// CLASE MOKEPON
/// =========================

class Mokepon {
  /*
  nombre: texto visible del personaje
  img: ruta de la imagen del personaje
  vidas: valor base que se muestra en el combate
  id: se usa sobre todo cuando el enemigo llega desde el backend
  */
  constructor(nombre, img, vidas, x, y, id = null) {
    this.id = id;
    this.nombre = nombre;
    this.img = img;
    this.vidas = vidas;
    this.ataques = [];

    // Tamaño con el que se dibuja dentro del mapa.
    this.ancho = 40;
    this.alto = 40;

    // La mascota del jugador nace en una posicion aleatoria.
    // En los enemigos recibidos desde el backend, luego sobrescribimos x e y con la posicion real.
    this.x = aleatorio(0, mapa.width - this.ancho);
    this.y = aleatorio(0, mapa.height - this.alto);

    // Imagen que se pinta dentro del canvas.
    this.mapaFoto = new Image();
    this.mapaFoto.src = img;

    // Velocidad actual en cada eje. Cambia con teclado o botones tactiles.
    this.velocidadX = 0;
    this.velocidadY = 0;
  }

  // Dibuja el personaje en el canvas usando su posicion actual.
  pintarMokepon() {
    lienzo.drawImage(this.mapaFoto, this.x, this.y, this.ancho, this.alto);
  }
}

/// =========================
/// CREACIÓN DE MOKEPONES
/// =========================

// Estas imagenes ahora se sirven desde public/assets/images.
let hipodoge = new Mokepon("Hipodoge", "/assets/images/Hipodoge.png", 5);
let capipepo = new Mokepon("Capipepo", "/assets/images/Capipepo.png", 5);
let ratigueya = new Mokepon("Ratigueya", "/assets/images/Ratigueya.png", 5);

/// =========================
/// ATAQUES DE CADA MOKEPON
/// =========================
const HIPODOGE_ATAQUES = [
  { id: "hipodoge-agua-1", clase: "boton-agua", nombre: "💧" },
  { id: "hipodoge-agua-2", clase: "boton-agua", nombre: "💧" },
  { id: "hipodoge-agua-3", clase: "boton-agua", nombre: "💧" },
  { id: "hipodoge-fuego-1", clase: "boton-fuego", nombre: "🔥" },
  { id: "hipodoge-tierra-1", clase: "boton-tierra", nombre: "🌱" },
];

const CAPIPEPO_ATAQUES = [
  { id: "capipepo-tierra-1", clase: "boton-tierra", nombre: "🌱" },
  { id: "capipepo-tierra-2", clase: "boton-tierra", nombre: "🌱" },
  { id: "capipepo-tierra-3", clase: "boton-tierra", nombre: "🌱" },
  { id: "capipepo-agua-1", clase: "boton-agua", nombre: "💧" },
  { id: "capipepo-fuego-1", clase: "boton-fuego", nombre: "🔥" },
];

const RATIGUEYA_ATAQUES = [
  { id: "ratigueya-fuego-1", clase: "boton-fuego", nombre: "🔥" },
  { id: "ratigueya-fuego-2", clase: "boton-fuego", nombre: "🔥" },
  { id: "ratigueya-fuego-3", clase: "boton-fuego", nombre: "🔥" },
  { id: "ratigueya-tierra-1", clase: "boton-tierra", nombre: "🌱" },
  { id: "ratigueya-agua-1", clase: "boton-agua", nombre: "💧" },
];

hipodoge.ataques.push(...HIPODOGE_ATAQUES);

capipepo.ataques.push(...CAPIPEPO_ATAQUES);

ratigueya.ataques.push(...RATIGUEYA_ATAQUES);

// Guardamos todos los mokepones en un solo arreglo
mokepones.push(hipodoge, capipepo, ratigueya);

/// =========================
/// FUNCIONES AUXILIARES
/// =========================

function $(qSelector) {
  return document.querySelector(qSelector);
}

// Devuelve un numero entero aleatorio dentro del rango indicado.
function aleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Busca un mokepon local por nombre para recuperar su informacion base y sus ataques.
function obtenerMokeponPorNombre(nombre) {
  return mokepones.find((mokepon) => mokepon.nombre === nombre);
}

// Convierte la informacion de un jugador recibida desde el backend en un Mokepon dibujable.
// El servidor no envia metodos ni imagenes listas para usar en canvas; aqui completamos esa parte local.
function crearMokeponEnemigoDesdeJugador(jugador) {
  if (
    !jugador ||
    !jugador.mokepon ||
    jugador.x === undefined ||
    jugador.y === undefined
  ) {
    return null;
  }

  let mokeponEnemigo = null;
  const mokeponNombre = jugador.mokepon.nombre || "";

  if (mokeponNombre === "Hipodoge") {
    mokeponEnemigo = new Mokepon("Hipodoge", "/assets/images/Hipodoge.png", 5);
  } else if (mokeponNombre === "Capipepo") {
    mokeponEnemigo = new Mokepon("Capipepo", "/assets/images/Capipepo.png", 5);
  } else if (mokeponNombre === "Ratigueya") {
    mokeponEnemigo = new Mokepon("Ratigueya", "/assets/images/Ratigueya.png", 5);
  }

  if (!mokeponEnemigo) {
    return null;
  }

  mokeponEnemigo.x = jugador.x;
  mokeponEnemigo.y = jugador.y;
  // Reutilizamos el id remoto para saber exactamente con quien estamos peleando.
  mokeponEnemigo.id = jugador.id;

  return mokeponEnemigo;
}

/// =========================
/// INICIO DEL JUEGO
/// =========================

function iniciarJuego() {
  // El mapa y los botones finales empiezan ocultos hasta que el jugador elija mascota.
  sectionVerMapa.setAttribute("hidden", true);
  botonContinuar.setAttribute("hidden", true);
  botonReiniciar.setAttribute("hidden", true);

  // Creamos las tarjetas HTML de las mascotas disponibles.
  mokepones.forEach((mokepon) => {
    opcionDeMokepones = `
      <input id="${mokepon.nombre}" type="radio" name="mascota" />
      <label class="tarjeta-de-mokepon" style="background-image: url('${mokepon.img}')" for="${mokepon.nombre}">
        ${mokepon.nombre}
      </label>
    `;

    contenedorTarjetas.innerHTML += opcionDeMokepones;
  });

  inputHipodoge = $("#Hipodoge");
  inputCapipepo = $("#Capipepo");
  inputRatigueya = $("#Ratigueya");

  // Registramos los eventos principales del juego.
  botonMascota.addEventListener("click", seleccionarMascotaJugador);
  botonContinuar.addEventListener("click", continuarJugando);
  botonReiniciar.addEventListener("click", reiniciarJuego);

  // Guardamos esta promesa para poder esperar el jugadorId antes de enviar datos importantes al backend
  promesaJugadorId = unirseAlJuego();
}

async function unirseAlJuego() {
  // Esta es la primera conexion al backend. Sin este id no se puede guardar posicion ni ataques.
  // Forzamos al navegador a no reutilizar una respuesta cacheada para que cada pestaña obtenga un jugador distinto
  const res = await fetch(`/unirse?nocache=${Date.now()}-${Math.random()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudo obtener el jugadorId.");
  }

  jugadorId = await res.text();
  console.log(jugadorId);
  return jugadorId;
}

/// =========================
/// SELECCIÓN DE MASCOTA DEL JUGADOR
/// =========================

async function seleccionarMascotaJugador() {
  // Identificamos cual radio button fue elegido y enlazamos su objeto local.
  if (inputHipodoge.checked) {
    spanMascotaJugador.textContent = inputHipodoge.id;
    mascotaJugador = hipodoge;
  } else if (inputCapipepo.checked) {
    spanMascotaJugador.textContent = inputCapipepo.id;
    mascotaJugador = capipepo;
  } else if (inputRatigueya.checked) {
    spanMascotaJugador.textContent = inputRatigueya.id;
    mascotaJugador = ratigueya;
  } else {
    alert("Selecciona una mascota");
    return;
  }

  // Esperamos el id del jugador para que el backend pueda guardar correctamente la mascota elegida
  if (!jugadorId && promesaJugadorId) {
    await promesaJugadorId;
  }

  await seleccionarMokepon(mascotaJugador);

  // Sacamos los ataques base de la mascota elegida para construir los botones del combate.
  extraerAtaques(mascotaJugador.nombre);

  // Mostramos el mapa una vez que la mascota ya esta registrada en el servidor.
  sectionVerMapa.removeAttribute("hidden");

  // Ocultamos la seccion inicial porque a partir de aqui el flujo ya sigue en el mapa.
  sectionMascota.setAttribute("hidden", true);

  iniciarMapa();
}

async function seleccionarMokepon(mokepon) {
  // Este log muestra el objeto completo del mokepon seleccionado, igual que en la consola de tu profesor.
  console.log(mokepon);
  // Este log muestra solamente el nombre del mokepon seleccionado.
  console.log(mokepon.nombre);

  if (!jugadorId) {
    console.error("No existe jugadorId para enviar el mokepon.");
    return;
  }

  await fetch(`/mokepon/${jugadorId}`, {
    method: "POST",
    // Express lee este JSON gracias al middleware express.json() del backend.
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // Enviamos solo el nombre porque el backend actual crea un nuevo objeto Mokepon a partir de ese texto.
      mokepon: mokepon.nombre,
    }),
  });
}

/// =========================
/// EXTRAER ATAQUES DE LA MASCOTA ELEGIDA
/// =========================

function extraerAtaques(mascota) {
  let ataques;

  // Recorremos el catalogo local hasta encontrar la mascota seleccionada.
  for (let i = 0; i < mokepones.length; i++) {
    if (mokepones[i].nombre === mascota) {
      ataques = mokepones[i].ataques;
    }
  }

  mostrarAtaques(ataques);
}

/// =========================
/// MOSTRAR BOTONES DE ATAQUE
/// =========================

function mostrarAtaques(listaAtaques) {
  contenedorAtaques.innerHTML = "";

  // Cada ataque se representa como un boton visual dentro de la interfaz.
  listaAtaques.forEach(({ id, clase, nombre }) => {
    opcionDeAtaques = `<button id="${id}" class="BAtaque ${clase}">${nombre}</button>`;
    contenedorAtaques.innerHTML += opcionDeAtaques;
  });

  botones = document.querySelectorAll(".BAtaque");
}

/// =========================
/// MASCOTA ENEMIGA
/// =========================

function seleccionarMascotaEnemigo(enemigo) {
  // El enemigo llega desde el backend porque es el jugador real con el que hubo colision.
  const mokeponEnemigo = obtenerMokeponPorNombre(enemigo.nombre);

  if (!mokeponEnemigo) {
    console.error(
      "No se encontro la mascota enemiga para iniciar la batalla:",
      enemigo,
    );
    return;
  }

  spanMascotaEnemigo.textContent = mokeponEnemigo.nombre;
  // Copiamos los ataques base del rival por si luego se necesita esa referencia local.
  ataqueMokeponEnemigo = [...mokeponEnemigo.ataques];
  // Volvemos a dibujar los botones para que una nueva batalla no reutilice listeners viejos.
  mostrarAtaques(mascotaJugador.ataques);
  // Entramos visualmente a la pantalla de combate.
  activarSectionAtaque();
  secuenciaAtaque();
}

function iniciarCombateConEnemigo(enemigo) {
  if (combateIniciado) return;

  // Desde este momento la sesion entra formalmente en combate y detiene el mapa.
  combateIniciado = true;
  // Guardamos el id del enemigo real para luego consultar sus ataques al backend.
  enemigoId = enemigo.id;
  // El personaje deja de moverse y el mapa deja de actualizarse.
  detenerMovimiento();
  clearInterval(intervalo);
  seleccionarMascotaEnemigo(enemigo);
  // Ocultamos el mapa para concentrar la interfaz en la pelea.
  sectionVerMapa.setAttribute("hidden", true);
}

function notificarColision(enemigoId) {
  if (!jugadorId || !enemigoId) {
    return Promise.resolve(false);
  }

  // Avisamos al backend para que ambas ventanas compartan el mismo enemigoId.
  return fetch(`/mokepon/${jugadorId}/colision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      enemigoId,
    }),
  })
    .then(function (res) {
      // Solo iniciamos el combate local si el servidor acepta esa colision.
      return res.ok;
    })
    .catch(function (error) {
      console.error("No se pudo sincronizar la colision:", error);
      return false;
    });
}

/// =========================
/// SECUENCIA DE ATAQUES DEL JUGADOR
/// =========================

function secuenciaAtaque() {
  botones.forEach((boton) => {
    boton.addEventListener("click", (e) => {
      // Traducimos el emoji pulsado a un texto simple que el combate pueda comparar despues.
      if (e.target.textContent === "🔥") {
        ataqueJugador.push("FUEGO");
      } else if (e.target.textContent === "💧") {
        ataqueJugador.push("AGUA");
      } else {
        ataqueJugador.push("TIERRA");
      }

      boton.style.background = "#112f58";
      boton.disabled = true;

      // El jugador solo puede completar una secuencia de 5 ataques por combate.
      // Cuando ya hay 5 ataques, enviamos la jugada completa al backend.
      if (ataqueJugador.length === 5) {
        enviarAtaques();
      }
    });
  });
}

function enviarAtaques() {
  // Enviamos la jugada completa del jugador actual.
  fetch(`/mokepon/${jugadorId}/ataques`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ataques: ataqueJugador,
    }),
  }).then(function () {
    // Desde este punto ya no falta nada del lado local; solo esperar lo que haga el rival.
    mostrarMensajeEstado(
      "Ya hiciste tu jugada. El otro jugador todavia no termina sus ataques.",
    );

    // A partir de aqui consultamos repetidamente los ataques del rival hasta que complete sus 5 movimientos.
    if (!intervaloAtaques) {
      intervaloAtaques = setInterval(obtenerAtaques, 50);
    }
  });
}

function obtenerAtaques() {
  if (!jugadorId || !enemigoId) return;

  // Consultamos constantemente al servidor hasta que el enemigo termine sus 5 ataques.
  fetch(`/mokepon/${jugadorId}/ataques`)
    .then(function (res) {
      if (res.ok) {
        res.json().then(function ({ ataques }) {
          // Mientras el servidor siga devolviendo un arreglo vacio, el rival aun no termina.
          // Esperamos hasta que el otro jugador complete sus 5 ataques antes de resolver el combate.
          if (ataques.length === 5) {
            ataqueEnemigo = ataques;
            clearInterval(intervaloAtaques);
            intervaloAtaques = null;
            ocultarMensajeEstado();
            iniciarPelea();
          }
        });
      }
    })
    .catch(function (error) {
      console.error("No se pudieron obtener los ataques del enemigo:", error);
    });
}
/// =========================
/// ATAQUE ALEATORIO DEL ENEMIGO
/// =========================

// Esta funcion pertenece al flujo antiguo local. La dejamos por compatibilidad, aunque
// el proyecto actual usa ataques sincronizados por backend con obtenerAtaques().

function ataqueAleatorioEnemigo() {
  let indiceAleatorio = aleatorio(0, ataqueMokeponEnemigo.length - 1);
  let ataque = ataqueMokeponEnemigo[indiceAleatorio].nombre;

  if (ataque === "🔥") {
    ataqueEnemigo.push("FUEGO");
  } else if (ataque === "💧") {
    ataqueEnemigo.push("AGUA");
  } else {
    ataqueEnemigo.push("TIERRA");
  }
}

/// =========================
/// INICIAR PELEA
/// =========================

function iniciarPelea() {
  // El combate solo debe empezar cuando ambos jugadores ya terminaron sus 5 movimientos.
  if (ataqueJugador.length === 5 && ataqueEnemigo.length === 5) {
    // Recien aqui ya tenemos las dos secuencias completas y comparables.
    combate();
  }
}

/// =========================
/// LÓGICA DEL COMBATE
/// =========================

function combate() {
  // Limpiamos el historial visual anterior para mostrar solo el resultado de esta pelea.
  ataqueJugadorElem.innerHTML = "";
  ataqueEnemigoElem.innerHTML = "";

  for (let i = 0; i < ataqueJugador.length; i++) {
    let ataqueActualJugador = ataqueJugador[i];
    let ataqueActualEnemigo = ataqueEnemigo[i];

    mostrarAtaquesCombate(ataqueActualJugador, ataqueActualEnemigo);

    if (ataqueActualJugador === ataqueActualEnemigo) {
      // Si ambos ataques son iguales, nadie gana punto en esta ronda.
    } else if (
      (ataqueActualJugador === "AGUA" && ataqueActualEnemigo === "FUEGO") ||
      (ataqueActualJugador === "FUEGO" && ataqueActualEnemigo === "TIERRA") ||
      (ataqueActualJugador === "TIERRA" && ataqueActualEnemigo === "AGUA")
    ) {
      // Estas son las combinaciones donde el jugador local gana la ronda.
      victoriaJugador++;
    } else {
      // Si no gana el jugador, entonces gana el enemigo.
      victoriaEnemigo++;
    }
  }

  victoriasJugadorElem.textContent = victoriaJugador;
  victoriasEnemigoElem.textContent = victoriaEnemigo;

  revisarVidas();
}

/// =========================
/// REVISAR GANADOR
/// =========================

function revisarVidas() {
  // Aunque el nombre venga del curso, aqui realmente se decide el ganador por cantidad de rondas ganadas.
  if (victoriaJugador > victoriaEnemigo) {
    notificarResultadoCombate("ganador");
    crearMensajeFinal("🎉 ¡FELICIDADES! GANASTE EL JUEGO 🎉");
    esperarOpcionDeContinuar();
  } else if (victoriaEnemigo > victoriaJugador) {
    notificarResultadoCombate("perdedor");
    crearMensajeFinal("☠️ LO SIENTO, PERDISTE EL JUEGO ☠️");
  } else {
    notificarResultadoCombate("empate");
    crearMensajeFinal("🤝 EMPATE 🤝");
  }

  sectionReiniciar.removeAttribute("hidden");
  botonContinuar.setAttribute("hidden", true);
  botonReiniciar.removeAttribute("hidden");
  // Una vez resuelto el combate, ya no debe ser posible seguir pulsando ataques viejos.
  desactivarBotonesAtaque();
}

/// =========================
/// MOSTRAR RESULTADO DE CADA RONDA
/// =========================

function mostrarAtaquesCombate(ataqueJ, ataqueE) {
  // Elegimos un color distinto para que cada tipo de ataque se reconozca mas facil.
  function obtenerColor(ataque) {
    if (ataque === "FUEGO") return "#ff6b6b";
    if (ataque === "AGUA") return "#4dabf7";
    if (ataque === "TIERRA") return "#51cf66";
    return "#ccc";
  }

  let pAtaqueJugador = document.createElement("p");
  let pAtaqueEnemigo = document.createElement("p");

  pAtaqueJugador.textContent = ataqueJ;
  pAtaqueJugador.style.color = obtenerColor(ataqueJ);
  ataqueJugadorElem.appendChild(pAtaqueJugador);

  pAtaqueEnemigo.textContent = ataqueE;
  pAtaqueEnemigo.style.color = obtenerColor(ataqueE);
  ataqueEnemigoElem.appendChild(pAtaqueEnemigo);
}

/// =========================
/// MENSAJE FINAL
/// =========================

function crearMensajeFinal(resultado) {
  mensajeFinalElem.innerHTML = "";

  let parrafo = document.createElement("p");
  parrafo.innerHTML = resultado;
  mensajeFinalElem.appendChild(parrafo);
}

function mostrarMensajeEstado(mensaje) {
  // Este mensaje se usa sobre todo cuando un jugador ya termino y esta esperando al rival.
  crearMensajeFinal(mensaje);
  sectionReiniciar.removeAttribute("hidden");
  botonContinuar.setAttribute("hidden", true);
  botonReiniciar.setAttribute("hidden", true);
}

function ocultarMensajeEstado() {
  mensajeFinalElem.innerHTML = "";
  sectionReiniciar.setAttribute("hidden", true);
}

function notificarResultadoCombate(resultado) {
  if (!jugadorId) return;

  // Guardamos el resultado en el servidor para que ambas sesiones puedan sincronizarse.
  fetch(`/mokepon/${jugadorId}/resultado`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resultado,
    }),
  }).catch(function (error) {
    console.error("No se pudo guardar el resultado del combate:", error);
  });
}

function detenerEsperaDeContinuar() {
  // Apagamos la consulta periodica cuando ya no hace falta revisar mas enemigos.
  clearInterval(intervaloContinuar);
  intervaloContinuar = null;
}

// Despues de una victoria, revisa si el combate ya se cerro y si quedan enemigos vivos.
function esperarOpcionDeContinuar() {
  if (intervaloContinuar) return;

  intervaloContinuar = setInterval(verificarSiPuedeSeguirJugando, 250);
}

function verificarSiPuedeSeguirJugando() {
  if (!jugadorId || !mascotaJugador) return;

  // Reutilizamos la ruta de posicion para saber si todavia existe un combate activo
  // y para actualizar la lista de enemigos que siguen vivos en el mapa.
  fetch(`/mokepon/${jugadorId}/posicion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      x: mascotaJugador.x,
      y: mascotaJugador.y,
    }),
  })
    .then(function (res) {
      if (res.ok) {
        res.json().then(function ({ enemigos, combate }) {
          // Volvemos a construir la lista porque despues de un combate algun rival pudo haber desaparecido.
          mokeponesEnemigos = enemigos
            .map(function (enemigo) {
              return crearMokeponEnemigoDesdeJugador(enemigo);
            })
            .filter(Boolean);

          // Solo dejamos seguir cuando el combate anterior ya se cerró en el servidor
          // y aun quedan enemigos vivos en el mapa.
          if (!combate) {
            detenerEsperaDeContinuar();

            if (mokeponesEnemigos.length > 0) {
              // Solo mostramos esta opcion cuando realmente vale la pena volver al mapa.
              botonContinuar.removeAttribute("hidden");
            }
          }
        });
      }
    })
    .catch(function (error) {
      console.error("No se pudo verificar si hay mas enemigos:", error);
    });
}

function reiniciarEstadoDelCombate() {
  // Detenemos cualquier proceso asociado al combate actual.
  clearInterval(intervalo);
  clearInterval(intervaloAtaques);
  detenerEsperaDeContinuar();

  intervalo = null;
  intervaloAtaques = null;
  ataqueJugador = [];
  ataqueEnemigo = [];
  victoriaJugador = 0;
  victoriaEnemigo = 0;
  // enemyId vuelve a null para no arrastrar la referencia del combate anterior.
  enemigoId = null;
  combateIniciado = false;

  // Limpiamos el historial visual de la batalla anterior.
  ataqueJugadorElem.innerHTML = "";
  ataqueEnemigoElem.innerHTML = "";
  victoriasJugadorElem.textContent = "0";
  victoriasEnemigoElem.textContent = "0";
  spanMascotaEnemigo.textContent = "";
  mensajeFinalElem.innerHTML = "";

  sectionAtaques.setAttribute("hidden", true);
  ataquesSection.setAttribute("hidden", true);
  sectionReiniciar.setAttribute("hidden", true);
  botonContinuar.setAttribute("hidden", true);
  botonReiniciar.setAttribute("hidden", true);
}

// Permite volver al mapa sin reiniciar toda la partida cuando todavia quedan enemigos.
function continuarJugando() {
  // Esta opcion devuelve al jugador al mapa manteniendo la misma sesion activa.
  reiniciarEstadoDelCombate();
  sectionVerMapa.removeAttribute("hidden");
  iniciarMapa();
  // Enviamos enseguida la posicion actual para reconstruir enemigos y estado compartido.
  enviarPosicion(mascotaJugador.x, mascotaJugador.y);
}

/// =========================
/// MAPA Y MOVIMIENTO
/// =========================

function pintarCanvas() {
  if (!mascotaJugador) return;

  // Actualizamos la posicion usando la velocidad actual.
  mascotaJugador.x += mascotaJugador.velocidadX;
  mascotaJugador.y += mascotaJugador.velocidadY;

  // En cada frame redibujamos todo desde cero: fondo, jugador y enemigos.
  lienzo.clearRect(0, 0, mapa.width, mapa.height);
  lienzo.drawImage(mapaBackground, 0, 0, mapa.width, mapa.height);
  mascotaJugador.pintarMokepon();

  // Esta llamada mantiene el mapa sincronizado entre las distintas pestañas conectadas.
  enviarPosicion(mascotaJugador.x, mascotaJugador.y);
  // Dibujamos todos los enemigos que el servidor nos devuelve en cada actualizacion
  mokeponesEnemigos.forEach(function (mokeponEnemigo) {
    mokeponEnemigo.pintarMokepon();

    // Revisamos colision solo contra los enemigos reales recibidos del backend
    if (mascotaJugador.velocidadX !== 0 || mascotaJugador.velocidadY !== 0) {
      revisarColision(mokeponEnemigo);
    }
  });
}

function enviarPosicion(x, y) {
  // Si aun no existe un jugadorId, no intentamos enviar la posicion porque el backend no podria identificar al jugador
  if (!jugadorId) return;

  // En la URL real no se usa ":"; eso solo se usa en Express al definir la ruta del servidor
  fetch(`/mokepon/${jugadorId}/posicion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      x,
      y,
    }),
  })
    .then(function (res) {
      if (res.ok) {
        res.json().then(function ({ enemigos, combate }) {
          console.log(enemigos);

          // Reconstruimos el arreglo de enemigos en cada respuesta para que el mapa siempre use el estado mas reciente
          mokeponesEnemigos = enemigos
            .map(function (enemigo) {
              return crearMokeponEnemigoDesdeJugador(enemigo);
            })
            .filter(Boolean);

          // Si la otra ventana detecto la colision primero, el servidor nos devolvera el combate activo y
          // esta sesion tambien entrara a batalla.
          if (combate && !combateIniciado) {
            // Esto resuelve el caso en que la otra pestaña detecta la colision antes que esta.
            const enemigoDeCombate = crearMokeponEnemigoDesdeJugador(combate);

            if (enemigoDeCombate) {
              iniciarCombateConEnemigo(enemigoDeCombate);
            }
          }
        });
      }
    })
    .catch(function (error) {
      console.error(
        "No se pudo enviar u obtener la posicion del jugador:",
        error,
      );
    });
}

function moverDerecha() {
  if (!mascotaJugador) return;
  mascotaJugador.velocidadX = 5;
}

function moverIzquierda() {
  if (!mascotaJugador) return;
  mascotaJugador.velocidadX = -5;
}

function moverArriba() {
  if (!mascotaJugador) return;
  mascotaJugador.velocidadY = -5;
}

function moverAbajo() {
  if (!mascotaJugador) return;
  mascotaJugador.velocidadY = 5;
}

function detenerMovimiento() {
  if (!mascotaJugador) return;
  // Frenamos por completo en ambos ejes.
  mascotaJugador.velocidadX = 0;
  mascotaJugador.velocidadY = 0;
}

// Escucha las flechas del teclado y traduce esa tecla a una direccion de movimiento.
function sePresionoUnaTecla(e) {
  e.preventDefault();

  switch (e.key) {
    case "ArrowUp":
      moverArriba();
      break;
    case "ArrowDown":
      moverAbajo();
      break;
    case "ArrowLeft":
      moverIzquierda();
      break;
    case "ArrowRight":
      moverDerecha();
      break;
    default:
      break;
  }
}

function iniciarMapa() {
  // Ajustamos el tamaño del canvas y activamos el repintado constante del mapa.
  mapa.width = 600;
  mapa.height = 400;
  intervalo = setInterval(pintarCanvas, 50);

  // Permitimos mover al personaje con teclado.
  window.addEventListener("keydown", sePresionoUnaTecla);
  window.addEventListener("keyup", detenerMovimiento);
}

// Comprueba si la caja del jugador y la del enemigo se tocaron.
function revisarColision(enemigo) {
  if (combateIniciado || colisionEnProceso) {
    return;
  }

  // La colision se calcula comparando los bordes del rectangulo del jugador y del enemigo.
  const arribaEnemigo = enemigo.y;
  const abajoEnemigo = enemigo.y + enemigo.alto;
  const derechaEnemigo = enemigo.x + enemigo.ancho;
  const izquierdaEnemigo = enemigo.x;

  const arribaMascota = mascotaJugador.y;
  const abajoMascota = mascotaJugador.y + mascotaJugador.alto;
  const derechaMascota = mascotaJugador.x + mascotaJugador.ancho;
  const izquierdaMascota = mascotaJugador.x;

  if (
    abajoMascota < arribaEnemigo ||
    arribaMascota > abajoEnemigo ||
    derechaMascota < izquierdaEnemigo ||
    izquierdaMascota > derechaEnemigo
  ) {
    // Si una caja no toca a la otra por algun lado, todavia no hay choque.
    return;
  }
  // Mientras el servidor valida la colision, bloqueamos nuevas solicitudes para este jugador.
  colisionEnProceso = true;

  // Solo iniciamos el combate si el servidor confirma que ese enemigo sigue libre.
  notificarColision(enemigo.id)
    .then(function (puedeIniciarCombate) {
      if (puedeIniciarCombate) {
        iniciarCombateConEnemigo(enemigo);
      }
    })
    .finally(function () {
      colisionEnProceso = false;
    });
}

/// =========================
/// MOSTRAR SECCIÓN DE ATAQUES
/// =========================

function activarSectionAtaque() {
  sectionAtaques.removeAttribute("hidden");
  ataquesSection.removeAttribute("hidden");

  // Cada nueva batalla reactiva los botones hasta que el jugador termine su jugada.
  botones.forEach((boton) => {
    boton.disabled = false;
  });
}

/// =========================
/// DESACTIVAR BOTONES DE ATAQUE
/// =========================

function desactivarBotonesAtaque() {
  botones.forEach((boton) => {
    boton.disabled = true;
  });
}

/// =========================
/// REINICIAR JUEGO
/// =========================

function reiniciarJuego() {
  location.reload();
}

/// =========================
/// EJECUCIÓN INICIAL
/// =========================

iniciarJuego();
