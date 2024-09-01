const { Events, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

const dataFolderPath = path.join(__dirname, '../../data/vehicleData');
const policeRecordsDirPath = path.join(__dirname, '../../data/policeRecords');
const licensesDirPath = path.join(__dirname, '../../data/licenses');
const ticketsDirPath = path.join(__dirname, '../../data/tickets');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            if (interaction.isButton()) {
                const userId = interaction.customId.split('_')[2]; // Extract userId from customId

                const userFilePath = path.join(dataFolderPath, `${userId}.json`);
                const policeRecordFilePath = path.join(policeRecordsDirPath, `${userId}.json`);
                const licenseFilePath = path.join(licensesDirPath, `${userId}.json`);
                const ticketFilePath = path.join(ticketsDirPath, `${userId}.json`);

                let userVehicles = [];
                if (fs.existsSync(userFilePath)) {
                    userVehicles = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
                }

                let policeRecords = [];
                if (fs.existsSync(policeRecordFilePath)) {
                    policeRecords = JSON.parse(fs.readFileSync(policeRecordFilePath, 'utf8'));
                }

                let licenseStatus = 'No license records found.';
                if (fs.existsSync(licenseFilePath)) {
                    const licenses = JSON.parse(fs.readFileSync(licenseFilePath, 'utf8'));
                    if (licenses.length > 0) {
                        const latestLicense = licenses[licenses.length - 1];
                        licenseStatus = `**Status:** ${latestLicense.status}\n**Date:** ${new Date(latestLicense.date).toLocaleString()}`;
                    }
                }

                if (interaction.customId.startsWith('view_vehicles_')) {
                    const vehiclesList = userVehicles.length > 0
                        ? userVehicles.map((v, index) =>
                            `**${index + 1}.** Year: ${v.year}, Make: ${v.make}, Model: ${v.model}, Trim: ${v.trim}, Color: ${v.color}, Number Plate: ${v.numberPlate}`).join('\n')
                        : 'No vehicles registered.';

                    const vehiclesEmbed = new EmbedBuilder()
                        .setTitle(`${interaction.user.tag}'s Registered Vehicles`)
                        .setDescription(vehiclesList)
                        .setColor('#2B2D31');

                    await interaction.reply({ embeds: [vehiclesEmbed], ephemeral: true });
                } else if (interaction.customId.startsWith('view_police_records_')) {
                    const arrestsList = policeRecords.length > 0
                        ? policeRecords.map((r, index) =>
                            `**${index + 1}.** Reason: ${r.reason}\nOffenses: ${r.offenses}\nPrice: ${r.price}\nExecuted By: ${r.executedBy}\nDate: ${new Date(r.date).toLocaleString()}`).join('\n\n')
                        : 'No arrests found.';

                    let ticketsList = 'No tickets found.';
                    if (fs.existsSync(ticketFilePath)) {
                        const tickets = JSON.parse(fs.readFileSync(ticketFilePath, 'utf8'));
                        if (tickets.length > 0) {
                            ticketsList = tickets.map((t, index) =>
                                `**${index + 1}.** Offense: ${t.offense}\nPrice: ${t.price}\nCount: ${t.count}\nDate: ${new Date(t.date).toLocaleString()}`).join('\n\n');
                        }
                    }

                    const policeRecordsEmbed = new EmbedBuilder()
                        .setTitle(`${interaction.user.tag}'s Police Records and Tickets`)
                        .addFields(
                            { name: 'Arrests', value: arrestsList || 'No arrests found.', inline: false },
                            { name: 'Tickets', value: ticketsList || 'No tickets found.', inline: false },
                            { name: 'License Status', value: licenseStatus, inline: false }
                        )
                        .setColor('#FF0000');

                    await interaction.reply({ embeds: [policeRecordsEmbed], ephemeral: true });
                }
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
                } catch (replyError) {
                    console.error(`Failed to send error reply: ${replyError}`);
                }
            }
        }
    },
};
