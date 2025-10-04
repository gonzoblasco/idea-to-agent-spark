# Modelo de datos

El proyecto utiliza Supabase (Postgres) como backend. A continuación se describen las tablas principales y cómo las consume el frontend.

## Diagramas y relaciones clave

```
profiles 1---* agents *---* categories
    |             |  \\       \\
    |             |   \\       agent_categories
    |             |    \\
    |             |     * agent_executions
    |             \\
    * collections
```

- `profiles` es la fuente de verdad para la información del usuario autenticado.
- `agents` almacena la definición completa del agente IA.
- `categories` clasifica los agentes por profesión o necesidad; la relación `agent_categories` resuelve el vínculo N:M.
- `agent_executions` guarda métricas de uso (tiempo, costo, satisfacción).
- `agent_customizations` permitirá que cada usuario guarde variantes personalizadas.
- `collections` agrupa agentes creados por un mismo usuario.

## Tablas

### profiles
| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | `uuid` | Identificador del usuario (coincide con `auth.users`). |
| `email` | `text` | Email principal. |
| `full_name` | `text` | Nombre visible en el dashboard. |
| `avatar_url` | `text` | URL del avatar opcional. |
| `role` | `enum(user_role)` | Rol (admin, creator, client). |
| `created_at`, `updated_at` | `timestamptz` | Timestamps de auditoría. |

Uso en frontend: la página `Dashboard` obtiene `profiles` para saludar al usuario.

### agents
| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | `uuid` | Identificador del agente. |
| `name` | `text` | Nombre comercial mostrado en tarjetas y detalle. |
| `description` | `text` | Resumen mostrado en la UI. |
| `creator_id` | `uuid` | Relación con `profiles.id`. |
| `collection_id` | `uuid` | Agrupación opcional (`collections`). |
| `status` | `enum(agent_status)` | `draft`, `published` o `archived`. |
| `tags` | `text[]` | Etiquetas visibles en tarjetas y detalle. |
| `system_prompt` | `text` | Prompt base utilizado por el modelo. |
| `workflow_steps` | `jsonb` | Lista ordenada de pasos mostrada en la ficha. |
| `llm_provider`, `temperature`, `top_p`, `max_tokens` | `text`/`numeric` | Configuración del modelo. |
| `input_schema`, `output_schema`, `tools` | `jsonb` | Estructuras avanzadas para integraciones. |
| `language` | `text` | Idioma principal del agente. |
| `created_at`, `updated_at`, `version` | `timestamptz`/`int` | Control de versiones. |

Consultas relevantes:
- `Home` y `Explore` cargan agentes publicados y agregan el conteo de ejecuciones.
- `AgentDetail` expone la configuración completa usando joins con `profiles`, `collections` y `categories`.

### categories
| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | `uuid` | Identificador. |
| `name` | `text` | Nombre mostrado en filtros. |
| `description` | `text` | Texto descriptivo opcional. |
| `icon` | `text` | Nombre de icono (pendiente de uso en UI). |
| `type` | `enum(category_type)` | `profession` o `need`. |
| `created_at` | `timestamptz` | Fecha de creación. |

Uso en frontend: `Explore` permite filtrar por tipo y categoría específica.

### agent_categories
Tabla pivote que relaciona agentes con categorías.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `agent_id` | `uuid` | FK a `agents`. |
| `category_id` | `uuid` | FK a `categories`. |

### agent_executions
| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | `uuid` | Identificador de la ejecución. |
| `agent_id` | `uuid` | Referencia al agente ejecutado. |
| `user_id` | `uuid` | Usuario que lanzó la ejecución. |
| `estimated_cost` | `numeric` | Costo aproximado en tokens o USD. |
| `execution_time_ms` | `integer` | Duración en milisegundos. |
| `satisfaction_rating` | `integer` | Calificación 1-5. |
| `feedback` | `text` | Comentario libre. |
| `input_data`, `output_data` | `jsonb` | Payload de entrada y salida (opcional). |
| `created_at` | `timestamptz` | Fecha de la ejecución. |

Uso en frontend: `Dashboard` agrega costo total, total de ejecuciones y promedio de satisfacción.

### agent_customizations
Permite a los usuarios guardar configuraciones personalizadas de un agente base.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | `uuid` | Identificador. |
| `agent_id` | `uuid` | Relación con `agents`. |
| `user_id` | `uuid` | Usuario propietario. |
| `custom_config` | `jsonb` | Payload con overrides (prompts, parámetros, etc.). |
| `created_at`, `updated_at` | `timestamptz` | Seguimiento de cambios. |

### collections
| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | `uuid` | Identificador. |
| `creator_id` | `uuid` | Propietario (`profiles`). |
| `name` | `text` | Nombre visible de la colección. |
| `description` | `text` | Descripción opcional. |
| `thumbnail_url` | `text` | Imagen representativa. |
| `is_public` | `boolean` | Indica si la colección es pública. |
| `created_at`, `updated_at` | `timestamptz` | Fechas de control. |

## Buenas prácticas para la base de datos
- Utiliza los tipos generados (`Database`) al llamar `createClient` para mantener autocompletado y validaciones.
- Prefiere `select` tipados (`supabase.from<'agents'>`) cuando agregues nuevas consultas.
- Considera políticas RLS en Supabase para restringir acceso según `role` antes de publicar.
- Versiona cualquier cambio en SQL dentro de `supabase/migrations` para mantener coherencia entre entornos.
