function btnAyuda() {
	let divPrincipal = document.getElementById('main');
	let divAyuda = document.getElementById('help');
	if (divAyuda.hidden) {
		divAyuda.hidden = false;
		divPrincipal.hidden = true;
	} else {
		divAyuda.hidden = true;
		divPrincipal.hidden = false;
	}
}

function btnNuevo() {
  dataGuardada = {};
  actualizar();
  btnReset();
}

function btnAbrir() {
	/*abrirArchivo(function(json) {
		restaurar(json.lang);
    actualizar();
    btnReset();
	}, console.log);*/
}

function btnAbrirGrammar() {
  //
}

function btnAbrirToken() {
  //
}

function btnAbrirSemantic() {
  //
}

function restaurar(lang) {
  //
}

function actualizar() {
  saveBackup('lang', nuevoEstado());
  mostrarTupla();
}

function mostrarTupla() {
	const data = construir(setTupla);
	if (data) {
    //
	}
}

function setTupla(tupla) {
	document.getElementById("tupla").innerHTML = convertLatexShortcuts(tupla);
}

let dataGuardada = {};
function construir(fallar=(x)=>{}) {
  let g = Grammar.construir(setTupla);
  if (g === undefined) { return; }
  return dataGuardada;
}

function nuevoEstado() {
  return {
    grammar:inputGrammar.value
  };
}

function btnGuardar() {
	descargarArchivo('data:text/plain;charset=utf-8,' +
		encodeURIComponent(JSON.stringify({lang:nuevoEstado()})), 'lang.lang');
}

function btnEjecutar() {
  if (debug.hidden) { // GO
    if (construir(alert)) {
      debug.hidden = false;
      document.getElementById('btnEjecutar').innerHTML = "Editar";
      if (!('prods' in dataGuardada)) {
        btnReset();
      }
    }
  } else { // EDIT
    debug.hidden = true;
    document.getElementById('btnEjecutar').innerHTML = "Ejecutar";
  }
}

function init() {
  runningGrammar = [dataGuardada.grammar.S];
  dataGuardada.arbol = {k:dataGuardada.grammar.S};
  dataGuardada.proxNodoArbol = dataGuardada.arbol;
}

function btnReset() {
  document.getElementById('pasos').innerHTML = '';
  init();
  Grammar.agregarBotonesProducciones(runningGrammar);
  agregarPaso();
}

const tmpData = {};
function btnCancelarGrammar() {
  restaurarInput(tmpData);
  finGrammarGen();
}

function btnGrammarGen() {
  tmpData.prods = dataGuardada.prods.map((x)=>x.i);
  if ('runTokens' in dataGuardada) {
    tmpData.tokens = dataGuardada.runTokens;
  }
  delete dataGuardada.runTokens;
  if (dataGuardada.proxNodoArbol === null) {
    btnReset();
  } else {
    Grammar.agregarBotonesProducciones(runningGrammar);
  }
  document.getElementById('btnGrammarGen').hidden = true;
  document.getElementById('grammarGen').hidden = false;
}

let runningGrammar = [];

function restaurarInput(data) {
  if (dataGuardada.grammar) {
    init();
    dataGuardada.prods = [];
    for (let p of data.prods || []) {
      Grammar.next(p-1);
    }
    if (data.tokens) {
      dataGuardada.runTokens = data.tokens;
      nuevaCadena(data.tokens.join(' '));
    } else {
      nuevaCadena(Grammar.current());
    }
  }
}

function nuevaCadena(cadena) {
  document.getElementById('cadena').innerHTML = cadena;
}

function agregarPaso(p) {
  if (p) {
    dataGuardada.prods.push(p);
    dataGuardada.proxNodoArbol.hijos = p.res.map((x) => dataGuardada.grammar.Vn.includes(x) ? {k:x} : x);
    dataGuardada.proxNodoArbol = dfs(dataGuardada.arbol);
  } else {
    dataGuardada.prods = [];
  }
  saveBackup('runL', {
    prods: dataGuardada.prods.map((x)=>x.i)
  });
  nuevaCadena(Grammar.current());
  if (proximoNoTerminal() === null) {
    setTimeout(escanearTerminales, 10);
  }
}

function finGrammarGen() {
  document.getElementById('btnGrammarGen').hidden = false;
  document.getElementById('grammarGen').hidden = true;
}

function escanearTerminales() {
  let terminales = terminalesDfs(dataGuardada.arbol);
  if (terminales.length == 0) {
    finGrammarGen();
    return
  }
  dataGuardada.regexps = {};
  for (let t of dataGuardada.tokens) {
    dataGuardada.regexps[t.key] = t.regexp;
  }
  let content = '<table>';
  let i=0;
  for (let t of terminales) {
    content += `<tr><td>${t}</td><td><input type="text" id="token_value_${i}" value="${t}"></td></tr>`;
    i++;
  }
  content += `</table><button onclick="updateTokens(${i})">OK</button>`;
  document.getElementById('btnProds').innerHTML = content;
  document.getElementById('token_value_0').select();
}

function updateTokens(n) {
  dataGuardada.runTokens = [];
  for (let i=0; i<n; i++) {
    dataGuardada.runTokens.push(document.getElementById(`token_value_${i}`).value);
  }
  saveBackup('runL', {
    prods: dataGuardada.prods.map((x)=>x.i),
    tokens: dataGuardada.runTokens
  });
  nuevaCadena(dataGuardada.runTokens.join(' '));
  finGrammarGen();
}

function dfs(a) {
  if (!('hijos' in a)) {
    return a;
  }
  for (let h of a.hijos) {
    if (typeof h == 'object') {
      let proximo = dfs(h);
      if (proximo) { return proximo; }
    }
  }
  return null;
}

function terminalesDfs(a) {
  let terminales = [];
  for (let h of a.hijos) {
    if (typeof h == 'object') {
      terminales = terminales.concat(terminalesDfs(h));
    } else {
      terminales.push(h);
    }
  }
  return terminales;
}

function mouseDrag(e) {
  if (dragging && originalClick !== null) {
    debugPane.style.left = `${originalClick.pane.x + e.x - originalClick.mouse.x}px`;
    debugPane.style.top = `${originalClick.pane.y + e.y - originalClick.mouse.y}px`;
  }
}

let tabla;
let inputGrammar;
let tokenList;
let exec;
window.onload = function() {
  tabla = document.getElementById("tablaBuild");
  inputGrammar = document.getElementById("inputGrammar");
  exec = document.getElementById("exec");
  tokenList = document.getElementById("tokenList");
  inicializarDebug();
  redimensionar();
  restoreBackup([
    {k:'grammar', f:Grammar.restaurar},
    {k:'token', f:(x) => Token.show(x, tokenList)},
    {k:'runL', f:restaurarInput}
  ]);
	// restoreBackup([{k:'lang', f:restaurar}]);
  inputGrammar.oninput = actualizar;
  actualizar();
  inputGrammar.focus();
}

function redimensionar() {
	tabla.style.width = `${window.innerWidth - 20}px`;
	tabla.style.height = `${window.innerHeight - 70}px`;
	inputGrammar.style.width = `${window.innerWidth/2 - 20}px`;
	inputGrammar.style.height = `${window.innerHeight/2 - 80}px`;
	exec.style.width = `${window.innerWidth/2 - 30}px`;
	exec.style.height = `${window.innerHeight/2 - 70}px`;
	tokenList.style.width = `${window.innerWidth/2 - 40}px`;
	tokenList.style.height = `${window.innerHeight/2 - 90}px`;
}

window.addEventListener('resize', redimensionar, false);