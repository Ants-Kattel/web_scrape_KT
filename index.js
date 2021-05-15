const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

async function download(url, filename) {
    const writer = fs.createWriteStream(path.resolve(__dirname, filename));
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  }

async function getOrCache(url) {
  let md5 = crypto.createHash("md5");
  md5.update(url);
  let cacheName = `cache/${md5.digest("hex")}`;
  try {
    if (fs.existsSync(cacheName)) {
      console.log("cached request");
      return fs.readFileSync(cacheName);
    } else {
      let response = await axios.get(url);
      fs.writeFileSync(cacheName, response.data);
      console.log("live request");
      return response.data;
    }
  } catch (err) {
    console.error(err);
  }
}

(async () => {
  const baseURL = "https://explosm.net";
  let prev = baseURL + "/comics/5870";
  for (let i = 0; i < 10; i++) {
    try {
      let data = await getOrCache(prev);
      const $ = cheerio.load(data);
      let src = "https:" + $('#main-comic').attr('src');
      prev = baseURL + $('.nav-previous').attr('href');
      let parts = src.split('/');
      let filename = parts[parts.length - 1].split("?")[0];
      await download(src, 'images/' + filename);
    } catch (err) {
      console.log(err);
    }
  }
})();
