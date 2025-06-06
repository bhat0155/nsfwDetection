# 🚫 NSFW Detection API

This project provides an API for detecting NSFW content in images using `nsfwjs` with a Node.js/Express server.

**GitHub Repo:** [https://github.com/bhat0155/nsfwDetection](https://github.com/bhat0155/nsfwDetection)

---

## 📮 How to Use in Postman

### 🔍 Endpoint: Detect NSFW Content in Image or video

- **Method:** `POST`
- **URL:** `http://localhost:4000/nsfw` or `http://localhost:4000/nsfw-video`
- **Headers:**  
  `Content-Type: multipart/form-data`

### Body (form-data):
- **Key:** `file` or `video` 
- **Type:** File
- **Value:** Select an image file (preferably JPEG) or mp4 video

---

### ✅ Example Response:

## This is a Neutral image with a probability of 62.0 %

And

```json
[
  { "className": "Neutral", "probability": 0.8934 },
  { "className": "Porn", "probability": 0.0452 },
  { "className": "Hentai", "probability": 0.0311 },
  { "className": "Sexy", "probability": 0.0203 },
  { "className": "Drawing", "probability": 0.01 }
]
