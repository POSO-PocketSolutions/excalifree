"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Project } from "../server/projects";

import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(async () => (await import("@excalidraw/excalidraw")).Excalidraw, {
  ssr: false
});

type SaveState = "guardado" | "guardando" | "cambios" | "exportando";

type SceneElement = Record<string, any>;

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

function isFrame(element: SceneElement) {
  return (element.type === "frame" || element.type === "magicframe") && !element.isDeleted;
}

function getFrames(elements: readonly SceneElement[]) {
  return elements.filter(isFrame).sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;"
  }[char] || char));
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

  async function openPresentation() {
    const currentProject = project.current;
    const elements = currentProject.elements as readonly SceneElement[];
    const frames = getFrames(elements);

    if (frames.length === 0) {
      window.alert("No hay frames para exportar.");
      return;
    }

    setSaveState("exportando");
    const { exportToSvg } = await import("@excalidraw/excalidraw");
    const slides = [];

    for (const frame of frames) {
      const svg = await exportToSvg({
        elements: elements.filter((element) => !element.isDeleted) as any,
        appState: {
          ...currentProject.appState,
          exportBackground: true,
          viewBackgroundColor: currentProject.appState.viewBackgroundColor || "#ffffff",
          frameRendering: {
            enabled: true,
            clip: true,
            name: false,
            outline: false
          }
        },
        files: currentProject.files as any,
        exportPadding: 0,
        exportingFrame: frame as any,
        renderEmbeddables: true
      });

      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      slides.push(new XMLSerializer().serializeToString(svg));
    }

    const title = escapeHtml(currentProject.title || "Presentacion");
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      window.alert("El navegador bloqueo la ventana de presentacion.");
      setSaveState("guardado");
      return;
    }

    printWindow.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    html, body { margin: 0; background: #111; color: #fff; font-family: system-ui, sans-serif; }
    .toolbar { position: fixed; z-index: 10; top: 12px; right: 12px; display: flex; gap: 8px; }
    .toolbar button { border: 0; border-radius: 999px; padding: 10px 14px; background: #fff; color: #111; cursor: pointer; }
    .slide { align-items: center; background: #fff; display: flex; height: 100vh; justify-content: center; page-break-after: always; width: 100vw; }
    .slide svg { display: block; max-height: 100vh; max-width: 100vw; }
    @media print {
      html, body { background: #fff; }
      .toolbar { display: none; }
      .slide { break-after: page; height: 100vh; page-break-after: always; width: 100vw; }
      .slide:last-child { break-after: auto; page-break-after: auto; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Guardar PDF</button>
  </div>
  ${slides.map((slide) => `<section class="slide">${slide}</section>`).join("\n")}
</body>
</html>`);
    printWindow.document.close();
    setSaveState("guardado");
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
        <div className="row">
          <button className="button secondary" onClick={openPresentation} type="button">Presentar / PDF</button>
          <button className="button secondary" onClick={downloadProject} type="button">Exportar</button>
        </div>
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
