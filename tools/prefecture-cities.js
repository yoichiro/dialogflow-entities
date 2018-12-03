const request = require("request");

const CONFIG = require("./config.json");

const prefecturesUrl = "https://opendata.resas-portal.go.jp/api/v1/prefectures";
const citiesUrl = "https://opendata.resas-portal.go.jp/api/v1/cities";

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

const fetchCities = prefecture => {
  return new Promise((resolve, reject) => {
    request(`${citiesUrl}?prefCode=${prefecture.prefCode}`, {
      headers: {
        "X-API-KEY": CONFIG.RESAS_API_KEY
      },
      json: true
    }, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          prefCode: prefecture.prefCode,
          prefName: prefecture.prefName,
          cities: body.result
        });
      }
    });
  });
};

const findExistsCity = (obj, city) => {
  return obj.find(x => {
    return x.synonyms[0] === city.cityName;
  });
};

const omitCityName = cityName => {
  if (cityName.endsWith("村") || cityName.endsWith("市") || cityName.endsWith("区") || cityName.endsWith("町")) {
    return cityName.substring(0, cityName.length - 1);
  } else {
    return cityName;
  }
};

const getOmittedNameIndexes = (original, omittedName) => {
  const result = [];
  original.forEach((x, i) => {
    if (x.synonyms[1] === omittedName) {
      result.push(i);
    }
  });
  return result;
};

const reduceDuplicatedOmittedName = original => {
  const result = [];
  const alreadyMap = [];
  original.forEach(x => {
    const omittedName = x.synonyms[1];
    if (!alreadyMap.includes(omittedName)) {
      const indexes = getOmittedNameIndexes(original, omittedName);
      if (indexes.length === 1) {
        result.push(x);
      } else {
        result.push({
          value: indexes.map(i => {
            return original[i].value;
          }).join(","),
          synonyms: [omittedName]
        });
        indexes.forEach(i => {
          result.push({
            value: original[i].value,
            synonyms: [original[i].synonyms[0]]
          })
        })
      }
      alreadyMap.push(omittedName)
    }
  });
  return result;
};

fetchPrefectures()
  .then(prefectures => {
    return Promise.all(prefectures.map(prefecture => {
      return fetchCities(prefecture);
    }));
  }).then(result => {
    const obj = [];
    result.forEach(data => {
      data.cities.forEach(city => {
        const existCity = findExistsCity(obj, city);
        if (existCity) {
          existCity.value += `,${data.prefName}.${city.cityName}`;
        } else {
          obj.push({
            value: `${data.prefName}.${city.cityName}`,
            synonyms: [
              city.cityName,
              omitCityName(city.cityName)
            ]
          });
        }
      });
    });
    console.log(JSON.stringify(reduceDuplicatedOmittedName(obj)));
  });
