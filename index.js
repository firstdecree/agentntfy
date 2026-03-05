(async()=>{
    "use strict";

    // Dependencies
    const client = await require("./modules/mongodb.js")
    const compression = require("compression")
    const sAES256 = require("simple-aes-256")
    const { parse } = require("smol-toml")
    const express = require("express")
    const { isbot } = require("isbot")
    const hashJS = require("hash.js")
    const helmet = require("helmet")
    const path = require("path")
    const fs = require("fs")

    // Variables
    const config = parse(fs.readFileSync("./config.toml", "utf8"))
    const web = express()

    const database = client.db(config.database.database)
    const messages = database.collection(config.database.messagesCollection)

    // Configurations
    //* Express
    web.use(compression({ level: 1 }))
    web.use(helmet({ contentSecurityPolicy: false }))
    web.set("view engine", "ejs")
    web.set("views", path.join(__dirname, "views"))

    // Main
    web.get("/promo", async(req, res)=>{
        //* Variables
        const { code } = req.query 

        //* Validations
        if(!req.headers["user-agent"] || isbot(req.headers["user-agent"]) || !code) return res.redirect(config.deception.redirect)
        if(code.length >= 9) return res.redirect(config.deception.redirect)
        const messageData = await messages.findOne({ x: hashJS.sha512().update(code).digest("hex") })
        if(!messageData) return res.redirect(config.deception.redirect)

        //* Core
        await messages.deleteOne({ x: hashJS.sha512().update(code).digest("hex") })
        res.render("index", {
            message: sAES256.decrypt(code, Buffer.from(messageData.m, "hex")).toString("utf8")
        })
    })

    web.use("/{*any}", (req, res)=>res.redirect(config.deception.redirect))
    web.listen(config.web.port, ()=>console.log(`AgentNtfy is running. Port: ${config.web.port}`))
})()