import {
  resetStore,
  getAllHosts,
  addHostConfig,
  removeHostConfig,
  getHostConfig,
} from "../store.js"

import {
  DAY_START,
  DAY_END,
  INFINITY,
  DEFAULT_ALLOW_CONFIG,
  WEEKDAYS,
  deepClone,
  equalArrays,
  equalObjects,
  removeAllRules,
  extractHostFromUrl,
  generateHostConfig,
  clearAlarmsAndListeners,
  applyConfig,
} from "../commons.js"

const SIMPLE = "simple"
const ADVANCED = "advanced"

const weekdayMap = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
}

async function homeHTML(hostHandler) {
  let home = document.createElement("div")
  home.id = "home"
  home.innerHTML = `
  <button id="add-new-host">Add new website</button>
  <div class="host-list-container">
    <button id="host-list-display-toggle">Show websites</button>
    <div class="host-list"></div>
  </div>
  `

  home
    .querySelector("#host-list-display-toggle")
    .addEventListener("click", async () => {
      const hostList = home.querySelector(".host-list")
      hostList.innerHTML === ""
        ? hostList.replaceChildren(await generateHostListHtml(hostHandler))
        : (hostList.innerHTML = "")
    })

  home
    .querySelector("#add-new-host")
    .addEventListener("click", () => hostHandler())

  return home
}

async function generateHostListHtml(hostEditHandler) {
  const hosts = await getAllHosts()
  if (hosts.length) {
    let ul = document.createElement("ul")
    hosts.forEach(host => {
      let btn = document.createElement("button")
      btn.textContent = host
      btn.addEventListener("click", () => hostEditHandler(host))
      let li = document.createElement("li")
      li.appendChild(btn)
      ul.appendChild(li)
    })
    return ul
  } else {
    let p = document.createElement("p")
    p.textContent = "No hosts added"
    return p
  }
}

function process() {
  const main = document.querySelector("main")

  function hostHandler(host) {
    generateCrudHtml(host, gotoHome).then(crud => main.replaceChildren(crud))
  }

  function gotoHome() {
    homeHTML(hostHandler).then(home => main.replaceChildren(home))
  }

  gotoHome()

  document.getElementById("clearAll").addEventListener("click", clearAll)
}

async function generateCrudHtml(host = null, gotoHome) {
  let crud = document.createElement("div")
  crud.classList = ["crud-container"]

  crud.innerHTML = `
    <input ${host ? `value="${host}" disabled` : ""} />
    
    <div class="controls-selector-container">
      <input type="radio" id="simpleControlsFlag" value="simple" checked>
      <label for="simpleControlsFlag">Simple Controls</label>
      <input type="radio" id="advancedControlsFlag" value="advanced">
      <label for="advancedControlsFlag">Advanced Controls</label>
    </div>

    <div class="controls-parent-container"></div>

    <div>
    <button id="crudSave">Save</button>
    <button id="crudCancel">Cancel</button>
    </div>
  `

  const initialSimple = {
    blockWeekdays: { selected: false },
    indefiniteBlock: { selected: false },
    limitVisits: { selected: false, visits: 1 },
    limitToSchedule: { selected: false, sched: ["16:00", "17:00"] },
  }

  let defaultDayConfig = { schedule: ["16:00", "17:00"], frequency: 1 }
  const initialAdvanced = WEEKDAYS.reduce((acc, day) => {
    acc[day] = deepClone(defaultDayConfig)
    return acc
  }, {})

  let initialControls
  if (host) {
    let { type_, data } = presentationFromConfig(await getHostConfig(host))
    if (type_ == SIMPLE) {
      let simpleType = data["simpleType"]
      if (simpleType === "blockWeekdays")
        initialSimple[simpleType].selected = true
      else if (simpleType === "indefiniteBlock")
        initialSimple[simpleType].selected = true
      else if (simpleType === "limitVisits") {
        initialSimple[simpleType].selected = true
        initialSimple[simpleType].visits = data.visits
      } else if (simpleType === "limitToSchedule") {
        initialSimple[simpleType].selected = true
        initialSimple[simpleType].sched = data.sched
      } else throw new Error(`simpleType "${simpleType}" not handled`)
    } else
      initialAdvanced = WEEKDAYS.reduce((acc, day) => {
        acc[day] = data[day] || null
      }, {})

    initialControls =
      type_ === SIMPLE
        ? simpleControlsDiv(scEventHandler, initialSimple)
        : advancedControlsDiv(acEventHandler, initialAdvanced)
  } else initialControls = simpleControlsDiv(scEventHandler, initialSimple)

  const state = {
    [SIMPLE]: deepClone(initialSimple),
    [ADVANCED]: deepClone(initialAdvanced),
  }

  function scEventHandler(simpleType, ...args) {
    Object.keys(initialSimple).forEach(
      st => (state[SIMPLE][st].selected = false)
    )
    state[SIMPLE][simpleType].selected = true

    if (simpleType === "limitVisits")
      state[SIMPLE][simpleType].visits = args[0].visits
    else if (simpleType === "limitToSchedule")
      state[SIMPLE][simpleType].sched = args[0].sched

    crud
      .querySelector(".controls-parent-container")
      .firstElementChild.replaceWith(
        simpleControlsDiv(scEventHandler, state[SIMPLE])
      )
  }

  function acEventHandler(args) {
    state[ADVANCED] = args
  }

  crud.querySelector(".controls-parent-container").appendChild(initialControls)

  let simpleControl = crud.querySelector("#simpleControlsFlag")
  let advControl = crud.querySelector("#advancedControlsFlag")

  crud
    .querySelector(".controls-selector-container")
    .addEventListener("change", ({ target }) => {
      if (target.id === "simpleControlsFlag") {
        advControl.checked = false
        if (!host) {
          crud
            .querySelector(".controls-parent-container")
            .firstElementChild.replaceWith(
              simpleControlsDiv(scEventHandler, initialSimple)
            )
        } else {
          alert("Not handled: host with sc")
        }
      } else {
        simpleControl.checked = false
        if (!host) {
          crud
            .querySelector(".controls-parent-container")
            .firstElementChild.replaceWith(
              advancedControlsDiv(acEventHandler, initialAdvanced)
            )
        } else {
          alert("Not handled: host with ac")
        }
      }
    })

  crud.querySelector("#crudSave").addEventListener("click", async () => {
    let config
    if (simpleControl.checked) {
      config = generateSimpleConfig(state[SIMPLE])
    } else {
      // let config = generateAdvancedConfig(state[])
    }
    await addNewHost(crud.firstElementChild.value, config)
    gotoHome()
  })

  crud.querySelector("#crudCancel").addEventListener("click", gotoHome)

  return crud
}

