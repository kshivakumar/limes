import { getAllHosts, getHostConfigsByDay } from "./store.js"

const getRules = chrome.declarativeNetRequest.getDynamicRules
const updateRules = chrome.declarativeNetRequest.updateDynamicRules

function extractHostFromUrl(url) {
  if (!url.toLowerCase().startsWith("http")) url = "https://" + url
  try {
    return new URL(url).host
  } catch (error) {}
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

const DAY_START = "00:00"
const DAY_END = "23:59"
const INFINITY = 99999
const DEFAULT_ALLOW_CONFIG = {
  schedule: [DAY_START, DAY_END],
  frequency: INFINITY,
}
const ALARM_DAILY_CHECK = "dailyCheck"
const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

function generateHostConfig(host, dayConfigs = {}) {
  // dayConfigs: {'mon': {schedule: ["12:00", "18:00"]}}
  return {
    host,
    config: Object.entries(dayConfigs).reduce((acc, [day, conf]) => {
      acc[day] = { ...deepClone(DEFAULT_ALLOW_CONFIG), ...conf }
      return acc
    }, {}),
  }
}

async function removeHostsFromDeniedList(hosts) {
  if (!Array.isArray(hosts)) hosts = [hosts]
  await getRules()
    .then(rules =>
      rules.filter(rule =>
        hosts.includes(hostFromRegex(rule.condition.regexFilter))
      )
    )
    .then(
      rmRules =>
        rmRules.length > 0 &&
        updateRules({
          removeRuleIds: rmRules.map(r => r.id),
        })
    )
}

async function addHostsToDeniedList(hosts) {
  if (!Array.isArray(hosts)) hosts = [hosts]
  let rules = await getRules()
  let existingHosts = rules.map(r => hostFromRegex(r.condition.regexFilter))
  let newHosts = hosts.filter(h => !existingHosts.includes(h))
  if (newHosts) {
    let ids = rules.map(r => r.id)
    if (ids.length === 0) ids = [0]
    await updateRules({
      addRules: newHosts.map((host, idx) =>
        generateRule(Math.max(...ids) + idx + 1, host)
      ),
    })
  }

  return
}

function regexFilterForHost(host) {
  return `^(https?:\/\/|www\.|https?:\/\/www\.)?${host}\/?`
}

function hostFromRegex(regex) {
  return regex.match(/\?([\w\.]+)\/\?/)[1]
}

function generateRule(id, host) {
  return {
    id,
    action: {
      type: "block",
      // redirect: { extensionPath: "/redirect.html" },
    },
    condition: {
      regexFilter: regexFilterForHost(host),
      resourceTypes: ["main_frame"],
    },
  }
}

async function scheduleAlarmListener({ name }) {
  // This is hacky, ideally I should have the weekday and startTime in the alarm name
  // which can be used to find the hosts by querying storage
  // Chrome doesn't seem to restrict large alarm names(I tried 1000 chars name)
  // Since there won't be many hosts that user wants to manage, this is fine for now.
  if (name.startsWith("allowHosts")) {
    let hosts = name.replace("allowHosts ", "").split(",")
    return removeHostsFromDeniedList(hosts)
  } else if (name.startsWith("denyHosts")) {
    let hosts = name.replace("denyHosts ", "").split(",")
    return addHostsToDeniedList(hosts)
  }
}

async function createAllowHostAlarm(hosts, when) {
  if (!Array.isArray(hosts)) hosts = [hosts]
  const name = `allowHosts ${hosts}`
  chrome.alarms.create(name, { when })
  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name == name) removeHostsFromDeniedList(hosts)
  })
}

async function createDenyHostAlarm(hosts, when) {
  if (!Array.isArray(hosts)) hosts = [hosts]
  const name = `denyHosts ${hosts}`
  chrome.alarms.create(name, { when })
  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === name) addHostsToDeniedList(hosts)
  })
}

async function manageScheduledHosts(hostConfigs) {
  // This function can be called at any time.
  // It should handle schedules that are overlapping with current time
  let [sameStartTime, sameEndTime] = [{}, {}]
  let now = new Date()
  now = now.getHours() * 60 + now.getMinutes()
  let allowImmediately = []
  hostConfigs.forEach(({ startTime, endTime, host }) => {
    let [startHrs, startMins] = startTime.split(":").map(e => parseInt(e))
    let [endHrs, endMins] = endTime.split(":").map(e => parseInt(e))
    if (now < startHrs * 60 + startMins) {
      // Create alarm only if this function runs before sched start time
      if (startTime in sameStartTime) sameStartTime[startTime].push(host)
      else sameStartTime[startTime] = [host]

      if (endTime in sameEndTime) sameEndTime[endTime].push(host)
      else sameEndTime[endTime] = [host]
    } else if (now < endHrs * 60 + endMins) {
      // If sched start time has passed but not end time,
      // allow the host immediately and create denyhost alarm
      allowImmediately.push(host)
      if (endTime in sameEndTime) sameEndTime[endTime].push(host)
      else sameEndTime[endTime] = [host]
    }
  })

  await removeHostsFromDeniedList(allowImmediately)

  await Promise.all(
    Object.entries(sameStartTime).map(async ([startTime, hosts]) => {
      let [hrs, mins] = startTime.split(":").map(e => parseInt(e))
      let nextRun = new Date()
      nextRun.setHours(hrs)
      nextRun.setMinutes(mins)
      nextRun.setSeconds(0)
      nextRun.setMilliseconds(0)

      await createAllowHostAlarm(hosts, nextRun)
    })
  )

  await Promise.all(
    Object.entries(sameEndTime).map(async ([endTime, hosts]) => {
      let [hrs, mins] = endTime.split(":").map(e => parseInt(e))
      let nextRun = new Date()
      nextRun.setHours(hrs)
      nextRun.setMinutes(mins)
      nextRun.setSeconds(0)
      nextRun.setMilliseconds(0)

      await createDenyHostAlarm(hosts, nextRun)
    })
  )
}

