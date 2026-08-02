# Cultura Esta
## Relationship Model v1

Las relaciones son entidades de primera clase.

No son simplemente claves foráneas.

Una relación tiene significado.

Puede tener fecha.

Puede tener un rol.

Puede tener evidencia.

Puede cambiar con el tiempo.

---

# Relación básica

Entidad A

↓

Tipo de relación

↓

Entidad B

---

Ejemplo

Persona

↓

fundó

↓

Organización

---

# Tipos iniciales

## Persona

puede...

- fundar Organización
- trabajar en Organización
- colaborar con Organización
- participar en Proyecto
- dirigir Proyecto
- producir Evento
- asistir a Evento
- escribir Historia
- fotografiar Evento
- grabar Video
- impartir Taller
- recibir Convocatoria

---

## Organización

puede...

- gestionar Espacio
- organizar Evento
- lanzar Convocatoria
- desarrollar Proyecto
- publicar Historia

---

## Proyecto

puede...

- ocurrir en Espacio
- recibir financiación
- tener colaboradores
- producir Evento
- generar Historia
- generar Documento

---

## Espacio

puede...

- alojar Evento
- alojar Taller
- pertenecer a Organización

---

## Historia

puede...

- cubrir Proyecto
- cubrir Evento
- mencionar Persona
- mencionar Organización
- mencionar Espacio

---

# Cada relación tiene atributos

tipo

fecha_inicio

fecha_fin

estado

fuente

autor

nivel de confianza

observaciones

---

# Ejemplo

Persona

Andrés Franco

↓

fundador

↓

Cultura Esta

desde

2026

estado

activo

---

# Filosofía

Las entidades cuentan quién existe.

Las relaciones cuentan la historia.