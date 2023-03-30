function main() {
  const calendar = CalendarApp.getCalendarById(Config.calendarId);
  const sheet = MSheet.getSheetById(Config.sheetId)

  const masseurs = MSheet.parseMasseursFromSheet(sheet)
  const sheetInfo = MSheet.parseSheetInfo(sheet, masseurs);
  const [eventsToAdd, eventsToDelete] = MCalendar.getEventsInfo(calendar, sheetInfo);

  MCalendar.deleteEventsFromCalendar(eventsToDelete);
  MCalendar.addEventsToCalendar(calendar, eventsToAdd);
}
