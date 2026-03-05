module.exports = {
  name: 'guildCreate',

  execute(guild) {
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);
  }
};
