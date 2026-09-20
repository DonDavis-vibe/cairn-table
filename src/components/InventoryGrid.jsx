import { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Plus, GripVertical } from 'lucide-react';
import { IconTriangleAlert } from './icons.jsx';
import { useLang } from '../i18n/index.jsx';
import { WORN_SLOTS, PACK_SLOTS, SLOT_PAIR_FIRST } from '../rules/character.js';
import ItemCard from './ItemCard.jsx';
import AddItemMenu from './AddItemMenu.jsx';

function DraggableItem({ itemId, children }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: itemId });
  return (
    <div ref={setNodeRef} className={`drag-wrap${isDragging ? ' is-dragging' : ''}`}>
      <button type="button" className="drag-grip" aria-label="Move" {...attributes} {...listeners}>
        <GripVertical size={13} />
      </button>
      {children}
    </div>
  );
}

function SlotCell({ slot, character, onOpen, onRemove, onToggleUsage, onToggleCleared, onCast }) {
  const { t } = useLang();
  const { setNodeRef, isOver } = useDroppable({ id: slot });
  const ref = character.slots[slot];

  if (ref?.cont) return null; // vom Anker gerendert

  if (!ref) {
    return (
      <button
        type="button"
        ref={setNodeRef}
        className={`slot slot-empty${isOver ? ' slot-over' : ''}`}
        onClick={() => onOpen(slot)}
        aria-label={t('inv.addHere')}
      >
        <Plus size={16} />
      </button>
    );
  }

  const item = character.items[ref.itemId];
  if (!item) return <div ref={setNodeRef} className="slot slot-empty" />;
  const span = item.size === 2 ? 2 : 1;

  return (
    <div ref={setNodeRef} className={`slot slot-filled${span === 2 ? ' slot-span2' : ''}${isOver ? ' slot-over' : ''}`}>
      <DraggableItem itemId={ref.itemId}>
        <ItemCard
          item={item}
          span={span}
          onRemove={() => onRemove(ref.itemId)}
          onToggleUsage={(i) => onToggleUsage(ref.itemId, i)}
          onToggleCleared={() => onToggleCleared(ref.itemId)}
          onCast={onCast ? () => onCast(ref.itemId) : undefined}
        />
      </DraggableItem>
    </div>
  );
}

export default function InventoryGrid({ character, onAddAt, onRemove, onToggleUsage, onToggleCleared, onAddFatigue, onCast }) {
  const { t } = useLang();
  const [target, setTarget] = useState(null);

  const cellProps = { character, onOpen: setTarget, onRemove, onToggleUsage, onToggleCleared, onCast };

  return (
    <div className="inv">
      <div className="inv-group">
        <h3 className="inv-h">{t('inv.worn')}</h3>
        <div className="slot-grid slot-grid-4">
          {WORN_SLOTS.map((s) => <SlotCell key={s} slot={s} {...cellProps} />)}
        </div>
      </div>

      <div className="inv-group">
        <h3 className="inv-h">{t('inv.pack')}</h3>
        <div className="slot-grid slot-grid-6">
          {PACK_SLOTS.map((s) => <SlotCell key={s} slot={s} {...cellProps} />)}
        </div>
      </div>

      <div className="inv-actions">
        <button type="button" className="btn btn-ghost" onClick={onAddFatigue}>
          <IconTriangleAlert size={15} /> {t('inv.addFatigue')}
        </button>
      </div>

      {target ? (
        <AddItemMenu
          onClose={() => setTarget(null)}
          onPick={(item) => {
            onAddAt(item.size === 2 ? SLOT_PAIR_FIRST[target] : target, item);
            setTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}
