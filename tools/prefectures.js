const request = require("request");

const CONFIG = require("./config.json");

const prefecturesUrl = "https://opendata.resas-portal.go.jp/api/v1/prefectures";

const fetchPrefectures = () => {
  return new Promise((resolve, reject) => {
    request(prefecturesUrl, {
      headers: {
        "X-API-KEY": CONFIG.RESAS_API_KEY
      },
      json: true
    }, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body.result);
      }
    });
  });
};

const omitPrefectureName = prefName => {
    return prefName.substring(0, prefName.length - 1);
};

fetchPrefectures()
  .then(prefectures => {
    const result = prefectures.map(prefecture => {
        if (prefecture.prefName.endsWith("道")) {
            return {
                value: prefecture.prefName,
                synonyms: [prefecture.prefName]
            };
        } else {
            return {
                value: prefecture.prefName,
                synonyms: [prefecture.prefName, omitPrefectureName(prefecture.prefName)]
            };
        }
    });
    console.log(JSON.stringify(result));
  });
