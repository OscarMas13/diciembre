(() => {
  "use strict";

  const AÑO = CONFIG.año;
  const TOTAL = 24;
  const CLAVE = `adviento-${AÑO}-abiertos`;
  const params = new URLSearchParams(location.search);

  // Orden "desordenado" de las casillas (como los calendarios de verdad).
  // Las de DOBLES ocupan dos huecos.
  const ORDEN = [9, 17, 3, 22, 1, 14, 6, 19, 11, 24, 2, 15, 8, 20, 5, 12, 23, 4, 16, 10, 21, 7, 13, 18];
  const DOBLES = new Set([1, 8, 15, 24]);

  const POR_DEFECTO = {
    emoji: "💝",
    titulo: "Sorpresa en persona",
    texto: "La sorpresa de hoy no cabe en el móvil…\n\nPídemela con un beso 😘",
  };

  // ---------- Fechas ----------
  // Para probar: añade ?hoy=2026-12-10 a la dirección.
  function fechaHoy() {
    const p = params.get("hoy");
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) {
      const [y, m, d] = p.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  const hoy = fechaHoy();
  const fechaDe = (dia) => new Date(AÑO, 11, dia);
  const diasHasta = (dia) => Math.round((fechaDe(dia) - hoy) / 86400000);
  const disponible = (dia) => diasHasta(dia) <= 0;

  // ---------- Guardado (qué casillas se han abierto) ----------
  if (params.has("reset")) {
    try { localStorage.removeItem(CLAVE); } catch {}
  }
  function leerAbiertos() {
    try { return new Set(JSON.parse(localStorage.getItem(CLAVE)) || []); }
    catch { return new Set(); }
  }
  const abiertos = leerAbiertos();
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify([...abiertos])); } catch {}
  }
  const estaAbierto = (dia) => abiertos.has(dia) && disponible(dia);

  const infoDe = (dia) => DIAS[dia] || POR_DEFECTO;

  // ---------- Utilidades ----------
  const $ = (sel) => document.querySelector(sel);
  function el(tag, props = {}, ...hijos) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "style") n.style.cssText = v;
      else n.setAttribute(k, v);
    }
    for (const h of hijos) if (h) n.append(h);
    return n;
  }

  let temporizadorAviso;
  function avisar(msg) {
    const a = $("#aviso");
    a.textContent = msg;
    a.classList.add("visible");
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => a.classList.remove("visible"), 2600);
  }

  // ---------- Cabecera y pie ----------
  function pintarTextos() {
    $("#para").textContent = `Para ${CONFIG.nombre}`;
    $("#firma").textContent = `Hecho con ❤️ por ${CONFIG.firma}`;

    const navidad = diasHasta(25);
    const empieza = diasHasta(1);
    let estado;
    if (empieza > 0) estado = empieza === 1 ? "Empieza mañana ✨" : `Empieza el 1 de diciembre · faltan ${empieza} días`;
    else if (navidad > 1) estado = `Faltan ${navidad} días para Navidad 🎅`;
    else if (navidad === 1) estado = "¡Hoy es Nochebuena! ⭐";
    else estado = "¡Feliz Navidad! 🎄";
    $("#estado").textContent = estado;

    const n = ORDEN.filter(estaAbierto).length;
    $("#progreso").textContent =
      n === 0 ? "Aún no has abierto ninguna casilla 🎁" :
      n === TOTAL ? "¡Has abierto las 24 casillas! 🎉" :
      `Has abierto ${n} de ${TOTAL} casillas 🎁`;
  }

  // ---------- Casillas ----------
  function crearCasilla(dia, i) {
    const estilo = dia === 24 ? "estilo-oro"
      : (DIAS[dia] && DIAS[dia].especial) ? "estilo-corazon"
      : `estilo-${i % 4}`;
    const b = el("button", {
      class: `casilla ${estilo}${DOBLES.has(dia) ? " doble" : ""}`,
      "data-dia": dia,
      "aria-label": `Día ${dia}`,
    });

    const interior = el("div", { class: "interior" },
      el("span", { class: "mini-dia", text: dia }),
      el("span", { class: "emoji" }),
    );
    const hoja = el("div", { class: "hoja" },
      el("div", { class: "frente" }, el("span", { class: "numero", text: dia })),
      el("div", { class: "dorso" }),
    );
    b.append(interior, hoja);
    actualizarCasilla(b, dia);
    b.addEventListener("click", () => pulsar(b, dia));
    return b;
  }

  function actualizarCasilla(b, dia) {
    const libre = disponible(dia);
    const abierta = estaAbierto(dia);
    b.classList.toggle("bloqueada", !libre);
    b.classList.toggle("disponible", libre);
    b.classList.toggle("abierta", abierta);
    if (abierta) b.querySelector(".emoji").textContent = infoDe(dia).emoji || "🎁";

    const esHoy = diasHasta(dia) === 0;
    const etiqueta = b.querySelector(".etiqueta-hoy");
    if (esHoy && !etiqueta) b.append(el("span", { class: "etiqueta-hoy", text: "Hoy" }));
    if (!esHoy && etiqueta) etiqueta.remove();
  }

  function pulsar(b, dia) {
    if (!disponible(dia)) {
      const faltan = diasHasta(dia);
      b.classList.remove("sacudir");
      void b.offsetWidth;
      b.classList.add("sacudir");
      avisar(faltan === 1
        ? "¡Paciencia! Esta se abre mañana 🤫"
        : `¡Paciencia! Se abre el ${dia} de diciembre (faltan ${faltan} días) 🤫`);
      if (navigator.vibrate) navigator.vibrate(60);
      return;
    }

    if (estaAbierto(dia)) {
      mostrarSorpresa(dia);
      return;
    }

    abiertos.add(dia);
    guardar();
    actualizarCasilla(b, dia);
    pintarTextos();
    destellos(b);
    setTimeout(() => mostrarSorpresa(dia), 950);
  }

  function destellos(b) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = b.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const simbolos = ["✨", "⭐", "❄️", "💛", "✨", "❤️"];
    for (let i = 0; i < 16; i++) {
      const ang = (Math.PI * 2 * i) / 16 + Math.random() * .4;
      const dist = 60 + Math.random() * 70;
      const s = el("span", {
        class: "destello",
        text: simbolos[i % simbolos.length],
        style:
          `left:${cx}px;top:${cy}px;` +
          `--x:${Math.cos(ang) * dist}px;--y:${Math.sin(ang) * dist}px;` +
          `--r:${(Math.random() * 120 - 60) | 0}deg;` +
          `animation-delay:${Math.random() * 150 + 250}ms`,
      });
      document.body.append(s);
      setTimeout(() => s.remove(), 1500);
    }
  }

  // ---------- Contenido de la sorpresa ----------
  function urlSpotify(url) {
    const m = String(url).match(/open\.spotify\.com\/(?:intl-[\w-]+\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/);
    return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
  }
  function urlYoutube(url) {
    const m = String(url).match(/(?:youtu\.be\/|[?&]v=|shorts\/|embed\/)([\w-]{11})/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?playsinline=1&rel=0` : null;
  }

  function construirSorpresa(dia) {
    const d = infoDe(dia);
    const c = document.createDocumentFragment();

    c.append(
      el("div", { class: "emoji-grande", text: d.emoji || "🎁" }),
      el("p", { class: "fecha", text: `${dia} de diciembre` }),
      el("h2", { id: "titulo-sorpresa", text: d.titulo || `Día ${dia}` }),
    );

    if (d.carta) c.append(construirSobre(d.carta));

    const fotos = d.foto ? [].concat(d.foto) : [];
    for (const src of fotos) c.append(el("img", { src, alt: "", loading: "lazy" }));

    if (d.texto) c.append(el("p", { class: "texto", text: d.texto }));

    if (d.puzzle) c.append(construirPuzzle(dia, d.puzzle));

    if (d.ramo) c.append(construirRamo(dia, d.ramo));

    if (d.vale) {
      c.append(el("div", { class: "vale" },
        el("small", { text: "Vale por" }),
        el("strong", { text: d.vale.replace(/^vale por\s*/i, "") }),
      ));
    }

    if (d.adivinanza) {
      const caja = el("div", { class: "adivinanza" },
        el("p", { class: "pregunta", text: d.adivinanza.pregunta }));
      const boton = el("button", { class: "boton", text: "Ver respuesta" });
      boton.addEventListener("click", () => {
        const r = el("div", { class: "respuesta" });
        if (d.adivinanza.respuesta) r.append(el("p", { text: d.adivinanza.respuesta }));
        for (const src of [].concat(d.adivinanza.foto || [])) r.append(el("img", { src, alt: "" }));
        boton.replaceWith(r);
      });
      caja.append(boton);
      c.append(caja);
    }

    if (d.spotify) {
      const src = urlSpotify(d.spotify);
      if (src) {
        const alto = /\/track\/|\/episode\//.test(src) ? 152 : 352;
        c.append(el("iframe", {
          src, height: alto, loading: "lazy",
          allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
        }));
      }
    }

    if (d.youtube) {
      const src = urlYoutube(d.youtube);
      if (src) {
        c.append(el("iframe", {
          src, class: "youtube", loading: "lazy",
          allow: "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "",
        }));
      }
    }

    if (d.video) {
      c.append(el("video", { src: d.video, controls: "", playsinline: "", preload: "metadata" }));
    }

    if (d.enlace && d.enlace.url) {
      c.append(el("p", {}, el("a", {
        class: "boton", href: d.enlace.url, target: "_blank", rel: "noopener",
        text: d.enlace.texto || "Abrir",
      })));
    }

    return c;
  }

  // ---------- Puzzle (toca dos piezas para cambiarlas) ----------
  function construirPuzzle(dia, pz) {
    const cols = pz.columnas || 3;
    const filas = pz.filas || 4;
    const n = cols * filas;
    const clave = `adviento-${AÑO}-puzzle-${dia}`;
    let resuelto = false;
    try { resuelto = localStorage.getItem(clave) === "1"; } catch {}

    const orden = [...Array(n).keys()];
    if (!resuelto) {
      do {
        for (let i = n - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [orden[i], orden[j]] = [orden[j], orden[i]];
        }
      } while (orden.filter((p, i) => p === i).length > 1);
    }

    const tablero = el("div", {
      class: "puzzle",
      style: `--cols:${cols};--filas:${filas};aspect-ratio:${cols}/${filas};--foto:url("${pz.foto}")`,
    });
    const info = el("p", { class: "puzzle-info" });
    const pista = el("button", { class: "boton boton-suave", text: "👀 Ver la foto" });
    const mensaje = el("div", { class: "puzzle-mensaje" });
    let elegida = null;
    let movimientos = 0;

    function pintar(pieza, p) {
      const c = p % cols, f = Math.floor(p / cols);
      pieza.style.backgroundSize = `${cols * 100}% ${filas * 100}%`;
      pieza.style.backgroundPosition =
        `${cols > 1 ? (c / (cols - 1)) * 100 : 0}% ${filas > 1 ? (f / (filas - 1)) * 100 : 0}%`;
    }

    const piezas = orden.map((p, i) => {
      const b = el("button", { class: "pieza", "aria-label": `Pieza ${i + 1}` });
      b.style.backgroundImage = `url("${pz.foto}")`;
      pintar(b, p);
      b.addEventListener("click", () => tocar(i));
      return b;
    });
    tablero.append(...piezas);

    function tocar(i) {
      if (resuelto) return;
      if (elegida === null) {
        elegida = i;
        piezas[i].classList.add("elegida");
        return;
      }
      piezas[elegida].classList.remove("elegida");
      if (elegida !== i) {
        [orden[elegida], orden[i]] = [orden[i], orden[elegida]];
        for (const k of [elegida, i]) {
          pintar(piezas[k], orden[k]);
          piezas[k].classList.remove("cambio");
          void piezas[k].offsetWidth;
          piezas[k].classList.add("cambio");
        }
        movimientos++;
        info.textContent = `Movimientos: ${movimientos}`;
        if (orden.every((p, k) => p === k)) completar(true);
      }
      elegida = null;
    }

    function completar(celebrar) {
      resuelto = true;
      try { localStorage.setItem(clave, "1"); } catch {}
      tablero.classList.add("resuelto");
      pista.remove();
      info.textContent = celebrar
        ? `¡Conseguido en ${movimientos} movimientos! 🎉`
        : "¡Puzzle completado! 🎉";
      if (pz.mensaje) mensaje.replaceChildren(el("p", { class: "texto", text: pz.mensaje }));
      if (celebrar) setTimeout(() => destellos(tablero), 350);
    }

    pista.addEventListener("click", () => {
      tablero.classList.add("pista");
      setTimeout(() => tablero.classList.remove("pista"), 1500);
    });

    info.textContent = "Toca dos piezas para cambiarlas de sitio";
    const caja = el("div", { class: "puzzle-caja" }, tablero, info, pista, mensaje);
    if (resuelto) completar(false);
    return caja;
  }

  // ---------- Ramo de flores (toca los capullos) ----------
  const SVG = "http://www.w3.org/2000/svg";
  function svg(tag, attrs = {}, ...hijos) {
    const n = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    n.append(...hijos);
    return n;
  }

  const TIPOS_FLOR = [
    { capas: [[6, 11, 15, 11, "#e8466b"], [5, 8, 10, 5, "#c22a52"]], centro: [5, "#8e1630"] },  // rosa
    { capas: [[12, 4.5, 14, 15, "#ffffff"]], centro: [8, "#f4c430"] },                          // margarita
    { capas: [[5, 12, 14, 12, "#b07ad8"]], centro: [6, "#ffe08a"] },                            // lila
    { capas: [[8, 7, 14, 13, "#ff8a65"]], centro: [6, "#ffd54f"] },                             // coral
    { capas: [[6, 10, 15, 12, "#ffd54f"], [6, 6, 9, 6, "#ffb300"]], centro: [5, "#e65100"] },   // amarilla
    { capas: [[5, 13, 15, 11, "#f8bbd0"], [5, 8, 10, 5, "#f48fb1"]], centro: [5, "#fff59d"] },  // rosa clara
  ];
  const SITIOS_FLOR = [[150, 50], [92, 84], [208, 84], [62, 148], [238, 148], [150, 122], [110, 175], [190, 175]];

  function dibujarFlor(tipo) {
    const g = svg("g", { class: "flor" });
    tipo.capas.forEach(([n, rx, ry, dist, color], capa) => {
      for (let i = 0; i < n; i++) {
        const ang = (360 / n) * i + capa * (180 / n);
        g.append(svg("ellipse", {
          cx: 0, cy: -dist, rx, ry, fill: color,
          stroke: "rgba(0,0,0,.08)", "stroke-width": 1,
          transform: `rotate(${ang})`,
        }));
      }
    });
    g.append(svg("circle", { r: tipo.centro[0], fill: tipo.centro[1] }));
    return g;
  }

  function lluviaPetalos() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colores = ["#e8466b", "#f8bbd0", "#b07ad8", "#ff8a65", "#ffd54f", "#ffffff"];
    for (let i = 0; i < 36; i++) {
      const p = el("span", {
        class: "petalo",
        style:
          `left:${Math.random() * 100}vw;background:${colores[i % colores.length]};` +
          `animation-duration:${3 + Math.random() * 2.5}s;animation-delay:${Math.random() * 1.2}s;` +
          `--giro:${(Math.random() * 720 - 360) | 0}deg;--x:${(Math.random() * 120 - 60) | 0}px`,
      });
      document.body.append(p);
      setTimeout(() => p.remove(), 7000);
    }
  }

  function construirRamo(dia, ramo) {
    const frases = (ramo.flores || []).slice(0, SITIOS_FLOR.length);
    const clave = `adviento-${AÑO}-ramo-${dia}`;
    let completo = false;
    try { completo = localStorage.getItem(clave) === "1"; } catch {}

    const dibujo = svg("svg", { viewBox: "0 0 300 340", class: "ramo", role: "img", "aria-label": "Ramo de flores" });
    const base = [150, 300];

    // tallos y hojas
    const tallos = svg("g");
    frases.forEach((_, i) => {
      const [x, y] = SITIOS_FLOR[i];
      const cx = base[0] + (x - base[0]) * 0.25, cy = (y + base[1]) / 2;
      tallos.append(svg("path", {
        d: `M${base[0]},${base[1]} Q${cx},${cy} ${x},${y + 8}`,
        fill: "none", stroke: "#3f7d3a", "stroke-width": 3, "stroke-linecap": "round",
      }));
      if (i % 2 === 0) {
        const hx = (x + cx) / 2, hy = (y + cy) / 2 + 20;
        tallos.append(svg("ellipse", {
          cx: hx, cy: hy, rx: 5, ry: 12, fill: "#5a9e4b",
          transform: `rotate(${x < 150 ? -40 : 40} ${hx} ${hy})`,
        }));
      }
    });
    dibujo.append(tallos);

    // flores (capullo + flor abierta)
    const frase = el("p", { class: "ramo-frase" });
    const info = el("p", { class: "ramo-info" });
    const mensaje = el("div", { class: "ramo-mensaje" });
    let abiertas = 0;

    const flores = frases.map((texto, i) => {
      const [x, y] = SITIOS_FLOR[i];
      const capullo = svg("g", { class: "capullo" },
        svg("ellipse", { cx: 0, cy: 2, rx: 9, ry: 13, fill: "#4f9a46" }),
        svg("ellipse", { cx: 0, cy: -4, rx: 6, ry: 9, fill: TIPOS_FLOR[i % TIPOS_FLOR.length].capas[0][4] }),
        svg("ellipse", { cx: 0, cy: 6, rx: 9, ry: 8, fill: "#4f9a46" }),
      );
      const flor = dibujarFlor(TIPOS_FLOR[i % TIPOS_FLOR.length]);
      const zona = svg("circle", { r: 26, fill: "transparent" });
      const g = svg("g", { class: "flor-sitio", transform: `translate(${x} ${y})`, style: "cursor:pointer" },
        zona, flor, capullo);
      g.addEventListener("click", () => {
        if (g.classList.contains("abierta")) {
          mostrarFrase(texto);
          return;
        }
        g.classList.add("abierta");
        abiertas++;
        mostrarFrase(texto);
        actualizarInfo();
        if (abiertas === frases.length) setTimeout(() => terminar(true), 900);
      });
      dibujo.append(g);
      return g;
    });

    // papel del ramo y lazo
    dibujo.append(
      svg("polygon", { points: "78,212 222,212 174,332 126,332", fill: "#f3d9c4" }),
      svg("polygon", { points: "96,212 204,212 166,332 134,332", fill: "#e9c39f" }),
      svg("path", { d: "M150,212 L150,332", stroke: "rgba(120,70,30,.15)", "stroke-width": 2 }),
      svg("ellipse", { cx: 133, cy: 282, rx: 17, ry: 9, fill: "#c62b3e", transform: "rotate(-20 133 282)" }),
      svg("ellipse", { cx: 167, cy: 282, rx: 17, ry: 9, fill: "#c62b3e", transform: "rotate(20 167 282)" }),
      svg("path", { d: "M146,288 L136,312 M154,288 L164,312", stroke: "#c62b3e", "stroke-width": 5, "stroke-linecap": "round" }),
      svg("circle", { cx: 150, cy: 285, r: 7, fill: "#a81f30" }),
    );

    function mostrarFrase(texto) {
      frase.textContent = texto;
      frase.classList.remove("nueva");
      void frase.offsetWidth;
      frase.classList.add("nueva");
    }
    function actualizarInfo() {
      info.textContent = completo
        ? "Toca una flor para volver a leer su frase"
        : `Toca los capullos para que florezcan 🌷 (${abiertas}/${frases.length})`;
    }
    function terminar(celebrar) {
      completo = true;
      try { localStorage.setItem(clave, "1"); } catch {}
      dibujo.classList.add("completo");
      actualizarInfo();
      if (ramo.mensaje) mensaje.replaceChildren(el("p", { class: "texto", text: ramo.mensaje }));
      if (celebrar) lluviaPetalos();
    }

    if (completo) {
      flores.forEach((g) => g.classList.add("abierta"));
      abiertas = frases.length;
      terminar(false);
    } else {
      actualizarInfo();
    }

    return el("div", { class: "ramo-caja" }, dibujo, frase, info, mensaje);
  }

  // ---------- Carta dentro de un sobre ----------
  function construirCarta(carta) {
    const hoja = el("div", { class: "carta" });
    if (carta.fecha) hoja.append(el("p", { class: "carta-fecha", text: carta.fecha }));
    for (const parrafo of String(carta.texto || "").split(/\n\s*\n/)) {
      hoja.append(el("p", { text: parrafo.trim() }));
    }
    if (carta.firma) hoja.append(el("p", { class: "carta-firma", text: `${carta.firma} ❤️` }));
    return hoja;
  }

  function construirSobre(carta) {
    const sobre = el("button", { class: "sobre", "aria-label": "Abrir la carta" },
      el("div", { class: "sobre-fondo" }),
      el("div", { class: "sobre-papel" }),
      el("div", { class: "sobre-frente" }),
      el("span", { class: "sobre-etiqueta", text: carta.sobre || "" }),
      el("div", { class: "sobre-solapa" }),
      el("div", { class: "sobre-sello", text: "♥" }),
    );
    const pista = el("p", { class: "sobre-pista", text: "Toca el sobre para abrirlo" });
    const caja = el("div", { class: "sobre-caja" }, sobre, pista);
    sobre.addEventListener("click", () => {
      sobre.classList.add("abierto");
      pista.remove();
      const rapido = matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(() => caja.replaceWith(construirCarta(carta)), rapido ? 0 : 1800);
    }, { once: true });
    return caja;
  }

  function mostrarSorpresa(dia) {
    const cont = $("#contenido");
    cont.replaceChildren(construirSorpresa(dia));
    const modal = $("#modal");
    modal.hidden = false;
    modal.querySelector(".tarjeta").scrollTop = 0;
    document.body.style.overflow = "hidden";
  }

  function cerrarSorpresa() {
    const modal = $("#modal");
    modal.hidden = true;
    // Para la música/vídeo al cerrar
    $("#contenido").replaceChildren();
    document.body.style.overflow = "";
  }

  $("#modal").addEventListener("click", (e) => {
    if (e.target.closest("[data-cerrar]")) cerrarSorpresa();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#modal").hidden) cerrarSorpresa();
  });

  // ---------- Guirnalda ----------
  function pintarGuirnalda() {
    const g = document.querySelector(".guirnalda");
    const colores = ["#ff4d5e", "#ffd35c", "#4de38a", "#5cc8ff", "#ff9a3d"];
    const n = Math.max(9, Math.round(Math.min(innerWidth, 900) / 34));
    g.replaceChildren();
    for (let i = 0; i < n; i++) {
      const t = (i + .5) / n;
      const y = Math.sin(t * Math.PI) * 14 + 4; // sigue la curva del cable
      g.append(el("span", {
        class: "bombilla",
        style: `--c:${colores[i % colores.length]};--d:${(i % 5) * .45}s;--y:${y}px`,
      }));
    }
  }

  // ---------- Nieve ----------
  function nieve() {
    const cv = $("#nieve");
    const ctx = cv.getContext("2d");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let w, h, copos;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    function medir() {
      w = innerWidth; h = innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(110, (w * h) / 7000));
      copos = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.2 + .6,
        v: Math.random() * .6 + .3,
        f: Math.random() * Math.PI * 2,
      }));
    }
    medir();
    addEventListener("resize", medir);
    function paso() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,.85)";
      for (const c of copos) {
        c.y += c.v;
        c.f += .01;
        c.x += Math.sin(c.f) * .35;
        if (c.y > h + 5) { c.y = -5; c.x = Math.random() * w; }
        ctx.globalAlpha = .35 + c.r / 4;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(paso);
    }
    paso();
  }

  // ---------- Arranque ----------
  const rejilla = $("#rejilla");
  ORDEN.forEach((dia, i) => rejilla.append(crearCasilla(dia, i)));
  pintarTextos();

  // Para probar: ?hoy=2026-12-05&abrir=5 abre directamente esa casilla
  const abrir = parseInt(params.get("abrir"), 10);
  if (abrir >= 1 && abrir <= TOTAL) {
    const b = rejilla.querySelector(`[data-dia="${abrir}"]`);
    if (b) setTimeout(() => pulsar(b, abrir), 600);
  }

  pintarGuirnalda();
  addEventListener("resize", pintarGuirnalda);
  nieve();

  // Si la app se queda abierta y cambia el día, se actualiza sola.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !params.get("hoy")) {
      const ahora = new Date();
      if (ahora.getDate() !== hoy.getDate() || ahora.getMonth() !== hoy.getMonth()) location.reload();
    }
  });

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    // Cuando llega una versión nueva, se recarga sola una vez
    const habiaVersion = !!navigator.serviceWorker.controller;
    let recargado = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (habiaVersion && !recargado) { recargado = true; location.reload(); }
    });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" })
      .then((reg) => {
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") reg.update().catch(() => {});
        });
      })
      .catch(() => {});
  }
})();
