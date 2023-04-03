/// <reference path="../types.ts" />

namespace MUtils {
    function _getMondayOfCurrentWeek(): Date {
        const today = new Date();
        const monday = new Date();
        const diff = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1);
        monday.setDate(diff);
        return monday;
    }

    export function shouldIgnoreDay(i: number): [boolean, Date] {
        const current = new Date();
        const monday = _getMondayOfCurrentWeek()
        const today = new Date()
        current.setDate(monday.getDate() + i);
        const ignore = Config.flags.ignorePastDays
            ? today.getDay() > current.getDay()
            : false
        return [ignore, current]
    }

    export function createDate(hour: number, minute: number, daysFromMonday: number): Date {
        let monday = _getMondayOfCurrentWeek();
        let diff = daysFromMonday * 24 * 60 * 60 * 1000;
        let date = new Date(monday.getTime() + diff);

        date.setHours(hour);
        date.setMinutes(minute);
        date.setSeconds(0);
        date.setMilliseconds(0)

        // Logger.log("createDate", arguments, date)
        return date;
    }

    export function parseTime(time: string): T.ParsedTime {
        // prepare for typos and 0 or 00 as well. base format: "12:00-12:15", but " 12.00 12-15 " is also accepted
        const re = /^\s*(\d+)\s*[:.\-]\s*(\d+)\s*-?\s*(\d+)\s*[:.\-]\s*(\d+)\s*$/;
        const found = time.match(re);
        if (!found) {
            console.error(`Failed to parse time: ${time}`)
            return null
        }

        return {
            startH: parseInt(found[1]),
            startM: parseInt(found[2]),
            endH: parseInt(found[3]),
            endM: parseInt(found[4]),
        }
    }

    export function getMailAddressForName(name: string): string {
        const prefix = MUtils.removeAccents(name.toLowerCase())
        return `${prefix}@${Config.companyEmailDomain}`
    }

    export function removeAccents(str: string): string {
        // Normalize the string to remove accents
        let normalizedStr = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Replace any remaining non-ASCII characters with their closest ASCII equivalents
        let asciiStr = normalizedStr.replace(/[^\x00-\x7F]/g, function (char) {
            // Define a map of accented characters and their non-accented counterparts
            let accents = "ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûü";
            let noAccents = "AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuu";

            // Return the non-accented counterpart of the accented character
            let index = accents.indexOf(char);
            if (index !== -1) {
                return noAccents.charAt(index);
            }
            return char;
        });

        return asciiStr;
    }

    export function parseDateFromString(rawText: string) {
        try {
            const dateRegex = /^([a-zúéáőóüöí]+)\s*(\d+)\.?$/i;
            const [, month, day] = dateRegex.exec(rawText.toLocaleLowerCase());
            const monthNames = {
                "január": 0,
                "február": 1,
                "március": 2,
                "április": 3,
                "május": 4,
                "június": 5,
                "július": 6,
                "augusztus": 7,
                "szeptember": 8,
                "október": 9,
                "november": 10,
                "december": 11,
            };
            const monthNumber = monthNames[month.toLowerCase()];

            const date = new Date();
            date.setFullYear(new Date().getFullYear(), monthNumber, parseInt(day));
            return date
        } catch (e) {
            return null
        }
    }

    export function isCurrentWeek(dates: Date[]): boolean {
        const currentDate = new Date();
        const currentDay = currentDate.getDay();
        // Calculate the start and end dates of the current week
        const weekStartDate = new Date(currentDate);
        weekStartDate.setDate(currentDate.getDate() - currentDay);
        weekStartDate.setHours(0, 0, 0, 0);
        const weekEndDate = new Date(currentDate);
        weekEndDate.setDate(currentDate.getDate() + (6 - currentDay));
        weekEndDate.setHours(23, 59, 59, 999);
        // Validate each date in the list
        const isCurrentWeek = dates.every((date) => {
            return date >= weekStartDate && date <= weekEndDate;
        });
        return isCurrentWeek
    }
}