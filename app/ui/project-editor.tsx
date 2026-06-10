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

function isElementInsideFrame(element: SceneElement, frame: SceneElement) {
  if (element.id === frame.id || element.frameId === frame.id) return true;
  if (element.isDeleted || isFrame(element)) return false;

  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  return centerX >= frame.x && centerX <= frame.x + frame.width && centerY >= frame.y && centerY <= frame.y + frame.height;
}

function getFrames(elements: readonly SceneElement[]) {
  return elements.filter(isFrame).sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
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

  async function exportFramesToPdf() {
    const currentProject = project.current;
    const elements = currentProject.elements as readonly SceneElement[];
    const frames = getFrames(elements);

    if (frames.length === 0) {
      window.alert("No hay frames para exportar.");
      return;
    }

    setSaveState("exportando");
    const { exportToCanvas } = await import("@excalidraw/excalidraw");
    const { jsPDF } = await import("jspdf");
    let pdf: InstanceType<typeof jsPDF> | null = null;

    for (const [index, frame] of frames.entries()) {
      const frameElements = elements.filter((element) => isElementInsideFrame(element, frame));
      const canvas = await exportToCanvas({
        elements: frameElements as any,
        appState: {
          exportBackground: true,
          viewBackgroundColor: currentProject.appState.viewBackgroundColor || "#ffffff"
        },
        files: currentProject.files as any,
        exportPadding: 0,
        exportingFrame: frame as any,
        getDimensions: () => ({ width: frame.width, height: frame.height, scale: 2 })
      });

      const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
      if (!pdf) {
        pdf = new jsPDF({ orientation, unit: "px", format: [canvas.width, canvas.height] });
      } else {
        pdf.addPage([canvas.width, canvas.height], orientation);
      }

      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
      if (index === frames.length - 1) pdf.save(`${currentProject.title || "presentacion"}.pdf`);
    }

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
          <button className="button secondary" onClick={exportFramesToPdf} type="button">PDF frames</button>
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
