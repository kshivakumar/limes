import {
  INIT_STORAGE,
  getRules,
  extractHostFromUrl,
  storageApi,
  addHostToDeniedList,
  removeHostFromDeniedList,
} from "./commons.js"

function process() {
  refreshList()

  document.getElementById("addBtn").addEventListener(
    "click",
    () => {
      let host = extractHostFromUrl(document.getElementById("addHost").value)
      if (host) {
        storageApi.get(["hosts", "hostConfigs"]).then(data => {
          if (data.hosts.includes(host)) {
            alert("host already added")
          } else {
            addHostToDeniedList(host).then(() =>
              storageApi
                .set({
                  hosts: [...data.hosts, host],
                  hostConfigs: [
                    ...data.hostConfigs,
                    { host, frequency: "day", count: 1 },
                  ],
                })
                .then(() => refreshList())
            )
          }
        })
      } else alert(`Invalid URL ${document.getElementById("newHost").value}`)
    },
    false
  )

  document.getElementById("removeBtn").addEventListener("click", () => {
    let host = document.getElementById("removeHost").value.trim().toLowerCase()
    if (host) {
      storageApi.get(["hosts", "hostConfigs"]).then(data =>
        storageApi
          .set({
            hosts: data.hosts.filter(sthost => sthost !== host),
            hostConfigs: data.hostConfigs.filter(hc => hc.host !== host),
          })
          .then(() => removeHostFromDeniedList(host))
          .then(() => refreshList())
      )
    }
  })

  document.getElementById("clearAll").addEventListener("click", clearAll)
}

async function refreshList() {
  const hosts = await storageApi.get(["hosts"]).then(data => data.hosts)
  const list = document.getElementById("deny-list")
  list.innerHTML = ""
  console.log('hosts', hosts, typeof hosts)
  hosts.forEach(host => {
    list.innerHTML += `<li>${host}</li>`
  })
}

async function clearAll() {
  let removeRuleIds = await getRules().then(rules => rules.map(r => r.id))
  if (removeRuleIds) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds })
  }
  storageApi
    .clear()
    .then(() => storageApi.set({...INIT_STORAGE}).then(() => refreshList()))
}

process()
