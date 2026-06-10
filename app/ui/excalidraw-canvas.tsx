"use client";

import Link from "next/link";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import type { ReactNode } from "react";

type ExcalidrawCanvasProps = {
  initialData: any;
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
    <Excalidraw initialData={initialData} name={name} UIOptions={UIOptions} onChange={onChange}>
      <MainMenu>
        <MainMenu.Group title="Proyecto">
          <Link className="excalidraw-home-menu-link" href="/">Volver a proyectos</Link>
          <MenuItem onSelect={onRename}>Renombrar</MenuItem>
          <MenuItem onSelect={onOpenPresentation}>Presentar</MenuItem>
          <MenuItem onSelect={onOpenPdf}>Guardar PDF</MenuItem>
          <MenuItem onSelect={onDownload}>Exportar .excalidraw</MenuItem>
        </MainMenu.Group>
        <MainMenu.Separator />
        <MainMenu.Group title="Excalidraw">
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.Help />
        </MainMenu.Group>
        <MainMenu.Separator />
        <MainMenu.ItemCustom>
          <span className="excalidraw-home-save-state">{saveState}</span>
        </MainMenu.ItemCustom>
      </MainMenu>
    </Excalidraw>
  );
}
