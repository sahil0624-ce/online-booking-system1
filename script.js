// --- DOM Elements ---
const bookingDateInput = document.getElementById('bookingDate');
const timeSlotsContainer = document.getElementById('timeSlotsContainer');
const selectedSlotInfo = document.getElementById('selectedSlotInfo');
const displaySelectedSlot = document.getElementById('displaySelectedSlot');
const bookingForm = document.getElementById('bookingForm');
const bookNowBtn = document.getElementById('bookNowBtn');
const calendarDaysContainer = document.getElementById('calendarDays');
const prevDayBtn = document.getElementById('prevDayBtn');
const nextDayBtn = document.getElementById('nextDayBtn');
const currentDateDisplay = document.getElementById('currentDateDisplay');

const messageBoxOverlay = document.getElementById('messageBoxOverlay');
const messageBox = document.getElementById('messageBox');
const messageBoxTitle = document.getElementById('messageBoxTitle');
const messageBoxMessage = document.getElementById('messageBoxMessage');
const messageBoxCloseBtn = document.getElementById('messageBoxCloseBtn');

// --- State Variables ---
let selectedDate = new Date(); // Stores the currently selected date object
let selectedSlotId = null; // Stores the ID of the selected time slot (e.g., '2025-07-26-10:00')

// In-memory data store for available and booked slots
// Structure: { 'YYYY-MM-DD': [{ id: 'YYYY-MM-DD-HH:MM', time: 'HH:MM', booked: boolean, bookingDetails: {} }] }
const allAvailableSlots = {};

// --- Helper Functions ---

/**
 * Formats a Date object to 'YYYY-MM-DD' string.
 * @param {Date} date - The date object to format.
 * @returns {string} Formatted date string.
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object to a readable string (e.g., "Mon, Jul 26, 2025").
 * @param {Date} date - The date object to format.
 * @returns {string} Readable date string.
 */
function formatReadableDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Generates mock time slots for a given date.
 * @param {string} dateString - Date in 'YYYY-MM-DD' format.
 * @returns {Array<Object>} Array of slot objects.
 */
function generateTimeSlots(dateString) {
    const slots = [];
    // Generate slots from 9 AM to 5 PM, every hour
    for (let i = 9; i <= 17; i++) {
        const time = `${String(i).padStart(2, '0')}:00`;
        slots.push({
            id: `${dateString}-${time}`,
            time: time,
            booked: false, // Initially not booked
            bookingDetails: null
        });
    }
    return slots;
}

/**
 * Ensures slots exist for a given date in `allAvailableSlots`.
 * If not, generates them.
 * @param {string} dateString - Date in 'YYYY-MM-DD' format.
 */
function ensureSlotsForDate(dateString) {
    if (!allAvailableSlots[dateString]) {
        allAvailableSlots[dateString] = generateTimeSlots(dateString);
    }
}

/**
 * Renders the time slots for the currently selected date.
 */
function renderTimeSlots() {
    const dateString = formatDate(selectedDate);
    ensureSlotsForDate(dateString); // Make sure slots exist for this date
    const slotsForDate = allAvailableSlots[dateString];

    timeSlotsContainer.innerHTML = ''; // Clear previous slots

    if (slotsForDate.length === 0) {
        timeSlotsContainer.innerHTML = `<p class="text-gray-500 text-center col-span-full">No slots available for ${formatReadableDate(selectedDate)}.</p>`;
        return;
    }

    slotsForDate.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = `slot-item p-4 border border-gray-300 rounded-lg text-center font-medium transition-all duration-200 ease-in-out ${slot.booked ? 'slot-booked' : 'bg-white'}`;
        slotDiv.textContent = slot.time;
        slotDiv.dataset.slotId = slot.id;

        if (slot.id === selectedSlotId) {
            slotDiv.classList.add('slot-selected');
        }

        if (!slot.booked) {
            slotDiv.addEventListener('click', () => selectSlot(slot.id));
        }

        timeSlotsContainer.appendChild(slotDiv);
    });
}

/**
 * Handles the selection of a time slot.
 * @param {string} slotId - The ID of the selected slot.
 */
function selectSlot(slotId) {
    const dateString = formatDate(selectedDate);
    const currentSlots = allAvailableSlots[dateString];
    const slotToSelect = currentSlots.find(s => s.id === slotId);

    if (!slotToSelect || slotToSelect.booked) {
        // Should not happen if event listener is correctly removed for booked slots
        showMessageBox('Error', 'This slot is already booked or invalid.', 'error');
        return;
    }

    // Deselect previous slot if any
    if (selectedSlotId) {
        const prevSelectedDiv = document.querySelector(`[data-slot-id="${selectedSlotId}"]`);
        if (prevSelectedDiv) {
            prevSelectedDiv.classList.remove('slot-selected');
            prevSelectedDiv.classList.add('bg-white'); // Revert background
        }
    }

    // Select new slot
    selectedSlotId = slotId;
    const newSelectedDiv = document.querySelector(`[data-slot-id="${selectedSlotId}"]`);
    if (newSelectedDiv) {
        newSelectedDiv.classList.add('slot-selected');
        newSelectedDiv.classList.remove('bg-white'); // Remove white background
    }

    displaySelectedSlot.textContent = `${formatReadableDate(selectedDate)} at ${slotToSelect.time}`;
    selectedSlotInfo.classList.remove('hidden');
    bookNowBtn.disabled = false; // Enable book button
}

/**
 * Renders the calendar days for the current month.
 * Highlights the selected date.
 */
