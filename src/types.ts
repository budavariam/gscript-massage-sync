namespace T {
    export type SheetRange = {
        day: number;
        range: string;
    }

    export type MasseurData = {
        name: string;
        ranges: T.SheetRange[];
    }

    export type ParsedTime = {
        startH: number,
        startM: number,
        endH: number,
        endM: number,
    }

    export type SheetInfo = {
        massagistName: string,
        name: string,
        email: string,
        day: number,
        time: T.ParsedTime,
    }
    export type EventToAdd = {
        startTime: Date,
        endTime: Date,
        title: string,
        options: any,
    }
    export type EventsToDelete = GoogleAppsScript.Calendar.CalendarEvent[] | null
    export type Calendar = GoogleAppsScript.Calendar.Calendar
}