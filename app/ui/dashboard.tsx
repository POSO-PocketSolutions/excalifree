"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageToggle, useLanguage } from "./i18n";
import type { Project } from "../server/projects";

export function Dashboard({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter();
  const { language, t } = useLanguage();

  async function createProject(formData: FormData) {
    const title = String(formData.get("title") || "").trim();
    if (!title) return;

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    const project = await response.json();
    router.push(`/projects/${project.id}`);
  }

  async function deleteProject(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <main className="shell">
      <section className="topbar">
        <div>
          <p className="muted">{t.appLabel}</p>
          <h1 className="title">{t.projectsTitle}</h1>
        </div>
        <div className="row align-end">
          <LanguageToggle />
          <form action={createProject} className="row">
            <input className="input" name="title" placeholder={t.projectName} required />
            <button className="button" type="submit">{t.create}</button>
          </form>
        </div>
      </section>

      <section className="grid">
        {initialProjects.length === 0 ? (
          <div className="card">
            <p>{t.emptyTitle}</p>
            <p className="muted">{t.emptyText}</p>
          </div>
        ) : null}

        {initialProjects.map((project) => (
          <article className="card project" key={project.id}>
            <div>
              <h2>{project.title}</h2>
              <p className="muted">{t.updated} {new Date(project.updatedAt).toLocaleString(language === "es" ? "es-AR" : "en-US")}</p>
            </div>
            <div className="row">
              <Link className="button" href={`/projects/${project.id}`}>{t.open}</Link>
              <button className="button secondary" onClick={() => deleteProject(project.id)} type="button">{t.delete}</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
