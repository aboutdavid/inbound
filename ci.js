require("dotenv").config()
const yaml = require('js-yaml');
const utils = require("./utils")
const fs = require('fs');
var config = ""

try {
    config = yaml.load(fs.readFileSync('./config.yaml', 'utf8'));
} catch (e) {
    console.error("Failed to parse YAML. See below:")
    console.error(e)
    process.exit(1)
}

config.events.forEach(async event => {
    console.log(`Checking event: ${event.name}`)
    event.users.map(async user => {
        var flights = await Promise.all(user.flights.map(async flight => {
            var res
            if (!/^\d{4}-\d{2}-\d{2}$/.test(flight.date)) {
                console.error(`Invalid date in event ${event.name}: ${flight.code} on ${flight.date} for user ${user.name}/${user.id}`)
                process.exit(1)
            }
            try {
                res = await utils.checkFlight(flight.code, new Date(flight.date));
            } catch (e) {
                console.error(`Failed to get flight info for event ${event.name}: ${flight.code} on ${flight.date} for user ${user.name}/${user.id}`)
                process.exit(e)
            }
            if (res.error) {
                console.error(`Failed to get flight info for event ${event.name}: ${flight.code} on ${flight.date} for user ${user.name}/${user.id}`)
                process.exit(1)
            }
            console.error(`PASS: ${event.name}: ${flight.code} on ${flight.date} for user ${user.name}/${user.id}`)
        }))
        flights = flights.filter(item => item).sort(function (a, b) {
            return new Date(a.scheduled_out) - new Date(b.scheduled_out);
        });
    })
})