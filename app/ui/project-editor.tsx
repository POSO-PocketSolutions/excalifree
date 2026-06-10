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

type SlideSettings = {
  order: string[];
  hidden: string[];
};

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLElement && target.isContentEditable;
}

function cleanAppState(appState: Record<string, any> = {}) {
  return {
    theme: appState.theme || "light",
    viewBackgroundColor: appState.viewBackgroundColor || "#ffffff",
    posoDrawSlides: normalizeSlideSettings([], appState.posoDrawSlides)
  };
}

function projectSnapshot(project: Project) {
  return JSON.stringify({
    title: project.title,
    elements: project.elements,
    appState: cleanAppState(project.appState),
    files: project.files
  });
}

function isFrame(element: SceneElement) {
  return (element.type === "frame" || element.type === "magicframe") && !element.isDeleted;
}

function getFrames(elements: readonly SceneElement[]) {
  return elements.filter(isFrame).sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
}

function frameTitle(frame: SceneElement, index: number) {
  return frame.name || `Frame ${index + 1}`;
}

function normalizeSlideSettings(frames: readonly SceneElement[], settings?: Partial<SlideSettings>) {
  const frameIds = new Set(frames.map((frame) => frame.id));
  const order = [
    ...(settings?.order || []).filter((id) => frameIds.size === 0 || frameIds.has(id)),
    ...frames.map((frame) => frame.id).filter((id) => !(settings?.order || []).includes(id))
  ];
  const uniqueOrder = Array.from(new Set(order));
  const hidden = (settings?.hidden || []).filter((id) => frameIds.size === 0 || frameIds.has(id));

  return { order: uniqueOrder, hidden: Array.from(new Set(hidden)) };
}

