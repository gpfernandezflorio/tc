Grammar = {};

const Prod = function(i, nt, m) {
  this.i = i;
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

const GR = 0;
const GLC = 1;

Grammar.restaurar = function(grammar) {
  inputGrammar.value = grammar.text;
  // grammar.user
  Grammar.construir();
};

Grammar.construir = function(fallar=(x)=>{}) {
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
        data.P.push(new Prod(j, N, m));
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
};

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

Grammar.agregarBotonesProducciones = function() {
  let content = '';
  let N = proximoNoTerminal();
  if (N !== null) {
    let btns = {};
    for (let nt of dataGuardada.grammar.Vn) {
      btns[nt] = [];
    }
    let i=0;
    for (let p of dataGuardada.grammar.P) {
      btns[p.nt].push({i, txt:p.res.length == 0 ? 'λ' : p.res.join(" ")});
      i++;
    }
    content = '<table>';
    for (let nt in btns) {
      let info = nt==N ? '' : 'disabled'
      content += `<tr><td>${nt}:</td>`;
      for (let b of btns[nt]) {
        content += `<td><button onclick="Grammar.next(${b.i})" ${info}>${b.txt}</button></td>`;
      }
      content += '</tr>';
    }
    content += '</table>';
  }
  document.getElementById('btnProds').innerHTML = content;
}

function proximoNoTerminal() {
  if (runningGrammar.every((x) => !dataGuardada.grammar.Vn.includes(x))) {
    return null;
  }
  return runningGrammar.filter((x) => dataGuardada.grammar.Vn.includes(x))[0];
}

Grammar.next = function(p) {
  p = dataGuardada.grammar.P[p];

  let i = 0;
  while (i < runningGrammar.length && !dataGuardada.grammar.Vn.includes(runningGrammar[i])) {
    i++;
  }
  if (i < runningGrammar.length && runningGrammar[i] == p.nt) {
    runningGrammar = runningGrammar.slice(0,i).concat(p.res).concat(runningGrammar.slice(i+1));
  }
  agregarPaso(p);
  Grammar.agregarBotonesProducciones();
};

Grammar.current = function() {
  let i = 0;
  let content = [];
  while (i < runningGrammar.length && !dataGuardada.grammar.Vn.includes(runningGrammar[i])) {
    content.push(`<span>${runningGrammar[i]}</span>`);
    i++;
  }
  if (i < runningGrammar.length) {
    content.push(`<span class="current">${runningGrammar[i]}</span>`);
    i++;
    while (i < runningGrammar.length) {
      content.push(`<span>${runningGrammar[i]}</span>`);
      i++;
    }
  }
  return content.join(' ');
}