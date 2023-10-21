const btns = [
  'btnAbrirGrammar','btnEditarGrammar',
  'btnAbrirSemantic','btnEditarSemantic',
  'btnAbrirToken','btnEditarToken'
];

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
      for (let btn of btns) {
        document.getElementById(btn).hidden = true;
      }
      if (!('prods' in dataGuardada)) {
        btnReset();
      }
      if ('arbol' in dataGuardada) {
        dibujarArbol(dataGuardada.arbol);
      }
    }
  } else { // EDIT
    debug.hidden = true;
    document.getElementById('btnEjecutar').innerHTML = "Ejecutar";
    for (let btn of btns) {
      document.getElementById(btn).hidden = false;
    }
  }
}

function init() {
  runningGrammar = [dataGuardada.grammar.S];
  dataGuardada.arbol = {k:dataGuardada.grammar.S};
  dataGuardada.proxNodoArbol = dataGuardada.arbol;
}

function btnReset() {
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
  document.getElementById('btnGrammarGen').hidden = true;
  document.getElementById('grammarGen').hidden = false;
  document.getElementById('arbolShow').hidden = true;
  if (dataGuardada.proxNodoArbol === null) {
    btnReset();
  } else {
    Grammar.agregarBotonesProducciones(runningGrammar);
  }
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
  if ('arbol' in dataGuardada && !debug.hidden && !document.getElementById('arbolShow').hidden) {
    dibujarArbol(dataGuardada.arbol);
  }
}

const WNodo = 50;
const HNodo = 50;
function dibujarArbol(arbol) {
  let c = document.getElementById('arbolsCanvas');
  let ctx = c.getContext('2d');
  let w = cantidadDeHojas(arbol);
  let h = dibujarArbolDesde(ctx, arbol, 1, 1).h;
  c.width = (w+1)*WNodo/2;
	c.height = h*HNodo;
  dibujarArbolDesde(ctx, arbol, 0, 0.5).h;
};

function dibujarArbolDesde(ctx, a, x, y) {
  let text = a;
  let _h = y;
  let _w = (x+1)*WNodo/2;
  if (typeof a != 'string') {
    text = a.k;
    _w = (x+cantidadDeHojas(a))*WNodo/2;
    let xh = x;
    for (let hijo of a.hijos) {
      let rec = dibujarArbolDesde(ctx, hijo, xh, y+1);
      if (rec.h > _h) { _h = rec.h; }
      dibujarLinea(ctx, _w, y*HNodo+5, rec.x, (y+1)*HNodo-10);
      xh = xh + cantidadDeHojas(hijo);
    }
  }
  dibujarNodo(ctx, y*HNodo, _w, text);
  return {h:_h, x:_w};
};

function dibujarNodo(ctx, y, x, t) {
  let w = ctx.measureText(t).width;
  ctx.fillText(t, x-w/2, y);
};

function dibujarLinea(c,x,y,w,h) {
	c.beginPath();
	c.moveTo(x, y);
	c.lineTo(w, h);
	c.stroke();
};

function cantidadDeHojas(a) {
  if (typeof a == 'string') {
    return 1;
  }
  return a.hijos.reduce((rec, x) => rec + cantidadDeHojas(x), 0);
};

let semanticRunning = null;
function btnRun() {
  let expresion = dataGuardada.arbol.hijos;
  for (let r of dataGuardada.rules) {
    if (!('tokened' in r)) {
      r.tokened = Semantic.tokenedRule(r);
    }
  }
  let pasos = document.getElementById('pasos')
  pasos.innerHTML = '';
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  semanticRunning = {
    table:pasos,
    last_row: row,
    last_cell: cell
  };
  row.appendChild(cell);
  pasos.appendChild(row);
  addExpression(expresion);
  while(expresion != null) {
    expresion = semanticRun(expresion);
  }
};

function addExpression(e) {
  semanticRunning.last_cell.innerHTML = e.join(' ');
  const cell = document.createElement('td');
  semanticRunning.last_row.appendChild(cell);
  semanticRunning.last_cell = cell;
};

function reduce(r) {
  semanticRunning.last_cell.innerHTML = r.name;
  const cell = document.createElement('td');
  const row = document.createElement('tr');
  row.appendChild(cell);
  semanticRunning.table.appendChild(row);
  semanticRunning.last_row = row;
  semanticRunning.last_cell = cell;
};

function semanticRun(e) {
  for (let r of dataGuardada.rules) {
    if (Semantic.rulePatternMatching(e, r.tokened)) {
      reduce(r);
      addExpression(r.tokened.out);
    }
  }
  return null;
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
  document.getElementById('arbolShow').hidden = false;
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
  finGrammarGen();
  nuevaCadena(dataGuardada.runTokens.join(' '));
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
    {k:'rules', f:(x) => Semantic.show(x, rulesList)},
    {k:'runL', f:restaurarInput}
  ]);
	// restoreBackup([{k:'lang', f:restaurar}]);
  inputGrammar.oninput = actualizar;
  actualizar();
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
	rulesList.style.width = `${window.innerWidth/2 - 30}px`;
	rulesList.style.height = `${window.innerHeight/2 - 95}px`;
}

window.addEventListener('resize', redimensionar, false);