import { notFound } from "next/navigation";
import { getProject } from "../../server/projects";
import { ProjectEditor } from "../../ui/project-editor";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return <ProjectEditor initialProject={project} />;
}