function advancedControlsDiv(callback, dayConfigs) {
  const dayControlDiv = (day, config) => {
    let schedAndFreq = ""
    if (config !== null) {
      let { schedule, frequency } = config
      schedAndFreq = `
    <div>
      <span>Schedule</span>
      <div>Allow all day</div>
      <div>Allow between <input type="time" value="${schedule[0]}" min="00:00" required /> and <input type="time" value="${schedule[1]}" max="23:59" required /></div>
    </div>
    <div>
      <span>Visit Limits</span>
      <div>Unlimited</div>
      <div>Limited to <input type="number" value="${frequency}" min="1" max="99"/></div>
    </div>`
    }

    return `
    <div class="day-control" id="day-control-${day}">
      <span class="day-control-title">${weekdayMap[day]}</span>
      <div>
        <input type="checkbox" id="${day}-indefinite-block" ${
      config === null ? "checked" : ""
    } />
        <label for="${day}-indefinite-block">Indefinite Block</label>
      </div>
      ${schedAndFreq}
    </div>
    `
  }

  let div = document.createElement("div")
  div.classList = ["advanced-controls-container"]
  div.innerHTML = `${Object.entries(dayConfigs).map(([day, config]) =>
    dayControlDiv(day, config)
  )}`
  return div
}

function simpleControlsDiv(callback, cntxt) {
  let container = document.createElement("div")
  container.classList = ["simple-controls-container"]
  container.innerHTML = `
      <div class="simple-control ${
        cntxt.blockWeekdays.selected ? "simple-control-selected" : ""
      }" id="sc-blockWeekdays"><span>Block on Weekdays<span></div>
      <div class="simple-control ${
        cntxt.indefiniteBlock.selected ? "simple-control-selected" : ""
      }" id="sc-indefiniteBlock"><span>Block Indefinitely<span></div>
      <div class="simple-control ${
        cntxt.limitVisits.selected ? "simple-control-selected" : ""
      }" id="sc-limitVisits">
        <span>Limit visits to <input type="number" value="${
          cntxt.limitVisits.visits
        }" min="1" max="99"/> per day</span>
      </div>
      <div class="simple-control ${
        cntxt.limitToSchedule.selected ? "simple-control-selected" : ""
      }" id="sc-limitToSchedule">
        <span>Allow visits only between <input type="time" value="${
          cntxt.limitToSchedule.sched[0]
        }" min="00:00" required /> and <input type="time" value="${
    cntxt.limitToSchedule.sched[1]
  }" max="23:59" required /> every day</span>
      </div>
  `

  const getVisits = () =>
    container.querySelector("#sc-limitVisits>span>input").value

  const getSched = () => {
    let nodelist = container.querySelectorAll("#sc-limitToSchedule>span>input")
    return [nodelist[0].value, nodelist[1].value]
  }

  container
    .querySelector("#sc-limitVisits>span>input")
    .addEventListener("change", e => {
      callback("limitVisits", { visits: e.target.value })
    })

  container
    .querySelector("#sc-limitToSchedule>span:first-child")
    .addEventListener("change", () => {
      callback("limitToSchedule", { sched: getSched() })
    })

  container
    .querySelector("#sc-limitToSchedule>span:last-child")
    .addEventListener("change", () => {
      callback("limitToSchedule", { sched: getSched() })
    })

  container.addEventListener("click", ({ target }) => {
    switch (target.id) {
      case "sc-blockWeekdays":
        callback("blockWeekdays")
        break
      case "sc-indefiniteBlock":
        callback("indefiniteBlock")
        break
      case "sc-limitVisits":
        callback("limitVisits", { visits: getVisits() })
        break
      case "sc-limitToSchedule":
        callback("limitToSchedule", { sched: getSched() })
        break
      default:
      // Ignore everything else
    }
  })

  return container
}

