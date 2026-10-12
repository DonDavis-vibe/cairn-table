import { useLang, loc } from '../i18n/index.jsx';
import { dropCandidates, dropForFatigue, settleFatigue, hasFatigueRoom } from '../rules/fatigue.js';

// Erschoepfung ohne freien Slot (Cairn 2e): ein Gegenstand muss abgelegt werden,
// damit die Karte ins Inventar passt. Erscheint, solange Erschoepfung offen ist.
export default function FatigueDrop({ character, setCharacter, pushLog, onEvent }) {
  const { t, lang } = useLang();
  const owed = character.fatigueOwed || 0;
  if (owed <= 0) return null;

  const room = hasFatigueRoom(character);
  const take = () => {
    const r = settleFatigue(character);
    if (!r.ok) return;
    setCharacter(r.character);
    pushLog({ kind: 'bad', text: t('inv.fatigueAdded') });
  };
  const drop = (itemId) => {
    const r = dropForFatigue(character, itemId);
    if (!r.ok) return;
    setCharacter(r.character);
    const text = t('inv.fatigueDropped', { name: loc(r.item.name, lang) });
    pushLog({ kind: 'warn', text });
    onEvent?.({ kind: 'note', text });
  };

  return (
    <div className="prompt-card prompt-warn">
      <strong>{t('inv.fatigueDropTitle', { n: owed })}</strong>
      {room ? (
        <>
          <p>{t('inv.fatigueRoomNow')}</p>
          <div className="scar-card-actions">
            <button type="button" className="btn btn-primary" onClick={take}>{t('inv.fatigueTake')}</button>
          </div>
        </>
      ) : (
        <>
          <p>{t('inv.fatigueDropHint')}</p>
          <div className="scar-card-actions">
            {dropCandidates(character).map((it) => (
              <button key={it.itemId} type="button" className="btn btn-sm btn-bad" onClick={() => drop(it.itemId)}>
                {loc(it.name, lang)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
