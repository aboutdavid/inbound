const yaml = require('js-yaml');
const fs = require('fs');
const config = yaml.load(fs.readFileSync('./config.yaml', 'utf8'));
const { PrismaClient } = require("@prisma/client");
const { App } = require('@slack/bolt');
const prisma = new PrismaClient();
const utils = require("../utils")
/**
 * @param {App} app
 */
module.exports = (app, pull) => {
    app.view('add_flight', async ({ view, ack, body }) => {
        await ack()
        const submittedValues = view.state.values
        var json = JSON.parse(view.private_metadata)
        //console.log(submittedValues)
        let flightNumber, flightDate, event
        for (let key in submittedValues) {
            if (submittedValues[key]['flight_number']) flightNumber = submittedValues[key]['flight_number'].value.toUpperCase()
            if (submittedValues[key]['flight_date']) flightDate = new Date(submittedValues[key]['flight_date'].selected_date)
            if (submittedValues[key]['select_event']) event = submittedValues[key]['select_event'].selected_option.value

        }
        if (!flightNumber || !flightDate || !event) return await app.client.chat.postEphemeral({
            user: body.user.id,
            channel: json.channel_id,
            text: "All fields are required"
        })
        const existingFlight = await prisma.flight.findFirst({
            where: {
                slackId: body.user.id,
                flightNumber
            }
        })
        if (existingFlight) return await app.client.chat.postEphemeral({
            user: body.user.id,
            channel: json.channel_id,
            text: "You already have this as an existing flight."
        })

        // Note from David: Flights can be added more than two days in advanced.
        // Slight issue: The aeroapi only supports up to 2 days in advanced.
        // However, codes are usually still valid even weeks before hand, so we check with today's date

        const flight = await utils.checkFlight(flightNumber, new Date())
        if (!flight) return await app.client.chat.postEphemeral({
            user: body.user.id,
            channel: json.channel_id,
            text: "The flight code given is not valid."
        })
        await prisma.flight.create({
            data: {
                slackId: body.user.id,
                flightNumber,
                flightDate: flightDate,
                event
            }
        })
        await pull()

        return await app.client.chat.postEphemeral({
            user: body.user.id,
            channel: json.channel_id,
            text: "Added flight successfully."
        })
    })
    app.command('/addflight', async ({ ack, body, client, logger }) => {
        await ack();
        await client.views.open({
            trigger_id: body.trigger_id,
            view: {
                private_metadata: JSON.stringify({ channel_id: body.channel_id }),
                callback_id: 'add_flight',
                "title": {
                    "type": "plain_text",
                    "text": "Add your flight",
                    "emoji": true
                },
                "submit": {
                    "type": "plain_text",
                    "text": "Submit",
                    "emoji": true
                },
                "type": "modal",
                "close": {
                    "type": "plain_text",
                    "text": "Cancel",
                    "emoji": true
                },
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "Add your own flight to the tracking board."
                        }
                    },
                    {
                        "type": "input",
                        "element": {
                            "type": "plain_text_input",
                            "action_id": "flight_number"
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "Flight Number",
                            "emoji": true,
                        },
                        optional: false
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "Select the date of your flight"
                        },
                        "accessory": {
                            "type": "datepicker",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select a date",
                                "emoji": true,
                            },
                            "action_id": "flight_date",
                        },

                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "Select the event"
                        },
                        "accessory": {
                            "type": "static_select",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select an item",
                                "emoji": true,
                            },
                            "options": config.events.map(event => {
                                return {
                                    "text": {
                                        "type": "plain_text",
                                        "text": event.name,
                                        "emoji": true
                                    },
                                    "value": event.name
                                }
                            }),
                            "action_id": "select_event",
                        }
                    }
                ]
            }
        })
    })
}