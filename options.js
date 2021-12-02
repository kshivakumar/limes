import {
  extractHost,
  getRules,
  updateRules,
  generateRule,
  storageApi,
} from "./commons.js"

function process() {
  refreshList()

  document.getElementById("addBtn").addEventListener(
    "click",
    () => {
      let url = extractHost(document.getElementById("newDomain").value)
      // TODO: handle subdomains, presence/absence of http/www
      if (url) {
        storageApi
          .get(["domains"])
          .then(results => results["domains"])
          .then(existingDomains => {
            if (url in existingDomains) {
              alert("domain already added")
            } else {
              let nextId =
                Math.max(
                  0,
                  ...Object.values(existingDomains).map(domain => domain.ruleId)
                ) + 1
              let addRules = generateRule(nextId, url)

              updateRules({ addRules }).then(() =>
                storageApi
                  .set({
                    domains: {
                      ...existingDomains,
                      [url]: { ruleId: nextId, frequency: "day", count: 1 },
                    },
                  })
                  .then(() => refreshList())
              )
            }
          })
      } else alert(`Invalid URL ${document.getElementById("newDomain").value}`)
    },
    false
  )

  document.getElementById("removeBtn").addEventListener("click", () => {
    // TODO: Remove by domain
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
    await updateRules({ removeRuleIds })
  }
  storageApi.clear().then(() => refreshList())
}

process()
