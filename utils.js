require("dotenv").config()
const reachedDateLimit = (date) => (date - Date.now()) > 2 * 24 * 60 * 60 * 1000 || (Date.now() - date) > 8 * 24 * 60 * 60 * 1000;

async function checkFlight(code, date) {
    if (reachedDateLimit(date)) return { error: true}
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
module.exports = { checkFlight, progress }