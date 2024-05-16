require("dotenv").config()
const { App } = require("@slack/bolt");
const yaml = require('js-yaml');
const utils = require("./utils")
const fs = require('fs');
const config = yaml.load(fs.readFileSync('./config.yaml', 'utf8'));

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

(async () => {
  async function pull() {
    config.events.forEach(async event => {
      if (new Date(event.start) > new Date() || new Date() > new Date(event.end)) return


      const data = await app.client.conversations.history({
        channel: event.channel,
      })
      const { messages } = data

      await Promise.all(
        messages.map((message) =>
          app.client.chat
            .delete({
              token: process.env.SLACK_USER_TOKEN, // sudo
              channel: event.channel,
              ts: message?.ts,
              thread_ts: message?.thread_ts,
            })
            .catch((e) => {
              console.warn(e)
            })
        ))


      let promises = event.users.map(async user => {

        var flights = await Promise.all(user.flights.map(async flight => {
          const res = await utils.checkFlight(flight.code, new Date(flight.date));
          if (!res.error) return res
        }))
        flights = flights.filter(item => item).sort(function (a, b) {

          return new Date(a.scheduled_out) - new Date(b.scheduled_out);
        });

        const flightsLeft = flights.filter(flight => !flight.actual_in).length
        var txt = ""


        txt += flightsLeft == 0 ? `*${user.name} has landed from their final flight.*` : `*${user.name} has ${flightsLeft} ${flightsLeft != 1 ? "flights" : "flight"} to complete*:`;

        flights.forEach((flight, i) => {
          txt += `\n\n*${flight.ident_iata} (${flight.ident_icao}): ${flight.origin?.code_iata} (${flight.origin?.code_icao}) -> ${flight.destination?.code_iata} (${flight.destination?.code_icao})*\n`
          txt += `ℹ️ Status: ${flight.status} • 🛄 Baggage claim: ${flight.baggage_claim || "None"} • ⛩️ Gate at ${flight.origin?.code_iata}: ${flight.gate_origin || "Unknown"} • ⛩️ Gate at ${flight.destination?.code_iata}: ${flight.gate_destination || "Unknown"} • 📏 ${flight.route_distance || "Unknown"} miles • 🏎️ ${flight.filed_airspeed || "Unknown"} mph \n`
          txt += `🛫 Take off (scheduled): ${flight.scheduled_off ? utils.fmtDate(flight.scheduled_off, event.timezone) : "Unknown"} `
          txt += `(Estimated: ${flight.estimated_off ? utils.fmtDate(flight.estimated_off, event.timezone) : "Unknown"}) `
          txt += `(Actual: ${flight.actual_off ? utils.fmtDate(flight.actual_off, event.timezone) : "Unknown"})\n`
          if (flight.scheduled_off && (flight.actual_off || flight.estimated_off)) txt += `_${utils.humanReadableDiff(flight.scheduled_off, flight.actual_off || flight.estimated_off)}_\n`
          txt += `🛬 Landing (scheduled): ${flight.scheduled_in ? utils.fmtDate(flight.scheduled_in, event.timezone) : "Unknown"} `
          txt += `(Estimated: ${flight.estimated_in ? utils.fmtDate(flight.estimated_in, event.timezone) : "Unknown"}) `
          txt += `(Actual: ${flight.actual_in ? utils.fmtDate(flight.actual_in, event.timezone) : "Unknown"})\n`
          if (flight.scheduled_in && (flight.actual_in || flight.estimated_in)) txt += `_${utils.humanReadableDiff(flight.scheduled_in, flight.actual_in || flight.estimated_in)}_\n`

          txt += `Progress: (${flight.progress_percent}%) ${utils.progress(flight.progress_percent)}\n`

        })

        return txt
      });

      let texts = await Promise.all(promises);
      texts.push(`⌚ All times are in ${event.timezone}`)
      texts.push(`🗑️ Messages here are automatically deleted. Please see #inbound-dev for more details.`)
      let text = texts.join('\n');

      let chunks = [];
      let i = 0;
      while (i < text.length) {
        let end = Math.min(i + 40000, text.length);
        if (end < text.length) {
          end = text.lastIndexOf('\n', end);
          if (end == -1) {
            end = Math.min(i + 40000, text.length);
          }
        }
        chunks.push(text.substring(i, end));
        i = end;
      }

      for (let chunk of chunks) {
        await app.client.chat.postMessage({
          channel: event.channel,
          text: chunk,
          mrkdwn: true
        });
      }
    })
  }
  app.message(/.*/gim, async ({ message }) => {
    const event = config.events.find(event => event.channel == message.channel)
    if (event) await app.client.chat.delete({
      channel: message.channel,
      ts: message.ts,
      token: process.env.SLACK_USER_TOKEN
    })

  })
  await pull()
  setInterval(pull, 1000 * 60 * 5)


  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
