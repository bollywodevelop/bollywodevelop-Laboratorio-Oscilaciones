
const $ = id => document.getElementById(id);

const controles = {
  A: $("amplitud"),
  T: $("periodo"),
  C: $("desplazamientoX"),
  D: $("desplazamientoY"),
  eje: $("ejeX")
};

const NS = "http://www.w3.org/2000/svg";

function elemento(nombre, atributos = {}) {
  const el = document.createElementNS(NS, nombre);
  Object.entries(atributos).forEach(([k, v]) =>
    el.setAttribute(k, v)
  );
  return el;
}

function leer() {
  return {
    A: Number(controles.A.value),
    T: Number(controles.T.value),
    C: Number(controles.C.value),
    D: Number(controles.D.value),
    eje: Number(controles.eje.value)
  };
}

// Función sinusoidal
function f(x, p) {
  const B = 2 * Math.PI / p.T;
  return p.A * Math.sin(B * (x - p.C)) + p.D;
}

// Conversión de coordenadas matemáticas a SVG
function X(x) {
  return 60 + ((x + 10) / 20) * 700;
}

function Y(y) {
  return 230 - y * 55;
}

// Construir cuadrícula
function dibujarCuadricula() {
  const grupo = $("cuadricula");
  grupo.innerHTML = "";

  for (let x = -10; x <= 10; x++) {
    grupo.appendChild(elemento("line", {
      x1: X(x), y1: 30,
      x2: X(x), y2: 430,
      stroke: "#344052",
      "stroke-width": 1,
      opacity: x === 0 ? 0.8 : 0.35
    }));

    if (x % 2 === 0) {
      const t = elemento("text", {
        x: X(x), y: 453,
        fill: "#9ca8bc",
        "font-size": 12,
        "text-anchor": "middle"
      });
      t.textContent = x;
      grupo.appendChild(t);
    }
  }

  for (let y = -3; y <= 3; y++) {
    grupo.appendChild(elemento("line", {
      x1: 60, y1: Y(y),
      x2: 760, y2: Y(y),
      stroke: "#344052",
      "stroke-width": 1,
      opacity: 0.4
    }));

    const t = elemento("text", {
      x: 45, y: Y(y) + 4,
      fill: "#9ca8bc",
      "font-size": 12,
      "text-anchor": "middle"
    });
    t.textContent = y;
    grupo.appendChild(t);
  }
}

// Construir ejes
function dibujarEjes(p) {
  const grupo = $("ejes");
  grupo.innerHTML = "";

  const ejeVertical = elemento("line", {
    x1: X(0), y1: 30,
    x2: X(0), y2: 430,
    stroke: "#8291a8",
    "stroke-width": 2
  });

  const ejeHorizontal = elemento("line", {
    x1: 60, y1: Y(p.eje),
    x2: 760, y2: Y(p.eje),
    stroke: "#ffffff",
    "stroke-width": 2
  });

  grupo.appendChild(ejeVertical);
  grupo.appendChild(ejeHorizontal);

  const etiqueta = elemento("text", {
    x: 765,
    y: Y(p.eje) - 8,
    fill: "#ffffff",
    "font-size": 14
  });

  etiqueta.textContent = "X";
  grupo.appendChild(etiqueta);
}

// Dibujar regiones positivas y negativas
function dibujarRegiones(p) {
  const grupo = $("regiones");
  grupo.innerHTML = "";

  if (!$("sombreado").checked) return;

  let anterior = null;
  let segmento = [];

  function guardar() {
    if (segmento.length < 2) return;

    const base = Y(p.eje);

    const puntos = [
      `M ${segmento[0].x} ${base}`,
      ...segmento.map(v => `L ${v.x} ${v.y}`),
      `L ${segmento[segmento.length - 1].x} ${base}`,
      "Z"
    ].join(" ");

    const positivo = segmento[0].y < base;

    grupo.appendChild(elemento("path", {
      d: puntos,
      fill: positivo ? "#2daa83" : "#db7792",
      opacity: 0.35
    }));

    segmento = [];
  }

  for (let i = 0; i <= 1000; i++) {
    const x = -10 + i / 50;
    const valor = f(x, p) - p.eje;

    const punto = {
      x: X(x),
      y: Y(f(x, p)),
      positivo: valor >= 0
    };

    if (anterior && anterior.positivo !== punto.positivo) {
      const t = anterior.positivo
        ? 1 - Math.abs(anterior.valor) /
          (Math.abs(anterior.valor) + Math.abs(valor))
        : Math.abs(anterior.valor) /
          (Math.abs(anterior.valor) + Math.abs(valor));

      const cruce = {
        x: X(x - 0.02 + 0.02 * t),
        y: Y(p.eje)
      };

      segmento.push(cruce);
      guardar();
      segmento.push(cruce);
    }

    segmento.push(punto);
    punto.valor = valor;
    anterior = punto;
  }

  guardar();
}

// Dibujar curva
function dibujarOnda(p) {
  let puntos = [];

  for (let i = 0; i <= 1000; i++) {
    const x = -10 + i / 50;
    const y = f(x, p);

    puntos.push(
      `${i === 0 ? "M" : "L"} ${X(x)} ${Y(y)}`
    );
  }

  $("onda").setAttribute("d", puntos.join(" "));
}

// Actualizar ecuación y controles
function actualizar() {
  const p = leer();

  const B = 2 * Math.PI / p.T;

  $("formula").textContent =
    `f(x) = ${p.A.toFixed(2)} · sen(${B.toFixed(3)}(x − (${p.C.toFixed(2)}))) + (${p.D.toFixed(2)})`;

  $("valores").textContent =
    `A = ${p.A} | T = ${p.T} | B = ${B.toFixed(3)} | C = ${p.C} | D = ${p.D}`;

  $("vA").textContent = p.A.toFixed(2);
  $("vT").textContent = p.T.toFixed(2);
  $("vC").textContent = p.C.toFixed(2);
  $("vD").textContent = p.D.toFixed(2);
  $("vEje").textContent = p.eje.toFixed(2);

  $("cuadricula").style.display =
    $("cuadriculaVisible").checked ? "block" : "none";

  dibujarCuadricula();
  dibujarEjes(p);
  dibujarRegiones(p);
  dibujarOnda(p);
}

// Escuchar movimientos
Object.values(controles).forEach(control => {
  control.addEventListener("input", actualizar);
});

$("sombreado").addEventListener("change", actualizar);
$("cuadriculaVisible").addEventListener("change", actualizar);

// Restaurar valores iniciales
$("reiniciar").addEventListener("click", () => {
  controles.A.value = 1.4;
  controles.T.value = 6.28;
  controles.C.value = 0;
  controles.D.value = 0;
  controles.eje.value = 0;

  $("sombreado").checked = true;
  $("cuadriculaVisible").checked = true;

  actualizar();
});

// Iniciar laboratorio
actualizar();
