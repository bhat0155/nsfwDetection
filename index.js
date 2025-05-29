const express = require("express");
const multer = require("multer");
const app = express();
const upload = multer();
const jpeg = require("jpeg-js");
const tf = require("@tensorflow/tfjs-node");
const nsfw = require("nsfwjs");
let _model;

app.get("/", (req, res) => {
  res.json("I made a server for nswf detection");
});

// extracting image and giving it to tensorflow
const convertToTensor = (imageBuffer) => {
  const image = jpeg.decode(imageBuffer, { useTArray: true });
  const numChannels = 3;
  const numOfPixels = image.width * image.height;
  const values = new Int32Array(numChannels * numOfPixels);

  for (let i = 0; i < numOfPixels; i++) {
    for (let c = 0; c < numChannels; ++c) {
      values[i * numChannels + c] = image.data[i * 4 + c];
    }
  }
  return tf.tensor3d(values, [image.height, image.width, numChannels], "int32");
};

// load nsfw model
const loadModel = async () => {
  _model = await nsfw.load();
  console.log("nsfw model loaded");

  app.listen(4000, () => {
    console.log("server is running on port 4000");
  });
};
loadModel();

// evaluating image
app.post("/nsfw", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).send("No image detected");
  } else {
    try {
      const imageTensor = convertToTensor(req.file.buffer);
      const predictions = await _model.classify(imageTensor);
      imageTensor.dispose();
      const theResult = predictions[0];
      const probability = theResult.probability * 100;
      console.log(predictions)
      res.send(
        `This is a ${
          theResult.className
        } image with a probability of ${probability.toFixed(1)} %`
      );
    } catch (err) {
      res.send(err);
    }
  }
});

// result
// [
//   { className: 'Neutral', probability: 0.6196945309638977 },
//   { className: 'Drawing', probability: 0.23560059070587158 },
//   { className: 'Sexy', probability: 0.14455826580524445 },
//   { className: 'Porn', probability: 0.00009631263674236834 },
//   { className: 'Hentai', probability: 0.00005030235479352996 }
// ]