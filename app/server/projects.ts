import { randomUUID } from "crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

export type Project = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  elements: readonly any[];
  appState: Record<string, any>;
  files: Record<string, any>;
};

const dataDir = process.env.DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "data");

function projectPath(id: string) {
  if (!/^[a-zA-Z0-9-]+$/.test(id)) throw new Error("Invalid project id");
  return path.join(dataDir, `${id}.json`);
}

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

export async function listProjects() {
  await ensureDataDir();
  const files = await readdir(dataDir);
  const projects = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => JSON.parse(await readFile(path.join(dataDir, file), "utf8")) as Project)
  );
  return projects.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function getProject(id: string) {
  try {
    return JSON.parse(await readFile(projectPath(id), "utf8")) as Project;
  } catch {
    return null;
  }
}

export async function createProject(title: string) {
  await ensureDataDir();
  const now = new Date().toISOString();
  const project: Project = {
    id: randomUUID(),
    title,
    createdAt: now,
    updatedAt: now,
    elements: [],
    appState: {},
    files: {}
  };
  await writeProject(project);
  return project;
}

export async function writeProject(project: Project) {
  await ensureDataDir();
  const nextProject = { ...project, updatedAt: new Date().toISOString() };
  await writeFile(projectPath(project.id), JSON.stringify(nextProject, null, 2));
  return nextProject;
}

export async function deleteProject(id: string) {
  await rm(projectPath(id), { force: true });
}
