# WAAI Bot

Chatbot de WhatsApp con IA, hecho para la prueba técnica de Innovaitors.
Usa Next.js, Evolution API para conectar WhatsApp, y OpenRouter para la
parte de IA (modelos gratis).

## Qué hace

La idea es simple: alguien te escribe por WhatsApp, Evolution API le avisa
a mi backend por un webhook, el backend le manda ese mensaje a un modelo
gratuito de OpenRouter, y la respuesta se la reenvía al usuario por
WhatsApp otra vez. También hice un panel web sencillo donde se puede
cambiar el system prompt del bot, el modelo que usa y la temperatura, sin
tener que tocar código cada vez.

```
WhatsApp -> Evolution API (Docker) -> webhook -> mi backend -> OpenRouter
                                           |
                                        SQLite (guarda config + historial)
```

## Estructura

```
src/
  app/
    page.tsx        -> el panel
    api/
      webhook/       -> recibe los mensajes de whatsapp
      config/        -> guardar/leer la configuracion del bot
      models/        -> lista de modelos gratis de openrouter
      test-chat/     -> para probar el bot sin necesidad de whatsapp
  lib/
    db.ts            -> todo lo de sqlite
    openrouter.ts    -> llamada a la IA
    evolution.ts     -> mandar mensajes por whatsapp
    utils.ts         -> funciones sueltas (parsear mensajes, etc)
tests/
  utils.test.mjs
docker-compose.yml   -> para levantar evolution api
```

## Decisiones que tomé

Usé SQLite directo con `better-sqlite3` en vez de un ORM tipo Prisma.
Son solo 2 tablas (config del bot y mensajes), me pareció que meter un ORM
para esto era más complicación de la que necesitaba.

También le agregué memoria de conversación (guarda los últimos mensajes por
número de teléfono y se los pasa a la IA como contexto) y un chat de prueba
dentro del panel, porque cansa estar mandando mensajes reales por WhatsApp
cada vez que quiero probar un cambio en el prompt.

El panel no tiene login — la prueba dice explícitamente que no hace falta
para esto, así que lo dejé simple.

## Cómo correrlo

1. Clonar e instalar:
```bash
git clone https://github.com/HamedPro3D/Waai.git
cd waai
npm install
```

2. Copiar `.env.example` a `.env` y completar tus claves:
```bash
cp .env.example .env
```
- `OPENROUTER_API_KEY`: la sacas gratis en https://openrouter.ai/keys
- `EVOLUTION_API_KEY`: te la inventas tú (cualquier clave)
- `EVOLUTION_INSTANCE_NAME`: el nombre que le vas a poner a tu instancia de WhatsApp

3. Levantar Evolution API:
```bash
docker compose up -d
```

4. Entrar a `localhost:8080/manager`, crear la instancia (mismo nombre que
   pusiste en `EVOLUTION_INSTANCE_NAME`) y escanear el QR con WhatsApp.

5. Evolution API corre en Docker y necesita poder llegarle a tu backend, así
   que hay que exponerlo con ngrok:
```bash
ngrok http 3000
```

6. Configurar el webhook en el Manager de Evolution API con la URL que te
   dio ngrok + `/api/webhook`, activando el evento `MESSAGES_UPSERT`.

7. Correr el proyecto:
```bash
npm run dev
```

Y abrir `localhost:3000` para el panel.

## Para probarlo

Desde el panel hay un chat de prueba para ver cómo responde el bot antes de
meter WhatsApp en la ecuación. Cuando ya tengas todo conectado (Docker +
ngrok + webhook), solo escríbele al número que conectaste desde otro
celular — no puedes probarlo escribiéndote a ti mismo en el chat "Tú".

Tests:
```bash
npm test
```

## Variables de entorno

Están todas comentadas en `.env.example`. Las que sí o sí tienes que llenar
son `OPENROUTER_API_KEY`, `EVOLUTION_API_KEY` y `EVOLUTION_INSTANCE_NAME`.
Las demás ya tienen un valor por defecto que funciona.

## Qué me quedó pendiente

No le puse autenticación al panel. Tampoco tiene RAG, ni
reintentos automáticos si un modelo gratis da error 429 — por ahora solo le
avisa al usuario que algo falló. Los tests que tengo son solo de las
funciones puras de `utils.ts`.

## Problemas que me encontré haciéndolo

- Los modelos `:free` de OpenRouter se saturan seguido y tiran error 429 —
  no es que algo esté roto, toca cambiar de modelo desde el panel.
- Si el bot responde en el chat de prueba pero no por WhatsApp, casi siempre
  es porque la URL del webhook quedó apuntando a `localhost` en vez de la
  de ngrok (y ngrok cambia de URL cada vez que lo reinicias, a menos que
  pagues por una fija).
- `docker compose up` a veces falla la primera vez en `evolution-api`
  porque Postgres todavía no terminó de inicializar — esperar unos
  segundos y volver a intentar, o revisar con `docker compose logs`.