import express from "express";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import { addImage, getImages, deleteImage } from "./database.js";
import * as s3 from "./s3.js";
import crypto from "crypto";
import sharp from "sharp";
// import { PrismaClient } from "@prisma/client";

const generateFileName = (bytes = 32) =>
	crypto.randomBytes(bytes).toString("hex");

dotenv.config();

const app = express();
// const upload = multer({ dest: "images/" });
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// const prisma = new PrismaClient();

// Before the other routes
app.use(express.static("build"));

//Get All Images:

app.use(express.static("images"));

app.get("/api/images", async (req, res) => {
	const images = await getImages();
	console.log("images", images);

	// Add the signed url to each image
	for (const image of images) {
		image.url = await s3.getSignedUrl(image.file_name);

		console.log("image.url", image.url);
	}
	console.log(images);

	res.send({ images });
});

app.post("/api/images", upload.single("image"), async (req, res) => {
	// Get the data from the post request
	const description = req.body.description;
	const fileBuffer = req.file.buffer;
	const mimetype = req.file.mimetype;
	const fileName = generateFileName();

	const buffer = await sharp(fileBuffer)
		.resize({ height: 300, width: 300, fit: "cover" })
		.toBuffer();

	// Store the image in s3
	const s3Result = await s3.uploadImage(buffer, fileName, mimetype);

	// Store the image in the database
	const databaseResult = await addImage(fileName, description);

	databaseResult.url = await s3.getSignedUrl(fileName);

	res.status(201).send(databaseResult);
});

app.post("/api/images/:id/delete", async (req, res) => {
	const fileName = req.params.id;
	const s3Result = await s3.deleteImage(fileName);
	const databaseResult = await deleteImage(fileName);
	res.redirect("/");
});

// app.delete(":file_name", async (req, res) => {
// 	const id = req.body.id;
// 	console.log(id);
// 	const s3Result = await s3.deleteImage(id);
// 	const databaseResult = await deleteImage(id);
// 	res.status(201).send(databaseResult);
// });

// app.post("/api/images", upload.single("image"), async (req, res) => {
// 	const imageName = req.file.filename;
// 	const description = req.body.description;

// 	//save to db
// 	//Save this data to a database
// 	const result = await addImage(imageName, description);
// 	console.log(description, imageName);
// 	res.send({ result });
// });

// After all other routes
app.get("*", (req, res) => {
	res.sendFile("build/index.html");
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}`));
