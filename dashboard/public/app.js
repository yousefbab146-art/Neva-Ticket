// ============================================================
// NEVA TICKET DASHBOARD - app.js
// ============================================================

const API = '';
let currentGuildId = null;

const app = {
    init() {
        this.setupNavigation();
        this.fetchGuildData();
        lucide.createIcons();
    },

    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        const pages = document.querySelectorAll('.page');

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                pages.forEach(p => {
                    p.classList.remove('active', 'animate-fade-in');
                    if (p.id === targetId) {
                        p.classList.add('active');
                        setTimeout(() => p.classList.add('animate-fade-in'), 10);
                    }
                });

                if (targetId === 'tickets') this.loadTickets();
                if (targetId === 'ratings') this.loadRatings();
            });
        });
    },

    async fetchGuildData() {
        try {
            const res = await fetch(`${API}/api/guilds/current`);
            const data = await res.json();
            
            if (data.error) {
                this.showToast('Veri yüklenemedi: ' + data.error, 'error');
                return;
            }

            currentGuildId = data.id;
            
            document.getElementById('currentGuildName').innerText = data.name;
            document.getElementById('stat-open-tickets').innerText = data.openTickets || 0;
            document.getElementById('stat-total-tickets').innerText = data.totalTickets || 0;
            document.getElementById('bot-ping').innerText = `${data.botPing}ms`;
            
            let totalSeconds = (data.botUptime / 1000);
            let days = Math.floor(totalSeconds / 86400);
            let hours = Math.floor(totalSeconds / 3600) % 24;
            let minutes = Math.floor(totalSeconds / 60) % 60;
            document.getElementById('bot-uptime').innerText = `${days}g ${hours}s ${minutes}d`;

            this.populateSelects(data.channels, data.categories, data.roles);

            const s = data.settings || {};
            this.renderSettings(s);
            this.loadRatings();

        } catch (err) {
            console.error(err);
            this.showToast('Sunucuya bağlanılamadı.', 'error');
        }
    },

    populateSelects(channels = [], categories = [], roles = []) {
        const channelSelects = document.querySelectorAll('.channel-select');
        const categorySelects = document.querySelectorAll('.category-select');
        const roleSelects = document.querySelectorAll('.role-select');

        const channelOptionsHtml = '<option value="">-- Kanal Seçilmedi --</option>' + 
            channels.map(c => `<option value="${c.id}"># ${c.name}</option>`).join('');

        const categoryOptionsHtml = '<option value="">-- Kategori Seçilmedi --</option>' + 
            categories.map(c => `<option value="${c.id}">📁 ${c.name}</option>`).join('');

        const roleOptionsHtml = '<option value="">-- Rol Seçilmedi --</option>' + 
            roles.map(r => `<option value="${r.id}">@ ${r.name}</option>`).join('');

        channelSelects.forEach(select => select.innerHTML = channelOptionsHtml);
        categorySelects.forEach(select => select.innerHTML = categoryOptionsHtml);
        roleSelects.forEach(select => select.innerHTML = roleOptionsHtml);
    },

    renderSettings(settings) {
        if (!settings) return;
        document.getElementById('set-category').value = settings.ticketCategory || '';
        document.getElementById('set-role').value = settings.supportRoleId || '';
        document.getElementById('set-log').value = settings.logChannel || '';
        document.getElementById('set-title').value = settings.panelTitle || '🎟️ Neva Destek Talebi Oluştur';
        document.getElementById('set-desc').value = settings.panelDescription || 'Aşağıdaki menüden yardım almak istediğiniz konuyu seçerek hızlıca bilet açabilirsiniz.';
        document.getElementById('set-banner').value = settings.panelBanner || '';
        document.getElementById('set-thumbnail').value = settings.panelThumbnail || '';
    },

    async saveSettings() {
        const payload = {
            ticketCategory: document.getElementById('set-category').value || null,
            supportRoleId: document.getElementById('set-role').value || null,
            logChannel: document.getElementById('set-log').value || null,
            panelTitle: document.getElementById('set-title').value.trim() || '🎟️ Neva Destek Talebi Oluştur',
            panelDescription: document.getElementById('set-desc').value.trim(),
            panelBanner: document.getElementById('set-banner').value.trim() || null,
            panelThumbnail: document.getElementById('set-thumbnail').value.trim() || null
        };

        try {
            const res = await fetch(`${API}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                this.showToast('Bilet ayarları kaydedildi!', 'success');
                this.fetchGuildData();
            }
        } catch (e) {
            this.showToast('Hata oluştu.', 'error');
        }
    },

    async loadTickets() {
        try {
            const res = await fetch(`${API}/api/tickets`);
            const data = await res.json();

            const tbody = document.getElementById('tickets-table-body');
            tbody.innerHTML = '';

            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted)">Henüz bilet kaydı yok.</td></tr>';
                return;
            }

            data.forEach(t => {
                const date = new Date(t.createdAt).toLocaleString('tr-TR');
                const badgeClass = t.status === 'open' ? 'success' : 'danger';
                const statusText = t.status === 'open' ? 'Açık' : 'Kapalı';
                const ratingText = t.rating ? `${t.rating} ⭐` : 'Puanlanmadı';

                tbody.innerHTML += `
                    <tr>
                        <td><span class="status-badge ${badgeClass}">${statusText}</span></td>
                        <td>${t.userTag || t.userId}</td>
                        <td>${t.category}</td>
                        <td>${t.claimedBy ? `<@${t.claimedBy}>` : 'Henüz Yok'}</td>
                        <td>${ratingText}</td>
                        <td>${date}</td>
                    </tr>
                `;
            });
            lucide.createIcons();
        } catch (e) {
            console.error(e);
        }
    },

    async loadRatings() {
        try {
            const res = await fetch(`${API}/api/ratings`);
            const data = await res.json();

            const tbody = document.getElementById('ratings-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted)">Henüz yetkili puanlaması yok.</td></tr>';
                return;
            }

            let avgSum = 0;
            data.forEach((r, i) => {
                avgSum += r.averageRating;
                tbody.innerHTML += `
                    <tr>
                        <td style="font-weight: 700">#${i + 1}</td>
                        <td><@${r.staffId}> (\`${r.staffId}\`)</td>
                        <td>${r.totalRatings} Değerlendirme</td>
                        <td><strong style="color: #f59e0b">${r.averageRating} ⭐</strong> / 5.0</td>
                    </tr>
                `;
            });

            if (data.length > 0) {
                const overallAvg = (avgSum / data.length).toFixed(1);
                document.getElementById('stat-avg-rating').innerText = `${overallAvg} ⭐`;
            }
            lucide.createIcons();
        } catch (e) {
            console.error(e);
        }
    },

    async refreshData() {
        await this.fetchGuildData();
        await this.loadTickets();
        this.showToast('Veriler güncellendi', 'success');
    },

    showToast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 'alert-circle';
        
        toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${msg}</span>`;
        container.appendChild(toast);
        lucide.createIcons();
        
        setTimeout(() => {
            toast.style.animation = 'fadeIn 0.3s reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
