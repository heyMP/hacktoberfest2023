import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});

function getCache(key) {
  try {
    const cache = JSON.parse(fs.readFileSync('cache.json', 'utf8'));
    return cache[key];
  } catch (e) {
    return null;
  }
}

function setCache(data) {
  try {
    const cache = JSON.parse(fs.readFileSync('cache.json', 'utf8'));
    const newData = {
      ...cache,
      ...data
    }
    console.log(data)
    fs.writeFileSync('cache.json', JSON.stringify(newData), 'utf8');
  } catch (e) {
    console.log(e);
  }
}

export async function generate({ prompt, size = '1024x1024', n = 1 }) {
  const options = { prompt, size, n };
  // const cacheKey = `generate:${JSON.stringify(options)}`;
  // let data = getCache(cacheKey);
  let data;
  try {
    if (!data) {
      const response = await openai.images.generate(options);
      const savedImage = await saveImage({ source: response.data[0].url, name: `${uuidv4()}.png` })
      data = savedImage;
      // modify url with local version
      // setCache({ [cacheKey]: data })
    }
    return data;
  } catch (error) {
    console.log(`Error with OpenAI API request: ${error.message}`)
  }
}

export async function edit({ prompt, mask, image, size = '1024x1024', n = 1 }) {
  console.log({image, mask})
  try {
    const res = await openai.images.edit({
      prompt,
      mask: fs.createReadStream(mask),
      image: fs.createReadStream(image),
      size,
      n
    });
    console.log('images created by AI', res)
    const savedImages = [];
    for await (const image of res.data) {
      const savedImage = await saveImage({ source: image.url, name: `${uuidv4()}.png` });
      savedImages.push(savedImage);
    }
    console.log('images saved locally', savedImages)
    return savedImages;
  } catch (error) {
    console.log(`Error with OpenAI API request: ${error.message}`)
    console.log(`Error with OpenAI API request: ${error}`)
  }
}

export async function variation({ image, size = '1024x1024', n = 1 }) {
  try {
    const res = await openai.images.createVariation({
      image: fs.createReadStream(image.replace('http://localhost:3000/', '')),
      size,
      n
    });
    const savedImages = [];
    for (const image of res.data) {
      const savedImage = await saveImage({ source: image.url, name: `${uuidv4()}.png` });
      savedImages.push(savedImage);
    }
    return savedImages;
  } catch (error) {
    console.log(`Error with OpenAI API request: ${error.message}`)
  }
}

export function saveImage({ source, name }) {
  const sourcePath = path.join(process.cwd(), 'assets', 'images', name);
  return new Promise((res, rej) => {
    const file = fs.createWriteStream(sourcePath, { flags: 'w' });

    https.get(source, response => {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        res({ url: `http://localhost:3000/assets/images/${name}` });
        console.log(`Image downloaded as ${name}`);
      });
    }).on('error', err => {
      unlink(name);
      rej({ error: err })
      console.error(`Error downloading image: ${err.message}`);
    });
  });
}

// const completion = await openai.createCompletion({
//   model: "gpt-3.5-turbo",
//   prompt: generatePrompt(animal),
//   temperature: 0.6,
// });