async function manageAlldayBlockHosts(hostConfigs) {
  let hosts = hostConfigs.map(hc => hc.host)
  await addHostsToDeniedList(hosts)
}

async function manageAlldayAllowHosts(hostConfigs) {
  let hosts = hostConfigs.map(hc => hc.host)
  await removeHostsFromDeniedList(hosts)
}

function filterHostsWithFreq(hcs) {
  return hcs.filter(
    ({ config: { frequency } }) => frequency && frequency !== INFINITY
  )
}

function filterHostsWithSched(hcs) {
  return hcs.filter(
    ({ config: { schedule } }) => schedule && schedule !== [DAY_START, DAY_END]
  )
}

function filterHostsWithAlldayBlock(hcs) {
  return hcs.filter(({ config }) => config && Object.keys(config).length === 0)
}

function filterHostsWithAlldayAllow(hcs) {
  return hcs.filter(
    ({ config }) =>
      config.schedule === [DAY_START, DAY_END] && config.frequency === INFINITY
  )
}

async function trackHostVisits({ url }) {
  // If a host's visits exceed the limit, it's removed from tracking
  // If all the hosts exceed their limit, the listener is all together removed
  // When a blocked host is visited, this listener is not called because
  // this listener only works on 'OnComplete' requests, not failed/blocked.
  let hostConfigs = await getHostConfigsByDay()
  let urlHC = hostConfigs.find(hc => hc.host === extractHostFromUrl(url))
  if (Object.keys(urlHC).length !== 0) {
    let newCount = await incrementHostVisits(urlHC.host)
    if (newCount >= urlHC.frequency) {
      // Block the host and remove it from the listener's url list
      await addHostsToDeniedList(urlHC.host)

      chrome.webNavigation.onCompleted.removeListener(trackHostVisits)
      let newList = filterHostsWithFreq(hostConfigs).filter(
        hc => hc.host !== urlHC.host
      )
      if (!newList.length)
        chrome.webNavigation.onCompleted.addListener(trackHostVisits, {
          url: newList.map(hc => ({ hostEquals: hc.host })),
        })
    }
  } else console.error(`urlHC should be non-empty object`)
}

async function clearAlarmsAndListeners(clearDailyCheck = false) {
  let alarms = await chrome.alarms.getAll()
  if (!clearDailyCheck)
    alarms = alarms.filter(a => a.name !== ALARM_DAILY_CHECK)
  await Promise.all(alarms.map(a => chrome.alarms.clear(a.name)))

  chrome.alarms.onAlarm.removeListener(scheduleAlarmListener)
  if (!clearDailyCheck)
    chrome.alarms.onAlarm.removeListener(dailyCheckAlarmListener)

  chrome.webNavigation.onCompleted.removeListener(trackHostVisits)
}

async function applyConfig() {
  await clearAlarmsAndListeners()

  await removeAllRules()

  // Block all hosts
  await getAllHosts().then(hosts => addHostsToDeniedList(hosts))

  // Recreate everything
  await getHostConfigsByDay().then(hostConfigs => {
    let hostsWithFreqCheck = filterHostsWithFreq(hostConfigs)
    let hostsWithSchedule = filterHostsWithSched(hostConfigs)
    let hostsWithAlldayBlock = filterHostsWithAlldayBlock(hostConfigs)
    let hostsWithAlldayAllow = filterHostsWithAlldayAllow(hostConfigs)

    if (!hostsWithFreqCheck.length)
      chrome.webNavigation.onCompleted.addListener(trackHostVisits, {
        url: hostsWithFreqCheck.map(h => ({ hostEquals: h })),
      })

    if (!hostsWithSchedule.length) manageScheduledHosts(hostsWithSchedule)

    if (!hostsWithAlldayBlock.length)
      manageAlldayBlockHosts(hostsWithAlldayBlock)

    if (!hostsWithAlldayAllow.length)
      manageAlldayAllowHosts(hostsWithAlldayAllow)
  })
}

async function dailyCheckAlarmListener(alarm) {
  if (alarm.name == ALARM_DAILY_CHECK) {
    return applyConfig()
  }
}

async function removeAllRules() {
  let removeRuleIds = await getRules().then(rules => rules.map(r => r.id))
  if (removeRuleIds) {
    await updateRules({ removeRuleIds })
  }
}

export {
  WEEKDAYS,
  DAY_START,
  DAY_END,
  INFINITY,
  ALARM_DAILY_CHECK,
  getRules,
  updateRules,
  removeAllRules,
  extractHostFromUrl,
  hostFromRegex,
  generateHostConfig,
  addHostsToDeniedList,
  removeHostsFromDeniedList,
  createAllowHostAlarm,
  createDenyHostAlarm,
  manageScheduledHosts,
  scheduleAlarmListener,
  applyConfig,
  clearAlarmsAndListeners,
  dailyCheckAlarmListener,
}
