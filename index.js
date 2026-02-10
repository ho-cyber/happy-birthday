const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const schedule = require('node-schedule');
const express = require('express');
const moment = require('moment-timezone');

const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        // Essential flags for running in a Docker container
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    }
});

client.on('qr', (qr) => {
    console.log('SCAN THIS QR CODE IN YOUR RENDER LOGS:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('WhatsApp Client is ready!'));

// API Endpoint to Schedule
app.post('/schedule', (req, res) => {
    const { phone, message, time } = req.body; // time format: "2026-02-11 10:30"
    
    const scheduledTime = moment.tz(time, "YYYY-MM-DD HH:mm", "Asia/Kolkata").toDate();
    const chatId = `${phone}@c.us`;

    schedule.scheduleJob(scheduledTime, function() {
        client.sendMessage(chatId, message)
            .then(() => console.log(`Sent to ${phone} at ${time} IST`))
            .catch(err => console.error("Send error:", err));
    });

    res.json({ status: "Scheduled", for: phone, at: time + " IST" });
});

app.get('/', (req, res) => res.send('Server Active'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server on port ${PORT}`));

client.initialize();