import { NextResponse } from "next/server";
import { createProject, listProjects } from "../../server/projects";

export async function GET() {
  return NextResponse.json(await listProjects());
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  return NextResponse.json(await createProject(title));
}
