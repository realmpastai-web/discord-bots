module.exports = {
  name: 'ready',
  once: true,

  execute(client) {
    console.log(`✓ Bot logged in as ${client.user.tag}`);
    client.user.setActivity('/giveaway-create', { type: 'PLAYING' });
    
    // Load active giveaways from database
    const db = require('../database/connection');
    const activeGiveaways = db.prepare("SELECT * FROM giveaways WHERE status = 'active'").all();
    
    for (const giveaway of activeGiveaways) {
      const endTime = giveaway.end_time * 1000;
      if (endTime > Date.now()) {
        client.giveaways.scheduleGiveaway(giveaway.id, endTime);
      } else {
        // End immediately if past due
        client.giveaways.endGiveaway(giveaway.id);
      }
    }
    
    console.log(`Loaded ${activeGiveaways.length} active giveaways`);
  }
};
