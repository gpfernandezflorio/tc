/* --- MDE --- */

let canvas;

function drawUsing(c) {
  mde_drawUsing(c);
}

function seleccionado(x) {
  let elementosSeleccionados = x instanceof Node
    ? nodosSeleccionados()
    : enTransicion
  ;
  if (elementosSeleccionados == null) { return false; }
  return elementosSeleccionados.includes(x);
}

function nodosSeleccionados() {
  if (configActual === null) {
    return null;
  }
  let res = configActual.q;
  if (dataGuardada.clase === AP) {
    res = res.map((x) => x[0]);
  }
  return res;
}

function prepararParaExportar(f) { f(); }

let caretVisible = false;

function draw(save=true) {
	const c = canvas.getContext('2d');
	drawUsing(c);
}

/* --- --- --- */

window.onload = function() {
	canvas = document.getElementById('canvas');
  inicializarDebug();
	mdeRestoreBackup('runG', function(run) {
    document.getElementById('inputCadena').value = run.cadena || '';
  });
	redimensionar();
  mostrarTupla();
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
  let target = dataGuardada.clase === AP ? ((x) => [nodoDst(x), [dataGuardada.data.Z]]) : nodoDst;
  configActual = {q:enTransicion.map(target), i:cadenaCargada};
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
  let f = dataGuardada.clase === AP
    ? (q) => `(${q[0].text}, ${q[1].join('')})`
    : (q) => q.text;
  if (dataGuardada.det) {
    return f(Q[0]);
  }
  return `{ ${Q.map(f).join(', ')} }`;
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
  while(puedoAgregarEstados(proximasTransiciones())) {
    btnStep(false); btnStep(false);
  }
  actualizar();
}

function puedoAgregarEstados(ts) {
  return ts.some((x) =>
    esTransicionLambda(x) && !yaEstaQ(dataGuardada.clase, configActual.q, nodoDst(x))
  )
}

function btnStep(show=true) {
  if (enTransicion && enTransicion.some((x) => !(x instanceof StartLink))) {
    let nuevosEstados = estadosAlcanzables(enTransicion);
    if (enTransicion.some((x) => !esTransicionLambda(x))) {
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
  let filtro = dataGuardada.clase === AP
    ? (x) => configActual.q.some((q) =>
      q[0] == nodoSrc(x) && q[1][0] == simboloPila1(x.text)
    ) : (x) => configActual.q.includes(nodoSrc(x));
  let ts = transiciones().filter(filtro);
  return ts.filter(
    puedoAgregarEstados(ts)
    ? (x) => esTransicionLambda(x)
    : (x) => convertLatexShortcuts(simboloTransicion(x.text)) == configActual.i[0]
  );
}

function nodoXpila(t) {
  let res = [];
  for (let q of configActual.q) {
    if (q[0] == nodoSrc(t) && q[1][0] == simboloPila1(t.text)) {
      res.push([nodoDst(t), simboloPila2(t.text).concat(q[1].slice(1))]);
    }
  }
	return res;
}

function estadosAlcanzables(ts) {
  let target = dataGuardada.clase === AP ? nodoXpila : nodoDst;
  let res = ts.map(target);
  if (dataGuardada.clase === AP) { // lista de listas de estados
    res = res.reduce((rec, x) => rec.concat(x), []); // lista de estados
  }
  return res.reduce(
    (rec, x) => (yaEsta(dataGuardada.clase, rec, x) ? rec : rec.concat([x])), []
  );
}

function puedoUsarUnaLambda(ts) {
  return ts.some((x) => esTransicionLambda(x)) &&
    estadosAlcanzables(ts.filter((x) => esTransicionLambda(x)))
      .some((x) => !configActual.q.includes(
        dataGuardada.clase === AP ? x[0] : x
      ));
}

function esTransicionLambda(t) {
  return simboloTransicion(t.text) == '\\lambda';
}

function union(l1, l2) {
  return l1.reduce((rec, x) => rec.includes(x) ? rec : rec.concat([x]), l2);
}

function mdeSaveBackup() {
  saveBackup('runG', {
    cadena: document.getElementById('inputCadena').value
  });
}

function redimensionar() {
	canvas.width = window.innerWidth - 20;
	canvas.height = window.innerHeight - 70;
	draw(false);
}

window.addEventListener('resize', redimensionar, false);