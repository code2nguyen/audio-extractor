const express = require('express');
const app = express();
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const fs = require('fs');
const timeout = require('connect-timeout');

const ffmpeg = createFFmpeg({ log: false });
const PUBLIC_FOLDER = 'media';

app.get('/extract', timeout('25s'), haltOnTimedout, async (req, res) => {
  const videoUrl = req.query.videoUrl;
  const fileName = req.query.fileName;
  const outputFileName = req.query.outputFileName;

  if (videoUrl) {
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }
    ffmpeg.FS('writeFile', fileName, await fetchFile(videoUrl));
    const audioFileName = outputFileName;
    await ffmpeg.run('-i', fileName, audioFileName);
    const output = ffmpeg.FS('readFile', audioFileName);
    await ffmpeg.FS('unlink', audioFileName);
    await fs.promises.writeFile(`${PUBLIC_FOLDER}/${audioFileName}`, output);

    if (req.timedout) return
    return res.status(200).send(audioFileName);
  }

  res.status(501).send('Not found videoUrl');
});

app.use(express.static(PUBLIC_FOLDER));

app.listen(process.env.PORT || 8080, '0.0.0.0');

function haltOnTimedout(req, res, next) {
  if (!req.timedout) next();
}
