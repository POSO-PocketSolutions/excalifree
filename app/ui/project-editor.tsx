"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Project } from "../server/projects";
import { useLanguage } from "./i18n";

import "@excalidraw/excalidraw/index.css";

const ExcalidrawCanvas = dynamic(async () => (await import("./excalidraw-canvas")).ExcalidrawCanvas, {
  ssr: false
});

type SaveState = "saved" | "saving" | "changes" | "exporting";

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
  const { language, t } = useLanguage();
  const [title, setTitle] = useState(initialProject.title);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const initialData = useRef({ elements: initialProject.elements, files: initialProject.files });
  const project = useRef(initialProject);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveVersion = useRef(0);

  async function save(nextProject: Project, version: number) {
    setSaveState("saving");
    await fetch(`/api/projects/${nextProject.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextProject)
    });
    if (saveVersion.current === version) setSaveState("saved");
  }

  function scheduleSave(nextProject: Project, showPending = true) {
    project.current = nextProject;
    saveVersion.current += 1;
    const version = saveVersion.current;
    if (showPending) setSaveState("changes");
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

  async function exportFrameSlides() {
    const currentProject = project.current;
    const elements = currentProject.elements as readonly SceneElement[];
    const frames = getFrames(elements);

    if (frames.length === 0) {
      window.alert(t.noFrames);
      return null;
    }

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

    return {
      title: escapeHtml(currentProject.title || (language === "es" ? "Presentacion" : "Presentation")),
      slides
    };
  }

  async function openPresentation() {
    const presentationWindow = window.open("", "_blank");
    if (!presentationWindow) {
      window.alert(t.popupPresentationBlocked);
      return;
    }

    presentationWindow.document.write(`<!doctype html><title>${escapeHtml(t.preparingPresentation)}</title><body style="background:#111;color:#fff;font-family:system-ui;margin:0;padding:24px">${escapeHtml(t.preparingPresentation)}</body>`);
    presentationWindow.document.close();

    setSaveState("exporting");
    const presentation = await exportFrameSlides();
    if (!presentation) {
      presentationWindow.close();
      setSaveState("saved");
      return;
    }

    presentationWindow.document.write(`<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${presentation.title}</title>
  <style>
    html, body { background: #000; height: 100%; margin: 0; overflow: hidden; width: 100%; }
    .slide { align-items: center; background: #fff; display: none; height: 100vh; justify-content: center; width: 100vw; }
    .slide.active { display: flex; }
    .slide svg { display: block; max-height: 100vh; max-width: 100vw; }
  </style>
</head>
<body>
  ${presentation.slides.map((slide, index) => `<section class="slide${index === 0 ? " active" : ""}">${slide}</section>`).join("\n")}
  <script>
    const slides = Array.from(document.querySelectorAll('.slide'));
    let index = 0;
    function show(next) {
      slides[index].classList.remove('active');
      index = Math.max(0, Math.min(slides.length - 1, next));
      slides[index].classList.add('active');
    }
    function exitPresentation() {
      if (document.fullscreenElement) {
        document.exitFullscreen().finally(() => window.close());
      } else {
        window.close();
      }
    }
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') exitPresentation();
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(event.key)) { event.preventDefault(); show(index + 1); }
      if (['ArrowLeft', 'PageUp', 'Backspace'].includes(event.key)) { event.preventDefault(); show(index - 1); }
      if (event.key.toLowerCase() === 'home') show(0);
      if (event.key.toLowerCase() === 'end') show(slides.length - 1);
    });
    document.addEventListener('click', () => show(index + 1));
    document.documentElement.requestFullscreen?.().catch(() => {});
  </script>
</body>
</html>`);
    presentationWindow.document.close();
    setSaveState("saved");
  }

  async function openPrintablePdf() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.alert(t.popupPdfBlocked);
      return;
    }

    printWindow.document.write(`<!doctype html><title>${escapeHtml(t.preparingPdf)}</title><body style="font-family:system-ui;padding:24px">${escapeHtml(t.preparingPdf)}</body>`);
    printWindow.document.close();

    setSaveState("exporting");
    const presentation = await exportFrameSlides();
    if (!presentation) {
      printWindow.close();
      setSaveState("saved");
      return;
    }

    printWindow.document.write(`<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${presentation.title}</title>
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
    <button onclick="window.print()">${escapeHtml(t.savePdfButton)}</button>
  </div>
  ${presentation.slides.map((slide) => `<section class="slide">${slide}</section>`).join("\n")}
</body>
</html>`);
    printWindow.document.close();
    setSaveState("saved");
  }

  function renameProject() {
    const nextTitle = window.prompt(t.renamePrompt, title)?.trim();
    if (!nextTitle) return;
    setTitle(nextTitle);
    scheduleSave({ ...project.current, title: nextTitle });
  }

  return (
    <main className="editor-page">
      <section className="editor-canvas">
        <ExcalidrawCanvas
          initialData={initialData.current}
          language={language}
          labels={t}
          name={title}
          saveState={t[saveState]}
          onDownload={downloadProject}
          onOpenPdf={openPrintablePdf}
          onOpenPresentation={openPresentation}
          onRename={renameProject}
          UIOptions={{
            canvasActions: {
              export: false,
              loadScene: false,
              saveToActiveFile: false
            }
          }}
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
