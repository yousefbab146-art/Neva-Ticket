const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-ekle')
        .setDescription('Bilet kanalına yeni bir üye ekler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addUserOption(o => o.setName('kullanıcı').setDescription('Eklenecek kullanıcı').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('kullanıcı');
        await interaction.channel.permissionOverwrites.edit(target.id, {
            ViewChannel: true,
            SendMessages: true,
            AttachFiles: true
        });
        await interaction.reply({ content: `✅ <@${target.id}> bilete başarıyla eklendi.` });
    }
};
