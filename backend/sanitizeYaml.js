function sanitizeYaml(raw){
  // Normaliza saltos y tabs
  let text = raw.replace(/\r\n?/g, '\n').replace(/\t/g, '  ');
  const lines = text.split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length){
    let ln = lines[i];
    ln = ln.replace(/[ \t]+$/,'');                         // quita espacios al final
    ln = ln.replace(/^(\s*[^:\n]+:)(\S)/, (_, a, b) => a+' '+b); // espacio tras ':'
    ln = ln.replace(/^(\s*)-\s+/, '$1- ');                 // "-   x" -> "- x"
    out.push(ln);

    // Reindent hijos de items de lista
    const m = ln.match(/^(\s*)-\s+\S/);
    if (m){
      const base = m[1].length;
      const childIndent = base + 2;
      let j = i + 1;
      while (j < lines.length){
        let nxt = lines[j];
        if (!nxt.trim()){ out.push(nxt.replace(/[ \t]+$/,'')); j++; continue; }
        const isItem = nxt.match(/^(\s*)-\s+\S/);
        const curInd = (nxt.match(/^(\s*)/) || ['',''])[1].length;
        if ((isItem && curInd <= base) || (!isItem && curInd <= base)) break;

        if (/^\s*[^:\n]+:/.test(nxt)){                    // clave bajo el item
          const trimmed = nxt.trimStart();
          nxt = ' '.repeat(childIndent) + trimmed;
          nxt = nxt.replace(/^(\s*[^:\n]+:)(\S)/, (_, a, b) => a+' '+b);
        }
        out.push(nxt.replace(/[ \t]+$/,''));
        j++;
      }
      i = j;
      continue;
    }
    i++;
  }
  return out.join('\n');
}

module.exports = sanitizeYaml;
