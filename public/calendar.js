// Globale Variablen
let currentDate = new Date();
let events = [];

// Monatsnamen
const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/**
 * Events vom Server laden
 */
async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        if (response.ok) {
            events = await response.json();
            console.log(`${events.length} Events geladen`);
            renderCalendar();
        } else {
            console.error('Fehler beim Laden der Events:', response.status);
            showError('Fehler beim Laden der Events');
        }
    } catch (error) {
        console.error('Netzwerkfehler:', error);
        showError('Verbindungsfehler zum Server');
    }
}

/**
 * Fehlermeldung anzeigen
 */
function showError(message) {
    document.getElementById('calendar').innerHTML = `
        <div class="loading" style="color: #dc2626;">
            ❌ ${message}
            <br><br>
            <button onclick="loadEvents()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer;">
                🔄 Erneut versuchen
            </button>
        </div>
    `;
}

/**
 * Kalender rendern
 */
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Aktueller Monat anzeigen
    document.getElementById('currentMonth').textContent = 
        `${monthNames[month]} ${year}`;

    // Erster Tag des Monats und Anzahl Tage
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    // Kalender-Grid aufbauen
    let calendarHTML = '';

    // Wochentag-Header
    dayNames.forEach(day => {
        calendarHTML += `<div class="day-header">${day}</div>`;
    });

    // Leere Tage vom vorherigen Monat
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    
    for (let i = startDay - 1; i >= 0; i--) {
        const dayNum = prevMonthDays - i;
        calendarHTML += `<div class="calendar-day other-month">
            <div class="day-number">${dayNum}</div>
        </div>`;
    }

    // Tage des aktuellen Monats
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDay = new Date(year, month, day);
        const dateString = formatDate(currentDay);
        const dayEvents = events.filter(event => event.date === dateString);
        
        let dayClass = 'calendar-day';
        if (isSameDay(currentDay, today)) {
            dayClass += ' today';
        }

        let eventsHTML = '';
        dayEvents.forEach(event => {
            const tagClass = getTagClass(event.tags);
            eventsHTML += `
                <div class="event ${tagClass}" onclick="showEventDetails(${event.id})" title="${event.name}">
                    ${truncateText(event.name, 15)}
                </div>`;
        });

        calendarHTML += `
            <div class="${dayClass}" onclick="dayClicked('${dateString}')">
                <div class="day-number">${day}</div>
                ${eventsHTML}
            </div>`;
    }

    // Leere Tage für den nächsten Monat
    const remainingCells = 42 - (startDay + daysInMonth);
    for (let day = 1; day <= remainingCells && remainingCells < 7; day++) {
        calendarHTML += `<div class="calendar-day other-month">
            <div class="day-number">${day}</div>
        </div>`;
    }

    document.getElementById('calendar').innerHTML = calendarHTML;
}

/**
 * Tag-Klasse für Event-Styling bestimmen
 */
function getTagClass(tags) {
    if (!tags || tags.length === 0) return '';
    
    const tag = tags[0].toLowerCase();
    const tagMap = {
        'work': 'tag-work',
        'arbeit': 'tag-work',
        'job': 'tag-work',
        'personal': 'tag-personal',
        'privat': 'tag-personal',
        'private': 'tag-personal',
        'meeting': 'tag-meeting',
        'termin': 'tag-meeting',
        'birthday': 'tag-birthday',
        'geburtstag': 'tag-birthday',
        'bday': 'tag-birthday'
    };
    
    return tagMap[tag] || '';
}

/**
 * Text kürzen
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Hilfsfunktionen für Datum
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
}

function formatDateGerman(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Navigation
 */
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

/**
 * Event-Handler
 */
function dayClicked(dateString) {
    const dayEvents = events.filter(event => event.date === dateString);
    if (dayEvents.length > 0) {
        showDayEvents(dateString, dayEvents);
    } else {
        console.log('Kein Event an diesem Tag:', dateString);
        // Hier könnten Sie optional ein "Event hinzufügen" Modal öffnen
    }
}

