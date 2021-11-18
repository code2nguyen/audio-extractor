const express = require('express')
const app = express()
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const ffmpeg = createFFmpeg({ log: true });
const PUBLIC_FOLDER = 'media'

app.use(express.static(PUBLIC_FOLDER))

app.get('/extract', async (req, res) => {
    const videoUrl = req.query.videoUrl;
    const fileName = req.query.fileName;

    if (videoUrl) {
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }
        ffmpeg.FS('writeFile', fileName, await fetchFile(videoUrl));
        const audioFileName = `${uuidv4()}.mp3`;
        await ffmpeg.run('-i', fileName, audioFileName);
        const output = ffmpeg.FS('readFile', audioFileName);
        await ffmpeg.FS('unlink', audioFileName);
        await fs.promises.writeFile(`${PUBLIC_FOLDER}/${audioFileName}`, output);
        return res.status(200).send(audioFileName)
    }
    
    res.status(501).send('Not found videoUrl')
})

app.listen(process.env.PORT || 8080, '0.0.0.0');
