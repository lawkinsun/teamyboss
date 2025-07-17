import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Download } from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

const CalendarExport = ({ tasks, onExport }) => {
  const generateICSContent = (tasks) => {
    const now = new Date();
    const events = [];

    tasks.forEach(task => {
      if (task.frequency === 'one-time' && task.due_date) {
        // One-time task
        const dueDate = new Date(task.due_date);
        events.push({
          uid: `task-${task.id}@restaurant-pro.app`,
          dtstart: format(dueDate, 'yyyyMMdd'),
          dtend: format(dueDate, 'yyyyMMdd'),
          summary: task.title,
          description: task.description || '',
          location: task.project_names?.join(', ') || '',
          categories: task.categories?.join(',') || 'Task'
        });
      } else if (task.frequency !== 'one-time' && task.start_date) {
        // Recurring task - generate next 10 occurrences
        const startDate = new Date(task.start_date);
        const occurrences = [];
        
        for (let i = 0; i < 10; i++) {
          let occurrenceDate;
          
          switch (task.frequency) {
            case 'daily':
              occurrenceDate = addDays(startDate, i);
              break;
            case 'weekly':
              occurrenceDate = addWeeks(startDate, i);
              break;
            case 'monthly':
              occurrenceDate = addMonths(startDate, i);
              break;
            case 'quarterly':
              occurrenceDate = addMonths(startDate, i * 3);
              break;
            default:
              continue;
          }
          
          if (occurrenceDate >= now) {
            events.push({
              uid: `task-${task.id}-${i}@restaurant-pro.app`,
              dtstart: format(occurrenceDate, 'yyyyMMdd'),
              dtend: format(occurrenceDate, 'yyyyMMdd'),
              summary: `${task.title} (${task.frequency})`,
              description: task.description || '',
              location: task.project_names?.join(', ') || '',
              categories: task.categories?.join(',') || 'Task',
              rrule: task.frequency === 'daily' ? 'FREQ=DAILY' :
                     task.frequency === 'weekly' ? 'FREQ=WEEKLY' :
                     task.frequency === 'monthly' ? 'FREQ=MONTHLY' :
                     task.frequency === 'quarterly' ? 'FREQ=MONTHLY;INTERVAL=3' : ''
            });
          }
        }
      }
    });

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Restaurant Pro//Task Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Restaurant Pro Tasks',
      'X-WR-TIMEZONE:Asia/Hong_Kong',
      'X-WR-CALDESC:Tasks from Restaurant Pro Management System'
    ];

    events.forEach(event => {
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${event.uid}`,
        `DTSTART;VALUE=DATE:${event.dtstart}`,
        `DTEND;VALUE=DATE:${event.dtend}`,
        `DTSTAMP:${format(now, 'yyyyMMdd\'T\'HHmmss\'Z\'')}`,
        `SUMMARY:${event.summary}`,
        `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
        `LOCATION:${event.location}`,
        `CATEGORIES:${event.categories}`,
        event.rrule ? `RRULE:${event.rrule}` : '',
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    return icsContent.filter(line => line !== '').join('\r\n');
  };

  const handleExportCalendar = () => {
    const icsContent = generateICSContent(tasks);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `restaurant-pro-tasks-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (onExport) onExport();
  };

  const tasksWithDates = tasks.filter(t => 
    (t.frequency === 'one-time' && t.due_date) || 
    (t.frequency !== 'one-time' && t.start_date)
  );

  if (tasksWithDates.length === 0) {
    return null;
  }

  return (
    <Button
      onClick={handleExportCalendar}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Calendar className="w-4 h-4" />
      Export to Calendar
      <Download className="w-4 h-4" />
    </Button>
  );
};

export default CalendarExport;