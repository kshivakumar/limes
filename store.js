const storageApi = chrome.storage.sync

const INIT_STORAGE = { configs: [], currentDayVisits: {} }

async function storeGet(key) {
  return storageApi.get(key).then(r => r[key])
}

async function storeGetMany(keys) {
  return storageApi.get(keys)
}

async function resetStore() {
  return storageApi.clear().then(() => storageApi.set({ ...INIT_STORAGE }))
}

async function getAllHosts() {
  return storeGet("configs").then(configs => configs.map(c => c.host))
}

async function getHostConfig(host) {
  return storeGet("configs").then(configs =>
    configs.find(config => config.host === host).config
  )
}

async function getAllHostConfigs() {
  return storeGet("configs")
}

async function addHostConfig(newHostConfigs) {
  if (!Array.isArray(newHostConfigs)) newHostConfigs = [newHostConfigs]
  return getAllHostConfigs().then(configs =>
    storageApi.set({
      configs: [...configs, ...newHostConfigs],
    })
  )
}

async function updateHostConfig(hostConfig) {
  
}

async function removeHostConfig(hosts) {
  if (!Array.isArray(hosts)) hosts = [hosts]
  return getAllHostConfigs().then(configs =>
    storageApi.set({
      configs: configs.filter(c => !hosts.includes(c.host)),
    })
  )
}

async function getHostConfigsByDay(weekday) {
  if (!weekday) {
    weekday = new Date().toLocaleDateString("en-US", {
      weekday: "short",
    })
  }
  weekday = weekday.toLowerCase()
  return getAllHostConfigs().then(hostConfigs =>
    hostConfigs.map(hc => {
      return {
        host: hc.host,
        config: weekday in hc.config ? hc.config[weekday] : {}, // return empty object if the host is totally blocked for that day
      }
    })
  )
}

async function getHostVisits(host) {
  return storeGet("currentDayVisits").then(cdv => cdv[host])
}

async function incrementHostVisits(host, increment = 1) {
  let cdvs = await storeGet("currentDayVisits")
  let newCount = cdvs[host] + increment
  await storageApi.set({ currentDayVisits: { ...cdvs, [host]: newCount } })
  return newCount
}

export {
  resetStore,
  getAllHosts,
  getHostConfig,
  getAllHostConfigs,
  addHostConfig,
  removeHostConfig,
  getHostConfigsByDay,
  getHostVisits,
  incrementHostVisits,
}
