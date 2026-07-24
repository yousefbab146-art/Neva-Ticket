const mongoose = require('mongoose');

const StaffRatingSchema = new mongoose.Schema({
    guildId:      { type: String, required: true },
    staffId:      { type: String, required: true },
    totalRatings: { type: Number, default: 0 },
    totalStars:   { type: Number, default: 0 },
    averageRating:{ type: Number, default: 5.0 }
}, { timestamps: true });

StaffRatingSchema.index({ guildId: 1, staffId: 1 }, { unique: true });

module.exports = mongoose.model('StaffRating', StaffRatingSchema);
