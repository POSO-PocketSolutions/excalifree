# Excalidraw Home

Excalidraw self-hosted con proyectos locales.

## Architecture

This is a small Next.js app.

- The home page lists local projects.
- Each project opens the Excalidraw editor.
- Projects are saved as JSON files in `/data`.
- Docker stores `/data` in the `excalidraw_data` volume.
- `docker-compose.yml` runs the app on port `3030`.
- Cloudflare Tunnel can later point `excali.mnsosa.com` to `http://localhost:3030`.

Main files:

```text
app/page.tsx                    Project list
app/projects/[id]/page.tsx      Project editor page
app/ui/project-editor.tsx       Saving, export, presentation logic
app/ui/excalidraw-canvas.tsx    Excalidraw canvas and custom menu
app/server/projects.ts          Project file storage
docker-compose.yml              Local Docker service
```

## Uso

```bash
docker compose up -d --build
```

Abrir:

```text
http://localhost:3030
```

Desde otra maquina de la red:

```text
http://desktop:3030
```

## Datos

Los proyectos se guardan en el volumen `excalidraw_data`.

## Presentaciones

En el editor, usar frames de Excalidraw como diapositivas.

El menu `Presentar` abre un modo presentacion con una diapositiva por frame.

Atajos:

```text
Flecha derecha / Espacio: siguiente
Flecha izquierda: anterior
Escape: salir
```

El menu `Guardar PDF` abre una vista imprimible con una pagina por frame.

## Apagar

```bash
docker compose down
```

## Reinicio automatico

El contenedor usa `restart: unless-stopped`, asi que vuelve a iniciar con Docker salvo que se apague manualmente.

## Cloudflare Tunnel

Cuando se quiera publicar como `excali.mnsosa.com`, apuntar el tunnel a:

```text
http://localhost:3030
```

Si queda publico, cualquiera con la URL puede abrir y editar proyectos. Para restringirlo, usar Cloudflare Access.
