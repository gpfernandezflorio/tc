Token = {};

Token.restaurar = function(tokenizador) {
  tokenList.innerHTML = '';
  if ('tokens' in tokenizador) {
    for (let t of tokenizador.tokens) {
      addTokenDom(t);
    }
  }
};

Token.show = function(data, dom) {
  let i = 0;
  let content = '<table><th><td>Token</td><td>RegExp</td></th>'
  for (let t of data.tokens) {
    content += `<tr><td>${i}</td><td>${
      convertLatexShortcuts(t.key)
    }</td><td>${
      convertLatexShortcuts(t.regexp)
    }</td></tr>`;
    i++;
  }
  dom.innerHTML = content+'</table>';
  dataGuardada.tokens = data.tokens;
};