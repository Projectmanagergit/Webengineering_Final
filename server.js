const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'events.json');

// Verzeichnis anlegen, falls nicht vorhanden
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Datei mit leeren Array initialisieren, falls nicht vorhanden
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Verbesserte Hilfsfunktionen: Events laden/speichern mit Fehlerbehandlung
function loadEvents() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            // Datei erstellen falls sie nicht existiert
            saveEvents([]);
            return [];
        }
        
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        
        // Prüfen ob Datei leer ist
        if (!data.trim()) {
            saveEvents([]);
            return [];
        }
        
        const events = JSON.parse(data);
        return Array.isArray(events) ? events : [];
    } catch (error) {
        console.error('Fehler beim Laden der Events:', error);
        // Bei Fehler leeres Array zurückgeben und Datei neu erstellen
        saveEvents([]);
        return [];
    }
}

function saveEvents(events) {
    try {
        // Sicherstellen dass das Verzeichnis existiert
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        
        // Atomic write: Erst in temporäre Datei schreiben, dann umbenennen
        const tempFile = DATA_FILE + '.tmp';
        const jsonData = JSON.stringify(events, null, 2);
        
        fs.writeFileSync(tempFile, jsonData, 'utf8');
        fs.renameSync(tempFile, DATA_FILE);
        
        console.log(`${events.length} Events erfolgreich gespeichert`);
    } catch (error) {
        console.error('Fehler beim Speichern der Events:', error);
        throw error;
    }
}

// Beim Start: Events laden und Anzahl anzeigen
const initialEvents = loadEvents();
console.log(`Server gestartet. ${initialEvents.length} Events aus Datei geladen.`);

// API: Alle Events holen
app.get('/api/events', (req, res) => {
    try {
        const events = loadEvents();
        res.json(events);
    } catch (error) {
        console.error('Fehler beim Abrufen der Events:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Events' });
    }
});

// API: Einzelnes Event holen
app.get('/api/events/:id', (req, res) => {
    try {
        const id = Number(req.params.id);
        const events = loadEvents();
        const event = events.find(e => e.id === id);
        
        if (!event) {
            return res.status(404).json({ error: 'Event nicht gefunden' });
        }
        
        res.json(event);
    } catch (error) {
        console.error('Fehler beim Abrufen des Events:', error);
        res.status(500).json({ error: 'Fehler beim Laden des Events' });
    }
});

// API: Neues Event anlegen
app.post('/api/events', (req, res) => {
    try {
        const { name, date, location, description, tags } = req.body;
        
        if (!name || !date) {
            return res.status(400).json({ error: "Name und Datum sind Pflichtfelder." });
        }

        const events = loadEvents();
        const newEvent = {
            id: Date.now() + Math.random(), // Unique ID auch bei schnellen Requests
            name: name.trim(),
            date,
            location: location ? location.trim() : '',
            description: description ? description.trim() : '',
            tags: Array.isArray(tags) ? tags.filter(tag => tag.trim()) : [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        events.push(newEvent);
        saveEvents(events);
        
        console.log(`Neues Event erstellt: ${newEvent.name} (ID: ${newEvent.id})`);
        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Fehler beim Erstellen des Events:', error);
        res.status(500).json({ error: 'Fehler beim Erstellen des Events' });
    }
});

// API: Event aktualisieren
app.put('/api/events/:id', (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, date, location, description, tags } = req.body;
        
        if (!name || !date) {
            return res.status(400).json({ error: "Name und Datum sind Pflichtfelder." });
        }

        const events = loadEvents();
        const eventIndex = events.findIndex(e => e.id === id);
        
        if (eventIndex === -1) {
            return res.status(404).json({ error: 'Event nicht gefunden' });
        }

        const updatedEvent = {
            ...events[eventIndex],
            name: name.trim(),
            date,
            location: location ? location.trim() : '',
            description: description ? description.trim() : '',
            tags: Array.isArray(tags) ? tags.filter(tag => tag.trim()) : [],
            updatedAt: new Date().toISOString()
        };

        events[eventIndex] = updatedEvent;
        saveEvents(events);
        
        console.log(`Event aktualisiert: ${updatedEvent.name} (ID: ${updatedEvent.id})`);
        res.json(updatedEvent);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Events:', error);
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Events' });
    }
});

// API: Event löschen
app.delete('/api/events/:id', (req, res) => {
    try {
        const id = Number(req.params.id);
        const events = loadEvents();
        const initialLength = events.length;
        
        const filteredEvents = events.filter(e => e.id !== id);
        
        if (filteredEvents.length === initialLength) {
            return res.status(404).json({ error: 'Event nicht gefunden' });
        }
        
        saveEvents(filteredEvents);
        
        console.log(`Event gelöscht (ID: ${id})`);
        res.json({ success: true, message: 'Event erfolgreich gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen des Events:', error);
        res.status(500).json({ error: 'Fehler beim Löschen des Events' });
    }
});

// API: Alle verfügbaren Tags (aus allen Events)
app.get('/api/tags', (req, res) => {
    try {
        const events = loadEvents();
        const tagSet = new Set();
        
        events.forEach(event => {
            if (Array.isArray(event.tags)) {
                event.tags.forEach(tag => {
                    if (tag && tag.trim()) {
                        tagSet.add(tag.trim());
                    }
                });
            }
        });
        
        const tags = Array.from(tagSet).sort();
        res.json(tags);
    } catch (error) {
        console.error('Fehler beim Abrufen der Tags:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Tags' });
    }
});

// API: Events nach Tag filtern
app.get('/api/events/tag/:tag', (req, res) => {
    try {
        const tag = req.params.tag;
        const events = loadEvents();
        
        const filteredEvents = events.filter(event => 
            Array.isArray(event.tags) && event.tags.includes(tag)
        );
        
        res.json(filteredEvents);
    } catch (error) {
        console.error('Fehler beim Filtern nach Tag:', error);
        res.status(500).json({ error: 'Fehler beim Filtern der Events' });
    }
});

// Graceful Shutdown - Events beim Beenden sichern
process.on('SIGINT', () => {
    console.log('\nServer wird beendet...');
    const events = loadEvents();
    console.log(`${events.length} Events sind gespeichert.`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Server wird beendet (SIGTERM)...');
    const events = loadEvents();
    console.log(`${events.length} Events sind gespeichert.`);
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
    console.log(`Events werden in: ${DATA_FILE} gespeichert`);
});
