const path = require("path");

const IOhandler = require("./IOhandler");
const zipFilePath = path.join(__dirname, "myfile.zip");
const pathUnzipped = path.join(__dirname, "unzipped");
const pathProcessed = path.join(__dirname, "filtered");

/**
 * @param {number} filterType 0: Grayscale, 1: Sepia, 2: Invert
 */
async function main(filterType) {
    await IOhandler.unzip(zipFilePath, pathUnzipped);
    const fileNames = await IOhandler.readDir(pathUnzipped);

    for (const fileName of fileNames) {
        await IOhandler.filterImage(filterType, pathUnzipped, pathProcessed, fileName);
    }
}

main(0);