function orderedFrames(frames: readonly SceneElement[], settings: SlideSettings, includeHidden: boolean) {
  const byId = new Map(frames.map((frame) => [frame.id, frame]));
  return settings.order
    .map((id) => byId.get(id))
    .filter((frame): frame is SceneElement => Boolean(frame))
    .filter((frame) => includeHidden || !settings.hidden.includes(frame.id));
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
  const [lastSavedAt, setLastSavedAt] = useState(() => new Date(initialProject.updatedAt));
  const [slidesOpen, setSlidesOpen] = useState(false);
  const [frames, setFrames] = useState(() => getFrames(initialProject.elements as readonly SceneElement[]));
  const initialData = useRef({ elements: initialProject.elements, appState: initialProject.appState, files: initialProject.files });
  const project = useRef(initialProject);
  const savedSnapshot = useRef(projectSnapshot(initialProject));
  const pendingSnapshot = useRef(savedSnapshot.current);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveVersion = useRef(0);

  async function save(nextProject: Project, version: number) {
    setSaveState("saving");
    await fetch(`/api/projects/${nextProject.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextProject)
    });
    if (saveVersion.current === version) {
      const savedAt = new Date();
      savedSnapshot.current = projectSnapshot(nextProject);
      pendingSnapshot.current = savedSnapshot.current;
      project.current = { ...nextProject, updatedAt: savedAt.toISOString() };
      setLastSavedAt(savedAt);
      setSaveState("saved");
    }
  }

  function scheduleSave(nextProject: Project, showPending = true) {
    const nextSnapshot = projectSnapshot(nextProject);
    if (nextSnapshot === savedSnapshot.current || nextSnapshot === pendingSnapshot.current) {
      project.current = nextProject;
      return;
    }

    project.current = nextProject;
    pendingSnapshot.current = nextSnapshot;
    saveVersion.current += 1;
    const version = saveVersion.current;
    if (showPending) setSaveState("changes");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(nextProject, version), 800);
  }

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !isEditableTarget(event.target)) {
        event.preventDefault();
        openPresentation();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
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
    const frames = orderedFrames(getFrames(elements), normalizeSlideSettings(getFrames(elements), currentProject.appState.posoDrawSlides), false);

    if (frames.length === 0) {
      window.alert(t.noFrames);
      return null;
    }

    const { exportToSvg } = await import("@excalidraw/excalidraw");
    const slides = [];
    const isDark = currentProject.appState.theme === "dark";
    const slideBackground = isDark ? "#121212" : currentProject.appState.viewBackgroundColor || "#ffffff";

    for (const frame of frames) {
      const svg = await exportToSvg({
        elements: elements.filter((element) => !element.isDeleted) as any,
        appState: {
          ...currentProject.appState,
          exportBackground: true,
          exportWithDarkMode: isDark,
          theme: isDark ? "dark" : "light",
          viewBackgroundColor: slideBackground,
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
      isDark,
      slideBackground,
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
    .slide { align-items: center; background: ${presentation.slideBackground}; display: none; height: 100vh; justify-content: center; width: 100vw; }
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
    html, body { margin: 0; background: ${presentation.isDark ? "#000" : "#111"}; color: #fff; font-family: system-ui, sans-serif; }
    .toolbar { position: fixed; z-index: 10; top: 12px; right: 12px; display: flex; gap: 8px; }
    .toolbar button { border: 0; border-radius: 999px; padding: 10px 14px; background: #fff; color: #111; cursor: pointer; }
    .slide { align-items: center; background: ${presentation.slideBackground}; display: flex; height: 100vh; justify-content: center; page-break-after: always; width: 100vw; }
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

  function updateSlideSettings(nextSettings: SlideSettings) {
    const nextProject = {
      ...project.current,
      appState: cleanAppState({
        ...project.current.appState,
        posoDrawSlides: nextSettings
      })
    };
    scheduleSave(nextProject);
  }

  function moveSlide(frameId: string, direction: -1 | 1) {
    const settings = normalizeSlideSettings(frames, project.current.appState.posoDrawSlides);
    const index = settings.order.indexOf(frameId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= settings.order.length) return;
    const nextOrder = [...settings.order];
    [nextOrder[index], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[index]];
    updateSlideSettings({ ...settings, order: nextOrder });
  }

  function toggleSlide(frameId: string) {
    const settings = normalizeSlideSettings(frames, project.current.appState.posoDrawSlides);
    const hidden = settings.hidden.includes(frameId)
      ? settings.hidden.filter((id) => id !== frameId)
      : [...settings.hidden, frameId];
    updateSlideSettings({ ...settings, hidden });
  }

  function saveLabel() {
    if (saveState === "exporting") return t.exporting;
    if (saveState === "saving") return t.savingChanges;
    if (saveState === "changes") return t.unsavedChanges;
    return `${t.lastSaved} ${lastSavedAt.toLocaleTimeString(language === "es" ? "es-AR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit"
    })}`;
  }

  return (
    <main className="editor-page">
      <section className="editor-canvas">
        <ExcalidrawCanvas
          initialData={initialData.current}
          language={language}
          labels={t}
          name={title}
          saveState={saveLabel()}
          onDownload={downloadProject}
          onOpenPdf={openPrintablePdf}
          onOpenPresentation={openPresentation}
          onOpenSlides={() => setSlidesOpen(true)}
          onRename={renameProject}
          UIOptions={{
            canvasActions: {
              export: false,
              loadScene: false,
              saveToActiveFile: false
            }
          }}
          onChange={(elements, appState, files) => {
            const nextFrames = getFrames(elements as readonly SceneElement[]);
            setFrames(nextFrames);
            scheduleSave({
              ...project.current,
              elements,
              appState: cleanAppState({
                ...appState,
                posoDrawSlides: project.current.appState.posoDrawSlides
              }),
              files
            });
          }}
        />
        {slidesOpen ? (
          <aside className="slides-panel" aria-label={t.slidesPanelTitle}>
            <div className="slides-panel-header">
              <div>
                <h2>{t.slidesPanelTitle}</h2>
                <p>{t.slidesPanelText}</p>
              </div>
              <button className="slides-panel-close" onClick={() => setSlidesOpen(false)} type="button">{t.close}</button>
            </div>
            <div className="slides-list">
              {orderedFrames(frames, normalizeSlideSettings(frames, project.current.appState.posoDrawSlides), true).length === 0 ? (
                <p className="slides-empty">{t.noSlides}</p>
              ) : null}
              {orderedFrames(frames, normalizeSlideSettings(frames, project.current.appState.posoDrawSlides), true).map((frame, index) => {
                const settings = normalizeSlideSettings(frames, project.current.appState.posoDrawSlides);
                const isHidden = settings.hidden.includes(frame.id);
                return (
                  <article className={`slide-card${isHidden ? " hidden" : ""}`} key={frame.id}>
                    <div className="slide-thumb">
                      <span>{index + 1}</span>
                    </div>
                    <div className="slide-card-body">
                      <strong>{frameTitle(frame, index)}</strong>
                      <small>{Math.round(frame.width)} x {Math.round(frame.height)}</small>
                      <label className="slide-visible-toggle">
                        <input checked={!isHidden} onChange={() => toggleSlide(frame.id)} type="checkbox" />
                        {isHidden ? t.hideSlide : t.showSlide}
                      </label>
                    </div>
                    <div className="slide-actions">
                      <button disabled={index === 0} onClick={() => moveSlide(frame.id, -1)} type="button">{t.moveUp}</button>
                      <button disabled={index === settings.order.length - 1} onClick={() => moveSlide(frame.id, 1)} type="button">{t.moveDown}</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </aside>
        ) : null}
      </section>
    </main>
  );
}
