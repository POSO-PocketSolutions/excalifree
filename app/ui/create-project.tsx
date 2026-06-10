"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateProject() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);

  async function createProject() {
    const cleanTitle = title.trim();
    if (!cleanTitle || pending) return;

    setPending(true);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: cleanTitle })
    });
    const project = await response.json();
    router.push(`/projects/${project.id}`);
  }

  return (
    <div className="row">
      <input
        className="input"
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") createProject();
        }}
        placeholder="Nombre del proyecto"
        value={title}
      />
      <button className="button" disabled={pending} onClick={createProject} type="button">
        Crear
      </button>
    </div>
  );
}
