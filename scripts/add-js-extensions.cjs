const fs = require('fs');
const path = require('path');

function walk(dir){
  for(const name of fs.readdirSync(dir)){
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if(st.isDirectory()) walk(p);
    else if(p.endsWith('.ts')){
      let s = fs.readFileSync(p,'utf8');
      const orig = s;
      // Add .js to relative import paths that do not already end with .js or .json
      s = s.replace(/(from\s+['"])(\.\.?(?:\/[^'"]*?))(?<!\.js|\.json)(['"])/g, (m, pre, rel, post) => {
        return pre + rel + '.js' + post;
      });
      if(s !== orig){
        fs.writeFileSync(p, s, 'utf8');
        console.log('patched', p);
      }
    }
  }
}
walk('src');
