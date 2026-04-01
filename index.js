(async () => {
    "use strict";

    // Dependencies
    const client = await require("./modules/mongodb.js")
    const shortener = require("./shortener.js")
    const compression = require("compression")
    const sAES256 = require("simple-aes-256")
    const { parse } = require("smol-toml")
    const express = require("express")
    const { isbot } = require("isbot")
    const hashJS = require("hash.js")
    const helmet = require("helmet")
    const crypto = require("crypto")
    const ky = require("ky").default
    const path = require("path")
    const fs = require("fs")

    // Variables
    const config = parse(fs.readFileSync("./config.toml", "utf8"))
    const web = express()

    const database = client.db(config.database.database)
    const agents = database.collection(config.database.agentsCollection)
    const messages = database.collection(config.database.messagesCollection)

    // Configurations
    //* Express
    web.use(express.json())
    web.use(compression({ level: 1 }))
    web.use(helmet({ contentSecurityPolicy: false }))
    web.set("view engine", "ejs")
    web.set("views", path.join(__dirname, "views"))

    // Main
    web.use((req, res, next) => {
        // Variables
        const userAgent = req.headers["user-agent"]

        // Validations
        if (!req.path.startsWith("/promo")) {
            if (userAgent !== config.login.userAgent) return res.redirect(config.deception.redirect)
        }

        // Core
        next()
    })
    web.get("/", async (req, res) => {
        // Variables
        const { purge } = req.query

        // Actions
        if (purge === "agents") {
            await agents.deleteMany({})
            return res.redirect("/")
        }

        if (purge === "messages") {
            await messages.deleteMany({})
            return res.redirect("/")
        }

        const data = {
            agentsCount: await agents.find({}).count(),
            messagesCount: await messages.find({}).count()
        }

        // Core
        res.render("index", data)
    })

    web.get("/agents", async (req, res) => {
        const agentsList = await agents.find({}).toArray()
        res.render("agents", { agentsList })
    })

    web.post("/agents/add", async (req, res) => {
        // Variables
        const { name } = req.body
        if (!name) return res.send("0")

        // Core
        const id = crypto.randomBytes(25).toString("hex").slice(0, 25)
        await agents.insertOne({ name, id })
        res.send("1")
    })

    web.post("/agents/delete", async (req, res) => {
        // Variables
        const { id } = req.body
        if (!id) return res.send("0")

        // Core
        await agents.deleteOne({ id })
        res.send("1")
    })

    web.post("/agents/push", async (req, res) => {
        // Variables
        const { id, message: userMessage } = req.body
        if (!id || !userMessage) return res.send("0")

        const agent = await agents.findOne({ id })
        if (!agent) return res.send("0")

        // Core
        const code = crypto.randomBytes(4).toString("hex")
        const shortenedUrl = config.web.url.includes("localhost:") ? false : await shortener(`${config.web.url}/promo?code=${code}`)
        await messages.insertOne({
            x: hashJS.sha512().update(code).digest("hex"),
            m: sAES256.encrypt(code, userMessage).toString("hex")
        })

        await ky.post(`https://ntfy.sh/${agent.id}`, {
            body: userMessage.replace("{url}", shortenedUrl)
        })

        res.send("1")
    })

    web.get("/promo", async (req, res) => {
        //* Variables
        const { code } = req.query

        //* Validations
        if (!req.headers["user-agent"] || isbot(req.headers["user-agent"]) || !code) return res.redirect(config.deception.redirect)
        if (code.length >= 9) return res.redirect(config.deception.redirect)
        const messageData = await messages.findOne({ x: hashJS.sha512().update(code).digest("hex") })
        if (!messageData) return res.redirect(config.deception.redirect)

        //* Core
        await messages.deleteOne({ x: hashJS.sha512().update(code).digest("hex") })
        res.render("message", {
            message: sAES256.decrypt(code, Buffer.from(messageData.m, "hex")).toString("utf8")
        })
    })

    web.use("/{*any}", (req, res) => res.redirect(config.deception.redirect))
    web.listen(config.web.port, () => console.log(`AgentNtfy is running. Port: ${config.web.port}`))
})()