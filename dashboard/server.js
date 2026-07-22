const express = require('express');
const cors = require('cors');
const path = require('path');
const TicketSettings = require('../database/models/TicketSettings');
const TicketData = require('../database/models/TicketData');
const StaffRating = require('../database/models/StaffRating');

function startDashboard(client) {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(cors({ origin: '*' }));
    app.use(express.json());

    const buildPath = path.join(__dirname, 'public');
    if (require('fs').existsSync(buildPath)) {
        app.use(express.static(buildPath));
    }

    // Status API
    app.get('/api/status', (req, res) => {
        res.json({
            online: client.isReady(),
            tag: client.user?.tag || 'Bilinmiyor',
            guilds: client.guilds.cache.size,
            uptime: process.uptime()
        });
    });

    // Current Guild Info & Settings
    app.get('/api/guilds/current', async (req, res) => {
        const guild = client.guilds.cache.first();
        if (!guild) return res.status(404).json({ error: 'Bot bir sunucuda değil.' });

        let settings = await TicketSettings.findOne({ guildId: guild.id });
        if (!settings) {
            settings = await TicketSettings.create({ guildId: guild.id });
        }

        const roles = guild.roles.cache.map(r => ({ id: r.id, name: r.name, color: r.hexColor }));
        const channels = guild.channels.cache
            .filter(c => c.isTextBased())
            .map(c => ({ id: c.id, name: c.name }));

        const categories = guild.channels.cache
            .filter(c => c.type === 4)
            .map(c => ({ id: c.id, name: c.name }));

        const openTicketsCount = await TicketData.countDocuments({ guildId: guild.id, status: 'open' });
        const totalTicketsCount = await TicketData.countDocuments({ guildId: guild.id });

        res.json({
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL({ dynamic: true }),
            memberCount: guild.memberCount,
            openTickets: openTicketsCount,
            totalTickets: totalTicketsCount,
            botPing: client.ws.ping,
            botUptime: client.uptime,
            roles,
            channels,
            categories,
            settings
        });
    });

    // Active & Closed Tickets API
    app.get('/api/tickets', async (req, res) => {
        const guild = client.guilds.cache.first();
        if (!guild) return res.json([]);
        const tickets = await TicketData.find({ guildId: guild.id }).sort({ createdAt: -1 }).limit(50);
        res.json(tickets);
    });

    // Staff Rating Leaderboard API
    app.get('/api/ratings', async (req, res) => {
        const guild = client.guilds.cache.first();
        if (!guild) return res.json([]);
        const ratings = await StaffRating.find({ guildId: guild.id }).sort({ averageRating: -1, totalRatings: -1 });
        res.json(ratings);
    });

    // Save Settings API
    app.post('/api/settings', async (req, res) => {
        const guild = client.guilds.cache.first();
        if (!guild) return res.status(404).json({ error: 'Sunucu bulunamadı' });

        try {
            const settings = await TicketSettings.findOneAndUpdate(
                { guildId: guild.id },
                { $set: req.body },
                { upsert: true, new: true }
            );
            res.json({ success: true, settings });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.get('*', (req, res) => {
        const indexPath = path.join(__dirname, 'public', 'index.html');
        if (require('fs').existsSync(indexPath)) res.sendFile(indexPath);
        else res.json({ message: 'Neva Ticket API aktif.' });
    });

    app.listen(PORT, () => {
        console.log(`[Dashboard] Neva Ticket Web paneli http://localhost:${PORT} adresinde aktif!`);

        // Self-ping to keep awake
        const RENDER_URL = process.env.DASHBOARD_URL || `http://localhost:${PORT}`;
        setInterval(() => {
            fetch(`${RENDER_URL}/api/status`).catch(() => {});
        }, 5 * 60 * 1000);
    });
}

module.exports = startDashboard;
