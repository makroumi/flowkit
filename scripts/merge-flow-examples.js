import fs from "fs";
import path from "path";
import yaml from "yaml";

const repoRoot = process.cwd();
const candidates = [
  path.join(repoRoot, "flow-examples"),
  path.join(repoRoot, "orchestrator/flow-examples")
];
const examplesDir = candidates.find((p) => fs.existsSync(p)) || path.join(repoRoot, "flow-examples");
const rootFlowPath = path.join(repoRoot, "flow.yaml");
const backupPath = path.join(repoRoot, "flow.yaml.bak");

function readYamlFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return yaml.parse(content);
}

function writeYamlFile(filePath, obj) {
  const content = yaml.stringify(obj);
  fs.writeFileSync(filePath, content, "utf8");
}

function collectExampleFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .map((f) => path.join(dir, f));
}

function mergeFlows() {
  let rootMeta = {};
  if (fs.existsSync(rootFlowPath)) {
    try {
      const rootObj = readYamlFile(rootFlowPath);
      if (rootObj && typeof rootObj === "object" && rootObj.meta) {
        rootMeta = { meta: rootObj.meta };
      }
    } catch (err) {
      console.warn("Warning: could not parse existing root flow.yaml meta:", err.message);
    }
  }

  const files = collectExampleFiles(examplesDir);
  const merged = { flows: [] };

  for (const file of files) {
    try {
      const obj = readYamlFile(file);
      if (obj && Array.isArray(obj.flows)) {
        merged.flows.push(...obj.flows);
      } else if (obj && obj.flows) {
        merged.flows.push(obj.flows);
      } else {
        console.warn(`Warning: no 'flows' array found in ${file}`);
      }
    } catch (err) {
      console.error(`Failed to parse ${file}:`, err.message);
      process.exitCode = 1;
    }
  }

  const finalObj = { ...(rootMeta || {}), ...merged };

  if (fs.existsSync(rootFlowPath)) {
    fs.copyFileSync(rootFlowPath, backupPath);
    console.log(`Backed up existing flow.yaml to ${path.basename(backupPath)}`);
  }

  writeYamlFile(rootFlowPath, finalObj);
  console.log(`Merged ${files.length} example file(s) into ${path.basename(rootFlowPath)}`);
}

mergeFlows();
