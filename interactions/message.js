const yaml = require('js-yaml');
const fs = require('fs');
const config = yaml.load(fs.readFileSync('./config.yaml', 'utf8'));
module.exports = (app) => {
    app.message(/.*/gim, async ({ message }) => {
        const event = config.events.find(event => event.channel == message.channel)
        if (event) await app.client.chat.delete({
            channel: message.channel,
            ts: message.ts,
            token: process.env.SLACK_USER_TOKEN
        })

    })
}