"use client";

import Link from "next/link";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import type { ReactNode } from "react";
import type { Language } from "./i18n";
import { LanguageToggle } from "./i18n";

type ExcalidrawCanvasProps = {
  initialData: any;
  language: Language;
  labels: Record<string, string>;
  name: string;
  saveState: string;
  UIOptions: any;
  onChange: (...args: any[]) => void;
  onDownload: () => void;
  onOpenPdf: () => void;
  onOpenPresentation: () => void;
  onRename: () => void;
};

function MenuItem({ children, onSelect }: { children: ReactNode; onSelect: () => void }) {
  return <MainMenu.Item onSelect={onSelect}>{children}</MainMenu.Item>;
}

export function ExcalidrawCanvas({
  initialData,
  language,
  labels,
  name,
  saveState,
  UIOptions,
  onChange,
  onDownload,
  onOpenPdf,
  onOpenPresentation,
  onRename
}: ExcalidrawCanvasProps) {
  return (
    <Excalidraw
      initialData={initialData}
      langCode={language === "es" ? "es-ES" : "en"}
      name={name}
      UIOptions={UIOptions}
      onChange={onChange}
    >
      <MainMenu>
        <MainMenu.Group title={labels.projectMenu}>
          <Link className="poso-draw-menu-link" href="/">{labels.backToProjects}</Link>
          <MenuItem onSelect={onRename}>{labels.rename}</MenuItem>
          <MenuItem onSelect={onOpenPresentation}>{labels.present}</MenuItem>
          <MenuItem onSelect={onOpenPdf}>{labels.savePdf}</MenuItem>
          <MenuItem onSelect={onDownload}>{labels.exportFile}</MenuItem>
        </MainMenu.Group>
        <MainMenu.Separator />
        <MainMenu.Group title="Excalidraw">
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
          <MainMenu.DefaultItems.ToggleTheme allowSystemTheme={false} />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.Help />
        </MainMenu.Group>
        <MainMenu.Separator />
        <MainMenu.ItemCustom>
          <div className="poso-draw-menu-footer">
            <span className="poso-draw-save-state">{saveState}</span>
            <LanguageToggle />
          </div>
        </MainMenu.ItemCustom>
      </MainMenu>
    </Excalidraw>
  );
}
