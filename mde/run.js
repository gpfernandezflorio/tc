/* --- MDE --- */

let canvas;

function drawUsing(c) {
  mde_drawUsing(c);
}

function seleccionado(x) {
  let elementosSeleccionados = x instanceof Node
    ? (configActual || {q:null}).q
    : enTransicion
  ;
  if (elementosSeleccionados == null) { return false; }
  return elementosSeleccionados.includes(x);
}

function prepararParaExportar(f) { f(); }

let caretVisible = false;

function draw(save=true) {
	const c = canvas.getContext('2d');
	drawUsing(c);
}

/* --- --- --- */

let debugPane;
let originalClick = null;
let dragging = false;

window.onload = function() {
	canvas = document.getElementById('canvas');
  debugPane = document.getElementById('debug');
	mdeRestoreBackup('run', function(run) {
    document.getElementById('inputCadena').value = run.cadena || '';
  });
	redimensionar();
  mostrarTupla();

  debugPane.onmousedown = function(e) {
    originalClick = {mouse:e, pane:debugPane.getClientRects()[0]};
    dragging = true;
    document.onmousemove = mouseDrag;
  };

  document.onmouseup = function(e) {
    dragging = false;
    originalClick = null;
    delete document.onmousemove;
  };
}

function mouseDrag(e) {
  if (dragging && originalClick !== null) {
    debugPane.style.left = `${originalClick.pane.x + e.x - originalClick.mouse.x}px`;
    debugPane.style.top = `${originalClick.pane.y + e.y - originalClick.mouse.y}px`;
  }
}

function btnEditar() {
	window.location.replace("./build.html");
}

let running = 0; // detenido
let cadenaCargada = '';
let configActual = null;
let enTransicion = null;
let mde;

function cargarInput() {
  let dOn = document.getElementById('debugOn');
  let dOff = document.getElementById('debugOff');
  if (dOn.hidden) { // GO
    mde = construir(alert);
    if (mde && validarCadena()) {
      dOff.hidden = true;
      document.getElementById('labelCadena').value =
      Array.isArray(cadenaCargada) ? cadenaCargada.join(" ") : cadenaCargada;
      reiniciar();
      dOn.hidden = false;
    }
  } else { // EDIT
    enTransicion = null;
    configActual = null;
    draw();
    dOn.hidden = true;
    dOff.hidden = false;
  }
}

function validarCadena() {
  cadenaCargada = convertLatexShortcuts(document.getElementById('inputCadena').value);
  if (cadenaCargada.includes(" ") || mde.A.some((x) => x.length > 1)) {
    cadenaCargada = cadenaCargada.split(" ");
  }
  let simbolosValidos = mde.A.map(convertLatexShortcuts);
  for (let x of cadenaCargada) {
    if (!simbolosValidos.includes(x)) {
      alert(`Símbolo ' ${x} ' inválido`);
      return false;
    }
  }
  return true;
}

function reiniciar() {
  enTransicion = flechasIniciales();
  configActual = {q:enTransicion.map(nodoDst), i:cadenaCargada};
  actualizar();
}

function actualizar() {
  document.getElementById('config').innerHTML = convertLatexShortcuts(configuracionInstantanea());
  draw();
}

function configuracionInstantanea() {
  return `< ${nodosStr(configActual.q)}, ${configActual.i} >`;
}

function nodosStr(Q) {
  if (dataGuardada.det) {
    return Q[0].text;
  }
  return `{ ${Q.map((x)=>x.text).join(', ')} }`;
}

function btnReset() {
  reiniciar();
}

function btnPlay() {
  document.getElementById("btnPlay").hidden = true;
  document.getElementById("btnStop").hidden = false;
  if (running) {
    clearInterval(running);
  }
  running = setInterval(timedStep, 50);
}

function btnStop() {
  if (running) {
    clearInterval(running);
    running = null;
    document.getElementById("btnStop").hidden = true;
    document.getElementById("btnPlay").hidden = false;
  }
}

function timedStep() {
  btnStep();
}

function btnFullStep() {
  btnStep(false);
  if (enTransicion) {
    btnStep(false);
  }
  while(proximasTransiciones().some((x) => x.text == '\\lambda')) {
    btnStep(false); btnStep(false);
  }
  actualizar();
}

function btnStep(show=true) {
  if (enTransicion && enTransicion.some((x) => !(x instanceof StartLink))) {
    let nuevosEstados = estadosAlcanzables(enTransicion);
    if (enTransicion.some((x) => x.text != '\\lambda')) {
      configActual.i = configActual.i.slice(1);
      configActual.q = nuevosEstados;
    } else {
      configActual.q = union(configActual.q, nuevosEstados);
    }
    enTransicion = null;
  } else {
    enTransicion = proximasTransiciones();
    if (enTransicion.length == 0) {
      enTransicion = null;
      alert("FIN");
      if (running) { btnStop(); }
    }
  }
  if (show) { actualizar(); }
}

function proximasTransiciones() {
  let ts = transiciones().filter((x) => configActual.q.includes(nodoSrc(x)));
  return ts.filter(
    puedoUsarUnaLambda(ts)
    ? (x) => x.text == '\\lambda'
    : (x) => convertLatexShortcuts(x.text) == configActual.i[0]
  );
}

function estadosAlcanzables(ts) {
  return ts.map(nodoDst).reduce(
    (rec, x) => (rec.includes(x) ? rec : rec.concat(x)), []
  );
}

function puedoUsarUnaLambda(ts) {
  return ts.some((x) => x.text == '\\lambda') &&
    estadosAlcanzables(ts.filter((x) => x.text == '\\lambda'))
      .some((x) => !configActual.q.includes(x));
}

function union(l1, l2) {
  return l1.reduce((rec, x) => rec.includes(x) ? rec : rec.concat([x]), l2);
}

function mdeSaveBackup() {
  saveBackup('run', {
    cadena: document.getElementById('inputCadena').value
  });
}

function redimensionar() {
	canvas.width = window.innerWidth - 20;
	canvas.height = window.innerHeight - 70;
	draw(false);
}

window.addEventListener('resize', redimensionar, false);