const { EmbedBuilder } = require('discord.js');
const db = require('../database/connection');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    // Handle giveaway entry button
    if (interaction.customId.startsWith('giveaway_enter_')) {
      const giveawayId = parseInt(interaction.customId.split('_')[2]);
      
      const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(giveawayId);
      
      if (!giveaway || giveaway.status !== 'active') {
        return interaction.reply({
          content: '❌ This giveaway is no longer active.',
          ephemeral: true
        });
      }

      // Check requirements
      const requirements = JSON.parse(giveaway.requirements || '{}');
      
      // Check role requirement
      if (requirements.roleId) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.roles.cache.has(requirements.roleId)) {
          const role = await interaction.guild.roles.fetch(requirements.roleId);
          return interaction.reply({
            content: `❌ You need the **${role?.name || 'required'}** role to enter this giveaway.`,
            ephemeral: true
          });
        }
      }

      // Check account age
      if (requirements.minAccountAge > 0) {
        const accountAge = (Date.now() - interaction.user.createdTimestamp) / (1000 * 60 * 60 * 24);
        if (accountAge < requirements.minAccountAge) {
          return interaction.reply({
            content: `❌ Your account must be at least **${requirements.minAccountAge} days** old to enter.`,
            ephemeral: true
          });
        }
      }

      // Check if already entered
      const existingEntry = db.prepare('SELECT * FROM giveaway_entries WHERE giveaway_id = ? AND user_id = ?').get(giveawayId, interaction.user.id);
      
      if (existingEntry) {
        // Remove entry (toggle off)
        const removed = await client.giveaways.removeEntry(giveawayId, interaction.user.id);
        if (removed) {
          return interaction.reply({
            content: '👋 You have left the giveaway.',
            ephemeral: true
          });
        }
      } else {
        // Add entry
        const added = await client.giveaways.addEntry(giveawayId, interaction.user.id, interaction.user.username);
        if (added) {
          const entries = db.prepare('SELECT COUNT(*) as count FROM giveaway_entries WHERE giveaway_id = ?').get(giveawayId).count;
          return interaction.reply({
            content: `🎉 You have entered the giveaway! There are now ${entries} entries.`,
            ephemeral: true
          });
        }
      }
    }
  }
};
