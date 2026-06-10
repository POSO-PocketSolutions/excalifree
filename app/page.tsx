import Link from "next/link";
import { CreateProject } from "./ui/create-project";
import { deleteProject, listProjects } from "./server/projects";

export const dynamic = "force-dynamic";

async function removeProject(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  await deleteProject(id);
}

export default async function HomePage() {
  const projects = await listProjects();

  return (
    <main className="shell">
      <section className="topbar">
        <div>
          <p className="muted">Excalidraw self-hosted</p>
          <h1 className="title">Tus proyectos</h1>
        </div>
        <CreateProject />
      </section>

      <section className="grid">
        {projects.length === 0 ? (
          <div className="card">
            <p>No hay proyectos todavia.</p>
            <p className="muted">Crea uno para empezar a dibujar.</p>
          </div>
        ) : null}

        {projects.map((project) => (
          <article className="card project" key={project.id}>
            <div>
              <h2>{project.title}</h2>
              <p className="muted">Actualizado {new Date(project.updatedAt).toLocaleString("es-AR")}</p>
            </div>
            <div className="row">
              <Link className="button" href={`/projects/${project.id}`}>Abrir</Link>
              <form action={removeProject}>
                <input name="id" type="hidden" value={project.id} />
                <button className="button secondary" type="submit">Borrar</button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
