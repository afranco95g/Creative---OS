# Creative OS Architecture Bible

## Versión
v0.1

## Estado
Documento vivo de arquitectura

---

# 1. Principio central

Creative OS no es un chatbot.

Creative OS es un sistema operativo conversacional para construir, fortalecer y activar proyectos.

La conversación es la interfaz.

El proyecto es el centro.

---

# 2. Las tres fases del producto

## 1. Construir

La plataforma ayuda a convertir una idea en un proyecto estructurado.

Incluye:

- propósito
- problema
- contexto
- comunidad
- objetivos
- actividades
- cronograma
- presupuesto
- equipo
- riesgos
- sostenibilidad
- impacto
- documentos

## 2. Fortalecer

Cuando el proyecto alcanza madurez, puede pasar a revisión humana.

Un consultor puede:

- comentar módulos
- validar presupuesto
- revisar cronograma
- detectar riesgos
- fortalecer documentos
- proponer tareas
- recomendar oportunidades

## 3. Activar

El proyecto se conecta con personas, empresas, organizaciones, convocatorias, aliados, proveedores o financiadores.

---

# 3. Arquitectura general

```txt
UI
↓
ProjectController
↓
ExecutiveBrain
↓
ActionEngine
↓
ProjectEngine
↓
ProjectGraph