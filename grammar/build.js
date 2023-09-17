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
		Grammar.restaurar(json.grammar);
    actualizar();
    btnReset();
	}, console.log);
}

function actualizar() {
  saveBackup('grammar', nuevoEstado());
  mostrarTupla();
}

function mostrarTupla() {
	const data = Grammar.construir(setTupla);
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

function setTupla(tupla) {
	document.getElementById("tupla").innerHTML = convertLatexShortcuts(tupla);
}

let dataGuardada = {};


function nuevoEstado() {
  return {
    text:inputGrammar.value,
    user:[]
  };
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
    if (Grammar.construir(alert)) {
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
  runningGrammar = [dataGuardada.grammar.S];
  agregarPaso();
  Grammar.agregarBotonesProducciones();
}

let runningGrammar = [];

function agregarPaso(p) {
  if (p) { document.getElementById('pasos').lastChild.innerHTML += `<td>${p.show()}</td>`; }
  let paso = document.createElement('tr');
  paso.innerHTML = `<td>${Grammar.current()}</td>`;
  document.getElementById('pasos').appendChild(paso);
};

function mouseDrag(e) {
  if (dragging && originalClick !== null) {
    debugPane.style.left = `${originalClick.pane.x + e.x - originalClick.mouse.x}px`;
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
  inicializarDebug();
  redimensionar();
	restoreBackup([{k:'grammar', f:Grammar.restaurar}]);
  inputGrammar.oninput = actualizar;
  actualizar();
  inputGrammar.focus();
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