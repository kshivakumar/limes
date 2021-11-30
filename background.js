import { getRules, updateRules, storageApi } from "./commons.js"

console.log("Hello")

const STATE_CHECK_FREQ = 30 // minutes

chrome.runtime.onInstalled.addListener(() => {
  storageApi.set({'urls': {}})
})

// chrome.runtime.onStartup.addListener()


// TBD: Read history to check if the user visited blocked sites on mobile


// How to detect and disable a site after user visits it?
// Check history every 30 mins to see if the limited site was visited
// It's probably not efficient to check every url visit

chrome.alarms.create('checkState', {
  delayInMinutes: 0,
  periodInMinutes: STATE_CHECK_FREQ,
})

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name == 'checkState') {
    chrome.history.search({
      text: "engadget.com",
      maxResults: 25,
      startTime: calcStartTime('day'),
    })
  }
})

async function loop() {
  let rules = await getRules()
  let stUrls = await storageApi.get(['urls'])
  
}

function calculateNextVisit(frequency, count, lastVisit) {
  let nextVisit = 0
  switch (frequency) {
    case "day":

    case "week":
      throw new Error("Not implemented")
    case "weekend":
      throw new Error("Not implemented")
    default:
      throw new Error("Not implemented")
  }
}

function calcStartTime(frequency) {
  let now = new Date()
  switch (frequency) {
    case "day":
      if (now.getHours() >= 0 && now.getHours() <= 5) {
        now.setDate(now.getDate() - 1)
      }
      now.setHours(6)
      now.setMinutes(0)
      now.setSeconds(0)
      return now.valueOf()
    case "week":
      throw new Error("Not implemented")
    case "weekend":
      throw new Error("Not implemented")
    default:
      throw new Error(`Not implemented: ${frequency}`)
  }
}

// chrome.runtime.onStartup.addListener(
//   callback: () => void,
// )

