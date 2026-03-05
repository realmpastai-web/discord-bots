module.exports = {
  name: 'interactionCreate',

  async execute(interaction, services) {
    const { leadService, followUpService, logger } = services;

    // Handle slash commands
    if (interaction.isCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, { leadService, followUpService, logger });
      } catch (error) {
        logger.error('Command execution error:', { command: interaction.commandName, error: error.message });
        
        const reply = {
          content: '❌ There was an error executing this command!',
          ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      if (interaction.customId === 'export_leads') {
        await interaction.reply({
          content: '📥 Export feature coming soon! Use `/lead-list` to view your leads.',
          ephemeral: true
        });
      }
    }
  },
};
