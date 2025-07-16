const apiUrl = '/api/events';
const tagUrl = '/api/tags';

document.addEventListener('DOMContentLoaded', () => {
  const eventForm = document.getElementById('eventForm');
  const eventList = document.getElementById('eventList');
  const formHelp = document.getElementById('formHelp');
  const searchInput = document.getElementById('searchInput');
  const tagFilter = document.getElementById('tagFilter');
  const dateFilter = document.getElementById('dateFilter');
  const resetFilters = document.getElementById('resetFilters');

  // Nur auf events.html aktiv
  if (eventForm && eventList) {
    // Events laden
    fetchEvents();

    // Tags für Filter laden
    fetch(tagUrl)
      .then(res => res.json())
      .then(tags => {
        tagFilter.innerHTML = '<option value="">Alle Tags</option>';
        tags.forEach(tag => {
          const opt = document.createElement('option');
          opt.value = tag;
          opt.textContent = tag;
          tagFilter.appendChild(opt);
        });
      });

    // Event anlegen
    eventForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('eventName').value.trim();
      const date = document.getElementById('eventDate').value;
      const location = document.getElementById('eventLocation').value.trim();
      const description = document.getElementById('eventDescription').value.trim();
      const tags = document.getElementById('tag').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

      if (!name || !date) {
        formHelp.textContent = "Bitte mindestens Name und Datum angeben!";
        return;
      }
      formHelp.textContent = "";

      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, date, location, description, tags })
      })
      .then(res => res.json())
      .then(() => {
        eventForm.reset();
        fetchEvents();
      });
    });

    // Filter-Events
    [searchInput, tagFilter, dateFilter].forEach(el => {
      if (el) el.addEventListener('input', fetchEvents);
    });
    if (resetFilters) {
      resetFilters.addEventListener('click', () => {
        searchInput.value = '';
        tagFilter.value = '';
        dateFilter.value = '';
        fetchEvents();
      });
    }

    // Event-Liste laden und filtern
    function fetchEvents() {
      fetch(apiUrl)
        .then(res => res.json())
        .then(events => {
          // Filter anwenden
          let filtered = events;
          const search = searchInput.value.trim().toLowerCase();
          const tag = tagFilter.value;
          const date = dateFilter.value;

          if (search) {
            filtered = filtered.filter(e =>
              e.name.toLowerCase().includes(search) ||
              (e.location && e.location.toLowerCase().includes(search)) ||
              (e.description && e.description.toLowerCase().includes(search))
            );
          }
          if (tag) {
            filtered = filtered.filter(e => (e.tags || []).includes(tag));
          }
          if (date) {
            filtered = filtered.filter(e => e.date === date);
          }

          renderEvents(filtered);
        });
    }

    // Event-Liste anzeigen
    function renderEvents(events) {
      eventList.innerHTML = '';
      if (events.length === 0) {
        eventList.innerHTML = '<li>Keine passenden Events gefunden.</li>';
        return;
      }
      events.forEach(event => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${event.name}</strong> <span style="color:#555;">(${event.date}${event.location ? ', ' + event.location : ''})</span>
          <br>
          <span>${event.description ? event.description : ''}</span>
          <div class="event-tags">${(event.tags || []).map(t => `<span class="event-tag">${t}</span>`).join(' ')}</div>
          <button class="event-delete-btn" data-id="${event.id}">Löschen</button>
        `;
        eventList.appendChild(li);
      });

      // Löschen-Buttons aktivieren
      document.querySelectorAll('.event-delete-btn').forEach(btn => {
        btn.onclick = function() {
          if (confirm("Event wirklich löschen?")) {
            fetch(`${apiUrl}/${btn.dataset.id}`, { method: 'DELETE' })
              .then(() => fetchEvents());
          }
        };
      });
    }
  }
});
