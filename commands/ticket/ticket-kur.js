const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendTicketSetupPanel } = require('../../utils/ticketEngine');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-kur')
        .setDescription('Kanalda butonlu/dropdownlu Bilet Destek Paneli oluşturur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await sendTicketSetupPanel(interaction.channel);
        await interaction.reply({ content: '✅ Bilet destek paneli başarıyla kuruldu!', ephemeral: true });
    }
};
