const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

async function registerCommands(client) {
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    
    if (!fs.existsSync(commandsPath)) return;

    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        if (fs.statSync(folderPath).isDirectory()) {
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);
                if (command.data && command.execute) {
                    client.commands.set(command.data.name, command);
                    commands.push(command.data.toJSON());
                }
            }
        }
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    try {
        console.log(`[Bot] ${commands.length} slash komutu Discord REST API'ye kaydediliyor...`);
        const guildId = process.env.GUILD_ID;
        const clientId = process.env.DISCORD_CLIENT_ID;

        if (guildId && clientId) {
            try {
                await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
                console.log(`[Bot] ${commands.length} slash komutu sunucuya (${guildId}) kaydoldu.`);
            } catch (e) {
                console.log(`[Bot] Sunucu kaydı başarısız (${e.message}), küresel (Global) olarak kaydediliyor...`);
                await rest.put(Routes.applicationCommands(clientId), { body: commands });
                console.log(`[Bot] ${commands.length} slash komutu küresel olarak kaydoldu.`);
            }
        } else if (clientId) {
            await rest.put(Routes.applicationCommands(clientId), { body: commands });
            console.log(`[Bot] ${commands.length} slash komutu küresel olarak kaydoldu.`);
        }
    } catch (err) {
        console.error('[Bot] Komut kaydı hatası:', err.message);
    }
}

module.exports = { registerCommands };
