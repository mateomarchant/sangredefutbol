# Sangre de Futbol - registro con base de datos

Esta version mantiene la web igual visualmente, pero el registro y login ya no usan `localStorage`.

## Que se agrego

- `netlify/functions/register.js`: crea usuarios en Postgres.
- `netlify/functions/login.js`: valida login contra Postgres.
- `netlify.toml`: configura build, publish y functions.
- `package.json` / `package-lock.json`: dependencia `@neondatabase/serverless`.

## Variable requerida en Netlify

Configura una variable de entorno en Netlify:

```txt
DATABASE_URL=postgresql://...
```

Si usas Netlify Database y Netlify crea `NETLIFY_DATABASE_URL`, tambien funciona sin cambiar codigo.

## Deploy recomendado

1. Crear o conectar un repositorio GitHub con estos archivos.
2. En Netlify, conectar el repo al proyecto `sangredefutbol`.
3. Build command: `npm run build`.
4. Publish directory: `.`.
5. Functions directory: `netlify/functions`.
6. Agregar `DATABASE_URL` o crear Netlify Database.
7. Deploy.

La tabla `users` se crea automaticamente la primera vez que alguien se registra.
