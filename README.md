<div align="center"><img src="https://i.ibb.co/rGJd2Crq/064030505035533.png"/></div>

# AgentNTFY
Read a secure one-time message delivered with a Sci-Fi aesthetic.

# ⚙️ Installations
## Github
```
git clone https://github.com/firstdecree/agentntfy
```

## NpmJS
```
npm install
```

## PNPM
```
pnpm install
```

# 🛠️ Setup
## Web
Please open `config.toml.example`. All required configuration options are provided there, along with detailed comments explaining each setting.

1. First, deploy AgentNTFY to a hosting platform such as Vercel.
2. After deployment, add the hosted URL to `config.toml` under `web -> url`.


## Pushing
1. The application leverages simulated advertisements or promotional content to deliver its messages. You may add or modify entries within the `fake-ads` directory. The `{url}` placeholder is used by the program to determine where to insert the shortened URL.
2. You may add new agents to `agents.json`. Each agent must have the corresponding secret string configured in their ntfy settings (which they must subscribe to).
3. To customize the message sent to a specific agent, edit `message.txt`. Once completed, run `node push.js <agentCode>` to upload the data to the database and notify the agent.

# 🚀 Usage
The web app.
```
node index.js
```
Pushing a message.
```
node push.js <agentCode>
```