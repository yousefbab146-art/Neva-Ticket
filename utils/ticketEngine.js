const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const TicketSettings = require('../database/models/TicketSettings');
const TicketData = require('../database/models/TicketData');
const StaffRating = require('../database/models/StaffRating');
const { generateHTMLTranscript } = require('./transcriptEngine');

/**
 * Bilet Kurulum Mesajını Gönderir (/ticket-kur) - Kompakt & Sleek Tasarım
 */
async function sendTicketSetupPanel(channel) {
    const settings = await TicketSettings.findOne({ guildId: channel.guild.id });

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setAuthor({
            name: channel.guild.name + ' • Destek Merkezi',
            iconURL: channel.guild.iconURL({ dynamic: true }) ?? undefined
        })
        .setTitle('🎫  DESTEK TALEBİ OLUŞTUR')
        .setThumbnail(settings?.panelThumbnail || channel.guild.iconURL({ dynamic: true, size: 256 }) || null)
        .setDescription(
            '```\n' +
            '  Merhaba! Sana yardımcı olmak için buradayız.\n' +
            '```\n' +
            '> Aşağıdaki **kategori menüsünden** seni en iyi tanımlayan\n' +
            '> seçeneği seç. Biletini saniyeler içinde oluşturuyoruz.\n\u200b'
        )
        .addFields(
            {
                name: '╔═══════════════════════════════╗',
                value: '\u200b',
                inline: false
            },
            {
                name: '🕙  Mesai Saatleri',
                value: '```\n10:00 — 22:00\n```',
                inline: true
            },
            {
                name: '🛡️  Gizlilik',
                value: '```\nUçtan Uca Şifreli\n```',
                inline: true
            },
            {
                name: '⚡  Yanıt Süresi',
                value: '```\nOrtalama 15 dk\n```',
                inline: true
            },
            {
                name: '╚═══════════════════════════════╝',
                value: '\u200b',
                inline: false
            },
            {
                name: '📋  Kategoriler',
                value: 
                    '> 💻  **Teknik Destek** — Yazılım & sistem sorunları\n' +
                    '> 💳  **Satın Alım / VIP** — Ödeme & üyelik işlemleri\n' +
                    '> ⚠️  **Şikayet** — Kural ihlali bildirimleri\n' +
                    '> ❓  **Genel** — Diğer tüm sorular',
                inline: false
            }
        )
        .setImage(settings?.panelBanner || 'https://i.imgur.com/your-banner.png')
        .setFooter({
            text: `${channel.guild.name}  •  Neva Ticket System  •  Kaliteli Destek`,
            iconURL: channel.guild.iconURL({ dynamic: true }) ?? undefined
        })
        .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_select_category')
        .setPlaceholder('🎫  Kategori seç ve biletini aç...')
        .addOptions([
            {
                label: 'Teknik & Sistem Desteği',
                value: 'tech',
                description: 'Yazılım, sunucu ve teknik sorunlar',
                emoji: '💻'
            },
            {
                label: 'Ödeme & VIP Üyelik',
                value: 'billing',
                description: 'VIP paketler, bağış ve ödeme bildirimleri',
                emoji: '💳'
            },
            {
                label: 'Şikayet & Oyuncu Bildirimi',
                value: 'complaint',
                description: 'Kural ihlali veya yetkili bildirimi',
                emoji: '⚠️'
            },
            {
                label: 'Genel Soru & İletişim',
                value: 'general',
                description: 'Her türlü soru ve bilgi talebi',
                emoji: '❓'
            }
        ]);

    const rowSelect = new ActionRowBuilder().addComponents(selectMenu);

    await channel.send({ embeds: [embed], components: [rowSelect] });
}

/**
 * Dropdown Seçimi Yapıldığında Modal Form Açar
 */
