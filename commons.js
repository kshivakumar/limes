function extractHost(url) {
  // TODO: Improve
  if (!url.startsWith("http")) url = "https://" + url
  try {
    let host = new URL(url).host
    if (host) return host
  } catch (error) {}
}

const getRules = chrome.declarativeNetRequest.getDynamicRules
const updateRules = chrome.declarativeNetRequest.updateDynamicRules
const storageApi = chrome.storage.sync

// class InvalidURLError extends Error {
//   constructor(url) {
//     super(`Invalid URL: ${url}`)
//   }
// }

function undenyDomain(domain) {
  // remove the domain from rules - call updateRules({removeIds})
}

function denyDomain(domain) {
  pass
}

async function getCurrentDeniedDomains() {
  let rules = await getRules()
  let domains = findDomainsFromRules(rules)
  return domains
}

function findDomainsFromRules(rules) {
  let domains = rules.map(rule => {
    rule.urlFilter
  })
  return [...new Set(domains)]
}

function regexFilterForHost(host) {
  return `^(https?:\/\/|www\.|https?:\/\/www\.)?${host}\/?`
}

function hostFromRegex(regex) {
  return regex.match(/\?([\w\.]+)\/\?/)[1]
}

function generateRule(id, host) {
  return [
    {
      id,
      action: {
        type: "block",
        // redirect: { extensionPath: "/redirect.html" },
      },
      condition: {
        regexFilter: regexFilterForHost(host),
        resourceTypes: ["main_frame"],
      },
    },
  ]
}

export {
  extractHost,
  getRules,
  updateRules,
  generateRule,
  storageApi,
  hostFromRegex,
}
