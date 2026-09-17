'use client';

import { FormEvent, useEffect, useState } from 'react';

import {
  createInventoryCategory,
  createInventoryItem,
  deleteInventoryItem,
  listInventoryCategories,
  listInventoryForRoom,
  type SpaceInventoryCategory,
  type SpaceRoomInventoryItem,
} from '@/services/spaces/spaceInventoryService';

const NEW_CATEGORY_VALUE = '__nueva__';

export function SpaceRoomInventoryPanel({ roomId }: { roomId: string }) {
  const [categories, setCategories] = useState<SpaceInventoryCategory[]>([]);
  const [items, setItems] = useState<SpaceRoomInventoryItem[]>([]);
  const [message, setMessage] = useState('');

  const [categoryKey, setCategoryKey] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [includedInBaseRental, setIncludedInBaseRental] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setMessage('');

    Promise.all([listInventoryCategories(), listInventoryForRoom(roomId)])
      .then(([loadedCategories, loadedItems]) => {
        setCategories(loadedCategories);
        setItems(loadedItems);
        setCategoryKey((current) => current || loadedCategories[0]?.key || '');
      })
      .catch((error) => setMessage(getErrorMessage(error)));
  }, [roomId]);

  async function handleAddItem(event: FormEvent) {
    event.preventDefault();
    setMessage('');

    try {
      let effectiveCategoryKey = categoryKey;

      if (categoryKey === NEW_CATEGORY_VALUE) {
        if (!newCategoryLabel.trim()) {
          setMessage('Escribe el nombre de la categoría nueva.');
          return;
        }

        const created = await createInventoryCategory({ label: newCategoryLabel });
        setCategories((current) => [...current, created]);
        effectiveCategoryKey = created.key;
        setCategoryKey(created.key);
        setNewCategoryLabel('');
      }

      const item = await createInventoryItem({
        roomId,
        categoryKey: effectiveCategoryKey,
        name: itemName,
        quantity: Number(quantity) || 1,
        includedInBaseRental,
        notes: notes || undefined,
      });

      setItems((current) => [...current, item]);
      setItemName('');
      setQuantity('1');
      setNotes('');
      setMessage('Ítem agregado al inventario.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleDelete(itemId: string) {
    setMessage('');

    try {
      await deleteInventoryItem(itemId);
      setItems((current) => current.filter((item) => item.id !== itemId));
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  function categoryLabel(key: string): string {
    return categories.find((category) => category.key === key)?.label ?? key;
  }

  return (
    <div className="border border-borde/10 bg-superficie-elevada p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[.1em] text-texto-principal">
        Inventario clasificado
      </h3>

      {message ? <p className="mt-3 text-sm text-texto-largo">{message}</p> : null}

      <ul className="mt-4 grid gap-px bg-borde/10 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 bg-superficie-elevada p-4">
            <div>
              <p className="text-xs uppercase tracking-[.08em] text-texto-principal">
                {categoryLabel(item.categoryKey)}
              </p>
              <p className="mt-1 text-sm font-semibold text-texto-largo">{item.name}</p>
              <p className="mt-1 text-xs text-texto-largo">
                Cantidad: {item.quantity} ·{' '}
                {item.includedInBaseRental ? 'incluido en el alquiler base' : 'adicional'}
              </p>
              {item.notes ? <p className="mt-1 text-xs text-texto-largo">{item.notes}</p> : null}
            </div>

            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="shrink-0 border border-borde px-2 py-1 text-xs font-semibold text-rojo-base"
            >
              Quitar
            </button>
          </li>
        ))}

        {!items.length ? (
          <li className="bg-superficie-elevada p-4 text-sm text-texto-largo">
            Todavía no hay equipos cargados en este salón.
          </li>
        ) : null}
      </ul>

      <form onSubmit={handleAddItem} className="mt-5 grid gap-3 border-t border-borde/10 pt-5 sm:grid-cols-2">
        <select
          value={categoryKey}
          onChange={(event) => setCategoryKey(event.target.value)}
          className="border border-borde/15 bg-superficie px-3 py-2 text-sm text-texto-largo outline-none focus:border-acento"
        >
          {categories.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label}
            </option>
          ))}
          <option value={NEW_CATEGORY_VALUE}>+ Nueva categoría</option>
        </select>

        {categoryKey === NEW_CATEGORY_VALUE ? (
          <input
            value={newCategoryLabel}
            onChange={(event) => setNewCategoryLabel(event.target.value)}
            placeholder="Nombre de la categoría nueva"
            className="border border-borde/15 bg-superficie px-3 py-2 text-sm text-texto-largo outline-none focus:border-acento"
          />
        ) : (
          <input
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            placeholder="Nombre del equipo"
            required
            className="border border-borde/15 bg-superficie px-3 py-2 text-sm text-texto-largo outline-none focus:border-acento"
          />
        )}

        {categoryKey === NEW_CATEGORY_VALUE ? (
          <input
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            placeholder="Nombre del equipo"
            required
            className="border border-borde/15 bg-superficie px-3 py-2 text-sm text-texto-largo outline-none focus:border-acento"
          />
        ) : null}

        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          placeholder="Cantidad"
          className="border border-borde/15 bg-superficie px-3 py-2 text-sm text-texto-largo outline-none focus:border-acento"
        />

        <label className="flex items-center gap-2 text-sm text-texto-largo">
          <input
            type="checkbox"
            checked={includedInBaseRental}
            onChange={(event) => setIncludedInBaseRental(event.target.checked)}
          />
          Incluido en el alquiler base
        </label>

        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notas (opcional)"
          className="border border-borde/15 bg-superficie px-3 py-2 text-sm text-texto-largo outline-none focus:border-acento sm:col-span-2"
        />

        <button
          type="submit"
          className="bg-rojo-base px-4 py-2 text-sm font-bold text-hueso sm:col-span-2"
        >
          Agregar al inventario
        </button>
      </form>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}
