# InnoTech Agents Platform

Catálogo web para descubrir, analizar y gestionar agentes de IA listos para usar. La aplicación ofrece una experiencia completa desde el landing page hasta el panel privado, con datos servidos por Supabase.

## Características principales
- **Landing orientada a conversión**: hero en español, llamadas a la acción y agentes destacados cargados desde Supabase.
- **Exploración avanzada**: buscador en vivo, filtros por tipo de categoría (profesión o necesidad) y contador de resultados.
- **Detalle de agente**: ficha enriquecida con configuración del modelo, pasos de workflow, categorías asociadas y acciones rápidas.
- **Autenticación Supabase**: registro, inicio de sesión y cierre de sesión con preservación de sesión en el navegador.
- **Dashboard del creador**: métricas de uso, costos estimados, satisfacción promedio y listado de agentes propios.

## Tecnologías
- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) y componentes de [shadcn/ui](https://ui.shadcn.com/)
- [@tanstack/react-query](https://tanstack.com/query/latest) para manejo de caché de datos
- [Supabase](https://supabase.com/) como backend (autenticación, base de datos Postgres y almacenamiento)

## Estructura relevante
```text
src/
  assets/               Recursos estáticos (p. ej. hero-bg)
  components/           UI reutilizable (Navbar, AgentCard, etc.)
  hooks/                Hooks personalizados
  integrations/
    supabase/           Cliente generado y tipado Database
  lib/                  Contextos y utilidades (AuthProvider)
  pages/                Rutas principales (Home, Explore, Dashboard...)
public/                 Archivos servidos por Vite
supabase/               Configuración de proyecto y migraciones SQL
```

## Requisitos previos
- Node.js 18 o superior (se recomienda usar `nvm`)
- Cuenta y proyecto en Supabase para obtener las llaves públicas
- [Supabase CLI](https://supabase.com/docs/guides/cli) opcional para ejecutar migraciones en local

## Configuración local
1. Instala dependencias:
   ```bash
   npm install
   ```
2. Copia el archivo de variables de entorno y complétalo:
   ```bash
   cp .env.example .env
   ```
   Variables utilizadas:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Ejecuta el entorno de desarrollo:
   ```bash
   npm run dev
   ```
4. Para revisar estilos con Tailwind y componentes, mantén abierto el servidor en `http://localhost:5173`.

## Supabase y base de datos
- El cliente se crea en `src/integrations/supabase/client.ts` con tipado generado automáticamente.
- El esquema disponible en `src/integrations/supabase/types.ts` refleja las tablas principales (`agents`, `categories`, `agent_executions`, etc.).
- Migraciones SQL ubicadas en `supabase/migrations/`. Puedes aplicarlas con la CLI:
  ```bash
  supabase link --project-ref <project_id>
  supabase db push
  ```
  El `project_id` por defecto se encuentra en `supabase/config.toml`.

Consulta la guía detallada del modelo de datos en [`docs/data-model.md`](docs/data-model.md).

## Scripts disponibles
- `npm run dev`: servidor de desarrollo con Vite.
- `npm run build`: compilación para producción.
- `npm run build:dev`: build en modo desarrollo (útil para validar warnings).
- `npm run preview`: previsualización del build.
- `npm run lint`: ejecuta ESLint sobre el código fuente.

## Buenas prácticas del proyecto
- Mantener el tipado estricto al interactuar con Supabase reutilizando los tipos generados (`Database`).
- Usar `@tanstack/react-query` para llamadas que requieran caché o estados de carga.
- Seguir la paleta y componentes base definidos en shadcn/ui para consistencia visual.
- Validar formularios con `zod` tal como se realiza en la página de autenticación.

## Próximos pasos sugeridos
- Implementar acciones pendientes en la ficha del agente (clonar, personalizar, ejecutar demo).
- Completar el flujo de creación de agentes desde el dashboard.
- Añadir pruebas end-to-end una vez se estabilice la API.
