const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// قاعدة بيانات مؤقتة في الذاكرة للرسائل والمستخدمين
let activeUsers = {};
let chats = { public: [] };

io.on('connection', (socket) => {
    console.log('مستخدم جديد اتصل:', socket.id);

    // تسجيل المستخدم بالرقم وكود التفعيل
    socket.on('register_user', (data) => {
        const { phone, username, isPremium } = data;
        activeUsers[socket.id] = { phone, username, isPremium, id: socket.id };
        
        socket.emit('auth_success', { status: 'OK', user: activeUsers[socket.id] });
        io.emit('online_count', Object.keys(activeUsers).length);
    });

    // إرسال كود تفعيل وهمي/سريع للتحقق
    socket.on('request_otp', (phone) => {
        const otpCode = Math.floor(100000 + Math.random() * 900000);
        socket.emit('receive_otp', { phone, otp: otpCode });
    });

    // استقبال وإرسال الرسائل فورياً
    socket.on('send_message', (data) => {
        const { room, text, sender, isPremium } = data;
        const msgObj = {
            sender,
            text,
            isPremium,
            timestamp: Date.now()
        };

        if (!chats[room]) chats[room] = [];
        chats[room].push(msgObj);

        io.emit('new_message', { room, msg: msgObj });
    });

    socket.on('disconnect', () => {
        delete activeUsers[socket.id];
        io.emit('online_count', Object.keys(activeUsers).length);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 سيرفر WhatsApp Ultra شغال بنجاح على البورت ${PORT}`);
});
