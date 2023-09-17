function restoreBackup(todo) {
  if(!localStorage || !JSON) {
    return;
  }

  for (let t of todo) {
    try {
      var data = JSON.parse(localStorage[t.k]);
      t.f(data);
    } catch(e) {
      localStorage[t.k] = '';
    }
  }
}

function saveBackup(k, val) {
	if(!localStorage || !JSON) {
		return;
	}

	localStorage[k] = JSON.stringify(val);
}

function abrirArchivo(fOk, fFail) {
	let input = document.createElement('input');
	input.type = 'file';
	
	input.onchange = e => { 
		 // getting a hold of the file reference
		 let file = e.target.files[0]; 
	
		 // setting up the reader
		 let reader = new FileReader();
		 reader.readAsText(file,'UTF-8');
	
		 // here we tell the reader what to do when it's done reading...
		 reader.onload = readerEvent => {
				var content = readerEvent.target.result; // this is the content!
				try {
					const json = JSON.parse(content);
          fOk(json);
				} catch(e) {
					fFail(e);
				}
		 }
	}
	input.click();
}

function descargarArchivo(contenido, nombre) {
	let e = document.createElement('a');
  e.setAttribute('href', contenido);
  e.setAttribute('download', nombre);
  e.style.display = 'none';
  document.body.appendChild(e);
  e.click();
  document.body.removeChild(e);
}

var greekLetterNames = [ 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega' ];

function convertLatexShortcuts(text) {
	// html greek characters
	for(var i = 0; i < greekLetterNames.length; i++) {
		var name = greekLetterNames[i];
		text = text.replace(new RegExp('\\\\' + name, 'g'), String.fromCharCode(913 + i + (i > 16)));
		text = text.replace(new RegExp('\\\\' + name.toLowerCase(), 'g'), String.fromCharCode(945 + i + (i > 16)));
	}

	// subscripts
	for(var i = 0; i < 10; i++) {
		text = text.replace(new RegExp('_' + i, 'g'), String.fromCharCode(8320 + i));
	}

	return text;
};

let debugPane;
let originalClick = null;
let dragging = false;

function inicializarDebug() {
  debugPane = document.getElementById('debug');

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
};