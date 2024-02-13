const express = require("express");
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
var fs = require('fs');

app.use(bodyParser());

app.use(cors({
    origin: '*'
}))

app.use(express.static(__dirname + "/public"), (_, res, next) => {
    res.status(404).redirect(`/`);
})

app.listen(3000, function() {
    console.log("Running")
})