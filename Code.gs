function main() {
  var calendarId = "xxxxxxxx@group.calendar.google.com";
  // var sheetId = "xxxxxxxx" // dev
  var sheetId = "yyyyyyyyyyy" // prod
  var calendar = CalendarApp.getCalendarById(calendarId);
  var sheet = getSheetById(sheetId)

  var masseurs = parseMasseursFromSheet(sheet)
  var sheetInfo = parseSheetInfo(sheet, masseurs);
  var [eventsToAdd, eventsToDelete] = getEventsInfo(calendar, sheetInfo);

  // TODO: remove events from last week
  deleteEventsFromCalendar(eventsToDelete);
  addEventsToCalendar(calendar, eventsToAdd);
}

function createGuestList(email) {
  let allowList = new Set([
    "asd@domain.com"
  ])
  if (allowList.has(email)) {
    console.log("SEND EVENT TO ", email)
    return { guests: email }
  }
  return { guests: "" };
}

function getMailAddressForName(name) {
  let prefix = removeAccents(name.toLowerCase())
  return `${prefix}@domain.com`
}

/** Day 1: monday, Day 5: friday */
function parseMasseursFromSheet(sheet) {
  // TODO: get it automatically
  return [{
    name: "Massageur1",
    ranges: [
      { day: 1, range: "A5:A9" },
      { day: 2, range: "E5:E10" },
      { day: 3, range: "I5:I10" },
      { day: 4, range: "M5:M10" },
      { day: 5, range: "Q5:E10" },
    ]
  },
  {
    name: "Masseur2",
    ranges: [
      { day: 1, range: "A14:A20" },
      { day: 2, range: "E14:E20" },
      { day: 3, range: "I14:I20" },
      { day: 4, range: "M14:M20" },
      { day: 5, range: "Q14:Q20" },
    ]
  },
  ];
}

//////////////////////////

function getSheetById(sheetId) {
  var sheetFile = SpreadsheetApp.openById(sheetId)
  var possibleSheets = sheetFile.getSheets()
    .filter(sheet => !sheet.isSheetHidden())
    .filter(sheet => !sheet.getSheetName().includes("Sheet"))
    .map(sheet => sheet.getSheetName())
  if (possibleSheets.length > 1) {
    console.warn("Inconclusive which one to select, chose the first one", possibleSheets)
  } else if (possibleSheets.length == 0) {
    console.error("No matching sheet found... exiting")
    throw new Error("no sheet found")
  }
  var sheetName = possibleSheets[0]
  var sheet = sheetFile.getSheetByName(sheetName)
  return sheet

}

function removeAccents(str) {
  // Normalize the string to remove accents
  var normalizedStr = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Replace any remaining non-ASCII characters with their closest ASCII equivalents
  var asciiStr = normalizedStr.replace(/[^\x00-\x7F]/g, function (char) {
    // Define a map of accented characters and their non-accented counterparts
    var accents = "ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûü";
    var noAccents = "AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuu";

    // Return the non-accented counterpart of the accented character
    var index = accents.indexOf(char);
    if (index !== -1) {
      return noAccents.charAt(index);
    }
    return char;
  });

  return asciiStr;
}

function parseTime(time) {
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

function parseSheetInfo(sheet, masseurs) {
  var sheetInfo = [];
  for (var i = 0; i < masseurs.length; i++) {
    var massagist = masseurs[i];
    var massagistName = massagist.name;
    var massagistRanges = massagist.ranges;
    for (var day = 0; day < massagistRanges.length; day++) {
      msgDayData = massagistRanges[day]
      let [shouldIgnore, _] = shouldIgnoreDay(msgDayData.day - 1)
      if (shouldIgnore) {
        console.log(`${massagistName}: Ignoring #${msgDayData.day} day of the week`)
        continue
      }
      var timeRange = sheet.getRange(msgDayData.range);
      var nameRange = timeRange.offset(0, 1);
      var times = timeRange.getValues();
      var names = nameRange.getValues();
      for (var y = 0; y < times.length; y++) {
        var time = times[y][0];
        if (time.indexOf("dőpontra vár") > -1) {
          console.warn("Hit an block in times: ", time)
          break
        }
        var name = names[y][0];
        var email = getMailAddressForName(name)
        sheetInfo.push({
          massagistName: massagistName,
          name: name,
          email: email,
          day: msgDayData.day,
          time: parseTime(time),
        })
      }
    }
  }
  console.log("sheetInfo generated")
  return sheetInfo;
}

function getMondayOfCurrentWeek() {
  var today = new Date();
  var monday = new Date();
  var diff = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1);
  monday.setDate(diff);
  return monday;
}

