const express = require("express");
const multer = require("multer");
const app = express();
const upload = multer();
const jpeg = require("jpeg-js");
const tf = require("@tensorflow/tfjs-node");
const nsfw = require("nsfwjs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const fs = require("fs-extra");
const path = require("path")
let _model;

// ffmpeg path so that it works in any os
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

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

// evaluating video 
// Here, we will save the uploaded video to temp file, extract frames using ffmpeg
// load frames as buffer, convert to tensor and finally run _model.classify on frame

app.post("/nsfw-video", upload.single("video"), async (req, res)=>{
     if(!req.file){
      res.status(400).send("no video detected");
     }

     // save uploaded video to temp file
     const videoPath = path.join(__dirname, "temp_video.mp4");

     // write video buffer to file
     await fs.writeFile(videoPath, req.file.buffer);

     // extracting 10 frames from the video and saving it locally
     const tempDir = path.join(__dirname, "temp_frames");
     await fs.ensureDir(tempDir);

     //ffmpeg command to extract 5 frames
     await new Promise((resolve, reject)=>{
      ffmpeg(videoPath)
      .on("end", resolve)
      .on("error", reject)
      .screenshots({
        count: 5,
        folder: tempDir,
        filename: 'frame-%03d.jpg',
        size: '640x480'
      })
     })

     // reading from frames, converting to tensor and evaluating results
     const frameFiles = await fs.readdir(tempDir);
     const results = [];

     for (let file of frameFiles){
      const frameBuffer = await fs.readFile(path.join(tempDir, file));
      const imageTensor = convertToTensor(frameBuffer);
      const predictions = await _model.classify(imageTensor);
      imageTensor.dispose()

      results.push({frame: file, predictions})
     }

     res.json({
      framesAnalysed: results.length,
      frameResults: results
     })


})




// result
// [
//   { className: 'Neutral', probability: 0.6196945309638977 },
//   { className: 'Drawing', probability: 0.23560059070587158 },
//   { className: 'Sexy', probability: 0.14455826580524445 },
//   { className: 'Porn', probability: 0.00009631263674236834 },
//   { className: 'Hentai', probability: 0.00005030235479352996 }
// ]


// result of video
// {
//     "framesAnalysed": 5,
//     "frameResults": [
//         {
//             "frame": "frame-001_1.jpg",
//             "predictions": [
//                 {
//                     "className": "Neutral",
//                     "probability": 0.9503704309463501
//                 },
//                 {
//                     "className": "Drawing",
//                     "probability": 0.04803307726979256
//                 },
//                 {
//                     "className": "Porn",
//                     "probability": 0.0007909857085905969
//                 },
//                 {
//                     "className": "Hentai",
//                     "probability": 0.000721739896107465
//                 },
//                 {
//                     "className": "Sexy",
//                     "probability": 0.00008375526522286236
//                 }
//             ]
//         },
//         {
//             "frame": "frame-001_2.jpg",
//             "predictions": [
//                 {
//                     "className": "Neutral",
//                     "probability": 0.9287858605384827
//                 },
//                 {
//                     "className": "Drawing",
//                     "probability": 0.06854971498250961
//                 },
//                 {
//                     "className": "Hentai",
//                     "probability": 0.0012747589498758316
//                 },
//                 {
//                     "className": "Porn",
//                     "probability": 0.0012239079223945737
//                 },
//                 {
//                     "className": "Sexy",
//                     "probability": 0.00016574094479437917
//                 }
//             ]
//         },
//         {
//             "frame": "frame-001_3.jpg",
//             "predictions": [
//                 {
//                     "className": "Drawing",
//                     "probability": 0.920391857624054
//                 },
//                 {
//                     "className": "Neutral",
//                     "probability": 0.06639111787080765
//                 },
//                 {
//                     "className": "Hentai",
//                     "probability": 0.012134755961596966
//                 },
//                 {
//                     "className": "Porn",
//                     "probability": 0.0008842744864523411
//                 },
//                 {
//                     "className": "Sexy",
//                     "probability": 0.00019809244258794934
//                 }
//             ]
//         },
//         {
//             "frame": "frame-001_4.jpg",
//             "predictions": [
//                 {
//                     "className": "Neutral",
//                     "probability": 0.9337379336357117
//                 },
//                 {
//                     "className": "Drawing",
//                     "probability": 0.06387217342853546
//                 },
//                 {
//                     "className": "Hentai",
//                     "probability": 0.001250695320777595
//                 },
//                 {
//                     "className": "Porn",
//                     "probability": 0.0009564722422510386
//                 },
//                 {
//                     "className": "Sexy",
//                     "probability": 0.00018274465401191264
//                 }
//             ]
//         },
//         {
//             "frame": "frame-001_5.jpg",
//             "predictions": [
//                 {
//                     "className": "Neutral",
//                     "probability": 0.9919477105140686
//                 },
//                 {
//                     "className": "Drawing",
//                     "probability": 0.006716329138725996
//                 },
//                 {
//                     "className": "Porn",
//                     "probability": 0.000889771559741348
//                 },
//                 {
//                     "className": "Hentai",
//                     "probability": 0.0003754941571969539
//                 },
//                 {
//                     "className": "Sexy",
//                     "probability": 0.00007070002175169066
//                 }
//             ]
//         }
//     ]
// }