import config from "./constant.js";

function proxyUri(uri) {
  return `/proxy${uri}`;
}

function appendUrlArg(u, k, v) {
  return u + (u.includes("?") ? "&" : "?") + `${k}=${v}`;
}

function addDefaultApiKey(r, u) {
  let url = u;
  const itemInfo = getItemInfo(r);
  if (!url.includes("api_key") && !url.includes("X-Emby-Token")) {
    url = appendUrlArg(url, "api_key", itemInfo.api_key);
  }
  return url;
}

function generateUrl(r, host, uri) {
  let url = host + uri;
  let isFirst = true;
  for (const key in r.args) {
    url += isFirst ? "?" : "&";
    url += `${key}=${r.args[key]}`;
    isFirst = false;
  }
  return url;
}

function getEmbyOriginRequestUrl(r) {
  const embyHost = config.embyHost;
  return addDefaultApiKey(r, generateUrl(r, embyHost, r.uri));
}

function getCurrentRequestUrl(r) {
  const host = r.headersIn["Host"];
  return addDefaultApiKey(r, generateUrl(r, "http://" + host, r.uri));
}

function getItemInfo(r) {
  const embyHost = config.embyHost;
  const embyApiKey = config.embyApiKey;
  const regex = /[A-Za-z0-9]+/g;
  const itemId = r.uri.replace("emby", "").replace("Sync", "").replace(/-/g, "").match(regex)[1];
  const mediaSourceId = r.args.MediaSourceId
    ? r.args.MediaSourceId
    : r.args.mediaSourceId;
  const Etag = r.args.Tag;
  let api_key = r.args["X-Emby-Token"]
    ? r.args["X-Emby-Token"]
    : r.args.api_key;
  api_key = api_key ? api_key : embyApiKey;
  // 判断是否app下载
  let itemInfoUri = "";
  if (r.uri.includes("JobItems")) {
		itemInfoUri = `${embyHost}/Sync/JobItems?api_key=${api_key}`;
  } else {
    if (mediaSourceId) {
			itemInfoUri = `${embyHost}/Items/${itemId}/PlaybackInfo?MediaSourceId=${mediaSourceId}&api_key=${api_key}`;
    } else {
			itemInfoUri = `${embyHost}/Items/${itemId}/PlaybackInfo?api_key=${api_key}`;
    }
  }
  return { itemId, mediaSourceId, Etag, api_key, itemInfoUri };
}

export default {
  appendUrlArg,
  addDefaultApiKey,
  proxyUri,
  getItemInfo,
  generateUrl,
  getCurrentRequestUrl,
  getEmbyOriginRequestUrl,
};
