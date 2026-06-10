"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Project } from "../server/projects";

import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(async () => (await import("@excalidraw/excalidraw")).Excalidraw, {
  ssr: false
});

type SaveState = "guardado" | "guardando" | "cambios";

function cleanAppState(appState: Record<string, any>) {
  const {
    collaborators,
    currentItemFontFamily,
    currentItemFontSize,
    currentItemRoundness,
    editingElement,
    editingLinearElement,
    editingTextElement,
    errorMessage,
    openDialog,
    openPopup,
    pendingImageElementId,
    selectedElementIds,
    selectedGroupIds,
    selectedLinearElement,
    selectionElement,
    suggestedBindings,
    toast,
    ...safeAppState
  } = appState;

  return safeAppState;
}

export function ProjectEditor({ initialProject }: { initialProject: Project }) {
  const [title, setTitle] = useState(initialProject.title);
  const [saveState, setSaveState] = useState<SaveState>("guardado");
  const initialData = useRef({ elements: initialProject.elements, files: initialProject.files });
  const project = useRef(initialProject);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveVersion = useRef(0);

  async function save(nextProject: Project, version: number) {
    setSaveState("guardando");
    await fetch(`/api/projects/${nextProject.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextProject)
    });
    if (saveVersion.current === version) setSaveState("guardado");
  }

  function scheduleSave(nextProject: Project, showPending = true) {
    project.current = nextProject;
    saveVersion.current += 1;
    const version = saveVersion.current;
    if (showPending) setSaveState("cambios");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(nextProject, version), 800);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function downloadProject() {
    const currentProject = project.current;
    const blob = new Blob([JSON.stringify(currentProject, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentProject.title || "proyecto"}.excalidraw`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="editor-page">
      <header className="editor-toolbar">
        <div className="row">
          <Link className="button secondary" href="/">Volver</Link>
          <input
            className="editor-title"
            onChange={(event) => {
              const nextTitle = event.target.value;
              setTitle(nextTitle);
              scheduleSave({ ...project.current, title: nextTitle });
            }}
            value={title}
          />
          <span className="muted">{saveState}</span>
        </div>
        <button className="button secondary" onClick={downloadProject} type="button">Exportar</button>
      </header>

      <section className="editor-canvas">
        <Excalidraw
          initialData={initialData.current}
          onChange={(elements, appState, files) => {
            scheduleSave({
              ...project.current,
              elements,
              appState: cleanAppState(appState),
              files
            }, false);
          }}
        />
      </section>
    </main>
  );
}
