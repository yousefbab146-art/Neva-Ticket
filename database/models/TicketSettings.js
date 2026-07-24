const mongoose = require('mongoose');

const TicketSettingsSchema = new mongoose.Schema({
    guildId:        { type: String, required: true, unique: true },
    ticketCategory: { type: String, default: null }, // Bilet kanallarının açılacağı kategori ID
    logChannel:     { type: String, default: null }, // HTML transcript log kanalı ID
    supportRoleId:  { type: String, default: null }, // Destek ekibi rolü ID
    
    // Kategori seçenekleri (Dropdown seçenekleri)
    categories: [{
        id:          String,
        label:       String,
        emoji:       String,
        description: String,
        supportRole: String,
        questions:   [String] // Modal form soruları
    }],

    // Bilet açılış panel bilgileri
    panelTitle:       { type: String, default: '🎟️ Destek Talebi Oluştur' },
    panelDescription: { type: String, default: 'Aşağıdaki menüden yardım almak istediğiniz konuyu seçerek hızlıca bilet açabilirsiniz.' },
    panelBanner:      { type: String, default: null },
    panelThumbnail:   { type: String, default: null } // Logo (sağ üst köşe)
}, { timestamps: true });

module.exports = mongoose.model('TicketSettings', TicketSettingsSchema);
