/* ============================================================
   ✏️  ESTE ES EL ÚNICO ARCHIVO QUE TIENES QUE RELLENAR
   ============================================================

   Cada día es un bloque { ... }. Todos los campos son opcionales:
   pon solo los que quieras y se muestran en este orden:

     emoji      → lo que se ve dentro de la casilla una vez abierta
     titulo     → título de la sorpresa
     foto       → "fotos/dia05.jpg"  o varias: ["fotos/a.jpg", "fotos/b.jpg"]
     texto      → mensaje (puedes hacer saltos de línea con \n)
     vale       → texto de un "vale por..." (sale como un ticket)
     adivinanza → { pregunta: "...", respuesta: "...", foto: "fotos/x.jpg" }
                  (la foto es opcional y solo sale al pulsar "Ver respuesta")
     spotify    → enlace de compartir de Spotify (canción, álbum o playlist)
     youtube    → enlace de YouTube (normal, youtu.be o shorts)
     video      → "videos/dia10.mp4" (vídeo propio; mejor que pese poco)
     enlace     → { texto: "Abrir", url: "https://..." }

   Si un día NO está definido, sale un mensaje por defecto
   ("la sorpresa de hoy te la doy en persona"), así que nunca se rompe.

   Las fotos van en la carpeta fotos/ y los vídeos en videos/.
   ============================================================ */

const CONFIG = {
  nombre: "mi xiquinina",   // aparece como "Para mi xiquinina"
  firma: "tu gordito",      // aparece abajo: "Hecho con ❤️ por tu gordito"
  año: 2026,
};

const DIAS = {
  1: {
    emoji: "🎄",
    titulo: "¡Empieza la cuenta atrás!",
    texto:
      "Bienvenida a tu calendario de adviento.\n\n" +
      "Cada día de aquí a Nochebuena se abre una casilla nueva con una sorpresa. " +
      "Nada de hacer trampas, ¿eh?\n\n" +
      "Te he hecho este calendario porque se me quedaba muy corto hacerte un regalo de un día, " +
      "y así pienses en mí todos los días, igual que hago yo. " +
      "Espero que lo disfrutes amor, te amoooo! ❤️",
  },

  2: {
    emoji: "💍",
    titulo: "Nuestra canción del futuro",
    texto:
      "Hay mil canciones que me recuerdan a ti, y luego está esta, " +
      "que me hace imaginarme contigo dentro de unos años. " +
      "Me encantaría que fuera la que sonara en nuestra boda.",
    youtube: "https://www.youtube.com/watch?v=4WTt69YO2VI",
    enlace: { texto: "▶ Abrir en YouTube", url: "https://www.youtube.com/watch?v=4WTt69YO2VI" },
  },

  3: {
    emoji: "📸",
    titulo: "Nuestra primera foto (en mi móvil)",
    foto: "fotos/dia03.jpg",
    texto:
      "La primera de verdad la tienes tú, pero esta fue la primera que me guardé de los dos.\n\n" +
      "Me lo sigo pasando igual de bien desde que tengo el privilegio de estar contigo.",
  },

  4: {
    emoji: "🍿",
    titulo: "Plan para mañana",
    vale: "Maratón de Los Juegos del Hambre en casita 🏹",
    texto:
      "Válido para mañana sábado 5.\n\n" +
      "Mantita, sushi 🍣, recetitas navideñas y todas las películas del tirón.\n\n" +
      "Planazo, aunque contigo siempre lo son.",
  },

  5: {
    emoji: "⚡",
    titulo: "¿Quién es ese Pokémon?",
    texto: "Hoy tu sorpresa no está en el móvil… ¡está en mis manos!",
    adivinanza: {
      pregunta: "Pista: es algo que tienes que abrir, puede salir algo brillante ✨ y lo mejor es que son dos.",
      respuesta: "¡Dos sobres de Pokémon! 🃏 Ven a pedírmelos y los abrimos juntos. Ojalá te salga una buena 🤞",
      foto: "fotos/dia05.jpg",
    },
  },

  6: {
    emoji: "💋",
    titulo: "No te lo he dicho pero…",
    texto:
      "La primera vez que nos dimos un beso no perdí la sonrisa en 3 días.\n\n" +
      "Bueno, aún me sigue pasando cuando te beso…",
  },

  7: {
    emoji: "💌",
    titulo: "10 meses contigo",
    especial: true, // la casilla sale con un corazón en el calendario
    carta: {
      sobre: "10 meses",
      fecha: "7 de diciembre de 2026",
      texto:
        "No sabía lo que era la verdadera felicidad hasta que tuve la suerte de conocerte. " +
        "Y no me refiero solo a la sonrisa que me provocas cuando me miras con tus ojos castaños oscuros, " +
        "en los que soy capaz de ver al niño risueño e inocente que una vez fui.\n\n" +
        "Me refiero a cómo has sido capaz de hacer que vea la vida con otros ojos. " +
        "Has conseguido que sea más agradecido con las cosas y que luche por lo que quiero. " +
        "Gracias a ti soy capaz de ver la vida con alegría, sabiendo que hay cosas maravillosas " +
        "que me pueden pasar, como conocerte a ti, y eso es algo que no voy a olvidar en la vida.\n\n" +
        "Y todo esto en tan solo 10 meses, que no es nada de tiempo en comparación con el resto de una vida, " +
        "que es el tiempo que quiero estar contigo.\n\n" +
        "Me muero de emoción por ver qué es todo lo que nos depara el tiempo juntos.\n\n" +
        "Te amo muchísimo, mi xiquinina.",
      firma: "Tu gordito",
    },
  },

  8: {
    emoji: "🧩",
    titulo: "Puzzle sorpresa",
    texto: "Alguien muy especial quiere decirte algo… pero primero tienes que descubrir quién es.",
    puzzle: {
      foto: "fotos/dia08.jpg",
      columnas: 3,
      filas: 4,
      mensaje: "Hoy me toca a mí recordarte lo mucho que te queremos.",
    },
  },

  9: {
    emoji: "💐",
    titulo: "Unas flores para ti",
    ramo: {
      // una frase por flor (máximo 8)
      flores: [
        "Eres preciosa",
        "Me encanta tu risa",
        "Gracias por existir",
        "Contigo todo es mejor",
        "Eres mi lugar favorito",
        "Te quiero muchísimo",
      ],
      mensaje:
        "Como no puedo darte flores de verdad todos los días, hoy te las doy así.\n\n" +
        "Que tengas un día tan bonito como tú. Te quiero ❤️",
    },
  },

  /* ---------- PLANTILLA (copia, pega y cambia el número) ----------

  4: {
    emoji: "📸",
    titulo: "Nuestro primer viaje",
    foto: "fotos/dia04.jpg",
    texto: "¿Te acuerdas de este día?",
  },

  5: {
    emoji: "🎵",
    titulo: "Nuestra canción",
    spotify: "https://open.spotify.com/track/XXXXXXXXXXXXXXXX",
  },

  6: {
    emoji: "🎬",
    titulo: "Mira esto",
    youtube: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  },

  ------------------------------------------------------------------ */

  24: {
    emoji: "⭐",
    titulo: "¡Feliz Nochebuena!",
    texto: "El último día merece la mejor sorpresa…",
  },
};
