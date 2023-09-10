const Prod = function(nt, m) {
  this.nt = nt;
  if (m !== null) {
    this.tmp = m;
  }
}

Prod.prototype.construirConEspacios = function() {
  this.res = 'tmp' in this
    ? this.tmp.split(" ").filter((x) => x.length > 0)
    : [];
  delete this.tmp;
  return this.res;
}

Prod.prototype.construirSinEspacios = function() {
  this.res = 'tmp' in this
    ? this.tmp.split("").filter((x) => x.length > 0)
    : [];
  delete this.tmp;
  return this.res;
}

Prod.prototype.show = function() {
  let res = '?'
  if ('res' in this) {
    res = this.res.length == 0
      ? convertLatexShortcuts('\\lambda')
      : this.res.join(" ");
  }
  return `${this.nt} -> ${res}`;
}

function btnAyuda() {
	let divPrincipal = document.getElementById('main');
	let divAyuda = document.getElementById('help');
	if (divAyuda.hidden) {
		divAyuda.hidden = false;
		divPrincipal.hidden = true;
	} else {
		divAyuda.hidden = true;
		divPrincipal.hidden = false;
    inputGrammar.focus();
	}
}

function btnNuevo() {
  inputGrammar.value = "S -> ";
  dataGuardada = {};
  actualizar();
  btnReset();
}

function btnAbrir() {
	abrirArchivo(function(json) {
		restaurar(json.grammar);
    actualizar();
    btnReset();
	}, console.log);
}

function restaurar(grammar) {
  inputGrammar.value = grammar.text;
  // grammar.user
}

function actualizar() {
  saveBackup('grammar', nuevoEstado());
  mostrarTupla();
}

function mostrarTupla() {
	const data = construir(setTupla);
	if (data) {
		let clase = {[GR]:"GR",[GLC]:"GLC"}[dataGuardada.clase];
    if (dataGuardada.clase == GR) {
      clase += ` (${dataGuardada.dir})`;
    }
		let tupla = `Vn : { ${
			data.Vn.join(', ')
		} }, Vt : { ${
			data.Vt.join(', ')
		} }, P : <a href="javascript:prods()">P</a>, S : ${
			data.S
		} }`;
		setTupla(`${clase} &lt ${tupla} &gt`);
	}
}

const GR = 0;
const GLC = 1;

function setTupla(tupla) {
	document.getElementById("tupla").innerHTML = convertLatexShortcuts(tupla);
}

let dataGuardada = {};
function construir(fallar=(x)=>{}) {
  const input = inputGrammar.value.split("\n");
  if (input.length == 0 || input.length == 1 && input[0].length == 0) {
    fallar(`Faltan producciones`);
    return;
  }
  const data = {
    Vn:[], Vt: [], P:[]
  };
  let j = 1;
  let usaEspacios = false;
  for (let i of input.map(convertLatexShortcuts)) {
    if (i.length > 0) {
      let p = i.split("->");
      if (p.length > 0) {
        if (p.length > 2) {
          let i_flecha = i.indexOf("->");
          p = [i.substring(0,i_flecha), i.substr(i_flecha+2)];
        }
        let m = null;
        if (p.length == 1 || p[1] == p[1].trim() || p[1].trim() == 'λ') { // lambda
          if (p[0] == i) {
            fallar(`Falta la flecha en la producción ${j}: ${i}`);
            return;
          }
        } else {
          m = p[1].trim();
          usaEspacios = usaEspacios || m.includes(" ");
        }
        let N = p[0].trim();
        if (!data.Vn.includes(N)) {
          data.Vn.push(N);
        }
        if (!("S" in data)) {
          data.S = N;
        }
        data.P.push(new Prod(N, m));
        j++;
      }
    }
  }
  let construirProduccion = usaEspacios ? 'construirConEspacios' : 'construirSinEspacios';
  for (let p of data.P) {
    simbolos = p[construirProduccion]();
    for (let s of simbolos) {
      if (!data.Vn.includes(s) && !data.Vt.includes(s)) {
        data.Vt.push(s);
      }
    }
  }
  // if dataGuardada.user ...
  dataGuardada.grammar = data;
  dataGuardada.clase = GR;
  if (data.P.every(esADerecha)) {
    dataGuardada.dir = "r";
  } else if (data.P.every(esAIzquierda)) {
    dataGuardada.dir = "l";
  } else {
    dataGuardada.clase = GLC;
  }
  return data;
}

function nuevoEstado() {
  return {
    text:inputGrammar.value,
    user:[]
  };
}

function esADerecha(p) {
  return p.res.length > 0 &&
  (
    p.res.every((x) => dataGuardada.grammar.Vt.includes(x)) || // Todos Vt
    (
      p.res.slice(0,p.res.length-1).every((x) => dataGuardada.grammar.Vt.includes(x)) &&
      dataGuardada.grammar.Vn.includes(p.res[p.res.length-1]) // Sólo el último Vn
    )
  )
}

