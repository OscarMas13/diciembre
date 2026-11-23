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
    const estilo = dia === 24 ? "estilo-oro" : `estilo-${i % 4}`;
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

    const fotos = d.foto ? [].concat(d.foto) : [];
    for (const src of fotos) c.append(el("img", { src, alt: "", loading: "lazy" }));

    if (d.texto) c.append(el("p", { class: "texto", text: d.texto }));

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
        boton.replaceWith(el("p", { class: "respuesta", text: d.adivinanza.respuesta }));
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
