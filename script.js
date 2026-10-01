(() => {
  "use strict";
  const KEY = "a2a128ed01614282880140302261409";
  const URL = "https://api.weatherapi.com/v1/current.json";
  const $ = (id) => document.getElementById(id);
  const form = $("search-form"), input = $("city-input"), btn = $("search-btn");

  const views = {
    idle: $("state-idle"), loading: $("state-loading"),
    error: $("state-error"), success: $("weather-card"),
  };
  let token = 0;

  const show = (s) => { for (const k in views) views[k].hidden = k !== s; };
  const fail = (msg) => { $("error-message").textContent = msg; show("error"); };

  const fmtTime = (t) => {
    if (!t) return "—";
    const [d, h] = t.split(" ");
    if (!d || !h) return t;
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y} · ${h} h`;
  };

  function render({ location: l, current: c }) {
    $("w-city").textContent = l.name;
    $("w-country").textContent = l.region ? `${l.region}, ${l.country}` : l.country;
    $("w-time").textContent = `Hora local: ${fmtTime(l.localtime)}`;
    const icon = $("w-icon");
    icon.src = c.condition.icon.startsWith("//") ? `https:${c.condition.icon}` : c.condition.icon;
    icon.alt = c.condition.text;
    $("w-temp").textContent = Math.round(c.temp_c);
    $("w-condition").textContent = c.condition.text;
    $("w-humidity").textContent = `${c.humidity}%`;
    $("w-wind").textContent = `${Math.round(c.wind_kph)} km/h`;
    $("w-feels").textContent = `${Math.round(c.feelslike_c)}°C`;
    show("success");
  }

  async function load(city) {
    const my = ++token;
    let res;
    try {
      res = await fetch(`${URL}?key=${KEY}&q=${encodeURIComponent(city)}&lang=es`);
    } catch {
      return my === token && fail("No se pudo conectar con el servicio de clima. Revisa tu conexión.");
    }

    let data;
    try { data = await res.json(); }
    catch { return my === token && fail("La respuesta del servicio no es válida."); }

    if (my !== token) return;
    if (!res.ok || data.error) {
      const code = data?.error?.code;
      if ([1002,2006,2007,2008,2009].includes(code)) fail("La clave de API no es válida. Reemplázala en script.js.");
      else if (code === 1006) fail(`No encontramos "${city}". Revisa el nombre.`);
      else if (res.status === 429) fail("Límite de solicitudes alcanzado. Intenta en unos minutos.");
      else fail(data?.error?.message || "Ocurrió un error al consultar el clima.");
      return;
    }
    render(data);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const city = input.value.trim();
    if (!city) { fail("Escribe el nombre de una ciudad."); input.focus(); return; }
    show("loading");
    btn.disabled = true;
    try { await load(city); } finally { btn.disabled = false; }
  });

  show("idle");
})();