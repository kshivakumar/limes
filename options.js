import {
  extractHost,
  getRules,
  updateRules,
  storageApi,
} from "./commons.js"

function process() {
  refreshList()

  document.getElementById("addBtn").addEventListener(
    "click",
    () => {
      let url = extractHost(document.getElementById("url").value)
      // TODO: handle subdomains, presence/absence of http/www
      if (url) {
        getRules().then(rules => {
          // Todo: Check if the url is already added
          let nextId = Math.max(0, ...rules.map(r => r.id)) + 1
          let addRules = [
            {
              id: nextId,
              action: {
                type: "redirect",
                redirect: { extensionPath: "/redirect.html" },
              },
              condition: { urlFilter: url, resourceTypes: ["main_frame"] },
            },
          ]
          updateRules({ addRules }).then(() => console.log("Updated", nextId))

          refreshList()
        })
      } else console.error(`Invalid URL ${document.getElementById("url").value}`)
    },
    false
  )

  document.getElementById("removeBtn").addEventListener("click", () => {
    let id = parseInt(document.getElementById("ruleid").value.trim())
    if (id) {
      let removeRuleIds = [id]
      updateRules({ removeRuleIds }).then(() => console.log("Removed", removeRuleIds))
      
      refreshList()
    }
  })

  document.getElementById("clearAll").addEventListener("click", clearAll)
}

async function refreshList() {
  const rules = await getRules()
  const list = document.getElementById("deny-list")
  list.innerHTML = ""
  rules.forEach(rule => {
    list.innerHTML += `<li>${rule.condition.urlFilter}(${rule.id})</li>`
  })
}

async function clearAll() {
  let removeRuleIds = await getRules().then(rules => rules.map(r => r.id))
  if (removeRuleIds) {
    await updateRules({ removeRuleIds }).then(() =>
      console.log("All cleared", removeRuleIds)
    )
    refreshList()
  } else console.log("Nothing to remove")
}

process()
