const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const TicketSettings = require('../../database/models/TicketSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-ayar')
        .setDescription('Ticket panel ayarlarını düzenler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName('logo')
                .setDescription('Panel sağ üst köşesinde görünecek logo URL\'si (thumbnail)')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('banner')
                .setDescription('Panel altında görünecek banner/resim URL\'si')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('baslik')
                .setDescription('Panel başlığı')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('aciklama')
                .setDescription('Panel açıklaması')
                .setRequired(false)
        )
        .addRoleOption(opt =>
            opt.setName('yetkili-rol')
                .setDescription('Biletlere erişecek yetkili rolü')
                .setRequired(false)
        )
        .addChannelOption(opt =>
            opt.setName('log-kanal')
                .setDescription('Kapatılan biletlerin loglanacağı kanal')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const logo       = interaction.options.getString('logo');
        const banner     = interaction.options.getString('banner');
        const baslik     = interaction.options.getString('baslik');
        const aciklama   = interaction.options.getString('aciklama');
        const rol        = interaction.options.getRole('yetkili-rol');
        const logKanal   = interaction.options.getChannel('log-kanal');

        // En az bir seçenek girilmiş mi?
        if (!logo && !banner && !baslik && !aciklama && !rol && !logKanal) {
            return interaction.editReply({ content: '❌ En az bir ayar seçeneği girmelisin!' });
        }

        const update = {};
        if (logo)      update.panelThumbnail = logo;
        if (banner)    update.panelBanner    = banner;
        if (baslik)    update.panelTitle     = baslik;
        if (aciklama)  update.panelDescription = aciklama;
        if (rol)       update.supportRoleId  = rol.id;
        if (logKanal)  update.logChannel     = logKanal.id;

        await TicketSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { $set: update },
            { upsert: true, returnDocument: 'after' }
        );

        const lines = [];
        if (logo)     lines.push(`🖼️ **Logo:** [Bağlantı](${logo})`);
        if (banner)   lines.push(`🎨 **Banner:** [Bağlantı](${banner})`);
        if (baslik)   lines.push(`📝 **Başlık:** ${baslik}`);
        if (aciklama) lines.push(`💬 **Açıklama:** ${aciklama}`);
        if (rol)      lines.push(`🛡️ **Yetkili Rol:** <@&${rol.id}>`);
        if (logKanal) lines.push(`📋 **Log Kanalı:** <#${logKanal.id}>`);

        await interaction.editReply({
            content: `✅ **Ticket ayarları güncellendi!**\n\n${lines.join('\n')}\n\n> 💡 Değişiklikleri görmek için \`/ticket-kur\` ile paneli yeniden kur.`
        });
    }
};
