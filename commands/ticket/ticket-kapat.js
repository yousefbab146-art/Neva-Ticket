const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { handleTicketButtons } = require('../../utils/ticketEngine');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-kapat')
        .setDescription('Açık olan bilet kanalını kapatır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        interaction.customId = `ticket_close_${interaction.channel.id}`;
        await handleTicketButtons(interaction);
    }
};
