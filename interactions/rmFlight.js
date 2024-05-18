const yaml = require('js-yaml');
const fs = require('fs');
const { PrismaClient } = require("@prisma/client");
const { App } = require('@slack/bolt');
const prisma = new PrismaClient();
/**
 * @param {App} app
 */
module.exports = (app, pull) => {
    app.command('/rmflight', async ({ ack, body, client, logger, respond, command }) => {
        await ack();
        const flightNumber = command.text

        if (!flightNumber) await respond("No flight number given.")

        const flight = await prisma.flight.findFirst({
            where: {
                slackId: body.user_id,
                flightNumber
            }
        })
        if (!flight) await respond("That flight is not found. If you gave an ICAO number, try giving an IATA number and vice versa.")
        await prisma.flight.delete({
            where: {
                id: flight.id
            }
        })
        await respond("Flight removed.")
        await pull()
    })
}