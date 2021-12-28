import { resetStore } from "./store.js"
import {
  DAY_START,
  ALARM_DAILY_CHECK,
  dailyCheckAlarmListener,
} from "./commons.js"

chrome.runtime.onInstalled.addListener(resetStore)

// chrome.runtime.onStartup.addListener()

// chrome.runtime.onStartup.addListener(
//   callback: () => void,
//

console.log("background")

function createDailyScheduleCheckAlarm() {
  let [hrs, mins] = DAY_START.split(":").map(e => parseInt(e))
  let nextRun = new Date()
  nextRun.setDate(nextRun.getDate() + 1) // Using setDate takes care of edge cases like month/year ends
  nextRun.setHours(hrs)
  nextRun.setMinutes(mins)
  nextRun.setSeconds(0)
  nextRun.setMilliseconds(0)

  chrome.alarms.create(ALARM_DAILY_CHECK, {
    when: nextRun.valueOf(), // next day midnight 12 am
    periodInMinutes: 24 * 60, // repeat every 24 hours
  })

  chrome.alarms.onAlarm.addListener(dailyCheckAlarmListener)
}

createDailyScheduleCheckAlarm()
