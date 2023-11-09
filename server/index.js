import 'dotenv/config';
import express from 'express';
import fileUpload from 'express-fileupload';
import fs, { unlinkSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';

import * as ImageService from './services/image.js';

const app = express();
const port = 3000;

app.use(
  fileUpload({
    limits: {
      fileSize: 10000000,
    },
    abortOnLimit: true,
  })
);

// Add this line to serve our index.html page
app.use(cors());
app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/images/generate', async (req, res) => {
  console.log('generating image', req.body.prompt);
  try {
    const response = await ImageService.generate({
      prompt: req.body.prompt,
    });
    res.json(response)
  } catch (e) {
    // Expectation Failed
    res.status(417);
    res.json(e);
  }
});

app.post('/images/edit', async (req, res) => {
  try {
    const response = await ImageService.edit({
      image: path.join(process.cwd(), req.body.image.replace('http://localhost:3000/', '')),
      mask: path.join(process.cwd(), req.body.mask.replace('http://localhost:3000/', '')),
      prompt: req.body.prompt,
      n: req.body.n
    });
    res.json(response)
  } catch (e) {
    // Expectation Failed
    res.status(417);
    res.json(e);
  }
});

app.post('/images/variant', async (req, res) => {
  try {
    const response = await ImageService.variation({
      image: req.body.image,
      n: req?.body?.n ?? 1
    });
    res.json(response)
  } catch (e) {
    // Expectation Failed
    res.status(417);
    res.json(e);
  }
});

app.post('/images/save-remote', async (req, res) => {
  try {
    const response = await ImageService.saveImage({
      source: req.body.source,
      name: req.body.name ?? `${uuidv4()}.png`
    })
    res.json(response)
  } catch (e) {
    // Expectation Failed
    res.status(417);
    res.json(e);
  }
});

app.get('/images', (req, res) => {
  try {
    const files = fs
      .readdirSync(path.join(process.cwd(), 'assets', 'images'))
      .filter(file => file.endsWith('.png'))
      .map(i => ({ url: `http://localhost:3000/assets/images/${i}` }));
    res.json(files);
  } catch (e) {
    // Expectation Failed
    res.status(417);
    res.json(e);
  }
});

app.delete('/images', (req, res) => {
  try {
    const unlink = fs.unlinkSync(path.join(process.cwd(), req.body.image.replace('http://localhost:3000/', '')));
    res.status(200);
    res.json(unlink);
  } catch (e) {
    console.log(e)
    // Expectation Failed
    res.status(417);
    res.json(e);
  }
});

app.post('/threads', async (req, res) => {
  try {
    const thread = await openai.beta.threads.create();
    res.json(thread);
  } catch (e) {
    // Expectation Failed
    res.status(417);
    res.json(e);
  }
});

app.post('/messages', async (req, res) => {
  try {
    const threadMessages = await openai.beta.threads.messages.create(
      "thread_abc123",
      { role: "user", content: "How does AI work? Explain it in simple terms." }
    );
    res(threadMessages)
  } catch (e) {
    // Expectation Failed
    res.status(417);
    res.json(e);
  }
});

app.post('/images/upload', (req, res) => {
  // Get the file that was set to our field named "image"
  const { image } = req.files;

  // If no image submitted, exit
  if (!image) return res.sendStatus(400);

  // If does not have image mime type prevent from uploading
  if (/^image/.test(image.mimetype)) return res.sendStatus(400);

  // Move the uploaded image to our upload folder
  image.mv(process.cwd() + '/images/' + image.name);

  // All good
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// try {
//   const response = ImageService.generate({
//     prompt: 'A duck with headphones coding on a laptop',
//   });
//   response.then(res => {
//     console.log(res);
//   });
// } catch (e) {
//   console.log(e);
// }

// try {
//   const response = ImageService.variation({
//     image: 'assets/img-1y5NkFbPol1EXAbTPJdgTas2.png',
//     n: 1
//   });
//   response.then(res => {
//     console.log(res);
//   });
// } catch (e) {
//   console.log(e);
// }
//
