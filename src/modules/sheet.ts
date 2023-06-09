/// <reference path="../types.ts" />
/// <reference path="config.ts" />
/// <reference path="utils.ts" />

namespace MSheet {
    /** Day 1: monday, Day 5: friday */
    export function parseMasseursFromSheet(_sheet: GoogleAppsScript.Spreadsheet.Sheet): T.MasseurData[] {
        // TODO: get it automatically
        return Config.tempMasseurData
    }

    export function getSheetById(sheetId: string): GoogleAppsScript.Spreadsheet.Sheet {
        const sheetFile = SpreadsheetApp.openById(sheetId)
        const possibleSheets = sheetFile.getSheets()
            .filter(sheet => !sheet.isSheetHidden())
            .filter(sheet => {
                const sheetName = sheet.getSheetName()
                return !Config.EXCLUDENAMES.some(exclude => sheetName.includes(exclude))
            })
            .map(sheet => sheet.getSheetName())
        // TODO: add smarter decision, or give back all
        if (possibleSheets.length > 1) {
            console.warn("Inconclusive which one to select, chose the first one %s", possibleSheets.join(","))
        } else if (possibleSheets.length == 0) {
            console.error("No matching sheet found... exiting")
            throw new Error("no sheet found")
        }
        const sheetName = possibleSheets[0]
        Logger.log("Opened file '%s' sheet '%s'", sheetFile.getName(), sheetName)
        const sheet = sheetFile.getSheetByName(sheetName)
        return sheet

    }

    export function getSheetWeekInfo(sheet) {
        try {
            const dateRangeValues = sheet
                .getRange(Config.DateRange)
                .getValues()[0]
                .map(date => MUtils.parseDateFromString(date))
                .filter(x => x);
            return [MUtils.isCurrentWeek(dateRangeValues), dateRangeValues]
        } catch (e) {
            console.error("Failed to get week info", e)
        }
    }

    export function parseSheetInfo(sheet: GoogleAppsScript.Spreadsheet.Sheet, masseurs: T.MasseurData[]): T.SheetInfo[] {
        const [currentWeek, _dates] = getSheetWeekInfo(sheet)
        if (!currentWeek) {
            console.warn("Skip other week...", _dates)
        }
        let sheetInfo: T.SheetInfo[] = [];
        for (let i = 0; i < masseurs.length; i++) {
            const massagist = masseurs[i];
            const massagistName = massagist.name;
            const massagistRanges = massagist.ranges;
            for (let day = 0; day < massagistRanges.length; day++) {
                let msgDayData = massagistRanges[day]
                let [shouldIgnore, _] = MUtils.shouldIgnoreDay(msgDayData.day - 1)
                if (shouldIgnore) {
                    Logger.log("%s: Ignoring #%d day of the week", massagistName, msgDayData.day)
                    continue
                }
                const timeRange = sheet.getRange(msgDayData.range);
                const nameRange = timeRange.offset(0, 1);
                const times = timeRange.getValues();
                const names = nameRange.getValues();
                for (let y = 0; y < times.length; y++) {
                    const rawTime = String(times[y][0]);
                    if (rawTime.includes("dőpontra vár")) {
                        console.warn("Hit a block in times: ", rawTime)
                        break
                    }
                    const name = String(names[y][0]);
                    const time = MUtils.parseTime(rawTime)

                    sheetInfo.push({
                        massagistName: massagistName,
                        name: name,
                        day: msgDayData.day,
                        _time: time,
                        startTime: MUtils.createDate(time.startH, time.startM, msgDayData.day - 1),
                        endTime: MUtils.createDate(time.endH, time.endM, msgDayData.day - 1),
                        isFree: name.trim() === "",
                    })
                }
            }
        }
        Logger.log("sheetInfo generated")
        return sheetInfo;
    }
}