/// <reference path="secret.ts" />

namespace Config {
    export const calendarId = Secret.calendarId;
    export const sheetId = Secret.sheetId;
    export const companyEmailDomain = Secret.companyEmailDomain;
    export const nicknameMapping = Secret.nicknameMapping;
    export const tempMasseurData = Secret.tempMasseurData;
    export const EXCLUDENAMES = Secret.EXCLUDENAMES;
    export const DateRange = "B1:O1"
    export const flags = {
        ignorePastDays: true,
        InviteEveryoneByEmailPrefix: false,
        skipAfterThursday: true,
        skipAfterWorkHours: true,
        createEventsForEmptySlots: false,
    }
}
