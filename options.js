import {
  resetStore,
  getAllHosts,
  addHostConfig,
  removeHostConfig,
} from "./store.js"

import {
  removeAllRules,
  extractHostFromUrl,
  generateHostConfig,
  clearAlarmsAndListeners,
  applyConfig,
} from "./commons.js"

function process() {
  refreshList()

  document.getElementById("addBtn").addEventListener(
    "click",
    () => {
      const domElem = document.getElementById("addHost")
      let host = extractHostFromUrl(domElem.value)
      if (host) {
        getAllHosts().then(hosts => {
          if (hosts.includes(host)) alert("host already added")
          else {
            addNewHost(host)
              .then(() => refreshList())
              .then(() => (domElem.value = ""))
          }
        })
      } else alert(`Invalid URL ${document.getElementById("newHost").value}`)
    },
    false
  )

  document.getElementById("removeBtn").addEventListener("click", () => {
    const domElem = document.getElementById("removeHost")
    let host = domElem.value.trim().toLowerCase()
    if (host)
      removeHost(host)
        .then(() => refreshList())
        .then(() => (domElem.value = ""))
  })

  document.getElementById("clearAll").addEventListener("click", clearAll)
}

async function addNewHost(host, dayConfigs = {}) {
  await addHostConfig(generateHostConfig(host, dayConfigs))
  await applyConfig()
}

async function removeHost(host) {
  await removeHostConfig(host)
  await applyConfig()
}

async function refreshList() {
  const hosts = await getAllHosts()
  const list = document.getElementById("deny-list")
  list.innerHTML = ""
  hosts.forEach(host => {
    list.innerHTML += `<li>${host}</li>`
  })
}

async function clearAll() {
  await clearAlarmsAndListeners()
  await removeAllRules()
  await resetStore().then(() => refreshList())
}

process()
