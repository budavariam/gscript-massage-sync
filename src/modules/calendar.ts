/// <reference path="../types.ts" />
/// <reference path="config.ts" />
/// <reference path="utils.ts" />

namespace MCalendar {
    const EVENT_DIFF_STATUS = {
        FOUND_EMPTY_SLOT_TO_FILL: "FOUND_EMPTY_SLOT_TO_FILL",
        HAS_DIFFERENT_EVENT: "HAS_DIFFERENT_EVENT",
        ALREADY_ADDED: "ALREADY_ADDED",
        OPEN_SLOT: "OPEN_SLOT",
    }

    export function isAfterThursday() {
        const today = new Date();
        const dayOfWeek = today.getDay(); 
        // Sunday = 0, Monday = 1, etc.
        return dayOfWeek == 0 || dayOfWeek > 4;
    }

    function _createEventTitle(massagist: string, name: string): string {
        return `Masszázs ${_markMassagist(massagist)} ${name}`
    }

    function _markMassagist(massagist: string): string {
        return `- ${massagist} -`
    }
    function _createGuestList(name: string): any {
        let mailaddress = ""
        if (name in Config.nicknameMapping) {
            mailaddress = Config.nicknameMapping[name]
            Logger.log("SEND EVENT TO '%s': '%s'", name, mailaddress)
        } else if (Config.flags.InviteEveryoneByEmailPrefix) {
            mailaddress = MUtils.getMailAddressForName(name)
            Logger.log("SEND EVENT TO %s", mailaddress)
        }
        return { guests: mailaddress };
    }

    function _calcEventDiff(title: string, startTime: Date, endTime: Date, emptySlot: boolean, eventsForDay: GoogleAppsScript.Calendar.CalendarEvent[], massagist: string): [string, T.EventsToDelete] {
        if (!eventsForDay || eventsForDay.length === 0) {
            return [EVENT_DIFF_STATUS.FOUND_EMPTY_SLOT_TO_FILL, null]
        }
        const readableEventList = eventsForDay.map((e, i) => {
            return {
                start: e.getStartTime(),
                end: e.getEndTime(),
                title: e.getTitle(),
                guests: e.getGuestList().map(e => e.getName()),
                originalIndex: i,
                originalEvent: e,
            }
        })
        const textMassagist = _markMassagist(massagist)
        if (!Config.flags.createEventsForEmptySlots && emptySlot) {
            // NOTE: remove events that are in the empty slot, and return without adding anything new
            const findEventForThatTime = readableEventList.filter(e => (+e.start === +startTime) && (+e.end === +endTime))
            return [EVENT_DIFF_STATUS.OPEN_SLOT, findEventForThatTime.map(e => e.originalEvent)]
        }
        // Logger.log("evtlist", readableEventList.map(e=> ({s: +e.start, e: +e.end, ss: +startTime, ee: +endTime, t:e.title, tt:title})))
        const toBeRemoved = readableEventList.filter(e => {
            return (e.title.includes(textMassagist)) && (+e.start === +startTime) && (+e.end === +endTime) && (e.title !== title) // e.guests.contains(guest)
        })
        if (toBeRemoved.length > 0) {
            return [EVENT_DIFF_STATUS.HAS_DIFFERENT_EVENT, toBeRemoved.map(e => e.originalEvent)]
        }
        const alreadyAdded = readableEventList.filter(e => {
            return (e.title.includes(textMassagist)) && (+e.start === +startTime) && (+e.end === +endTime) && (e.title === title) // e.guests.contains(guest)
        })
        if (alreadyAdded.length > 0) {
            return [EVENT_DIFF_STATUS.ALREADY_ADDED, null]
        }
        return [EVENT_DIFF_STATUS.FOUND_EMPTY_SLOT_TO_FILL, null]
    }

    export function getEventsInfo(calendar: T.Calendar, sheetInfo: T.SheetInfo[]) {
        let collectEvents = []
        for (let i = 0; i < 5; i++) {
            let [shouldIgnore, current] = MUtils.shouldIgnoreDay(i)
            if (shouldIgnore) {
                Logger.log("Ignoring #%d day of the week", i + 1)
                collectEvents.push([])
                continue
            }
            let events = calendar.getEventsForDay(current);
            Logger.log('Number of events: %d', events.length);
            collectEvents.push(events)
        }
        Logger.log("Found events per day: %s", collectEvents.map(l => l.length).join(","))

        let eventsToAdd = []
        let eventsToDelete = []
        for (let line of sheetInfo) {
            const title = _createEventTitle(line.massagistName, line.name)
            const options = _createGuestList(line.name)
            const currEvt: T.EventToAdd = {
                startTime: line.startTime,
                endTime: line.endTime,
                title: title,
                options: options
            };
            const currentDay = line.day - 1
            const [eventDiff, otherEvts] = _calcEventDiff(title, line.startTime, line.endTime, line.isFree, collectEvents[currentDay], line.massagistName)
            // Logger.log("evtInfo", title, startTime, endTime, eventDiff)
            switch (eventDiff) {
                case EVENT_DIFF_STATUS.HAS_DIFFERENT_EVENT: {
                    eventsToDelete = eventsToDelete.concat(otherEvts)
                    eventsToAdd.push(currEvt)
                    break;
                }
                case EVENT_DIFF_STATUS.OPEN_SLOT: {
                    eventsToDelete = eventsToDelete.concat(otherEvts)
                    break;
                }
                case EVENT_DIFF_STATUS.FOUND_EMPTY_SLOT_TO_FILL: {
                    eventsToAdd.push(currEvt)
                    break;
                }
                case EVENT_DIFF_STATUS.ALREADY_ADDED: { break; }
                default: { }
            }
        }
        return [eventsToAdd, eventsToDelete];
    }

    export function deleteEventsFromCalendar(eventsToDelete: T.EventsToDelete) {
        Logger.log("Number of events to delete: %d", eventsToDelete.length)
        for (let i = 0; i < eventsToDelete.length; i++) {
            let eventToDelete = eventsToDelete[i];
            // Logger.log(eventToDelete)
            eventToDelete.deleteEvent();
        }
    }

    export function addEventsToCalendar(calendar: T.Calendar, eventsToAdd: T.EventToAdd[]) {
        Logger.log("Number of events to add: %d", eventsToAdd.length)
        for (let i = 0; i < eventsToAdd.length; i++) {
            const eventToAdd = eventsToAdd[i];
            const startTime = eventToAdd.startTime;
            const endTime = eventToAdd.endTime;
            const title = eventToAdd.title;
            const options = eventToAdd.options;
            Logger.log(`createEvent(${title}, ${startTime}, ${endTime}, ${JSON.stringify(options)})`)
            calendar.createEvent(title, startTime, endTime, options);
        }
    }
}
