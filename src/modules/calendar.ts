namespace MCalendar {
    const EVENT_DIFF_STATUS = {
        FOUND_EMPTY_SLOT: "foundEmptySlot",
        HAS_DIFFERENT_EVENT: "hasDifferentEvent",
        ALREADY_ADDED: "alreadyAdded",
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

    function _calcEventDiff(title: string, startTime: Date, endTime: Date, eventsForDay: GoogleAppsScript.Calendar.CalendarEvent[], massagist: string): [string, T.EventsToDelete] {
        if (!eventsForDay || eventsForDay.length === 0) {
            return [EVENT_DIFF_STATUS.FOUND_EMPTY_SLOT, null]
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
        // Logger.log("evtlist", readableEventList.map(e=> ({s: +e.start, e: +e.end, ss: +startTime, ee: +endTime, t:e.title, tt:title})))
        const textMassagist = _markMassagist(massagist)
        const toBeRemoved = readableEventList.filter(e => {
            return (e.title.indexOf(textMassagist) > -1) && (+e.start === +startTime) && (+e.end === +endTime) && (e.title !== title) // e.guests.contains(guest)
        })
        if (toBeRemoved.length > 0) {
            return [EVENT_DIFF_STATUS.HAS_DIFFERENT_EVENT, toBeRemoved.map(e => e.originalEvent)]
        }
        const alreadyAdded = readableEventList.filter(e => {
            return (e.title.indexOf(textMassagist) > -1) && (+e.start === +startTime) && (+e.end === +endTime) && (e.title === title) // e.guests.contains(guest)
        })
        if (alreadyAdded.length > 0) {
            return [EVENT_DIFF_STATUS.ALREADY_ADDED, null]
        }
        return [EVENT_DIFF_STATUS.FOUND_EMPTY_SLOT, null]
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
            let time = line.time
            let startTime = MUtils.createDate(time.startH, time.startM, line.day - 1)
            let endTime = MUtils.createDate(time.endH, time.endM, line.day - 1)
            let title = _createEventTitle(line.massagistName, line.name)
            let options = _createGuestList(line.name)
            let currEvt: T.EventToAdd = {
                startTime: startTime,
                endTime: endTime,
                title: title,
                options: options
            };
            let [eventDiff, otherEvts] = _calcEventDiff(title, startTime, endTime, collectEvents[line.day - 1], line.massagistName)
            // Logger.log("evtInfo", title, startTime, endTime, eventDiff)
            switch (eventDiff) {
                case EVENT_DIFF_STATUS.HAS_DIFFERENT_EVENT: {
                    eventsToDelete = eventsToDelete.concat(otherEvts)
                    eventsToAdd.push(currEvt)
                    break;
                }
                case EVENT_DIFF_STATUS.FOUND_EMPTY_SLOT: {
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
