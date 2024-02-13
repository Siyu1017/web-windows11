const webpack = require("webpack");
const express = require("express");
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
var fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CryptoJS = require('crypto-js');

const key = process.env['KEY'];
const VerifyKey = process.env['Verify_Key'];

function aesECBEncrypt(key, plaintext) {
    const encrypted = CryptoJS.AES.encrypt(plaintext, CryptoJS.enc.Utf8.parse(key), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

function aesECBDecrypt(key, ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Utf8.parse(key), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
}

app.use(bodyParser());

app.use(cors({
    origin: '*'
}))

const randomString = (n, c) => { var c = c || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', r = '', l = c.length; for (let i = 0; i < n; i++) { r += c.charAt(Math.floor(Math.random() * l)); } return r; };

var v2 = require(__dirname + "/v2.json");

var v3 = {
    accessTokens: {},
    settings: {
        maxTime: 1000 * 60 * 10
    },
    functions: {
        createAccessResponse: () => {
            var accessToken = randomString(96);
            var accessDetail = {
                maxTime: Date.now() + v3.settings.maxTime,
            };
            v3.accessTokens[accessToken] = accessDetail;
            console.log(v3.accessTokens);
            setTimeout(() => {
                delete v3.accessTokens[accessToken];
            }, v3.settings.maxTime)
            return {
                accessToken: accessToken,
                accessDetail: accessDetail
            };
        }
    }
}

var Data = require(__dirname + "/data.json");

var user = null;

fs.readFile(__dirname + "/user.txt", 'utf8', function(err, data) {
    user = JSON.parse(aesECBDecrypt(key, data));
});

app.post("/api/availability", function (req, res) {
    return res.status(200).json({
        status: "ok"
    });
})

app.post("/v3/verify", function(req, res) {
    if (req.body["key"] == VerifyKey) {
        var response = v3.functions.createAccessResponse();
        return res.status(200).json({
            status: "ok",
            response: response
        });
    } else {
        return res.status(200).json({
            status: "error",
            response: null
        });
    }
})

app.post("/v3/login", function(req, res) {
    return res.status(200).json({
        status: "ok",
        response: "test"
    });
})

app.post("/v3/api/backstage/length/question", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({
        status: "ok",
        response: v2.length
    });
})

app.post("/v3/api/backstage/question", function(req, res) {
    
})

app.post("/v2/get/answer", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    var questionTitle = req.body["qt"],
        returns = [],
        type = "";
    v2.forEach(i => {
        if (i.questionTitle.indexOf(questionTitle) >= 0) {
            returns.push([JSON.stringify(i.correctAnswers), JSON.stringify(i.questionOptions), i.questionTitle]);
        }
    })
    if (returns.length == 0) {
        return res.status(200).send('{ "status": "error" }');
    } else {
        return res.status(200).send('{ "status": "ok", "data": "' + encodeURIComponent(JSON.stringify(returns)) + '" }');
    }
})

app.post("/v2/g", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    var questionId = req.body["qid"],
        questionTitle = req.body["qt"],
        questionOption = req.body["qo"],
        correctAnswers = [],
        type = "";
    v2.forEach(i => {
        if (i.questionId == questionId) {
            correctAnswers = i.correctAnswers;
        }
    })
    if (correctAnswers.length == 0) {
        v2.forEach(i => {
            if (i.questionTitle == questionTitle && questionTitle != "") {
                correctAnswers = i.correctAnswers;
            } else if (i.questionOption == questionOption && questionTitle != "") {
                correctAnswers = i.correctAnswers;
            }
        })
        return res.status(200).send('{ "correct": "' + JSON.stringify(correctAnswers) + '", "id": "' + questionId + '", "type": "id_not_found" }');
    } else {
        return res.status(200).send('{ "correct": "' + JSON.stringify(correctAnswers) + '", "id": "' + questionId + '", "type": "has_id" }');
    }
})

app.post("/v2/a", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    var questionId = req.body["question_id"],
        correctAnswers = req.body["question_answers"],
        questionOptions = req.body["question_options"],
        questionTitle = req.body["question_content"],
        exist = false;
    if (!questionId || !correctAnswers || correctAnswers.length == 0 || !questionOptions || !questionTitle) {
        return res.status(200).send("Error");
    }
    v2.forEach(i => {
        if (i.questionId == questionId) {
            exist = true;
        }
    })
    if (exist == true) return res.status(200).send("Question Existed.")
    v2.push({
        "questionId": questionId,
        "correctAnswers": correctAnswers,
        "questionOptions": questionOptions,
        "questionTitle": questionTitle
    });
    fs.writeFile(__dirname + "/v2.json", JSON.stringify(v2), function(err) {
        if (err) return console.log(err);
        return res.status(200).send("Success");
    });
})

app.post("/v2/token", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    var real_name = req.body["real_name"],
        nickname = req.body["nickname"],
        school = req.body["school"],
        unique_user_id = req.body["unique_user_id"],
        image = req.body["image"];
    if (!real_name || !nickname || !school || !unique_user_id || !image) {
        return res.send({ status: "error", data: "invalid_credentials", token: "invalid_credentials" });
    } else {
        var exist = false;
        for (let i = 0; i < user.length; i++) {
            if (user[i].unique_user_id == unique_user_id) {
                exist = true;
                user[i] = {
                    real_name: real_name,
                    nickname: nickname,
                    school: school,
                    unique_user_id: unique_user_id,
                    image: image,
                    time: Date.now()
                }
            }
        }
        if (exist == false) {
            user.push({
                real_name: real_name,
                nickname: nickname,
                school: school,
                unique_user_id: unique_user_id,
                image: image,
                time: Date.now()
            })
        }
        fs.writeFile(__dirname + "/user.txt", aesECBEncrypt(key, JSON.stringify(user)), function(err) {
            if (err) return console.log(err);
            return res.status(200).send({ status: "ok", data: "verify_success", token: randomString(24) });
        });
    }
})

app.post("/v2/all", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    res.send(v2);
})

app.post("/v2/user", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    res.send(aesECBDecrypt(req.body["key"], aesECBEncrypt(key, JSON.stringify(user))))
})

app.get("/add", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    var question = req.query.que,
        answer = req.query.ans,
        exist = false;
    Data.forEach(i => {
        if (i.que == question) {
            exist = true;
        }
    })
    if (exist == true) {
        return res.status(200).send("Question Existed.");
    }
    Data.push({
        "que": question,
        "ans": answer
    });
    fs.writeFile(__dirname + "/data.json", JSON.stringify(Data), function(err) {
        if (err) return console.log(err);
        return res.status(200).send("Success");
    });
})

app.get("/get", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    var ret = ""
    Data.forEach(i => {
        if (i.que == req.query.que) {
            ret = i.ans
        }
    })
    if (ret !== "") {
        return res.status(200).send('{ "answer": "' + ret + '" }');
    }
    return res.status(200).send('{ "message": "Not found." }');
})

app.get("/dist/admin", function(req, res) {
    res.sendFile(__dirname + "/public/dist/admin.html")
})

app.get("/v2/get/question", function(req, res) {
    res.redirect("/");
})

app.use(express.static(__dirname + "/public"), (_, res, next) => {
    res.status(404).redirect(`/dist/?t=d&v=2&ts=${Date.now()}`);
})

app.listen(3000, function() {
    console.log("Running")
})