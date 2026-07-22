const { AttachmentBuilder } = require('discord.js');

/**
 * Discord bilet sohbetinin mesajlarını çekip harika bir HTML Transcript dosyasına dönüştürür.
 */
async function generateHTMLTranscript(channel, ticketInfo) {
    try {
        const fetchedMessages = await channel.messages.fetch({ limit: 100 });
        const messages = Array.from(fetchedMessages.values()).reverse();

        let messagesHtml = '';

        messages.forEach(msg => {
            if (msg.author.bot && msg.components?.length > 0 && !msg.content) return; // Buton paneli mesajını atla

            const avatarUrl = msg.author.displayAvatarURL({ dynamic: true });
            const timestamp = new Date(msg.createdTimestamp).toLocaleString('tr-TR');
            const content = msg.content ? escapeHtml(msg.content) : '';

            let attachmentsHtml = '';
            if (msg.attachments.size > 0) {
                msg.attachments.forEach(att => {
                    if (att.contentType?.startsWith('image/')) {
                        attachmentsHtml += `<br><img src="${att.url}" style="max-width: 400px; border-radius: 8px; margin-top: 8px;" />`;
                    } else {
                        attachmentsHtml += `<br><a href="${att.url}" target="_blank" style="color: #00a8fc;">📎 ${att.name}</a>`;
                    }
                });
            }

            messagesHtml += `
            <div class="chat-message">
                <img src="${avatarUrl}" class="avatar" alt="avatar" />
                <div class="message-body">
                    <div class="author-info">
                        <span class="username">${escapeHtml(msg.author.username)}</span>
                        <span class="timestamp">${timestamp}</span>
                    </div>
                    <div class="message-content">${content}${attachmentsHtml}</div>
                </div>
            </div>`;
        });

        const fullHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Bilet Sohbet Yedeği - ${channel.name}</title>
<style>
    body { background-color: #313338; color: #dbdee1; font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 24px; margin: 0; }
    .header { background-color: #2b2d31; padding: 20px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #5865f2; }
    .header h1 { margin: 0 0 8px 0; font-size: 1.5rem; color: #fff; }
    .header p { margin: 4px 0; font-size: 0.9rem; color: #949ba4; }
    .chat-container { display: flex; flex-direction: column; gap: 16px; }
    .chat-message { display: flex; gap: 16px; padding: 8px 12px; border-radius: 4px; transition: background 0.15s; }
    .chat-message:hover { background-color: #2e3035; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
    .message-body { display: flex; flex-direction: column; }
    .author-info { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
    .username { font-weight: 600; color: #f2f3f5; font-size: 1rem; }
    .timestamp { font-size: 0.75rem; color: #949ba4; }
    .message-content { font-size: 0.95rem; line-height: 1.375rem; white-space: pre-wrap; word-break: break-word; }
</style>
</head>
<body>
    <div class="header">
        <h1>🎟️ Bilet Sohbet Yedeği: #${channel.name}</h1>
        <p><strong>Kullanıcı:</strong> ${ticketInfo?.userTag || ticketInfo?.userId}</p>
        <p><strong>Kategori:</strong> ${ticketInfo?.category || 'Genel'}</p>
        <p><strong>Kapatılma Tarihi:</strong> ${new Date().toLocaleString('tr-TR')}</p>
    </div>
    <div class="chat-container">
        ${messagesHtml || '<p>Sohbet kaydı boş.</p>'}
    </div>
</body>
</html>`;

        const buffer = Buffer.from(fullHtml, 'utf-8');
        return new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.html` });
    } catch (e) {
        console.error('[TranscriptEngine] Hata:', e.message);
        return null;
    }
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

module.exports = { generateHTMLTranscript };
