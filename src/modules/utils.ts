namespace MUtils {
    function _getMondayOfCurrentWeek(): Date {
        const today = new Date();
        const monday = new Date();
        const diff = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1);
        monday.setDate(diff);
        return monday;
    }

    export function shouldIgnoreDay(i: number): [boolean, Date] {
        const monday = _getMondayOfCurrentWeek()
        const today = new Date()
        const current = new Date();
        current.setDate(monday.getDate() + i);
        return [today.getDay() > current.getDay(), current]
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
        let prefix = MUtils.removeAccents(name.toLowerCase())
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
}