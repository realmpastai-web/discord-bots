const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get information about a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to get info about')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    
    try {
      const member = await interaction.guild.members.fetch(user.id);
      const warnings = await interaction.client.db.getWarnings(interaction.guild.id, user.id);
      
      const roles = member.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString())
        .slice(0, 10)
        .join(', ') || 'None';

      const embed = new EmbedBuilder()
        .setColor(member.displayColor || 0x5865f2)
        .setTitle('👤 User Information')
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: 'Username', value: user.tag, inline: true },
          { name: 'User ID', value: user.id, inline: true },
          { name: 'Nickname', value: member.nickname || 'None', inline: true },
          { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
          { name: 'Warnings', value: warnings.length.toString(), inline: true },
          { name: `Roles [${member.roles.cache.size - 1}]`, value: roles || 'None' }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Userinfo error:', error);
      await interaction.reply({
        content: '❌ Failed to fetch user information.',
        ephemeral: true,
      });
    }
  },
};
