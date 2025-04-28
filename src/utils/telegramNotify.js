import fetch from 'node-fetch';

/**
 * 发送 Telegram 通知消息
 * @param {string} token - Bot Token
 * @param {string|number} chatId - 目标 chat_id
 * @param {string} text - 消息内容
 * @returns {Promise<object>} - Telegram API 响应
 */
// @ts-check
export async function sendTelegramMessage(token, chatId, text) {
  console.log('[DEBUG] sendTelegramMessage 入参:', token, chatId, text);
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const params = new URLSearchParams({
    chat_id: String(chatId),
    text: text
  });
  try {
    const res = await fetch(`${url}?${params.toString()}`);
    /** @type {{ok: boolean, result?: any, error_code?: number, description?: string}} */
    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram API error:', data);
      throw new Error('Telegram API error: ' + JSON.stringify(data));
    }
    console.log('Telegram 消息发送成功:', data.result);
    return data;
  } catch (err) {
    console.error('发送 Telegram 消息异常:', err);
    throw err;
  }
} 