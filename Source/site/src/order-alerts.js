// Order alerts for the GitHub Pages preview: a Telegram bot message or a WhatsApp
// message (CallMeBot) for each new demo order. The token or key stays in this
// browser only, never in the files, the preview export or the public site.
// The live site sends Telegram alerts from the server instead (Worker secrets).
import { formatJD } from '../../shared/pricing.js';
import { governorates } from '../../shared/labels.js';

const KEY = 'trio-order-alerts-v1';
export const validTelegramToken = (value) => /^\d{5,15}:[A-Za-z0-9_-]{30,60}$/.test(value);
export const validChatId = (value) => /^-?\d{3,20}$/.test(value);
export const validCallMeBotKey = (value) => /^[A-Za-z0-9_-]{3,64}$/.test(value);
export function whatsappNumber(value) {
  let digits = String(value || '').replace(/[\s()-]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  else if (/^07\d{8}$/.test(digits)) digits = `+962${digits.slice(1)}`;
  else if (/^7\d{8}$/.test(digits)) digits = `+962${digits}`;
  else if (/^9627\d{8}$/.test(digits)) digits = `+${digits}`;
  return /^\+\d{9,15}$/.test(digits) ? digits : '';
}

function config() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved?.channel === 'telegram' && validTelegramToken(saved.token) && validChatId(saved.chatId)) return saved;
    if (saved?.channel === 'whatsapp' && whatsappNumber(saved.phone) && validCallMeBotKey(saved.apikey)) return saved;
  } catch { /* storage blocked */ }
  return null;
}

// A form POST is a simple request: Telegram answers with CORS headers, so the reply can be read.
const telegram = (token, method, params) => fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', body: new URLSearchParams(params), cache: 'no-store', referrerPolicy: 'no-referrer' })
  .then((response) => response.json()).catch(() => ({ ok: false, network: true }));
const failed = (reply) => ({ status: 'failed', code: reply?.error_code, reason: !reply || reply.network ? 'network' : String(reply.description || '') });

function send(text) {
  const saved = config();
  if (!saved) return Promise.resolve({ status: 'off' });
  if (saved.channel === 'telegram') return telegram(saved.token, 'sendMessage', { chat_id: saved.chatId, text }).then((reply) => reply?.ok ? { status: 'delivered' } : failed(reply));
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(saved.phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(saved.apikey)}`;
  // A browser cannot read CallMeBot's reply, so this can only say it was sent.
  return fetch(url, { mode: 'no-cors', cache: 'no-store', referrerPolicy: 'no-referrer' }).then(() => ({ status: 'sent' }), () => ({ status: 'failed', reason: 'network' }));
}

// One line per field, so a customer cannot add fake lines to the message.
const line = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
export function orderAlertText(order) {
  const customer = order.customer || {};
  const gov = governorates.find(([id]) => id === customer.governorate);
  return [
    `🛍️ طلب جديد · ${order.number}`,
    ...(order.lines || []).map((item) => `• ${line(item.name?.ar || item.name, 60)}${item.storage ? ` (${line(item.storage, 20)})` : ''} × ${item.qty} — ${formatJD(item.unitFils * item.qty, 'ar')}`),
    order.fulfilment === 'pickup' ? 'استلام من المحل' : `التوصيل: ${order.deliveryFils ? formatJD(order.deliveryFils, 'ar') : 'يتأكد بالتلفون'}`,
    `المجموع: ${formatJD(order.totalFils, 'ar')}`,
    `👤 ${line(customer.name, 60)} · ${line(customer.mobile, 20)}`,
    order.fulfilment === 'pickup' ? '' : `📍 ${gov ? gov[1] : ''} — ${line(customer.address, 200)}`,
    customer.notes ? `📝 ${line(customer.notes, 300)}` : '',
    '(طلب تجريبي من المعاينة)',
  ].filter(Boolean).join('\n');
}

export const orderAlerts = {
  get() { const saved = config(); return !saved ? null : saved.channel === 'telegram' ? { channel: 'telegram', chatId: saved.chatId } : { channel: 'whatsapp', phone: saved.phone }; },
  save(input) {
    const value = (key) => String(input?.[key] || '').trim();
    let saved = null;
    if (input?.channel === 'telegram' && validTelegramToken(value('token')) && validChatId(value('chatId'))) saved = { channel: 'telegram', token: value('token'), chatId: value('chatId') };
    else if (input?.channel === 'whatsapp' && whatsappNumber(value('phone')) && validCallMeBotKey(value('apikey'))) saved = { channel: 'whatsapp', phone: whatsappNumber(value('phone')), apikey: value('apikey') };
    if (!saved) return false;
    try { localStorage.setItem(KEY, JSON.stringify(saved)); return true; } catch { return false; }
  },
  clear() { try { localStorage.removeItem(KEY); } catch { /* storage blocked */ } return true; },
  // Checks the token first (getMe), so a wrong token and a wrong chat ID give different answers.
  test() {
    const saved = config(), text = '✅ TRIO Mobile — تجربة تنبيهات الطلبات.\nمع كل طلب جديد رح توصلك رسالة فيها الأجهزة والمجموع ورقم الزبون.';
    if (!saved || saved.channel !== 'telegram') return send(text);
    return telegram(saved.token, 'getMe', {}).then((me) => me?.ok ? send(text).then((reply) => ({ ...reply, bot: me.result?.username || '' })) : failed(me));
  },
  // Reads the latest private chat that pressed Start in the bot, so nobody looks up a chat ID by hand.
  findChat(token) {
    token = String(token || '').trim();
    if (!validTelegramToken(token)) return Promise.resolve({ error: 'token' });
    return telegram(token, 'getUpdates', { limit: '50' }).then((reply) => {
      if (!reply?.ok) return { error: reply?.error_code === 401 ? 'token' : 'network' };
      const chats = reply.result.map((update) => (update.message || update.my_chat_member || update.edited_message || {}).chat).filter((chat) => chat?.type === 'private');
      const chat = chats[chats.length - 1];
      return chat ? { chatId: String(chat.id), name: [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || '' } : { error: 'nostart' };
    });
  },
  notifyOrder(order) { return send(orderAlertText(order)).catch(() => ({ status: 'failed', reason: 'network' })); },
};
