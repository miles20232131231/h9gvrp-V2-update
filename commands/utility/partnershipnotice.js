const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('partnership-notice')
        .setDescription('Sends a partnership notice.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.MuteMembers),

    async execute(interaction) {
        try {
            // Create the embed message
            const embed = new EmbedBuilder()
                .setTitle('H9GVRP | Partnership Notice')
                .setDescription('TIRED OF PINGS? Right-click on the server logo, click on notifications settings, then mute it!')
                .setColor('#89cff0')
                .setThumbnail("https://cdn.discordapp.com/icons/1231665533653352500/68bd0fb834d88b198910d85cd60056ad.png?size=4096")
                .setFooter({
                    text: 'H9GVRP',
                    iconURL: 'https://cdn.discordapp.com/icons/1231665533653352500/68bd0fb834d88b198910d85cd60056ad.png?size=4096'
                });

            // Send the embed message to the current channel
            await interaction.channel.send({ embeds: [embed] });

            // Confirm command execution
            await interaction.reply({ content: 'Partnership notice sent.', ephemeral: true });
        } catch (error) {
            console.error('Error executing command:', error);
            await interaction.reply({ content: 'Failed to execute command. Please try again later.', ephemeral: true });
        }
    },
};
