const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const UPLOADS_DIR = path.join(__dirname, '../public/uploads/chat-images');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`Created directory: ${UPLOADS_DIR}`);
} else {
    console.log(`Directory already exists: ${UPLOADS_DIR}`);
}


const storage = multer.diskStorage({
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')); // Probelni almashtirish
    }
});

const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Faqat rasm fayllari qabul qilinadi! (png, jpg, jpeg, gif)'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const SERVICES_FILE = path.join(__dirname, 'data/services.json');
const MESSAGES_FILE = path.join(__dirname, 'data/messages.json');
const SETTINGS_FILE = path.join(__dirname, 'data/settings.json');

const readData = (filePath, callback) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading file:", filePath, err);
            return callback(err, null);
        }
        try {
            const jsonData = data ? JSON.parse(data) : (filePath.endsWith('messages.json') || filePath.endsWith('services.json') ? [] : {});
            callback(null, jsonData);
        } catch (parseErr) {
            console.error("Error parsing JSON from file:", filePath, parseErr);
            callback(parseErr, null);
        }
    });
};

const writeData = (filePath, data, callback) => {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) {
            console.error("Error writing file:", filePath, err);
            return callback(err);
        }
        callback(null);
    });
};

app.get('/api/services', (req, res) => {
    readData(SERVICES_FILE, (err, services) => {
        if (err) return res.status(500).json({ message: "Error reading services data" });
        res.json(services);
    });
});

app.post('/api/services', (req, res) => { // For admin to add a service
    readData(SERVICES_FILE, (err, services) => {
        if (err) return res.status(500).json({ message: "Error reading services data" });

        const newService = req.body;
        newService.id = Date.now();
        services.push(newService);

        writeData(SERVICES_FILE, services, (writeErr) => {
            if (writeErr) return res.status(500).json({ message: "Error saving new service" });
            res.status(201).json(newService);
        });
    });
});

app.get('/api/chat/messages', (req, res) => {
    readData(MESSAGES_FILE, (err, messages) => {
        if (err) return res.status(500).json({ message: "Error reading messages" });
        res.json(messages);
    });
});

app.post('/api/chat/messages', upload.single('chatImage'), (req, res) => {
    readData(MESSAGES_FILE, (err, messages) => {
        if (err) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(500).json({ message: "Error reading messages data" });
        }

        const { user, text } = req.body;
        const newMessage = {
            id: Date.now(),
            user: user,
            text: text || null,
            imageUrl: null,
            timestamp: new Date().toLocaleString('uz-UZ', { hour12: false })
        };

        if (req.file) {
            newMessage.imageUrl = `/uploads/chat-images/${req.file.filename}`;
        }

        if (!newMessage.text && !newMessage.imageUrl) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "Xabar yoki rasm bo'lishi shart." });
        }

        messages.push(newMessage);

        writeData(MESSAGES_FILE, messages, (writeErr) => {
            if (writeErr) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(500).json({ message: "Error saving message" });
            }
            res.status(201).json(newMessage);
        });
    });
});

app.get('/api/settings/working-hours', (req, res) => {
    readData(SETTINGS_FILE, (err, settings) => {
        if (err) return res.status(500).json({ message: "Error reading settings" });
        res.json(settings.workingHours || { days: 'Noma\'lum', startTime: '--:--', endTime: '--:--' });
    });
});

app.put('/api/settings/working-hours', (req, res) => {
    readData(SETTINGS_FILE, (err, settings) => {
        if (err) return res.status(500).json({ message: "Error reading settings" });

        settings.workingHours = req.body;

        writeData(SETTINGS_FILE, settings, (writeErr) => {
            if (writeErr) return res.status(500).json({ message: "Error updating settings" });
            res.json(settings.workingHours);
        });
    });
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
        res.json({ success: true, message: "Login successful" });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ message: `Fayl yuklashda xatolik: ${error.message}. Fayl hajmi 5MB dan oshmasligi kerak.` });
    } else if (error) {
        return res.status(400).json({ message: error.message });
    }
    next();
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});