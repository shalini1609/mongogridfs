'use strict';
var express = require('express');
var app = express();
var port = 30012;
var fs = require('fs');
var mongo = require('./controllers/mongoconnection');
var bodyParser = require('body-parser');
const mongodb = require('mongodb');
const mongoose = require("mongoose");
var operation = require('./controllers/operation');
const e = require('express');
var MongoClient = require('mongodb').MongoClient;
var config = require('./config');
const log4js = require('log4js');
const { log } = require('console');
const { casesLimit } = require('./config');
const logger = log4js.getLogger(config.loggerName);
logger.level = config.loglevel;

app.use(bodyParser.json({
    limit: '70mb'
}));
app.listen(port, function () {
    logger.info("Server listenning to port ", port);
});

app.get('/api/filenet/downl oad/', function (req, res) {
    logger.info("File Download Api Hit");
    let statusArray = config.caseSatus.split(' ');
    mongo.monogoConnection().then(_db => {
        let dataBase = config.caseMonogoDB
        var dbo = _db.db(dataBase);
        let limit = parseInt(config.casesLimit);

        logger.info("Db Connected Successfully", limit);
        dbo.collection('caseDetails').aggregate(
            [
                {
                    "$match": {
                        "caseStatus": { $in: statusArray }
                    }
                },
                {
                    "$lookup": {
                        "from": config.bucketName,
                        "localField": "_id",
                        "foreignField": "caseId",
                        "as": "files"
                    }
                },
                {
                    "$project": {
                        "_id": 1.0,
                        "caseStatus": 1.0,
                        "files": 1.0
                    }
                }, {
                    "$limit": limit
                }
            ]).toArray(function (err, cases) {
                if (err) {
                    logger.info("Error In The Aggregate Query", err)
                } else {
                    logger.info("Cases List Count", cases.length);
                    casesHandleFile(cases, function (err, newFiles) {
                        if (newFiles.length > 0) {
                            serverFileTranfer(newFiles, function (err, uploaded) {
                                if (uploaded.length > 0) {
                                    let files = {
                                        "files": uploaded
                                    }
                                    deleteFileFromPod(newFiles, function (err, removedFiles) {
                                        if (removedFiles.length > 0) {
                                            res.status(200).send({ "List of files transferred to the server": files })
                                        }
                                    })

                                } else if (err) {
                                    res.status(500).send({ "Failed Transfer": err })
                                }

                            })
                        } else if (err) {
                            res.status(500).send(err);
                        }

                    })
                }
            });
    })
})

async function serverFileTranfer(newFile, callback) {
    let uploadStatus = [];
    let errorStatus = [];
    logger.info("To Transfer The File")
    newFile.forEach(function (_item, _index) {
        let sourcePath = `./${_item}`;
        let filename = _item;
        operation.fileTransfer(sourcePath, filename).then(uploaded => {
            if (uploaded) {
                uploadStatus.push(uploadStatus)
                logger.info("File Transfer Length", uploadStatus.length)
                if (uploadStatus.length === newFile.length) {

                    callback(null, newFile)
                }
            }
        }).catch(err => {
            logger.info("Failed To Upload To Server", err)
            errorStatus.push(err)
            callback(errorStatus, null)
        }).catch(err => {
            console.log("Error catch in server file transfer", err)
            callback(err, null)
        })
    })

}
async function casesHandleFile(caseList, callback) {

    let newFilesArray = [];
    let errorList = [];
    let fileIds = [];
    caseList.forEach(function (element, index) {
        logger.info("CaseIDs fectched", element['_id'], "count", caseList.length)
        if (element['files'].length > 0) {
            element['files'].forEach(function (_files, _index) {
                let extension = _files['documentContent']['contentType'].split("/")[1];
                let filename = _files['documentContent']['filename'];
                let rename = _files['policyNumber'] + '-' + _files['_id'] + 'OEL' + _index + '.' + extension;
                logger.info("Case Id which has files", element['_id']);
                fileIds.push(element['_id'])
                mongo.mongoGridfs(filename, rename).then(_downloadedFiles => {
                    if (_downloadedFiles) {
                        logger.info("Files downloaded success gfs")
                        newFilesArray.push(_downloadedFiles);
                    } else if (err) {
                        errorList.push(err);
                    }

                    if (newFilesArray.length === fileIds.length) {
                        callback(null, newFilesArray)
                    } else if (errorList.length > 0) {
                        callback(errorList, null)
                    }
                }).catch(err => {
                    logger.info("Error in mongo grid fs", err)
                    callback(err, null)
                }).catch(err => {
                    callback(err, nul);
                })
            });

        }

    });

}

async function deleteFileFromPod(newFiles, callback) {
    let deletedFiles = [];
    newFiles.forEach(function (_ele) {
        let path = `./${_ele}`;
        fs.unlink(path, function (err, res) {

            deletedFiles.push(res)
            if (deletedFiles.length === newFiles.length) {
                callback(null, "deleted from pod")
            }
        })
    })
}