async function handleCategorySelect(interaction) {
    const selectedCategory = interaction.values[0];

    let modalTitle = 'Bilet Başvuru Formu';
    let label1 = 'Sorununuz veya Talebiniz';

    if (selectedCategory === 'tech') { modalTitle = '💻 Teknik Destek Formu'; label1 = 'Karşılaştığınız teknik sorun nedir?'; }
    if (selectedCategory === 'billing') { modalTitle = '💳 Satın Alım Formu'; label1 = 'Almak istediğiniz hizmet veya paket nedir?'; }
    if (selectedCategory === 'complaint') { modalTitle = '⚠️ Şikayet Formu'; label1 = 'Şikayet ettiğiniz konu/kişi nedir?'; }

    const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${selectedCategory}`)
        .setTitle(modalTitle);

    const input1 = new TextInputBuilder()
        .setCustomId('question_1')
        .setLabel(label1)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Detaylıca açıklayınız...')
        .setRequired(true);

    const input2 = new TextInputBuilder()
        .setCustomId('question_2')
        .setLabel('Eklemek İstediğiniz Detay (İsteğe Bağlı)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(input1),
        new ActionRowBuilder().addComponents(input2)
    );

    await interaction.showModal(modal);
}

/**
 * Modal Form Gönderildiğinde Bilet Kanalını Oluşturur
 */
async function handleModalSubmit(interaction) {
    const categoryKey = interaction.customId.replace('ticket_modal_', '');
    const answer1 = interaction.fields.getTextInputValue('question_1');
    const answer2 = interaction.fields.getTextInputValue('question_2') || 'Belirtilmedi';

    const guild = interaction.guild;
    const member = interaction.member;

    // Aktif Bilet Kontrolü
    const existingTicket = await TicketData.findOne({ guildId: guild.id, userId: member.id, status: 'open' });
    if (existingTicket && guild.channels.cache.has(existingTicket.channelId)) {
        return interaction.reply({ content: `❌ Zaten açık bir biletiniz var: <#${existingTicket.channelId}>`, ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const settings = await TicketSettings.findOne({ guildId: guild.id });
    const categoryNames = { tech: 'Teknik Destek', billing: 'Satın Alım', complaint: 'Şikayet', general: 'Genel Soru' };
    const catName = categoryNames[categoryKey] || 'Destek';

    // Kanal İzinleri: Sadece Bilet Sahibi ve Yetkili Rol görebilir!
    const permissionOverwrites = [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
    ];

    if (settings?.supportRoleId && guild.roles.cache.has(settings.supportRoleId)) {
        permissionOverwrites.push({
            id: settings.supportRoleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
        });
    }

    try {
        const ticketChannel = await guild.channels.create({
            name: `bilet-${member.user.username}`,
            type: ChannelType.GuildText,
            parent: settings?.ticketCategory || interaction.channel.parentId || null,
            permissionOverwrites
        });

        // Veritabanına kaydet
        await TicketData.create({
            guildId: guild.id,
            channelId: ticketChannel.id,
            userId: member.id,
            userTag: member.user.tag,
            category: catName,
            status: 'open',
            formAnswers: [
                { question: 'Talep Detayı', answer: answer1 },
                { question: 'Ek Detay', answer: answer2 }
            ]
        });

        // Kanal İçi Karşılama Embed'i
        const embed = new EmbedBuilder()
            .setColor('#10B981')
            .setTitle(`🎟️ Destek Talebi: ${catName}`)
            .setDescription(`Merhaba <@${member.id}>! Destek ekibimiz en kısa sürede sizinle ilgilenecektir.\n\n**📝 Başvuru Formu Yanıtlarınız:**\n• **Talep:** ${answer1}\n• **Ek Detay:** ${answer2}`)
            .addFields(
                { name: '👤 Talep Eden', value: `<@${member.id}>`, inline: true },
                { name: '📂 Kategori', value: catName, inline: true }
            )
            .setFooter({ text: 'Bileti kapatmak veya üstlenmek için aşağıdaki butonları kullanın.' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`ticket_close_${ticketChannel.id}`).setLabel('🔒 Kapat').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`ticket_claim_${ticketChannel.id}`).setLabel('👤 Talebi Üstlen').setStyle(ButtonStyle.Success)
        );

        await ticketChannel.send({ content: `<@${member.id}> ${settings?.supportRoleId ? `<@&${settings.supportRoleId}>` : ''}`, embeds: [embed], components: [row] });
        await interaction.editReply({ content: `✅ Biletiniz oluşturuldu: <#${ticketChannel.id}>` });

    } catch (e) {
        console.error('[Ticket] Oluşturma hatası:', e.message);
        await interaction.editReply({ content: '❌ Bilet kanalı oluşturulurken hata meydana geldi.' });
    }
}

/**
 * Bilet İçi Butonları Dinler (Kapatma, Üstlenme)
 */
