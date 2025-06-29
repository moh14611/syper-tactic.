
// simple node.js app using express and discord oauth2
const express = require('express');
const fetch = require('node-fetch');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// config
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/callback';
const WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL';

app.use(bodyParser.json());
app.use(session({ secret: 'syper_secret', resave: false, saveUninitialized: false }));

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/chat', (req, res) => res.sendFile(__dirname + '/chat.html'));

app.get('/login', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(url);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            scope: 'identify'
        })
    });
    const tokenData = await tokenRes.json();
    const userRes = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();
    req.session.user = userData;
    res.redirect('/chat');
});

app.post('/send', async (req, res) => {
    const user = req.session.user;
    const msg = req.body.msg;
    if (!user) return res.status(403).send("Unauthorized");
    await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: `💬 **${user.username}#${user.discriminator}**: ${msg}`
        })
    });
    res.send("تم الإرسال");
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
