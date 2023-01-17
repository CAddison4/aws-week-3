import express from 'express';
import multer from 'multer';
import fs from 'fs';
import dotenv from 'dotenv';
import {addImage, getImages} from './database.js'

dotenv.config();


const app = express();
const upload = multer({ dest: "images/" });

const port = process.env.PORT || 8080;

//Get All Images:
app.get("/api/images", async (req, res) => {
    const images = await getImages()
    res.send({images})
    });

//Get Image by Image Name:
app.get("/api/images/:imageName", (req, res) => {

    //do if statements to ensure user authorized to view the image
    //if they are, send the image
    //if they aren't, send a 403 error

    const imageName = req.params.imageName;
    const readStream = fs.createReadStream(`images/${imageName}`);
    readStream.pipe(res)

    });

app.post("/api/images", upload.single("image"), async (req, res) => {
    const imageName = req.file.filename;
    const description = req.body.description

    //Save this data to a database
    const result = await addImage(imageName, description)
    console.log(description, imageName)
    res.send({result})
    });

app.listen(port, () => console.log(`Listening on port ${port}`));




