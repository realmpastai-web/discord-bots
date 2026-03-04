module.exports = {
  name: 'guildCreate',

  execute(guild, client) {
    console.log(`✅ Joined guild: ${guild.name} (${guild.id})`);
    client.db.createGuildSettings(guild.id);
  }
};