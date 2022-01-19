import {
  resetStore,
  getAllHosts,
  addHostConfig,
  removeHostConfig,
  getHostConfig,
} from "../store.js"

import {
  removeAllRules,
  extractHostFromUrl,
  generateHostConfig,
  clearAlarmsAndListeners,
  applyConfig,
} from "../commons.js"

const SECTIONS = ["home", "crud"]

function show(section) {
  document.getElementById(section).classList.remove("hidden")
  SECTIONS.filter(e => e !== section).forEach(sec =>
    document.getElementById(sec).classList.add("hidden")
  )
}

function process() {
  const hosts = ["facebook.com", "google.com", "apple.com"]
  // const hosts = []

  let crud = document.querySelector("#crud")
  document.querySelector("#add-new-host").addEventListener("click", () => {
    show("crud")
    crud.appendChild(generateCrudHtml({ new: true }))
  })

  if (!hosts.length)
    document.querySelector("host-list-container").classList.toggle("hidden")
  else {
    let container = document.querySelector(".host-list")
    container.appendChild(generateHostListHtml(hosts))
    document
      .querySelector("#host-list-display-toggle")
      .addEventListener("click", () => {
        container.classList.toggle("hidden")
      })
  }

  document.getElementById("clearAll").addEventListener("click", clearAll)
}

async function generateHostList() {
  let frag = document.createDocumentFragment()
  let hosts = await getAllHosts()
  if (!hosts.length) {
    hosts.forEach(host => {
      let li = document.createElement("li")
      let span = document.createElement("span")
      span.value = host
      li.appendChild(span)
      li.addEventListener("click", () => {
        show("crud")
      })
    })
  }
  if (hosts.includes(host)) alert("host already added")
  else {
    addNewHost(host)
      .then(() => refreshList())
      .then(() => (domElem.value = ""))
  }

  let ul = document.createElement("ul")
  // <ul>
  // <li><span>facebook.com</span></li>
  // <li><span>engadget.com</span></li>
  // <li><span>neowin.net</span></li>
  // </ul>
}

async function addNewHost(host, dayConfigs = {}) {
  await addHostConfig(generateHostConfig(host, dayConfigs))
  await applyConfig()
}

async function removeHost(host) {
  await removeHostConfig(host)
  await applyConfig()
}

function generateHostListHtml(hosts) {
  let ul = document.createElement("ul")
  hosts.forEach(host => {
    let btn = document.createElement("button")
    btn.textContent = host
    let li = document.createElement("li")
    li.appendChild(btn)
    ul.appendChild(li)
  })
  return ul
}

function generateCrudHtml(payload) {
  let crudContainer = document.createElement("div")
  crudContainer.classList = ["crud-container"]
  crudContainer.innerHTML = `
    <input ${!payload.new ? `value="${payload.host}" disabled` : ""} />
    
    <div class="controls-selector-container">
      <input type="radio" id="simpleControlsFlag" value="simple" checked><label for="simpleControls">Simple Controls</label>
      <input type="radio" id="advancedControlsFlag" value="advanced"><label for="advancedControls">Advanced Controls</label>
    </div>
    
    <div class="simple-controls-container">
      <div class="simple-control"><span>Block on Weekdays<span></div>
      <div class="simple-control"><span>Block Indefinitely<span></div>
      <div class="simple-control">
        <span>Limit visits to <input type="number" value="1" min="1" max="99"/> per day</span>
      </div>
      <div class="simple-control">
        <span>Allow visits only between <input type="time" value="16:00" min="00:00" required /> and <input type="time" value="17:00" max="23:59" required /> every day</span>
      </div>
    </div>
    
    <div class="advanced-controls-container hidden">
      <h4>Under Construction</h4>
    </div>
  `

  let simpleControl = crudContainer.querySelector("#simpleControlsFlag")
  let advControl = crudContainer.querySelector("#advancedControlsFlag")

  simpleControl.addEventListener("change", () => {
    advControl.checked = false
    crudContainer
      .querySelector(".simple-controls-container")
      .classList.toggle("hidden")
    crudContainer
      .querySelector(".advanced-controls-container")
      .classList.toggle("hidden")
  })
  advControl.addEventListener("change", () => {
    simpleControl.checked = false
    crudContainer
      .querySelector(".simple-controls-container")
      .classList.toggle("hidden")
    crudContainer
      .querySelector(".advanced-controls-container")
      .classList.toggle("hidden")
  })

  return crudContainer
}

async function clearAll() {
  await clearAlarmsAndListeners()
  await removeAllRules()
  await resetStore().then(() => refreshList())
}

function appendChildren(parent, ...args) {
  args.forEach(ele => parent.appendChild(ele))
  return parent
}

process()
