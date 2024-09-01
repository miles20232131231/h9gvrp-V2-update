const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, PermissionsBitField } = require('discord.js');
const path = require('path');
const fs = require('fs');

const staffProfileDirPath = path.join(__dirname, '../../data/staffProfiles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startup')
        .setDescription('Sends a startup embed')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.MuteMembers)
        .addIntegerOption(option =>
            option.setName('reactions')
                .setDescription('Amount of reactions for the session to occur')
                .setRequired(true)),
    async execute(interaction) {
        const reactions = interaction.options.getInteger('reactions');
        const user = interaction.user;
        const now = new Date();

        const embed = new EmbedBuilder()
            .setTitle('H9GVRP | Session Startup')
            .setDescription(` <@${interaction.user.id}> started a session! Are you guys ready to start the session? Kindly make sure to check out <#1271353605395582996> for important information before participating.

                > For registering a vehicle, /register.This command and many more command may be run in <#1271363695087190107>.
                > Click on the button below to view the banned vehicle list.

                The session shall begin once this hits **__${reactions}+__**`)
            .setColor(`#89cff0`)
            .setFooter({
                text: 'H9GVRP',
                iconURL: 'https://cdn.discordapp.com/icons/1231665533653352500/68bd0fb834d88b198910d85cd60056ad.png?size=4096'
            });

        const bannedVehicleButton = new ButtonBuilder()
            .setCustomId('banned_vehicle_list')
            .setLabel('Banned Vehicle List')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder()
            .addComponents(bannedVehicleButton);

        const message = await interaction.channel.send({
            content: '@everyone',
            embeds: [embed],
            components: [row]
        });

        await message.react('✅');

        const newEmbed = new EmbedBuilder()
            .setTitle("Session Startup")
            .setDescription(`<@${interaction.user.id}> has started up a session.`);

        const targetChannel = await interaction.client.channels.fetch('1271365805644189737');
        await targetChannel.send({ embeds: [newEmbed] });

        const reactionFilter = (reaction, user) => reaction.emoji.name === '✅';
        const reactionCollector = message.createReactionCollector({ filter: reactionFilter, time: 86400000 });

        reactionCollector.on('collect', (reaction) => {
            console.log(`Collected ${reaction.count} reactions`);
            if (reaction.count >= reactions) {
                const settingUpEmbed = new EmbedBuilder()
                    .setDescription('Setting up!');

                interaction.channel.send({ embeds: [settingUpEmbed] });
                reactionCollector.stop();
            }
        });

        reactionCollector.on('end', collected => {
            console.log(`Collector ended. Total reactions: ${collected.size}`);
        });

        const buttonFilter = i => i.customId === 'banned_vehicle_list';
        const buttonCollector = message.createMessageComponentCollector({ filter: buttonFilter, componentType: ComponentType.Button, time: 9999999 });

        buttonCollector.on('collect', async i => {
            await i.deferUpdate();
            await i.followUp({ content: '**https://docs.google.com/document/d/152WxeUM5KvpiZNh7T828YMph3qDFom06cWNxQA0UKf4/edit**', ephemeral: true });
        });

        // Record the session details
        const staffProfileFilePath = path.join(staffProfileDirPath, `${user.id}.json`);
        let staffProfileData = { sessionsStarted: 0, sessionsEnded: 0 };

        if (fs.existsSync(staffProfileFilePath)) {
            staffProfileData = JSON.parse(fs.readFileSync(staffProfileFilePath, 'utf8'));
        }

        staffProfileData.sessionsStarted += 1;
        staffProfileData.sessions = staffProfileData.sessions || [];
        staffProfileData.sessions.push({
            sessionDate: now,
            reactionsRequired: reactions,
            actualReactions: 0
        });

        fs.writeFileSync(staffProfileFilePath, JSON.stringify(staffProfileData, null, 4));

        await interaction.reply({ content: `You Have Initiated A Session Successfully.`, ephemeral: true });
    },
};