function createDate(hour, minute, daysFromMonday) {
  var monday = getMondayOfCurrentWeek();
  var diff = daysFromMonday * 24 * 60 * 60 * 1000;
  var date = new Date(monday.getTime() + diff);

  date.setHours(hour);
  date.setMinutes(minute);
  date.setSeconds(0);
  date.setMilliseconds(0)

  // console.log("createDate", arguments, date)
  return date;
}

function shouldIgnoreDay(i) {
  var monday = getMondayOfCurrentWeek()
  var today = new Date()
  var current = new Date();
  current.setDate(monday.getDate() + i);
  return [today.getDay() > current.getDay(), current]
}

function createEventTitle(massagist, name) {
  return `Masszázs ${_markMassagist(massagist)} ${name}`
}

function _markMassagist(massagist) {
  return `- ${massagist} -`
}

function calcEventDiff(title, startTime, endTime, eventsForDay, massagist, guest) {
  if (!eventsForDay || eventsForDay.length === 0) {
    return ["foundEmptySlot", null]
  }
  let readableEventList = eventsForDay.map((e, i) => {
    return {
      start: e.getStartTime(),
      end: e.getEndTime(),
      title: e.getTitle(),
      guests: e.getGuests(),
      originalIndex: i,
      originalEvent: e,
    }
  })
  // console.log("evtlist", readableEventList.map(e=> ({s: +e.start, e: +e.end, ss: +startTime, ee: +endTime, t:e.title, tt:title})))
  const textMassagist = _markMassagist(massagist)
  let toBeRemoved = readableEventList.filter(e => {
    return (e.title.indexOf(textMassagist) > -1) && (+e.start === +startTime) && (+e.end === +endTime) && (e.title !== title) // e.guests.contains(guest)
  })
  if (toBeRemoved.length > 0) {
    return ["hasDifferentEvent", toBeRemoved.map(e => e.originalEvent)]
  }
  let alreadyAdded = readableEventList.filter(e => {
    return (e.title.indexOf(textMassagist) > -1) && (+e.start === +startTime) && (+e.end === +endTime) && (e.title === title) // e.guests.contains(guest)
  })
  if (alreadyAdded.length > 0) {
    return ["alreadyAdded", null]
  }
  return ["foundEmptySlot", null]
}

function getEventsInfo(calendar, sheetInfo) {
  let collectEvents = []
  for (let i = 0; i < 5; i++) {
    let [shouldIgnore, current] = shouldIgnoreDay(i)
    if (shouldIgnore) {
      console.log(`Ignoring #${i + 1} day of the week`)
      collectEvents.push([])
      continue
    }
    var events = calendar.getEventsForDay(current);
    Logger.log('Number of events: ' + events.length);
    collectEvents.push(events)
  }
  console.log("Found events per day:", collectEvents.map(l => l.length))

  let eventsToAdd = []
  let eventsToDelete = []
  for (let line of sheetInfo) {
    var time = line.time
    var startTime = createDate(time.startH, time.startM, line.day - 1)
    var endTime = createDate(time.endH, time.endM, line.day - 1)
    var title = createEventTitle(line.massagistName, line.name)
    var options = createGuestList(line.email)
    var currEvt = {
      startTime: startTime,
      endTime: endTime,
      title: title,
      options: options
    };
    var [eventDiff, otherEvts] = calcEventDiff(title, startTime, endTime, collectEvents[line.day - 1], line.massagistName, line.email)
    // console.log("evtInfo", title, startTime, endTime, eventDiff)
    switch (eventDiff) {
      case "hasDifferentEvent": {
        eventsToDelete = eventsToDelete.concat(otherEvts)
        eventsToAdd.push(currEvt)
        break;
      }
      case "foundEmptySlot": {
        eventsToAdd.push(currEvt)
        break;
      }
      case "alreadyAdded": { break; }
      default: { }
    }
  }
  return [eventsToAdd, eventsToDelete];
}


function addEventsToCalendar(calendar, eventsToAdd) {
  console.log("Events to add: ", eventsToAdd.length)
  for (var i = 0; i < eventsToAdd.length; i++) {
    var eventToAdd = eventsToAdd[i];
    var startTime = eventToAdd.startTime;
    var endTime = eventToAdd.endTime;
    var title = eventToAdd.title;
    var options = eventToAdd.options;
    console.log(`createEvent(${title}, ${startTime}, ${endTime}, ${JSON.stringify(options)})`)
    calendar.createEvent(title, startTime, endTime, options);
  }
}

function deleteEventsFromCalendar(eventsToDelete) {
  console.log("Events to delete: ", eventsToDelete.length)
  for (var i = 0; i < eventsToDelete.length; i++) {
    var eventToDelete = eventsToDelete[i];
    // console.log(eventToDelete)
    eventToDelete.deleteEvent();
  }
}
