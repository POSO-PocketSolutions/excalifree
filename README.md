# POSO DRAW

Self-hosted drawing app with local projects, autosave, frame presentations, and PDF export.

## Architecture

This is a small Next.js app wrapped in Docker.

```text
Browser
  -> Next.js app on port 3030
      -> Project dashboard
      -> Drawing editor powered by Excalidraw
      -> API routes for project data
          -> JSON files in /data
              -> Docker volume poso_draw_data
```

Main parts:

```text
app/page.tsx                    Loads projects for the dashboard
app/ui/dashboard.tsx            Project list, create, delete, language switch
app/projects/[id]/page.tsx      Loads one project
app/ui/project-editor.tsx       Autosave, export, presentation logic
app/ui/excalidraw-canvas.tsx    Excalidraw canvas and custom menu
app/ui/i18n.tsx                 English / Spanish UI strings
app/server/projects.ts          Reads and writes project JSON files
app/api/projects/*              Project API routes
docker-compose.yml              Local Docker service
Dockerfile                      Production Next.js image
```

## Features

- Local project dashboard.
- English and Spanish UI.
- Drawing editor powered by Excalidraw with autosave.
- Projects stored as JSON files.
- Custom Excalidraw menu without social links.
- Frame-based presentation mode.
- Printable PDF view, one page per frame.
- Docker restart policy: `unless-stopped`.

## Run Locally

```bash
docker compose up -d --build
```

Open:

```text
http://localhost:3030
```

From another device on the same network:

```text
http://desktop:3030
```

## Deploy

1. Copy the project to the server.
2. Make sure Docker and Docker Compose are installed.
3. Start the app:

```bash
docker compose up -d --build
```

4. Check the container:

```bash
docker compose ps
```

5. Open the app on port `3030`.

## Data

Projects are saved in `/data` inside the container.

Docker persists that folder in the `poso_draw_data` volume.

Useful commands:

```bash
docker compose down
docker compose up -d --build
docker volume ls
```

## Presentations

Use Excalidraw frames as slides.

Menu actions:

```text
Present       Open slideshow mode
Save PDF      Open printable PDF view
```

Editor shortcuts:

```text
Ctrl+Enter / Cmd+Enter        Open slideshow mode
```

Slideshow shortcuts:

```text
Right arrow / Space / Enter    Next slide
Left arrow / Backspace         Previous slide
Home                           First slide
End                            Last slide
Escape                         Exit
```

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Promo Asset

The POSO DRAW promo still is tracked in this repo:

```text
public/poso-draw-promo.png
```

## License

This project is licensed under MIT. It uses Excalidraw as a React component under MIT too. See `THIRD_PARTY_NOTICES.md` for attribution.
