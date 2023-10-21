function btnNuevo() {
  rulesList.innerHTML = '';
  actualizar();
}

function btnAbrir() {
	abrirArchivo(function(json) {
		Semantic.restaurar(json);
    actualizar();
	}, console.log);
}

function btnGuardar() {
	descargarArchivo('data:text/plain;charset=utf-8,' +
		encodeURIComponent(JSON.stringify(nuevoEstado())), 'rules.rules');
}

/*function btnEjecutar() {
  if (exec.hidden) { // GO
    if (construir(alert)) {
      Semantic.show(dataGuardada, execList);
      rulesArea.hidden = true;
      exec.hidden = false;
      document.getElementById('btnEjecutar').innerHTML = "Editar";
    }
  } else { // EDIT
    exec.hidden = true;
    rulesArea.hidden = false;
    document.getElementById('btnEjecutar').innerHTML = "Ejecutar";
  }
}*/

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

function addRule() {
  addRuleDom();
  actualizar();
}

function addRuleDom(data={}) {
  let t = document.createElement('div');
  let i = rulesList.children.length;
  t.innerHTML = '<table><tr><td></td><td style="text-align:center;">' +
    `<input type="text" id="rule_pre_${i}" oninput="actualizar();"></td></tr>` +
    `<tr><td>${i} - <input type="text" id="rule_name_${i}" oninput="actualizar();">:` +
    '</td><td><span class="hline"></span></td>' +
    `<td><button onclick="delRule(${i});"">-</button></td></tr><tr><td></td><td>` +
    `<input type="text" id="rule_in_${i}" oninput="actualizar();">` +
    `--> <input type="text" id="rule_out_${i}" oninput="actualizar();">` +
    '</td></tr><tr style="height:20px;"></tr></table>';
    rulesList.appendChild(t);
  document.getElementById(`rule_in_${i}`).value = data.in || '';
  document.getElementById(`rule_out_${i}`).value = data.out || '';
  document.getElementById(`rule_pre_${i}`).value = data.pre || '';
  document.getElementById(`rule_name_${i}`).value = data.name || '';
}

function delRule(i) {
  let j = i;
  while (j < rulesList.children.length -1) {
    for (let k of ['in', 'out', 'pre', 'name']) {
      document.getElementById(`rule_${k}_${j}`).value = document.getElementById(`rule_${k}_${j+1}`).value;
    }
    j++;
  }
  rulesList.removeChild(rulesList.children[j]);
  actualizar();
}

/*function rulesSaveBackup() {
  saveBackup('runS', {
    cadena: document.getElementById('inputCadena').value
  });
}*/

let dataGuardada = {};
function actualizar() {
  saveBackup('rules', nuevoEstado());
  mostrarTupla();
}

function nuevoEstado() {
  let rules = [];
  let i=0;
  while (i < rulesList.children.length) {
    rules.push({
      in:document.getElementById(`rule_in_${i}`).value,
      out:document.getElementById(`rule_out_${i}`).value,
      pre:document.getElementById(`rule_pre_${i}`).value,
      name:document.getElementById(`rule_name_${i}`).value
    });
    i++;
  }
  dataGuardada = {
    rules
  };
  return dataGuardada;
};

function construir(fallar=(x)=>{}) {
  let rules = dataGuardada.rules || [];
  let reglas = [];
  for (let i=0; i<rules.length; i++) {
    if (rules[i].name === '') {
      fallar(`Falta el nombre de la regla ${i}`);
      return;
    }
    if (rules[i].in === '') {
      fallar(`Falta la expresión de salida de la regla ${rules[i].name}`);
      return;
    }
    if (rules[i].out === '') {
      fallar(`Falta la expresión de llegada de la regla ${rules[i].name}`);
      return;
    }
    if (reglas.some((x) => x.name === rules[i].name)) {
      fallar(`El nombre de la regla ${i} (${rules[i].name}) está repetido`);
      return;
    }
    let regla = Semantic.nuevaRegla(rules[i]);
    reglas.push({
      name:rules[i].name,
      regla: regla
    });
  }
  return reglas;
}

function mostrarTupla() {
  const reglas = construir(setTupla);
  if (reglas) {
    setTupla('');
  }
}

function setTupla(tupla) {
	document.getElementById("tupla").innerHTML = convertLatexShortcuts(tupla);
}

/*function mouseDrag(e) {
  if (dragging && originalClick !== null) {
    debugPane.style.right = `${window.innerWidth - (originalClick.pane.right + e.x - originalClick.mouse.x)}px`;
    debugPane.style.top = `${originalClick.pane.y + e.y - originalClick.mouse.y}px`;
  }
}*/

let tabla;
let rulesArea;
let rulesList;
let exec;
let execList;
window.onload = function() {
  tabla = document.getElementById("tablaBuild");
  rulesArea = document.getElementById("rulesArea");
  rulesList = document.getElementById("rulesList");
  /*exec = document.getElementById("exec");
  execList = document.getElementById("tokenListExec");*/
  // inicializarDebug();
  redimensionar();
	restoreBackup([{k:'rules', f:Semantic.restaurar}]);
	/*restoreBackup([{k:'runS', f:function(run) {
    document.getElementById('inputCadena').value = run.cadena || '';
  }}]);*/
  actualizar();
}

function redimensionar() {
	tabla.style.width = `${window.innerWidth - 20}px`;
	tabla.style.height = `${window.innerHeight - 70}px`;
	rulesArea.style.width = `${window.innerWidth - 40}px`;
	rulesArea.style.height = `${window.innerHeight - 90}px`;
	/*exec.style.width = `${window.innerWidth - 50}px`;
	exec.style.height = `${window.innerHeight - 95}px`;*/
}

window.addEventListener('resize', redimensionar, false);