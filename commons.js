function extractHostFromUrl(url) {
  if (!url.toLowerCase().startsWith("http")) url = "https://" + url
  try {
    return new URL(url).host
  } catch (error) {}
}

const getRules = chrome.declarativeNetRequest.getDynamicRules
const storageApi = chrome.storage.sync

const INIT_STORAGE = {
  hosts: [],
  hostConfigs: []
}

// class InvalidURLError extends Error {
//   constructor(url) {
//     super(`Invalid URL: ${url}`)
//   }
// }

async function removeHostFromDeniedList(host) {
  return chrome.declarativeNetRequest
    .getDynamicRules()
    .then(rules =>
      rules.filter(rule => hostFromRegex(rule.condition.regexFilter) === host)
    )
    .then(
      reqRule =>
        reqRule &&
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [reqRule[0].id],
        })
    )
}

async function addHostToDeniedList(host) {
  return chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [generateRule(parseInt(Date.now() / 1000), host)],
  })
}

function regexFilterForHost(host) {
  return `^(https?:\/\/|www\.|https?:\/\/www\.)?${host}\/?`
}

function hostFromRegex(regex) {
  return regex.match(/\?([\w\.]+)\/\?/)[1]
}

function generateRule(id, host) {
  return {
    id: id,
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

export {
  INIT_STORAGE,
  getRules,
  extractHostFromUrl,
  storageApi,
  hostFromRegex,
  addHostToDeniedList,
  removeHostFromDeniedList,
}
