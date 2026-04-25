# Mokepon

Proyecto desarrollado como ejercicio práctico de Platzi para trabajar conceptos de `Node.js`, `Express`, `HTML`, `CSS` y `Canvas`.

El proyecto permite que varios jugadores entren desde distintas pestañas, elijan un mokepon, recorran un mapa compartido y peleen cuando colisionan.

## Contexto

Este repositorio corresponde a una práctica/ejercicio académico basado en el proyecto Mokepon de Platzi. La idea principal es reforzar conceptos de frontend, backend, canvas, eventos del navegador y sincronización básica entre jugadores.

## Características principales

- Selección de mokepon por jugador
- Mapa compartido con sincronización de posición
- Combate entre dos jugadores al colisionar
- Ataques por turnos sincronizados
- Eliminación del jugador derrotado del mapa
- Opción de `Seguir jugando` si aún quedan enemigos activos
- Protección para que un tercer jugador no entre a un combate ya ocupado

## Tecnologías

- `Node.js`
- `Express`
- `JavaScript`
- `HTML5 Canvas`
- `CSS3`

## Estructura del proyecto

```text
mokepon/
├── public/
│   ├── index.html
│   └── assets/
│       ├── images/
│       ├── scripts/
│       │   └── game.js
│       └── styles/
│           └── main.css
├── server.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

## Descripción de archivos importantes

- `server.js`
  Maneja el servidor Express, las rutas HTTP del juego y el estado temporal de los jugadores.

- `public/index.html`
  Estructura principal de la interfaz del juego.

- `public/assets/scripts/game.js`
  Lógica del cliente: selección, movimiento, colisiones, ataques, combate y sincronización con el backend.

- `public/assets/styles/main.css`
  Estilos visuales del proyecto.

## Requisitos

- Tener instalado `Node.js`
- Tener instalado `npm`

## Instalación

1. Abre una terminal dentro de la carpeta del proyecto.
2. Instala las dependencias:

```bash
npm install
```

## Ejecución

Inicia el servidor con:

```bash
npm start
```

Después abre esta URL en tu navegador:

```text
http://localhost:8080
```

## Flujo general del juego

1. Cada pestaña se registra en el servidor mediante `/unirse`.
2. El jugador elige una mascota y se guarda en el backend.
3. El cliente envía su posición continuamente al servidor.
4. El servidor responde con enemigos visibles y, si aplica, con el combate activo.
5. Cuando dos jugadores colisionan, ambos quedan enlazados al mismo combate.
6. Cada jugador selecciona 5 ataques.
7. El resultado se resuelve cuando ambos terminaron su jugada.
8. Si un jugador pierde, desaparece del mapa para los demás.
9. Si el jugador gana y quedan rivales activos, puede usar `Seguir jugando`.

## Consideraciones técnicas

- El estado del juego se guarda en memoria del servidor.
- Si reinicias `server.js`, se reinician los jugadores y los combates.
- Para probar el modo multijugador local, abre varias pestañas o varios navegadores.
- El proyecto debe abrirse desde `http://localhost:8080` y no directamente con doble clic sobre el HTML.

## Ideas de mejora futuras

- Persistencia en base de datos
- Manejo de desconexiones
- Salas o matchmaking
- Notificaciones visuales más claras cuando un rival ya está ocupado
- Pruebas automatizadas para las rutas del servidor
