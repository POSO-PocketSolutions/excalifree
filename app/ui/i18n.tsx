"use client";

import { useEffect, useState } from "react";

export type Language = "en" | "es";

const strings = {
  en: {
    appLabel: "POSO DRAW",
    projectsTitle: "Your projects",
    projectName: "Project name",
    create: "Create",
    emptyTitle: "No projects yet.",
    emptyText: "Create one to start drawing.",
    updated: "Updated",
    open: "Open",
    delete: "Delete",
    backToProjects: "Back to projects",
    rename: "Rename",
    present: "Present (Ctrl+Enter)",
    slidesLibrary: "Library / Slides",
    slidesPanelTitle: "Library / Slides",
    slidesPanelText: "Use frames as slides. Reorder them or hide the ones you do not want to present.",
    close: "Close",
    noSlides: "No frames yet.",
    showSlide: "Visible",
    hideSlide: "Hidden",
    moveUp: "Up",
    moveDown: "Down",
    savePdf: "Save PDF",
    exportFile: "Export .excalidraw",
    projectMenu: "Project",
    renamePrompt: "Project name",
    noFrames: "No frames to present.",
    popupPresentationBlocked: "The browser blocked the presentation window.",
    popupPdfBlocked: "The browser blocked the PDF window.",
    preparingPresentation: "Preparing presentation...",
    preparingPdf: "Preparing PDF...",
    savePdfButton: "Save PDF",
    lastSaved: "Last saved",
    unsavedChanges: "Unsaved changes",
    savingChanges: "Saving changes...",
    exporting: "Exporting..."
  },
  es: {
    appLabel: "POSO DRAW",
    projectsTitle: "Tus proyectos",
    projectName: "Nombre del proyecto",
    create: "Crear",
    emptyTitle: "No hay proyectos todavia.",
    emptyText: "Crea uno para empezar a dibujar.",
    updated: "Actualizado",
    open: "Abrir",
    delete: "Borrar",
    backToProjects: "Volver a proyectos",
    rename: "Renombrar",
    present: "Presentar (Ctrl+Enter)",
    slidesLibrary: "Biblioteca / Diapositivas",
    slidesPanelTitle: "Biblioteca / Diapositivas",
    slidesPanelText: "Usa los frames como diapositivas. Cambia el orden u oculta las que no quieras presentar.",
    close: "Cerrar",
    noSlides: "Todavia no hay frames.",
    showSlide: "Visible",
    hideSlide: "Oculta",
    moveUp: "Subir",
    moveDown: "Bajar",
    savePdf: "Guardar PDF",
    exportFile: "Exportar .excalidraw",
    projectMenu: "Proyecto",
    renamePrompt: "Nombre del proyecto",
    noFrames: "No hay frames para presentar.",
    popupPresentationBlocked: "El navegador bloqueo la ventana de presentacion.",
    popupPdfBlocked: "El navegador bloqueo la ventana de PDF.",
    preparingPresentation: "Preparando presentacion...",
    preparingPdf: "Preparando PDF...",
    savePdfButton: "Guardar PDF",
    lastSaved: "Ultimo guardado",
    unsavedChanges: "Cambios sin guardar",
    savingChanges: "Guardando cambios...",
    exporting: "Exportando..."
  }
};

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("poso-draw-language");
    const nextLanguage = stored === "es" ? "es" : "en";
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage;

    function handleLanguageChange(event: Event) {
      const next = (event as CustomEvent<Language>).detail;
      if (next === "en" || next === "es") {
        setLanguageState(next);
        document.documentElement.lang = next;
      }
    }

    window.addEventListener("poso-draw-language", handleLanguageChange);
    return () => window.removeEventListener("poso-draw-language", handleLanguageChange);
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem("poso-draw-language", nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.dispatchEvent(new CustomEvent("poso-draw-language", { detail: nextLanguage }));
  }

  return { language, setLanguage, t: strings[language] };
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-toggle" aria-label="Language">
      <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")} type="button">EN</button>
      <button className={language === "es" ? "active" : ""} onClick={() => setLanguage("es")} type="button">ES</button>
    </div>
  );
}