function esAIzquierda(p) {
  return p.res.length > 0 &&
  (
    p.res.every((x) => dataGuardada.grammar.Vt.includes(x)) || // Todos Vt
    (
      p.res.slice(1).every((x) => dataGuardada.grammar.Vt.includes(x)) &&
      dataGuardada.grammar.Vn.includes(p.res[0]) // Sólo el primero Vn
    )
  )
}

function prods() {
  alert("P:\n" + dataGuardada.grammar.P.map((x) => `  ${x.show()}`).join("\n"));
}

function btnGuardar() {
	descargarArchivo('data:text/plain;charset=utf-8,' +
		encodeURIComponent(JSON.stringify({grammar:nuevoEstado()})), 'grammar.grammar');
}

function btnEjecutar() {
  if (exec.hidden) { // GO
    if (construir(alert)) {
      btnReset();
      inputGrammar.setAttribute('readonly', true);
      inputGrammar.classList.add('readonly');
      exec.hidden = false;
      document.getElementById('btnEjecutar').innerHTML = "Editar";
    }
  } else { // EDIT
    exec.hidden = true;
    inputGrammar.removeAttribute('readonly');
    inputGrammar.classList.remove('readonly');
    inputGrammar.focus();
    document.getElementById('btnEjecutar').innerHTML = "Ejecutar";
  }
}

function btnReset() {
  document.getElementById('pasos').innerHTML = '';
  running = [dataGuardada.grammar.S];
  agregarPaso();
}

function agregarBotonesProducciones() {
  let btns = {};
  for (let nt of dataGuardada.grammar.Vn) {
    btns[nt] = [];
  }
  let i=0;
  for (let p of dataGuardada.grammar.P) {
    btns[p.nt].push({i, txt:p.res.length == 0 ? 'λ' : p.res.join(" ")});
    i++;
  }
  let N = proximoNoTerminal(); // Ojo: puede ser null
  let content = '<table>';
  for (let nt in btns) {
    let info = nt==N ? '' : 'disabled'
    content += `<tr><td>${nt}:</td>`;
    for (let b of btns[nt]) {
      content += `<td><button onclick="next(${b.i})" ${info}>${b.txt}</button></td>`;
    }
    content += '</tr>';
  }
  document.getElementById('btnProds').innerHTML = content + '</table>';
}

function next(p) {
  p = dataGuardada.grammar.P[p];

  let i = 0;
  while (i < running.length && !dataGuardada.grammar.Vn.includes(running[i])) {
    i++;
  }
  if (i < running.length && running[i] == p.nt) {
    running = running.slice(0,i).concat(p.res).concat(running.slice(i+1));
  }
  document.getElementById('pasos').lastChild.innerHTML += `<td>${p.show()}</td>`
  agregarPaso();
};

function agregarPaso() {
  let paso = document.createElement('tr');
  let i = 0;
  let content = '';
  while (i < running.length && !dataGuardada.grammar.Vn.includes(running[i])) {
    content += `<span>${running[i]}</span>`;
    i++;
  }
  if (i < running.length) {
    content += `<span class="current">${running[i]}</span>`;
    i++;
    while (i < running.length) {
      content += `<span>${running[i]}</span>`;
      i++;
    }
  }
  paso.innerHTML = `<td>${content}</td>`;
  document.getElementById('pasos').appendChild(paso);
  agregarBotonesProducciones();
}

function proximoNoTerminal() {
  if (running.every((x) => !dataGuardada.grammar.Vn.includes(x))) {
    return null;
  }
  return running.filter((x) => dataGuardada.grammar.Vn.includes(x))[0];
}

let debugPane;
let originalClick = null;
let dragging = false;
let running = [];

function mouseDrag(e) {
  if (dragging && originalClick !== null) {
    debugPane.style.right = `${window.innerWidth - (originalClick.pane.right + e.x - originalClick.mouse.x)}px`;
    debugPane.style.top = `${originalClick.pane.y + e.y - originalClick.mouse.y}px`;
  }
}

let tabla;
let inputGrammar;
let exec;
window.onload = function() {
  tabla = document.getElementById("tablaBuild");
  inputGrammar = document.getElementById("inputGrammar");
  exec = document.getElementById("exec");
  debugPane = document.getElementById('debug');
  redimensionar();
	restoreBackup([{k:'grammar', f:restaurar}]);
  inputGrammar.oninput = actualizar;
  actualizar();
  inputGrammar.focus();

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

function redimensionar() {
	tabla.style.width = `${window.innerWidth - 20}px`;
	tabla.style.height = `${window.innerHeight - 70}px`;
	inputGrammar.style.width = `${window.innerWidth/2 - 20}px`;
	inputGrammar.style.height = `${window.innerHeight - 80}px`;
	exec.style.width = `${window.innerWidth/2 - 30}px`;
	exec.style.height = `${window.innerHeight - 95}px`;
}

window.addEventListener('resize', redimensionar, false);