/// =========================
/// VARIABLES GLOBALES
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

// constante que guardará información de sección ver mapa
const sectionVerMapa = $("#ver-mapa");
const mapa = $("#mapa");

// Arreglos que guardan la secuencia de ataques elegidos
let ataqueJugador = [];
let ataqueEnemigo = [];

// Aquí se guardarán los ataques de la mascota enemiga
let ataqueMokeponEnemigo;

// Variables para construir HTML dinámico
let opcionDeMokepones;
let opcionDeAtaques;

// Inputs radio de las mascotas
let inputHipodoge;
let inputCapipepo;
let inputRatigueya;

// Aquí se guardan todos los botones de ataque generados dinámicamente
let botones = [];

// Guarda la mascota elegida por el jugador
let mascotaJugador;
// Guarda el id que devuelve el backend cuando este navegador se une al juego
let jugadorId = null;
let enemigoId = null;
// Guarda la promesa del fetch inicial para poder esperar el id antes de enviar el mokepon
let promesaJugadorId = null;

// Contadores de victorias
let victoriaJugador = 0;
let victoriaEnemigo = 0;

// Arreglo principal que guarda todos los mokepones
let mokepones = [];
// Aqui guardaremos los mokepones enemigos recibidos desde el backend para dibujarlos en el mapa
let mokeponesEnemigos = [];
// Este flag evita que el combate se abra varias veces o solo se inicie localmente sin control.
let combateIniciado = false;

// lienzo para dibujar dentro del canvas
let lienzo = mapa.getContext("2d");
let intervalo;
let intervaloAtaques = null;

// Creamos la imagen de fondo que se dibujara dentro del canvas del mapa
let mapaBackground = new Image();
// La ruta ahora apunta a la carpeta img tomando como base el HTML servido por Express
mapaBackground.src = "./img/mokemap.png";

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
  constructor(nombre, img, vidas, x, y, id = null) {
    this.id = id;
    this.nombre = nombre;
    this.img = img;
    this.vidas = vidas;
    this.ataques = [];

    // ✅ PRIMERO tamaño
    this.ancho = 40;
    this.alto = 40;

    // ✅ DESPUÉS posición aleatoria
    this.x = aleatorio(0, mapa.width - this.ancho);
    this.y = aleatorio(0, mapa.height - this.alto);

    this.mapaFoto = new Image();
    this.mapaFoto.src = img;

    this.velocidadX = 0;
    this.velocidadY = 0;
  }

  pintarMokepon() {
    lienzo.drawImage(this.mapaFoto, this.x, this.y, this.ancho, this.alto);
  }
}

/// =========================
/// CREACIÓN DE MOKEPONES
/// =========================

// Estas rutas tambien se resuelven desde mokepon.html, por eso usamos ./img
let hipodoge = new Mokepon("Hipodoge", "./img/Hipodoge.png", 5);
let capipepo = new Mokepon("Capipepo", "./img/Capipepo.png", 5);
let ratigueya = new Mokepon("Ratigueya", "./img/Ratigueya.png", 5);

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

function aleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function obtenerMokeponPorNombre(nombre) {
  return mokepones.find((mokepon) => mokepon.nombre === nombre);
}

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
    mokeponEnemigo = new Mokepon("Hipodoge", "./img/Hipodoge.png", 5);
  } else if (mokeponNombre === "Capipepo") {
    mokeponEnemigo = new Mokepon("Capipepo", "./img/Capipepo.png", 5);
  } else if (mokeponNombre === "Ratigueya") {
    mokeponEnemigo = new Mokepon("Ratigueya", "./img/Ratigueya.png", 5);
  }

  if (!mokeponEnemigo) {
    return null;
  }

  mokeponEnemigo.x = jugador.x;
  mokeponEnemigo.y = jugador.y;
  mokeponEnemigo.id = jugador.id;

  return mokeponEnemigo;
}

/// =========================
/// INICIO DEL JUEGO
/// =========================

function iniciarJuego() {
  sectionVerMapa.setAttribute("hidden", true);
  botonReiniciar.setAttribute("hidden", true);

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

  botonMascota.addEventListener("click", seleccionarMascotaJugador);
  botonReiniciar.addEventListener("click", reiniciarJuego);

  // Guardamos esta promesa para poder esperar el jugadorId antes de enviar datos importantes al backend
  promesaJugadorId = unirseAlJuego();
}

async function unirseAlJuego() {
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

  // Sacamos los ataques de la mascota elegida
  extraerAtaques(mascotaJugador.nombre);

  // Mostramos mapa
  sectionVerMapa.removeAttribute("hidden");

  // Ocultamos la sección de selección de mascota
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
    // La propiedad correcta es headers, en plural; asi Express puede leer el JSON del body
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
  const mokeponEnemigo = obtenerMokeponPorNombre(enemigo.nombre);

  if (!mokeponEnemigo) {
    console.error(
      "No se encontro la mascota enemiga para iniciar la batalla:",
      enemigo,
    );
    return;
  }

  spanMascotaEnemigo.textContent = mokeponEnemigo.nombre;
  ataqueMokeponEnemigo = [...mokeponEnemigo.ataques];
  activarSectionAtaque();
  secuenciaAtaque();
}

