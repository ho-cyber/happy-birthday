const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const schedule = require('node-schedule');
const express = require('express');
const moment = require('moment-timezone');

const puppeteer = require('puppeteer');
const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage', 
            '--disable-gpu'
        ],

    }
});

client.on('qr', (qr) => {
    console.log('SCAN THIS QR CODE IN YOUR RENDER LOGS:');
    qrcode.generate(qr, { small: true });
});

app.get('/qr', async (req, res) => {
    if (!lastQr) {
        return res.send('QR code not generated yet or client is already ready. Check logs.');
    }
    
    try {
        // Generate an HTML page with the QR code as an image
        const qrImage = await QRCode.toDataURL(lastQr);
        res.send(`
            <html>
                <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
                    <h1>Scan this with WhatsApp</h1>
                    <img src="${qrImage}" style="width:300px; height:300px; image-rendering: pixelated;" />
                    <p>Refresh the page if the QR expires.</p>
                </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send('Error generating QR image');
    }
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