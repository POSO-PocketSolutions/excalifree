import { listProjects } from "./server/projects";
import { Dashboard } from "./ui/dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await listProjects();
  return <Dashboard initialProjects={projects} />;
}
