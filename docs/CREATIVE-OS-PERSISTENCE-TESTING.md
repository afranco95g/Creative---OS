# Pruebas de persistencia y conversación

## Dos computadores

1. Aplicar migraciones hasta `032_project_sync_and_knowledge.sql` y desplegar la aplicación.
2. Iniciar sesión en A, crear un proyecto y responder tres preguntas. Confirmar que el chat muestra `Guardado.`.
3. Cerrar sesión. En B, iniciar con la misma cuenta y abrir `/studio`; el proyecto debe aparecer con mensajes y grafo.
4. Copiar su URL y abrirla en B. La carga por ID debe reconstruir el proyecto aunque la caché esté vacía.
5. Abrir esa URL con otra cuenta: debe mostrar que no existe o no pertenece a la cuenta; Supabase debe devolver cero filas por RLS.

## Sin conexión

1. Con DevTools en modo Offline, responder una pregunta. Debe aparecer `Sin conexión. Cambios pendientes.`.
2. Recargar: la caché conserva el turno y la advertencia de cambios pendientes.
3. Volver a Online. Debe aparecer `Recuperando cambios…` y luego `Sincronización resuelta.` o `Guardado.` sin mensajes duplicados.

## Caso Kicks

Enviar: `Quiero crear una marca de zapatos para deportistas extremos, skate y BMX. Hacer cada zapato me cuesta COP 80.000 y lo vendo en COP 220.000. No tengo diseño de marca aún.`

Verificar costo COP 80.000, precio COP 220.000, margen bruto preliminar COP 140.000, público, identidad pendiente y pregunta sobre costos incluidos. Las líneas económicas deben quedar propuestas, no aprobadas.