function showEventDetails(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) {
        console.error('Event nicht gefunden:', eventId);
        return;
    }

    const modal = document.getElementById('eventModal');
    const details = document.getElementById('eventDetails');
    
    let tagsHTML = '';
    if (event.tags && event.tags.length > 0) {
        tagsHTML = event.tags.map(tag => 
            `<span style="background: #4f46e5; color: white; padding: 4px 12px; border-radius: 15px; font-size: 0.8rem; margin-right: 8px; display: inline-block; margin-bottom: 4px;">${tag}</span>`
        ).join('');
    }

    details.innerHTML = `
        <h2>${event.name}</h2>
        <div class="event-detail">
            <strong>📅 Datum:</strong>
            ${formatDateGerman(event.date)}
        </div>
        ${event.location ? `
        <div class="event-detail">
            <strong>📍 Ort:</strong>
            ${event.location}
        </div>` : ''}
        ${event.description ? `
        <div class="event-detail">
            <strong>📝 Beschreibung:</strong>
            ${event.description}
        </div>` : ''}
        ${tagsHTML ? `
        <div class="event-detail">
            <strong>🏷️ Tags:</strong><br>
            ${tagsHTML}
        </div>` : ''}
        ${event.createdAt ? `
        <div class="event-detail" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #64748b;">
            <strong>Erstellt:</strong> ${new Date(event.createdAt).toLocaleString('de-DE')}
        </div>` : ''}
    `;
    
    modal.style.display = 'block';
}

function showDayEvents(dateString, dayEvents) {
    const modal = document.getElementById('eventModal');
    const details = document.getElementById('eventDetails');
    
    const formattedDate = formatDateGerman(dateString);

    let eventsHTML = dayEvents.map(event => {
        const tagClass = getTagClass(event.tags);
        return `
        <div class="event-item" style="background: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 12px; cursor: pointer; border-left: 4px solid #4f46e5; transition: all 0.3s ease;" 
             onclick="showEventDetails(${event.id})"
             onmouseover="this.style.background='#f1f5f9'; this.style.transform='translateX(5px)'"
             onmouseout="this.style.background='#f8fafc'; this.style.transform='translateX(0)'">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <div class="event ${tagClass}" style="padding: 4px 8px; margin: 0; font-size: 0.75rem; border-radius: 6px;">
                    ${event.name}
                </div>
            </div>
            ${event.location ? `<div style="color: #64748b; font-size: 0.9rem; margin-bottom: 4px;">📍 ${event.location}</div>` : ''}
            ${event.description ? `<div style="color: #475569; font-size: 0.9rem;">${truncateText(event.description, 80)}</div>` : ''}
        </div>
        `;
    }).join('');

    details.innerHTML = `
        <h2>Events am ${formattedDate}</h2>
        <div style="margin-bottom: 15px; color: #64748b; font-size: 0.9rem;">
            ${dayEvents.length} Event${dayEvents.length !== 1 ? 's' : ''} gefunden
        </div>
        ${eventsHTML}
    `;
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
}

function addNewEvent() {
    // Navigation zur Hauptseite oder Event-Formular
    if (confirm('Möchten Sie zur Hauptseite wechseln, um ein neues Event zu erstellen?')) {
        window.location.href = '/';
    }
}

/**
 * Event Listeners
 */
window.onclick = function(event) {
    const modal = document.getElementById('eventModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Tastatur-Navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    } else if (event.key === 'ArrowLeft') {
        previousMonth();
    } else if (event.key === 'ArrowRight') {
        nextMonth();
    }
});

/**
 * Initialisierung
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Kalender wird initialisiert...');
    loadEvents();
    
    // Auto-refresh alle 5 Minuten
    setInterval(function() {
        console.log('Auto-refresh der Events...');
        loadEvents();
    }, 5 * 60 * 1000);
});

/**
 * Zusätzliche Utility-Funktionen
 */

// Kalender zu bestimmtem Datum navigieren
function goToDate(year, month) {
    currentDate = new Date(year, month, 1);
    renderCalendar();
}

// Zu heute navigieren
function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

// Export für eventuelle externe Nutzung
window.CalendarAPI = {
    loadEvents,
    goToDate,
    goToToday,
    previousMonth,
    nextMonth
};
