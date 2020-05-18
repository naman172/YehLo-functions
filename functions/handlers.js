var { db, admin} = require("./utility/admin");
var fbConfig = require("./utility/fbConfig");
var Busboy = require("busboy");
var path = require("path");
var os = require("os");
var fs = require("fs");

const newPg = (req, res) => {
  const busboy = new Busboy({ headers: req.headers });
  const tmpdir = os.tmpdir();
  let imageExtension, imageFileName, imagePath, imageToBeUploaded;
  const pgInfo = {};

  // This code will process each non-file field in the form.
  busboy.on("field", (fieldname, val) => {
    pgInfo[fieldname] = val;
  });

  // This code will process each file uploaded.
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({
        error: true,
        message:
          "This file type is not supported, please use a .png or .jpeg file",
      });
    }

    imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${Math.round(
      Math.random() * 10000000000000000
    )}.${imageExtension}`;

    imagePath = path.join(tmpdir, imageFileName);
    imageToBeUploaded = {
      imagePath,
      mimetype,
    };

    const writeStream = fs.createWriteStream(imagePath);
    file.pipe(writeStream);
  });

  busboy.on("finish", () => {
    admin
      .storage()
      .bucket(fbConfig.storageBucket)
      .upload(imageToBeUploaded.imagePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        pgInfo[
          "imageURL"
        ] = `https://firebasestorage.googleapis.com/v0/b/${fbConfig.storageBucket}/o/${imageFileName}?alt=media`;
        db.collection("listings").add(pgInfo);
      })
      .then((doc) => {
        res.json({ error: false, message: "New PG was successfully listed" });
      })
      .catch((err) => {
        console.error(err);
        return res
          .status(500)
          .json({ error: true, message: "Something went wrong" });
      });
  });

  busboy.end(req.rawBody);
};

const getAllPgs = (req, res) => {
  let pgListings = [];

  db.collection("listings")
    .get()
    .then((data) => {
      data.forEach((doc) => {
        pgListings.push({ ...doc.data(), pgId: doc.id });
      });
      return res.json(pgListings);
    })
    .catch((err) => {
      res.status(500).json({ error: true });
    });
};

const getPg = (req, res) => {
  let pgDetails = {};
  db.doc(`/listings/${req.params.id}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: true });
      }
      pgDetails.data = doc.data();
      pgDetails.pgId = doc.id;

      return res.json(pgDetails);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: true });
    });
};

module.exports = { newPg, getAllPgs, getPg };
