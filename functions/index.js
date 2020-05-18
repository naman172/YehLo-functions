const functions = require("firebase-functions");
const app = require("express")();
var cors = require('cors')

var { newPg, getAllPgs, getPg } = require("./handlers");

app.use(cors());

app.post("/pg", newPg);
app.get("/pg/:id", getPg);
app.get("/pg", getAllPgs);

exports.api = functions.https.onRequest(app);
