
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

    function _getCheetWeekInfo(sheet) {
        try {
            const dateRangeValues = sheet.getRange(Config.DateRange).getValues();
            console.log(dateRangeValues.join(";"))
        } catch (e) {
            console.error("Failed to get week info", e)
        }
    }

    export function parseSheetInfo(sheet: GoogleAppsScript.Spreadsheet.Sheet, masseurs: T.MasseurData[]): T.SheetInfo[] {
        _getCheetWeekInfo(sheet)
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
                    let time = String(times[y][0]);
                    if (time.includes("dőpontra vár")) {
                        console.warn("Hit a block in times: ", time)
                        break
                    }
                    const name = String(names[y][0]);
                    sheetInfo.push({
                        massagistName: massagistName,
                        name: name,
                        day: msgDayData.day,
                        time: MUtils.parseTime(time),
                    })
                }
            }
        }
        Logger.log("sheetInfo generated")
        return sheetInfo;
    }
}