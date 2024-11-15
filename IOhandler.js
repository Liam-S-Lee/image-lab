const fs = require("fs");
const PNG = require("pngjs").PNG;
const path = require("path");
const yauzl = require('yauzl-promise'),
  { pipeline } = require('stream/promises');


/**
 * Description: decompress file from given pathIn, write to given pathOut
 *
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {promise}
 */
const unzip = async (pathIn, pathOut) => {
  const zip = await yauzl.open(pathIn);
  try {
    await fs.promises.mkdir(pathOut, { recursive: true });
    for await (const entry of zip) {
      if (entry.filename.endsWith('/')) {
        await fs.promises.mkdir(path.join(pathOut, entry.filename));
      } else {
        const readStream = await entry.openReadStream();
        const writeStream = fs.createWriteStream(
          path.join(pathOut, entry.filename)
        );
        await pipeline(readStream, writeStream);
      }
    }
  } finally {
    await zip.close();
  }
};

/**
 * Description: read all the png files from given directory and return Promise containing array of each png file path
 *
 * @param {string} path
 * @return {promise}
 */
const readDir = async (dir) => {
  //figure out png or not
  const fileList = await fs.promises.readdir(dir);
  const fileNames = [];
  for (const file of fileList) {
    if (file.includes(".png")) {
      fileNames.push(file);
    }
  }
  return fileNames;
};

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */
const grayScale = async (pathIn, pathOut, fileName) => {
  await fs.promises.mkdir(pathOut, { recursive: true });
  await fs.createReadStream(path.join(pathIn, fileName))
    .pipe(
      new PNG({
        filterType: 4,
      })
    )
    .on("parsed", function () {
      for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
          var idx = (this.width * y + x) << 2;

          const rgba = getChangedRGBA([this.data[idx], this.data[idx + 1], this.data[idx + 2], this.data[idx + 3]]);

          this.data[idx] = rgba.red;
          this.data[idx + 1] = rgba.green;
          this.data[idx + 2] = rgba.blue;
          this.data[idx + 3] = rgba.alpha;
        }
      }
      this.pack().pipe(fs.createWriteStream(path.join(pathOut, fileName)));
    });
};

function getChangedRGBA(rgba) {
  const gray = (rgba[0] + rgba[1] + rgba[2]) / 3;
  const rgbaObj = {
    red: gray,
    green: gray,
    blue: gray,
    alpha: rgba[3]
  }
  return rgbaObj;
}

module.exports = {
  unzip,
  readDir,
  grayScale,
};