function renderCalendar() {
    calendarDaysContainer.innerHTML = `
        <div class="text-gray-500">Sun</div>
        <div class="text-gray-500">Mon</div>
        <div class="text-gray-500">Tue</div>
        <div class="text-gray-500">Wed</div>
        <div class="text-gray-500">Thu</div>
        <div class="text-gray-500">Fri</div>
        <div class="text-gray-500">Sat</div>
    `; // Reset and add headers

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    // Add empty divs for leading blank days
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
        calendarDaysContainer.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
        const dateString = formatDate(date);

        const dayDiv = document.createElement('div');
        dayDiv.classList.add('p-2', 'rounded-lg', 'cursor-pointer', 'hover:bg-indigo-100', 'transition-colors', 'font-semibold');
        dayDiv.textContent = day;
        dayDiv.dataset.date = dateString;

        // Highlight today
        if (dateString === formatDate(today)) {
            dayDiv.classList.add('bg-yellow-100', 'text-yellow-800');
        }

        // Highlight selected date
        if (dateString === formatDate(selectedDate)) {
            dayDiv.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
        }

        // Disable past dates
        if (date < today) {
            dayDiv.classList.add('text-gray-400', 'cursor-not-allowed', 'opacity-60', 'hover:bg-transparent');
            dayDiv.style.pointerEvents = 'none'; // Prevent clicks
        } else {
            dayDiv.addEventListener('click', () => {
                selectedDate = date;
                bookingDateInput.value = dateString; // Update the date input
                updateUIForNewDate();
            });
        }
        calendarDaysContainer.appendChild(dayDiv);
    }

    currentDateDisplay.textContent = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Updates the UI when a new date is selected (or on initial load).
 */
function updateUIForNewDate() {
    selectedSlotId = null; // Reset selected slot
    selectedSlotInfo.classList.add('hidden');
    bookNowBtn.disabled = true; // Disable book button until a slot is selected

    renderCalendar(); // Re-render calendar to highlight new date
    renderTimeSlots(); // Re-render time slots for the new date
}

/**
 * Displays a custom message box.
 * @param {string} title - The title of the message box.
 * @param {string} message - The message content.
 * @param {'success'|'error'} type - Type of message (affects styling).
 */
function showMessageBox(title, message, type) {
    messageBoxTitle.textContent = title;
    messageBoxMessage.textContent = message;

    messageBox.classList.remove('message-box-success', 'message-box-error');
    if (type === 'success') {
        messageBox.classList.add('message-box-success');
    } else if (type === 'error') {
        messageBox.classList.add('message-box-error');
    }

    messageBoxOverlay.classList.remove('hidden');
    messageBoxOverlay.classList.add('show');
}

/**
 * Hides the custom message box.
 */
function hideMessageBox() {
    messageBoxOverlay.classList.remove('show');
    messageBoxOverlay.classList.add('hidden');
}

// --- Event Listeners ---

// Initialize date input with today's date and set min date
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const todayString = formatDate(today);
    bookingDateInput.value = todayString;
    bookingDateInput.min = todayString; // Prevent selecting past dates via input
    selectedDate = today; // Set initial selected date to today

    updateUIForNewDate(); // Initial render
});

// Date input change listener
bookingDateInput.addEventListener('change', (event) => {
    const newDate = new Date(event.target.value + 'T00:00:00'); // Add T00:00:00 to avoid timezone issues
    if (newDate < new Date().setHours(0,0,0,0)) {
        showMessageBox('Invalid Date', 'You cannot select a past date.', 'error');
        bookingDateInput.value = formatDate(selectedDate); // Revert to current selected date
        return;
    }
    selectedDate = newDate;
    updateUIForNewDate();
});

// Previous day button
prevDayBtn.addEventListener('click', () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    if (newDate < new Date().setHours(0,0,0,0)) {
        showMessageBox('Invalid Date', 'You cannot navigate to a past date.', 'error');
        return;
    }
    selectedDate = newDate;
    bookingDateInput.value = formatDate(selectedDate);
    updateUIForNewDate();
});

// Next day button
nextDayBtn.addEventListener('click', () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    selectedDate = newDate;
    bookingDateInput.value = formatDate(selectedDate);
    updateUIForNewDate();
});

// Booking form submission
bookingForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent default form submission

    if (!selectedSlotId) {
        showMessageBox('Booking Error', 'Please select a time slot before booking.', 'error');
        return;
    }

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!fullName || !email) {
        showMessageBox('Validation Error', 'Please fill in your full name and email.', 'error');
        return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessageBox('Validation Error', 'Please enter a valid email address.', 'error');
        return;
    }

    const [slotDateString, slotTime] = selectedSlotId.split('-');
    const slotsForDate = allAvailableSlots[slotDateString];
    const bookedSlot = slotsForDate.find(s => s.id === selectedSlotId);

    if (bookedSlot && !bookedSlot.booked) {
        bookedSlot.booked = true;
        bookedSlot.bookingDetails = {
            fullName: fullName,
            email: email,
            notes: notes,
            bookingTime: new Date().toISOString()
        };

        // Simulate successful booking
        showMessageBox(
            'Booking Confirmed!',
            `Your slot on ${formatReadableDate(selectedDate)} at ${bookedSlot.time} has been successfully booked by ${fullName}. A confirmation email has been sent to ${email}.`,
            'success'
        );

        // Reset form and UI
        bookingForm.reset();
        selectedSlotId = null;
        selectedSlotInfo.classList.add('hidden');
        bookNowBtn.disabled = true;
        renderTimeSlots(); // Re-render slots to show the booked one as unavailable
    } else {
        showMessageBox('Booking Failed', 'The selected slot is no longer available. Please choose another.', 'error');
        renderTimeSlots(); // Refresh slots in case status changed
    }
});

// Close message box
messageBoxCloseBtn.addEventListener('click', hideMessageBox);
messageBoxOverlay.addEventListener('click', (event) => {
    if (event.target === messageBoxOverlay) {
        hideMessageBox();
    }
});