async function handleTicketButtons(interaction) {
    const customId = interaction.customId;

    // 1. Talebi Üstlenme (Claim)
    if (customId.startsWith('ticket_claim_')) {
        const ticketData = await TicketData.findOne({ channelId: interaction.channel.id });
        if (!ticketData) return interaction.reply({ content: '❌ Bilet kaydı bulunamadı.', ephemeral: true });

        if (ticketData.claimedBy) {
            return interaction.reply({ content: `❌ Bu talebi zaten <@${ticketData.claimedBy}> üstlendi!`, ephemeral: true });
        }

        ticketData.claimedBy = interaction.user.id;
        await ticketData.save();

        const embed = new EmbedBuilder()
            .setColor('#3B82F6')
            .setDescription(`✅ Bu destek talebini <@${interaction.user.id}> yetkilisi üstlendi!`);

        await interaction.reply({ embeds: [embed] });
    }

    // 2. Bileti Kapatma
    if (customId.startsWith('ticket_close_')) {
        const ticketData = await TicketData.findOne({ channelId: interaction.channel.id });
        if (!ticketData) return interaction.reply({ content: '❌ Bilet kaydı bulunamadı.', ephemeral: true });

        await interaction.reply({ content: '🔒 Bilet kapatılıyor, sohbet yedeği çıkarılıyor...' });

        ticketData.status = 'closed';
        ticketData.closedBy = interaction.user.id;
        await ticketData.save();

        const settings = await TicketSettings.findOne({ guildId: interaction.guild.id });

        // HTML Transcript Üret
        const attachment = await generateHTMLTranscript(interaction.channel, ticketData);

        if (settings?.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(settings.logChannel);
            if (logChannel && attachment) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#EF4444')
                    .setTitle(`🔒 Bilet Kapatıldı: #${interaction.channel.name}`)
                    .addFields(
                        { name: '👤 Açan Kullanıcı', value: `<@${ticketData.userId}>`, inline: true },
                        { name: '🛡️ Kapatan Yetkili', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '👤 Üstlenen Yetkili', value: ticketData.claimedBy ? `<@${ticketData.claimedBy}>` : 'Yok', inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed], files: [attachment] });
            }
        }

        // 5 Yıldızlı Puanlama Anket Mesajı Açan Kullanıcıya Atılır
        try {
            const user = await interaction.client.users.fetch(ticketData.userId);
            if (user && ticketData.claimedBy) {
                const rateEmbed = new EmbedBuilder()
                    .setColor('#F59E0B')
                    .setTitle('⭐ Destek Talebi Değerlendirmesi')
                    .setDescription(`Biletiniz kapatıldı. <@${ticketData.claimedBy}> yetkilimizin verdiği destekten memnun kaldınız mı?\nLütfen 1 ile 5 arasında yıldız seçin:`);

                const rateRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`rate_1_${ticketData.claimedBy}`).setLabel('⭐ 1').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`rate_2_${ticketData.claimedBy}`).setLabel('⭐ 2').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`rate_3_${ticketData.claimedBy}`).setLabel('⭐ 3').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`rate_4_${ticketData.claimedBy}`).setLabel('⭐ 4').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`rate_5_${ticketData.claimedBy}`).setLabel('⭐ 5 (Mükemmel)').setStyle(ButtonStyle.Success)
                );

                await user.send({ embeds: [rateEmbed], components: [rateRow] }).catch(() => {});
            }
        } catch (e) {}

        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    }

    // 3. Yıldız Puanlama Etkileşimi
    if (customId.startsWith('rate_')) {
        const [_, starsStr, staffId] = customId.split('_');
        const stars = parseInt(starsStr);

        let rating = await StaffRating.findOne({ guildId: interaction.guild?.id || 'global', staffId });
        if (!rating) {
            rating = await StaffRating.create({ guildId: interaction.guild?.id || 'global', staffId });
        }

        rating.totalRatings += 1;
        rating.totalStars += stars;
        rating.averageRating = parseFloat((rating.totalStars / rating.totalRatings).toFixed(1));
        await rating.save();

        await interaction.update({ content: `⭐ Değerlendirmeniz kaydedildi (${stars} Yıldız). Teşekkür ederiz!`, embeds: [], components: [] });
    }
}

module.exports = {
    sendTicketSetupPanel,
    handleCategorySelect,
    handleModalSubmit,
    handleTicketButtons
};
