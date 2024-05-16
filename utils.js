require("dotenv").config()
const reachedDateLimit = (date) => (date - Date.now()) > 2 * 24 * 60 * 60 * 1000 || (Date.now() - date) > 8 * 24 * 60 * 60 * 1000;

async function checkFlight(code, date) {
    if (reachedDateLimit(date)) return { error: true }
    if (!/^[A-Za-z]{2}\d{1,4}$/.test(code)) return { invalid: true }
    const res = await fetch(`https://aeroapi.flightaware.com/aeroapi/flights/${code}?` + new URLSearchParams({
        start: new Date(date).toISOString(),
        max_pages: 1
    }), {
        headers: {
            "x-apikey": process.env.FLIGHT_API_TOKEN
        }
    })
    if (res.status != 200) return {
        error: true
    }
    const json = await res.json()
    if (json.flights?.length == 0) return {
        error: true
    }
    return json.flights.reverse()[0]
}

function progress(int) {
    int = Math.round(int / 10)
    var bar = "[";
    var filled = "=".repeat(int);
    var empty = "–".repeat(10 - int);
    bar += filled + empty + "]";
    return bar;
}

function fmtDate(date, tz) {
    return new Date(date).toLocaleString('en-US', { timeZone: tz, timeStyle: "short", dateStyle: "long" })
}

function humanReadableDiff(date1, date2) {
    date1 = new Date(date1)
    date2 = new Date(date2)
    var seconds = Math.floor((date2 - date1) / 1000);
    var prefix = seconds < 0 ? " early" : " late";
    seconds = Math.abs(seconds);

    var interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + " year" + (interval > 1 ? "s" : "") + prefix;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " month" + (interval > 1 ? "s" : "") + prefix;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " day" + (interval > 1 ? "s" : "") + prefix;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " hour" + (interval > 1 ? "s" : "") + prefix;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " minute" + (interval > 1 ? "s" : "") + prefix;

    return Math.floor(seconds) + " second(s)" + prefix;
}

module.exports = { checkFlight, progress, fmtDate, humanReadableDiff }