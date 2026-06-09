# Excalidraw Home

Excalidraw local para usar en casa con Docker.

## Uso

```bash
docker compose up -d
```

Abrir:

```text
http://localhost:3030
```

Desde otra maquina de la red:

```text
http://desktop:3030
```

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

Si queda publico, cualquiera con la URL puede abrir la app. Para restringirlo, usar Cloudflare Access.
