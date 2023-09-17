function btnNuevo() {
  tokenList.innerHTML = '';
  actualizar();
}

function btnAbrir() {
	abrirArchivo(function(json) {
		Token.restaurar(json);
    actualizar();
	}, console.log);
}

function btnGuardar() {
	descargarArchivo('data:text/plain;charset=utf-8,' +
		encodeURIComponent(JSON.stringify(nuevoEstado())), 'token.token');
}

function btnImportar() {
  // tomar tokens de una gramática o una máquina de estados
}

function btnEjecutar() {
  if (exec.hidden) { // GO
    if (construir(alert)) {
      Token.show(dataGuardada, execList);
      tokenArea.hidden = true;
      exec.hidden = false;
      document.getElementById('btnEjecutar').innerHTML = "Editar";
    }
  } else { // EDIT
    exec.hidden = true;
    tokenArea.hidden = false;
    document.getElementById('btnEjecutar').innerHTML = "Ejecutar";
  }
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
	}
};

function addToken() {
  addTokenDom();
  actualizar();
}

function addTokenDom(data={}) {
  let t = document.createElement('div');
  let i = tokenList.children.length;
  t.innerHTML = `${i} - Token: <input type="text" id="token_${i}" oninput="actualizar();">` +
    `RegExp: <input type="text" id="regexp_${i}" oninput="actualizar();">` +
    `<button onclick="delToken(${i});"">-</button>`;
  tokenList.appendChild(t);
  document.getElementById(`token_${i}`).value = data.key || '';
  document.getElementById(`regexp_${i}`).value = data.regexp || '';
}

function delToken(i) {
  let j = i;
  while (j < tokenList.children.length -1) {
    document.getElementById(`token_${j}`).value = document.getElementById(`token_${j+1}`).value;
    document.getElementById(`regexp_${j}`).value = document.getElementById(`regexp_${j+1}`).value;
    j++;
  }
  tokenList.removeChild(tokenList.children[j]);
  actualizar();
}

function tokenSaveBackup() {
  saveBackup('runT', {
    cadena: document.getElementById('inputCadena').value
  });
}

let dataGuardada = {};
function actualizar() {
  saveBackup('token', nuevoEstado());
  mostrarTupla();
}

function nuevoEstado() {
  let tokens = [];
  let i=0;
  while (i < tokenList.children.length) {
    tokens.push({
      key:document.getElementById(`token_${i}`).value,
      regexp:document.getElementById(`regexp_${i}`).value
    });
    i++;
  }
  dataGuardada = {
    tokens
  };
  return dataGuardada;
};

function construir(fallar=(x)=>{}) {
  let tokens = dataGuardada.tokens || [];
  let regexps = [];
  for (let i=0; i<tokens.length; i++) {
    if (tokens[i].key === '') {
      fallar(`Falta el identificador del token ${i}`);
      return;
    }
    if (tokens[i].regexp === '') {
      fallar(`Falta la expresión regular del token ${i}`);
      return;
    }
    let regexp = compileRegexp(convertLatexShortcuts(tokens[i].regexp));
    if (regexp === null) {
      fallar(`La expresión regular del token ${i} es inválida: ${tokens[i].regexp}`);
      return;
    }
    if (regexps.some((x) => x.key === tokens[i].key)) {
      fallar(`El token ${i} (${tokens[i].key}) está repetido`);
      return;
    }
    regexps.push({
      key:tokens[i].key,
      regexp:regexp
    });
  }
  return regexps;
}

function compileRegexp(s) {
  try {
    return new RegExp(s);
  } catch (error) {
  }
  return null;
}

function tokenizar() {
  let tokenizador = construir(alert);
  if (tokenizador) {
    let cadena = convertLatexShortcuts(document.getElementById('inputCadena').value);
    let contador = {
      i:0, linea:0, columna:0
    };
    let res = [];
    ignorarEspacios(cadena, contador);
    while (contador.i < cadena.length) {
      let r = tokenizarDesde(tokenizador, cadena.substr(contador.i));
      if (r === null) {
        alert("Cadena inválida");
        return;
      }
      r.contador = {i:contador.linea, j:contador.columna};
      res.push(r);
      contador.i += r.source.length;
      contador.columna += r.source.length;
      ignorarEspacios(cadena, contador);
    }
    alert(res.map((x) => convertLatexShortcuts(x.token)).join(' '));
    return res;
  }
}

function ignorarEspacios(cadena, contador) {
  while (true) {
    if (cadena[contador.i] === ' ') {
      contador.i ++;
      contador.columna ++;
    } else if (cadena[contador.i] === '\n') {
      contador.i ++;
      contador.fila ++;
      contador.columna = 0;
    } else {
      return;
    }
  }
}

function tokenizarDesde(tokenizador, cadena) {
  for (let t of tokenizador) {
    let z = t.regexp.exec(cadena);
    if (z && z.index == 0) {
      return {
        token:t.key,
        source:z[0]
      };
    }
  }
  return null;
}

function mostrarTupla() {
  const tokens = construir(setTupla);
  if (tokens) {
    setTupla('');
  }
}

function setTupla(tupla) {
	document.getElementById("tupla").innerHTML = convertLatexShortcuts(tupla);
}

function mouseDrag(e) {
  if (dragging && originalClick !== null) {
    debugPane.style.right = `${window.innerWidth - (originalClick.pane.right + e.x - originalClick.mouse.x)}px`;
    debugPane.style.top = `${originalClick.pane.y + e.y - originalClick.mouse.y}px`;
  }
}

let tabla;
let tokenArea;
let tokenList;
let exec;
let execList;
window.onload = function() {
  tabla = document.getElementById("tablaBuild");
  tokenArea = document.getElementById("tokenArea");
  tokenList = document.getElementById("tokenList");
  exec = document.getElementById("exec");
  execList = document.getElementById("tokenListExec");
  inicializarDebug();
  redimensionar();
	restoreBackup([{k:'token', f:Token.restaurar}]);
	restoreBackup([{k:'runT', f:function(run) {
    document.getElementById('inputCadena').value = run.cadena || '';
  }}]);
  actualizar();
}

function redimensionar() {
	tabla.style.width = `${window.innerWidth - 20}px`;
	tabla.style.height = `${window.innerHeight - 70}px`;
	tokenArea.style.width = `${window.innerWidth - 40}px`;
	tokenArea.style.height = `${window.innerHeight - 90}px`;
	exec.style.width = `${window.innerWidth - 50}px`;
	exec.style.height = `${window.innerHeight - 95}px`;
}

window.addEventListener('resize', redimensionar, false);