function iniciarCombateConEnemigo(enemigo) {
  if (combateIniciado) return;

  combateIniciado = true;
  // Guardamos el id del enemigo real para luego consultar sus ataques al backend.
  enemigoId = enemigo.id;
  detenerMovimiento();
  clearInterval(intervalo);
  seleccionarMascotaEnemigo(enemigo);
  sectionVerMapa.setAttribute("hidden", true);
}

function notificarColision(enemigoId) {
  if (!jugadorId || !enemigoId) return;

  fetch(`/mokepon/${jugadorId}/colision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      enemigoId,
    }),
  }).catch(function (error) {
    console.error("No se pudo sincronizar la colision:", error);
  });
}

/// =========================
/// SECUENCIA DE ATAQUES DEL JUGADOR
/// =========================

function secuenciaAtaque() {
  botones.forEach((boton) => {
    boton.addEventListener("click", (e) => {
      if (e.target.textContent === "🔥") {
        ataqueJugador.push("FUEGO");
      } else if (e.target.textContent === "💧") {
        ataqueJugador.push("AGUA");
      } else {
        ataqueJugador.push("TIERRA");
      }

      boton.style.background = "#112f58";
      boton.disabled = true;

      // ataqueAleatorioEnemigo();

      if (ataqueJugador.length === 5) {
        enviarAtaques();
      }
    });
  });
}

function enviarAtaques() {
  fetch(`/mokepon/${jugadorId}/ataques`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ataques: ataqueJugador,
    }),
  }).then(function () {
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

  fetch(`/mokepon/${jugadorId}/ataques`)
    .then(function (res) {
      if (res.ok) {
        res.json().then(function ({ ataques }) {
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
    combate();
  }
}

/// =========================
/// LÓGICA DEL COMBATE
/// =========================

function combate() {
  ataqueJugadorElem.innerHTML = "";
  ataqueEnemigoElem.innerHTML = "";

  for (let i = 0; i < ataqueJugador.length; i++) {
    let ataqueActualJugador = ataqueJugador[i];
    let ataqueActualEnemigo = ataqueEnemigo[i];

    mostrarAtaquesCombate(ataqueActualJugador, ataqueActualEnemigo);

    if (ataqueActualJugador === ataqueActualEnemigo) {
      // Empate
    } else if (
      (ataqueActualJugador === "AGUA" && ataqueActualEnemigo === "FUEGO") ||
      (ataqueActualJugador === "FUEGO" && ataqueActualEnemigo === "TIERRA") ||
      (ataqueActualJugador === "TIERRA" && ataqueActualEnemigo === "AGUA")
    ) {
      victoriaJugador++;
    } else {
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
  if (victoriaJugador > victoriaEnemigo) {
    notificarResultadoCombate("ganador");
    crearMensajeFinal("🎉 ¡FELICIDADES! GANASTE EL JUEGO 🎉");
  } else if (victoriaEnemigo > victoriaJugador) {
    notificarResultadoCombate("perdedor");
    crearMensajeFinal("☠️ LO SIENTO, PERDISTE EL JUEGO ☠️");
  } else {
    notificarResultadoCombate("empate");
    crearMensajeFinal("🤝 EMPATE 🤝");
  }

  sectionReiniciar.removeAttribute("hidden");
  botonReiniciar.removeAttribute("hidden");
  desactivarBotonesAtaque();
}

/// =========================
/// MOSTRAR RESULTADO DE CADA RONDA
/// =========================

function mostrarAtaquesCombate(ataqueJ, ataqueE) {
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
  crearMensajeFinal(mensaje);
  sectionReiniciar.removeAttribute("hidden");
  botonReiniciar.setAttribute("hidden", true);
}

function ocultarMensajeEstado() {
  mensajeFinalElem.innerHTML = "";
  sectionReiniciar.setAttribute("hidden", true);
}

function notificarResultadoCombate(resultado) {
  if (!jugadorId) return;

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

/// =========================
/// MAPA Y MOVIMIENTO
/// =========================

function pintarCanvas() {
  if (!mascotaJugador) return;

  mascotaJugador.x += mascotaJugador.velocidadX;
  mascotaJugador.y += mascotaJugador.velocidadY;

  lienzo.clearRect(0, 0, mapa.width, mapa.height);
  lienzo.drawImage(mapaBackground, 0, 0, mapa.width, mapa.height);
  mascotaJugador.pintarMokepon();

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
  mascotaJugador.velocidadX = 0;
  mascotaJugador.velocidadY = 0;
}

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
  // Ajustamos tamaño del canvas
  mapa.width = 600;
  mapa.height = 400;
  // Pintamos continuamente el personaje
  intervalo = setInterval(pintarCanvas, 50);

  window.addEventListener("keydown", sePresionoUnaTecla);
  window.addEventListener("keyup", detenerMovimiento);
}

function revisarColision(enemigo) {
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
    return;
  }
  notificarColision(enemigo.id);
  iniciarCombateConEnemigo(enemigo);
}

/// =========================
/// MOSTRAR SECCIÓN DE ATAQUES
/// =========================

function activarSectionAtaque() {
  sectionAtaques.removeAttribute("hidden");
  ataquesSection.removeAttribute("hidden");

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
