
namespace MSheet {
    const EXCLUDENAMES = "Sheet"

    /** Day 1: monday, Day 5: friday */
    export function parseMasseursFromSheet(_sheet: GoogleAppsScript.Spreadsheet.Sheet): T.MasseurData[] {
        // TODO: get it automatically
        return Config.tempMasseurData
    }

    export function getSheetById(sheetId: string): GoogleAppsScript.Spreadsheet.Sheet {
        const sheetFile = SpreadsheetApp.openById(sheetId)
        const possibleSheets = sheetFile.getSheets()
            .filter(sheet => !sheet.isSheetHidden())
            .filter(sheet => !sheet.getSheetName().includes(EXCLUDENAMES))
            .map(sheet => sheet.getSheetName())
        if (possibleSheets.length > 1) {
            console.warn("Inconclusive which one to select, chose the first one", possibleSheets)
        } else if (possibleSheets.length == 0) {
            console.error("No matching sheet found... exiting")
            throw new Error("no sheet found")
        }
        const sheetName = possibleSheets[0]
        Logger.log("Opened file '%s' sheet '%s'", sheetFile.getName(), sheetName)
        const sheet = sheetFile.getSheetByName(sheetName)
        return sheet

    }

    export function parseSheetInfo(sheet: GoogleAppsScript.Spreadsheet.Sheet, masseurs: T.MasseurData[]): T.SheetInfo[] {
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
                    let time = times[y][0];
                    if (time.indexOf("dőpontra vár") > -1) {
                        console.warn("Hit an block in times: ", time)
                        break
                    }
                    const name = names[y][0];
                    const email = MUtils.getMailAddressForName(name)
                    sheetInfo.push({
                        massagistName: massagistName,
                        name: name,
                        email: email,
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