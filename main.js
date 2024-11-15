const path = require("path");

const IOhandler = require("./IOhandler");
const zipFilePath = path.join(__dirname, "myfile.zip");
const pathUnzipped = path.join(__dirname, "unzipped");
const pathProcessed = path.join(__dirname, "grayscaled");

async function process() {
    await IOhandler.unzip(zipFilePath, pathUnzipped);
    const fileNames = await IOhandler.readDir(pathUnzipped);

    for (const fileName of fileNames) {
        await IOhandler.grayScale(pathUnzipped, pathProcessed, fileName);
    }
}

process();