function generateSimpleConfig(payload) {
  let [type_, data] = Object.entries(payload).find(
    ([simpleType, data]) => data.selected
  )

  let { visits, sched } = data || {}
  switch (type_) {
    case "blockWeekdays":
      return WEEKDAYS.slice(0, 6).reduce((acc, day) => {
        return { ...acc, [day]: deepClone(DEFAULT_ALLOW_CONFIG) }
      }, {})
    case "indefiniteBlock":
      return {}
    case "limitVisits":
      return WEEKDAYS.reduce((acc, day) => {
        return {
          ...acc,
          [day]: { ...deepClone(DEFAULT_ALLOW_CONFIG), frequency: visits },
        }
      }, {})
    case "limitToSchedule":
      return WEEKDAYS.reduce((acc, day) => {
        return {
          ...acc,
          [day]: {
            ...deepClone(DEFAULT_ALLOW_CONFIG),
            schedule: sched.slice(),
          },
        }
      }, {})
    default:
      throw new Error(`${type_} not implemented`)
  }
}

function generateAdvancedConfig(configs) {
  return configs
}

function presentationFromConfig(config) {
  if (Object.keys(config).length == 0) {
    return {
      type_: "simple",
      data: { simpleType: "indefiniteBlock" },
    }
  }

  let dayConfigs = Object.values(config)

  let allDaysSameSched = // all days same sched and !== default sched
    (dayConfigs.length == 7) &
    dayConfigs
      .slice(1)
      .every(({ schedule, _ }) => schedule == dayConfigs[0].schedule) &
    !equalArrays(dayConfigs[0].schedule, [DAY_START, DAY_END])
  let allDaysSameFreq = // all days same freq and !== default freq
    (dayConfigs.length == 7) &
    dayConfigs
      .slice(1)
      .every(({ _, frequency }) => frequency == dayConfigs[0].frequency) &
    (dayConfigs[0].frequency !== INFINITY)

  if (allDaysSameSched & !allDaysSameFreq) {
    return {
      type_: "simple",
      data: {
        simpleType: "limitToSchedule",
        sched: dayConfigs[0].schedule,
      },
    }
  }

  if (allDaysSameFreq & !allDaysSameSched) {
    return {
      type_: "simple",
      data: {
        simpleType: "limitVisits",
        visits: dayConfigs[0].frequency,
      },
    }
  }

  let { sat, sun } = config

  if (
    (dayConfigs.length == 2) &
    (sat == DEFAULT_ALLOW_CONFIG) &
    (sun == DEFAULT_ALLOW_CONFIG)
  ) {
    return {
      type_: "simple",
      data: { simpleType: "blockWeekdays" },
    }
  }

  return {
    type_: "advanced",
    data: {
      ...config,
    },
  }
}

async function addNewHost(host, dayConfigs = {}) {
  await addHostConfig(generateHostConfig(host, dayConfigs))
  await applyConfig()
}

async function updateHost(host, dayConfigs) {}

async function removeHost(host) {
  await removeHostConfig(host)
  await applyConfig()
}

async function clearAll() {
  await clearAlarmsAndListeners()
  await removeAllRules()
  await resetStore().then(() => console.log("All Cleared"))
}

process()
