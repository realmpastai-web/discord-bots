// In-memory warning storage (use Redis/DB for production)
const warningStore = new Map();

module.exports = {
  add(guildId, userId, reason, moderatorId) {
    const key = `${guildId}-${userId}`;
    const existing = warningStore.get(key) || [];
    existing.push({
      reason,
      moderatorId,
      timestamp: Date.now()
    });
    warningStore.set(key, existing);
    return existing.length;
  },

  get(guildId, userId) {
    const key = `${guildId}-${userId}`;
    return warningStore.get(key) || [];
  },

  clear(guildId, userId) {
    const key = `${guildId}-${userId}`;
    const existing = warningStore.get(key) || [];
    warningStore.delete(key);
    return existing.length;
  },

  getAllForGuild(guildId) {
    const results = [];
    for (const [key, warnings] of warningStore.entries()) {
      if (key.startsWith(`${guildId}-`)) {
        const userId = key.split('-')[1];
        results.push({ userId, warnings });
      }
    }
    return results;
  }
};
