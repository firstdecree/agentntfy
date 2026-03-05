(async()=>{
    "use strict";

    // Dependencies
    const client = await require("./modules/mongodb.js")
    const shortener = require("./shortener.js")
    const sAES256 = require("simple-aes-256")
    const { parse } = require("smol-toml")
    const hashJS = require("hash.js")
    const ky = require("ky").default
    const crypto = require("crypto")
    const fs = require("fs")

    // Variables
    const config = parse(fs.readFileSync("./config.toml", "utf8"))
    const fakeAds = fs.readdirSync("./fake-ads").map((d)=>`./fake-ads/${d}`)
    const agents = require("./agents.json")
    const args = process.argv.slice(2)

    const database = client.db(config.database.database)
    const messages = database.collection(config.database.messagesCollection)

    // Functions
    const generateCode = ()=>{
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        const bytes = crypto.randomBytes(8)

        var result = ""
        for ( let i = 0; i < 8; i++ ) result += chars[bytes[i] % chars.length]
        return result
    }

    // Main
    if(!args.length || !agents[args.slice(0).join(" ")]){
        console.log("usage: node push.js <agentCode>")
        process.exit()
    }

    //* Variables
    const code = generateCode()

    //* Core
    var message = fs.readFileSync(fakeAds[Math.floor(Math.random() * fakeAds.length)], "utf8")
    message = message.replace("{url}", await shortener(`${config.web.url}/promo?code=${code}`))

    await messages.insertOne({
        x: hashJS.sha512().update(code).digest("hex"),
        m: sAES256.encrypt(code, fs.readFileSync("./message.txt", "utf8")).toString("hex")
    })
    await ky.post(`https://ntfy.sh/${agents[args.slice(0).join(" ")]}`, {
        body: message
    })
    
    console.log(`The agent has been notified and the data has been pushed!
Code: ${code}`)
    process.exit()
})()