const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('Neva Ticket Web Yönetim Paneli linkini gönderir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const dashboardUrl = process.env.DASHBOARD_URL || 'https://neva-ticket.onrender.com';

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎟️ Neva Ticket Web Yönetim Paneli')
            .setDescription('Aşağıdaki butona basarak Neva Ticket Web Paneline erişebilir, aktif biletleri inceleyebilir ve yetkili puanlarını takip edebilirsiniz.')
            .setFooter({ text: 'Neva Ticket System' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🛡️ Paneli Aç')
                .setStyle(ButtonStyle.Link)
                .setURL(dashboardUrl)
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
