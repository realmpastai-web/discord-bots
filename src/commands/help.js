const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🛡️ Shield Moderation Bot — Help')
      .setDescription('Professional moderation tools for your server')
      .addFields(
        {
          name: '🔨 Punishment Commands',
          value: `
\`/ban\` — Ban a user from the server
\`/kick\` — Kick a user from the server
\`/unban\` — Unban a user by ID
\`/timeout\` — Temporarily mute a user
          `.trim(),
        },
        {
          name: '⚠️ Warning System',
          value: `
\`/warn\` — Issue a warning to a user
\`/warnings\` — View warnings for a user
\`/clearwarn\` — Clear warnings for a user
          `.trim(),
        },
        {
          name: '🧹 Message Management',
          value: `
\`/purge\` — Delete multiple messages (1-100)
\`/slowmode\` — Set channel slowmode
          `.trim(),
        },
        {
          name: '🤖 Auto-Moderation',
          value: `
\`/automod\` — Configure auto-moderation settings
          `.trim(),
        },
        {
          name: '📊 Other',
          value: `
\`/modlogs\` — View recent moderation actions
\`/userinfo\` — Get information about a user
          `.trim(),
        }
      )
      .setFooter({ text: 'Shield Bot v1.0 — Built by QuantBitRealm' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
