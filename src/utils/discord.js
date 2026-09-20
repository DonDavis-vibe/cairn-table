// Optionale Discord-Anbindung per Webhook — ein unabhaengiger Broadcast-Kanal,
// getrennt vom Multiplayer. Wuerfe und Ereignisse landen als Nachricht im Kanal,
// mit dem Charakternamen als Absender. Muster wie in den Schwester-Tools.
//
// Die Webhook-URL ist ein Zugangsschluessel fuer den Kanal. Sie liegt nur im
// localStorage dieses Browsers und wandert NIE in die Charakterdatei.

const URL_KEY = 'cairn-table-discord-webhook';
const OPT_KEY = 'cairn-table-discord-opts';

export const COLORS = {
  ok: 0x1c463b,
  bad: 0x9a3b1f,
  gold: 0x8a6a2e,
  warn: 0x8a6a2e,
  info: 0x3a5f7a,
  neutral: 0x6f6350,
};

export function getWebhook() {
  try { return localStorage.getItem(URL_KEY) || ''; } catch { return ''; }
}

export function setWebhook(url) {
  try {
    if (url && url.trim()) localStorage.setItem(URL_KEY, url.trim());
    else localStorage.removeItem(URL_KEY);
  } catch { /* privater Modus */ }
}

export function isValidWebhook(url) {
  return /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+/.test((url || '').trim());
}

export function hasWebhook() {
  return isValidWebhook(getWebhook());
}

export function getOpts() {
  try {
    return { rolls: true, events: true, ...JSON.parse(localStorage.getItem(OPT_KEY) || '{}') };
  } catch {
    return { rolls: true, events: true };
  }
}

export function setOpts(opts) {
  try { localStorage.setItem(OPT_KEY, JSON.stringify(opts)); } catch { /* ignorieren */ }
}

// --- gedrosselte Warteschlange; ein Netzwerkfehler blockiert die App nie ---
let queue = [];
let running = false;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function pump() {
  if (running) return;
  running = true;
  while (queue.length) {
    const body = queue.shift();
    const url = getWebhook();
    if (!isValidWebhook(url)) break;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        queue.unshift(body);
        await wait((data.retry_after || 1) * 1000 + 150);
      } else {
        await wait(400);
      }
    } catch {
      await wait(400); // offline / CORS / geloescht — still schlucken
    }
  }
  running = false;
}

function enqueue(body) {
  if (!hasWebhook()) return;
  queue.push({ allowed_mentions: { parse: [] }, ...body });
  pump();
}

function send(username, embed, opt) {
  if (opt && !getOpts()[opt]) return;
  enqueue({ username: String(username || 'Cairn Table').slice(0, 78), embeds: [embed] });
}

// --- oeffentliche Helfer ---

export function shareRoll(name, label, value, detail) {
  send(name, {
    color: COLORS.neutral,
    description: `🎲 **${label}** — ${value}${detail ? `  \n\`${detail}\`` : ''}`,
  }, 'rolls');
}

export function shareSave(name, attrLabel, roll, target, ok) {
  send(name, {
    color: ok ? COLORS.ok : COLORS.bad,
    description: `🎲 **${attrLabel}** — W20 ${roll} ${ok ? '≤' : '>'} ${target} · ${ok ? '✅' : '❌'}`,
  }, 'rolls');
}

export function shareEvent(name, text, tone = 'info') {
  send(name, { color: COLORS[tone] || COLORS.info, description: text }, 'events');
}

export async function testWebhook(url) {
  if (!isValidWebhook(url)) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Cairn Table',
        embeds: [{ color: COLORS.gold, description: '🧭 Verbindung steht — Würfe und Ereignisse landen ab jetzt hier.' }],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
