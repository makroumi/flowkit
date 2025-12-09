const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const files = (function walk(dir){
  let out = [];
  for(const name of fs.readdirSync(dir)){
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if(st.isDirectory()){
      out = out.concat(walk(p));
    } else if(p.endsWith('.ts')){
      out.push(p);
    }
  }
  return out;
})(path.join(repoRoot, 'src'));

const replacements = [
  // exact broken patterns -> replacement import lines
  { pattern: /import\s+\{\s*executeOrchestration\s*\}\s*;/g, replace: 'import { executeOrchestration } from "./orchestrator";' },
  { pattern: /import\s+\{\s*createLLMAdapter\s*\}\s*;/g, replace: 'import { createLLMAdapter } from "../adapters/adapterFactory";' },
  { pattern: /import\s+\{\s*validateStepOutput\s*,\s*StepValidation\s*\}\s*;/g, replace: 'import { validateStepOutput, StepValidation } from "./validation";' },
  { pattern: /import\s+\{\s*validateStepOutput\s*\}\s*;/g, replace: 'import { validateStepOutput } from "./validation";' },
  { pattern: /import\s+\{\s*setUpToolHandlers\s*\}\s*;/g, replace: 'import { setUpToolHandlers } from "../core/mcpHandlers";' }
];

let patched = 0;
for(const f of files){
  let s = fs.readFileSync(f, 'utf8');
  let orig = s;
  for(const r of replacements){
    s = s.replace(r.pattern, r.replace);
  }
  if(s !== orig){
    fs.writeFileSync(f, s, 'utf8');
    console.log('patched', f);
    patched++;
  }
}
if(patched === 0) console.log('No files needed patching.');
else console.log('Patched', patched, 'file(s).');
