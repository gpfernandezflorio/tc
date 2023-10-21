Semantic = {};

Semantic.nuevaRegla = function(data) {
  return 'TODO';
}

Semantic.restaurar = function(reglas) {
  // tokenList.innerHTML = '';
  rulesList.innerHTML = '';
  if ('rules' in reglas) {
    for (let t of reglas.rules) {
      // addTokenDom(t)
      addRuleDom(t);
    }
  }
};

Semantic.show = function(data, dom) {
  let i = 0;
  let content = '<table>'
  for (let t of data.rules) {
    content += `<tr><td></td><td style="text-align:center;">${
      convertLatexShortcuts(t.pre)
    }</td></tr><tr><td>${i} - ${
      convertLatexShortcuts(t.name)
    }:</td><td class="hliner"></td></tr><tr><td></td><td style="text-align:center;">${
      convertLatexShortcuts(t.in)
    } --> ${
      convertLatexShortcuts(t.out)
    }</td></tr><tr style="height:20px;"></tr>`;
    i++;
  }
  dom.innerHTML = content+'</table>';
  dataGuardada.rules = data.rules;
};

Semantic.brackets = {
  p:{o:'(', c:')'},
  c:{o:'[', c:']'},
  l:{o:'{', c:'}'}
};

Semantic.tokenedRule = function(r) {
  return {
    in:Semantic.parse(r.in),
    out:Semantic.parse(r.out),
    pre:r.pre
  };
}
Semantic.parse = function(r) {
  let elementos = [];
  let i = 0;
  let stack = [];
  let elementoActual = '';
  while (i<r.length) {
    if (r[i] == ' ' && stack.length == 0) {
      elementos.push(elementoActual);
      elementoActual = '';
    } else {
      for (let k in Semantic.brackets) {
        if (Semantic.brackets[k].o == r[i]) {
          stack.push(k);
        } else if (Semantic.brackets[k].c == r[i] && stack[stack.length-1] == k) {
          stack = stack.slice(0, stack.length-1);
        }
      }
      elementoActual += r[i];
    }
    i++;
  }
  if (elementoActual.length > 0) {
    elementos.push(elementoActual);
  }
  return elementos;
};

Semantic.rulePatternMatching = function(e, r) {
  if (e.length == r.in.length) {
    for (let i=0; i<e.length; i++) {
      if (!Semantic.termPatternMatching(e[i], r.in[i])) {
        return false;
      }
    }
    return true; // r.pre == '' || Semantic.cumplePre...
  }
  return false;
};

Semantic.esGenerico = function(t) {
  return ['M','N','O','P','Q'].includes(t);
}

Semantic.termPatternMatching = function(te, tr) {
  if (Semantic.esGenerico(tr)) { return true; }
  if (typeof te == 'string') { return te == tr; }
  console.log(te);
  console.log(tr);
  return false;
}