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
  const [project, setProject] = useState(initialProject);
  const [saveState, setSaveState] = useState<SaveState>("guardado");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save(nextProject: Project) {
    setSaveState("guardando");
    await fetch(`/api/projects/${nextProject.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextProject)
    });
    setSaveState("guardado");
  }

  function scheduleSave(nextProject: Project) {
    setProject(nextProject);
    setSaveState("cambios");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(nextProject), 800);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function downloadProject() {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.title || "proyecto"}.excalidraw`;
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
            onChange={(event) => scheduleSave({ ...project, title: event.target.value })}
            value={project.title}
          />
          <span className="muted">{saveState}</span>
        </div>
        <button className="button secondary" onClick={downloadProject} type="button">Exportar</button>
      </header>

      <section className="editor-canvas">
        <Excalidraw
          initialData={{
            elements: project.elements,
            files: project.files
          }}
          onChange={(elements, appState, files) => {
            scheduleSave({
              ...project,
              elements,
              appState: cleanAppState(appState),
              files
            });
          }}
        />
      </section>
    </main>
  );
}
