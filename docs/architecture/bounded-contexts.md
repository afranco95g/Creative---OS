# Cultura Esta
## Bounded Contexts v1

Los Bounded Contexts dividen la plataforma en dominios independientes que comparten un mismo lenguaje.

Cada dominio es responsable de sus propias reglas de negocio.

Las entidades pueden ser compartidas entre dominios, pero la lógica permanece encapsulada.

---

# 1. Identity

Responsabilidad:

Identidad y acceso.

Incluye:

- profiles
- autenticación
- permisos
- roles
- sesiones

Nunca almacena información editorial.

---

# 2. Ecosystem

Responsabilidad:

Representar el ecosistema cultural.

Entidades:

- people
- organizations
- projects
- spaces
- relationships

Es el corazón de Cultura Esta.

Todo lo demás consume información desde aquí.

---

# 3. Editorial

Responsabilidad:

Producción periodística.

Entidades:

- stories
- story_blocks
- categories
- publications

Reglas:

Solo periodistas autorizados pueden publicar.

Las historias referencian entidades del Ecosystem.

Nunca duplican información.

---

# 4. Agenda

Responsabilidad:

Actividades con fecha.

Entidades:

- events
- workshops
- calendars

Puede consumir personas, espacios y organizaciones.

---

# 5. Opportunities

Responsabilidad:

Oportunidades abiertas.

Entidades:

- opportunities
- applications
- beneficiaries

---

# 6. Media

Responsabilidad:

Archivos digitales.

Entidades:

- images
- videos
- audio
- documents

Todos los dominios pueden utilizar recursos desde aquí.

---

# 7. Studio

Responsabilidad:

Herramientas para creadores.

Incluye:

- proyectos internos
- IA
- generación de contenido
- borradores
- automatizaciones

No publica directamente.

Entrega contenido al dominio Editorial.

---

# 8. Experiences

Responsabilidad:

Reservas y experiencias.

Ejemplos:

- visitas
- recorridos
- talleres pagos
- membresías

---

# 9. Administration

Responsabilidad:

Configuración del sistema.

Incluye:

- usuarios
- auditoría
- métricas
- configuración
- taxonomías
- vocabularios controlados

---

# Regla principal

Los dominios se comunican mediante entidades.

Nunca mediante duplicación de información.

---

# Ejemplo

Persona

↓

participa en

↓

Proyecto

↓

es cubierto por

↓

Historia

↓

publicada por

↓

Editorial

↓

utiliza

↓

Media

↓

es encontrada mediante

↓

Agenda

Cada dominio aporta una perspectiva distinta sobre la misma realidad.