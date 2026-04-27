/**
 * @module calendar
 * @description Handles adding election reminders to Google Calendar
 */

import { showToast } from './ui-controller.js';

export const initCalendar = () => {
  // Can be called globally to generate .ics files
};

export const downloadICS = (title, description, location, startDate) => {
  const start = new Date(startDate);
  // Format for ICS: YYYYMMDDTHHMMSSZ
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour

  const icsString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ElectionIQ//EN
BEGIN:VEVENT
UID:${new Date().getTime()}@electioniq.web.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${title.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Calendar reminder downloaded!", "success");
};
