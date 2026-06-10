# Excalidraw Home

Excalidraw self-hosted con proyectos locales.

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
