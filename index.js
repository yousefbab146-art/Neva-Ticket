require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const connectDB = require('./database/connect');
const startDashboard = require('./dashboard/server');
const { registerCommands } = require('./handlers/commandHandler');
const { handleCategorySelect, handleModalSubmit, handleTicketButtons } = require('./utils/ticketEngine');

// ============================================================
// DISCORD BOT ALTYAPISI
// ============================================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

// ============================================================
// BOT HAZIR
// ============================================================
client.once('ready', async () => {
    console.log(`\n🎟️  Neva Ticket & Support Bot başlatıldı!`);
    console.log(`👤 Bot: ${client.user.tag}`);
    console.log(`🌐 Sunucu sayısı: ${client.guilds.cache.size}\n`);
    await registerCommands(client);
});

// ============================================================
// ETKİLEŞİM DİNLEYİCİSİ (Dropdown, Modal, Buton, Slash)
// ============================================================
client.on('interactionCreate', async interaction => {
    try {
        // 1. Kategori Dropdown Seçimi
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select_category') {
            return await handleCategorySelect(interaction);
        }

        // 2. Modal Form Gönderimi
        if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
            return await handleModalSubmit(interaction);
        }

        // 3. Bilet İçi ve Yıldız Puanlama Butonları
        if (interaction.isButton() && (interaction.customId.startsWith('ticket_') || interaction.customId.startsWith('rate_'))) {
            return await handleTicketButtons(interaction);
        }

        // 4. Slash Komutlar
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction);
        }
    } catch (err) {
        console.error(`[Etkileşim Hatası]:`, err.message);
        const reply = { content: `❌ İşlem hatası: \`${err.message}\``, ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply).catch(() => {});
        } else {
            await interaction.reply(reply).catch(() => {});
        }
    }
});

// ============================================================
// SİSTEMİ BAŞLAT
// ============================================================
async function startSystem() {
    await connectDB();
    startDashboard(client);

    if (!process.env.DISCORD_TOKEN) {
        console.error('❌ DISCORD_TOKEN .env dosyasında bulunamadı!');
        process.exit(1);
    }
    await client.login(process.env.DISCORD_TOKEN);
}

startSystem().catch(console.error);
