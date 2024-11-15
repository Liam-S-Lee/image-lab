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
  try {
    const fileNames = await fs.promises.readdir(dir);
    return fileNames.filter(file => file.includes(".png"));
  } catch (err) {
    console.error(err);
  }
};

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {number} type 0: Grayscale, 1: Sepia, 2: Invert
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */
const filterImage = async (type, pathIn, pathOut, fileName) => {
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

          const [r, g, b, a] = getChangedRGBA(
            type,
            [this.data[idx],
            this.data[idx + 1],
            this.data[idx + 2],
            this.data[idx + 3]]);

          this.data[idx] = r;
          this.data[idx + 1] = g;
          this.data[idx + 2] = b;
          this.data[idx + 3] = a;
        }
      }
      this.pack().pipe(fs.createWriteStream(path.join(pathOut, fileName)));
    });
};

function getChangedRGBA(type, rgba) {
  let [r, g, b, a] = rgba;

  switch (type) {
    case 0:
      // GrayScale
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = gray;
      g = gray;
      b = gray;
      break;

    case 1:
      // Sepia
      r = r * 0.3588 + g * 0.7044 + b * 0.1368;
      g = r * 0.2990 + g * 0.5870 + b * 0.1140;
      b = r * 0.2392 + g * 0.4696 + b * 0.0912;
      break;

    case 2:
    default:
      // Invert
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
      break;
  }

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return [r, g, b, a];
}

module.exports = {
  unzip,
  readDir,
  filterImage,
};