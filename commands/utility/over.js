const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const path = require('path');
const fs = require('fs');

const staffProfileDirPath = path.join(__dirname, '../../data/staffProfiles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('over')
        .setDescription('Purges messages from today between specified start and end times, excluding the first 2 messages.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.MuteMembers)
        .addStringOption(option =>
            option.setName('start-time')
                .setDescription('Start time in HH:MM format')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('end-time')
                .setDescription('End time in HH:MM format')
                .setRequired(true)),
    async execute(interaction) {
        console.log('Command execution started.');

        const startTime = interaction.options.getString('start-time');
        const endTime = interaction.options.getString('end-time');

        const now = new Date();
        const start = new Date(now);
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        start.setHours(startHours, startMinutes, 0, 0);

        const end = new Date(now);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        end.setHours(endHours, endMinutes, 0, 0);

        if (start > end) {
            end.setDate(end.getDate() + 1); // Adjust end time if it's past midnight
        }

        try {
            console.log('Sending initial response.');
            await interaction.reply({ content: 'Processing your request...', ephemeral: true });

            console.log('Fetching messages.');
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

            const messagesToDelete = sortedMessages.filter((msg, index) => {
                const msgDate = new Date(msg.createdTimestamp);
                return index >= 2 && msgDate >= start && msgDate <= end;
            });

            console.log(`Found ${messagesToDelete.size} messages to delete.`);
            for (const msg of messagesToDelete.values()) {
                try {
                    await msg.delete();
                    console.log(`Deleted message: ${msg.id}`);
                } catch (deleteError) {
                    console.error('Error deleting message:', deleteError);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('Session Over')
                .setDescription(`Thank you for participating! 
                **__Session Details:__**
                Host: **<@${interaction.user.id}>**
                Start Time: **${startTime}**
                End Time: **${endTime}**`)
                .setColor('#89cff0')
                .setFooter({ text: 'Session Ended' });

            console.log('Sending session end embed.');
            await interaction.channel.send({ embeds: [embed] });

            // Log the session details to the staff profile
            const staffProfileFilePath = path.join(staffProfileDirPath, `${interaction.user.id}.json`);
            let staffProfileData = { sessionsStarted: 0, sessionsEnded: 0, sessionDates: [] };

            if (fs.existsSync(staffProfileFilePath)) {
                try {
                    staffProfileData = JSON.parse(fs.readFileSync(staffProfileFilePath, 'utf8'));
                } catch (error) {
                    console.error('Error reading or parsing staff profile data:', error);
                }
            }

            staffProfileData.sessionsEnded += 1;
            staffProfileData.sessionDates.push(new Date().toISOString());

            console.log('Writing staff profile data.');
            try {
                fs.writeFileSync(staffProfileFilePath, JSON.stringify(staffProfileData, null, 2));
            } catch (error) {
                console.error('Error writing staff profile data:', error);
            }

            // Edit the initial response to indicate completion
            console.log('Editing reply to indicate success.');
            await interaction.editReply({ content: 'Command processed successfully.', ephemeral: true });
        } catch (error) {
            console.error('Error handling command:', error);
            try {
                if (!interaction.replied) {
                    await interaction.reply({ content: 'Failed to process the command. Please try again later.', ephemeral: true });
                } else {
                    await interaction.followUp({ content: 'Failed to process the command. Please try again later.', ephemeral: true });
                }
            } catch (replyError) {
                console.error('Error sending error reply:', replyError);
            }
        }
    },
};
