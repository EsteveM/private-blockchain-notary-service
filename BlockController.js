/* ===== BLOCKCONTROLLER.JS file ===================================
/*
/* This file contains the BlockController class with a constructor
/* for blockcontroller, and a number of functionalities:
/*          initializeMockData()
/*          requestValidation() -> POST /requestValidation
/*          validate() -> POST /message-signature/validate
/*          postNewBlock() -> POST /block
/*          getBlockByHash() -> GET /stars/hash\::hash
/*          getBlockByWalletAddress() -> GET /stars/address\::address
/*          getBlockByHeight() -> GET /block/:height
/*
/* Each functionality is further described below.
/*
/* ==============================================================
/* ===== BlockController Class ==============================
|  Class with a constructor for new blockController         |
|  =========================================================*/

//Importing BlockChain.js module
const BlockChain = require('./BlockChain.js');
//Importing mempool.js module
const Mempool = require('./mempool.js');
//Importing Block.js module
const Block = require('./Block.js');
//Importing hextoascii module
const hex2ascii = require('hex2ascii');

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

    /**
     * Constructor to create a new BlockController, all endpoints are initialized here
     * @param {*} app
     */
    constructor(app) {
        this.app = app;
        this.myBlockChain = new BlockChain.Blockchain();
        this.myMempool = new Mempool.Mempool();
        this.initializeMockData();
        this.requestValidation();
        this.validate();
        this.postNewBlock();
        this.getBlockByHash();
        this.getBlockByWalletAddress();
        this.getBlockByHeight();
    }

    /**
     * Helper method to inizialize Mock dataset, adds 10 test blocks to the blockchain, on top of the genesis block
     * already created. In this project, no initialization is made, but the code is here commented just in case it
     * could be considered helpful in the future.
     */
    initializeMockData() {
        /* let self = this;
        (function theLoop (i) {
            setTimeout(function () {
                let blockTest = new Block.Block("Test Block - " + (i + 1));
                self.myBlockChain.addBlock(blockTest).then((result) => {
                    i++;
                    if (i < 10) theLoop(i);
                });
            }, 10000);
        })(0); */
        console.log(`initializeMockData: No initialization made`);
    }

    /**
     * requestValidation Web API endpoint to submit a validation request, url: "/requestValidation", with
     * response in JSON format
     * the request contains a wallet address
     */
    requestValidation() {
        let self = this;
        this.app.post('/requestValidation', (req, res) => {
            let requestTimeStamp = new Date().getTime().toString().slice(0,-3);
            console.log(`requestValidation input: address: ${req.body.address} requestTimeStamp: ${requestTimeStamp}`);
            let requestObject = self.myMempool.addRequestValidation(req.body.address, requestTimeStamp);
            console.log(`requestValidation output: requestObject: ${JSON.stringify(requestObject)}`);
            res.status(200);
            res.type('application/json');
            res.set('Cache-Control', 'no-cache');
            res.set('Accept-Ranges', 'bytes');
            res.set('Connection', 'close');
            res.send(JSON.stringify(requestObject));
        });
    }

    /**
     * validate Web API endpoint to validate a mesage signature, url: "/message-signature/validate", with
     * response in JSON format
     * The request contains a wallet address and a signature
     */
    validate() {
        let self = this;
        this.app.post('/message-signature/validate', (req, res) => {
            console.log(`validation input: walletAddress: ${req.body.address} signature: ${req.body.signature}`);
            let responseObject = self.myMempool.validateRequestByWallet(req.body.address, req.body.signature);
            if (responseObject.error) {
                console.log(`validation output: error message: ${JSON.stringify(responseObject.data)}`)
                res.set('Connection', 'close');
                res.status(400);
                res.send(JSON.stringify(responseObject.data));
            } else {
                console.log(`validate output: validRequest: ${JSON.stringify(responseObject.data)}`);
                res.status(200);
                res.type('application/json');
                res.set('Cache-Control', 'no-cache');
                res.set('Accept-Ranges', 'bytes');
                res.set('Connection', 'close');
                res.send(JSON.stringify(responseObject.data));
            }
        });
    }

    /**
     * POST Endpoint to add a new Block, url: "/block"
     */
    postNewBlock() {
        let self = this;
        this.app.post('/block', (req, res) => {
            // Check empty object: https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
            if (req.body.constructor === Object && Object.entries(req.body).length === 0) {
                console.log(`postNewBlock: error message: an attempt has been made to add a block without specifying payload.`);
                res.set('Connection', 'close');
                res.status(400);
                res.send(`postNewBlock: error message: an attempt has been made to add a block without specifying payload.`);
            } else {
                // Check the format of the star data to be stored is correct. In particular, only it is checked that only one
                // star is sent in the request
                if (req.body.constructor === Object && Object.entries(req.body).length === 2) {
                    if (Object.entries(req.body)[0][0] === 'address' && Object.entries(req.body)[1][0] === 'star') {
                        // Check the star story string length is not greater than 250
                        if (req.body.star.story.length <= 250) {
                            // Check whether request validation exists and is valid
                            let isValid = self.myMempool.verifyAddressRequest(req.body.address);
                            if (isValid) {
                                // Encode the story of the star within the block to be added to the blockchain
                                let body = {
                                    address: req.body.address,
                                    star: req.body.star
                                };
                                body.star.story = Buffer(body.star.story).toString('hex')
                                // Block to be added to the blockchain
                                let block = new Block.Block(body);
                                self.myBlockChain.addBlock(block).then((result) => {
                                    // Deletion of the request once the user has used it to store one star into the blockchain
                                    self.myMempool.removeValidationRequest(block.body.address);
                                    res.status(200);
                                    res.type('application/json');
                                    res.set('Cache-Control', 'no-cache');
                                    res.set('Connection', 'close');
                                    res.send(result);
                                }).catch((err) => {
                                    console.log(err);
                                    res.set('Connection', 'close');
                                    res.status(500).end();
                                });
                            } else {
                                console.log(`postNewBlock: error message: the request for the wallet address is not valid, does not exist, or has already been used.`);
                                res.set('Connection', 'close');
                                res.status(400);
                                res.send(`postNewBlock: error message: the request for the wallet address is not valid, does not exist, or has already been used.`);
                            }
                        } else {
                            console.log(`postNewBlock: error message: the length of the star story is greater than 250.`);
                            res.set('Connection', 'close');
                            res.status(400);
                            res.send(`postNewBlock: error message: the length of the star story is greater than 250.`);
                        }

                    } else {
                        console.log(`postNewBlock: error message: the payload format is not correct - there must be a wallet address and a star data only.`);
                        res.set('Connection', 'close');
                        res.status(400);
                        res.send(`postNewBlock: error message: the payload format is not correct - there must be a wallet address and a star data only.`);
                    }
                } else {
                    console.log(`postNewBlock: error message: the payload format is not correct - there must be two properties and only two.`);
                    res.set('Connection', 'close');
                    res.status(400);
                    res.send(`postNewBlock: error message: the payload format is not correct - there must be two properties and only two.`);
                }
            }
        });
    }

    /**
     * GET Endpoint to retrieve a block by hash, url: "/stars/hash:hash"
     */
    getBlockByHash() {
        let self = this;
        this.app.get('/stars/hash\::hash', (req, res) => {
            console.log(`BlockController.js - getBlockByHash input: hash ${req.params.hash}`);
            self.myBlockChain.getBlockByHash(req.params.hash).then((block) => {

                // Decode the star story into a new property storyDecoded
                let resultObject = JSON.parse(block);
                resultObject.body.star.storyDecoded = hex2ascii(resultObject.body.star.story);
                console.log(`BlockController.js - getBlockByHash output: ${JSON.stringify(resultObject)}`);
                res.status(200);
                res.type('application/json');
                res.set('Cache-Control', 'no-cache');
                res.set('Accept-Ranges', 'bytes');
                res.set('Connection', 'close');
                res.send(JSON.stringify(resultObject));
            }).catch((err) => {
                console.log(err);
                res.set('Connection', 'close');
                res.status(404);
                res.send(`getBlockByHash output: error message: ${err}`);
            });
        });
    }

    /**
     * GET Endpoint to retrieve blocks by wallet address, url: "/stars/address:address"
     */
    getBlockByWalletAddress() {
        let self = this;
        this.app.get('/stars/address\::address', (req, res) => {
            console.log(`BlockController.js - getBlockByWalletAddress input: wallet address ${req.params.address}`);
            self.myBlockChain.getBlockByWalletAddress(req.params.address).then((blockList) => {

                // Decode the star story into a new property storyDecoded
                function decodeStory(item) {
                    let resultObject = JSON.parse(item);
                    resultObject.body.star.storyDecoded = hex2ascii(resultObject.body.star.story);
                    return resultObject;
                }
                let resultBlockList = blockList.map(decodeStory);
                console.log(`BlockController.js - getBlockByWalletAddress output: ${resultBlockList}`);
                res.status(200);
                res.type('application/json');
                res.set('Cache-Control', 'no-cache');
                res.set('Accept-Ranges', 'bytes');
                res.set('Connection', 'close');
                res.send(resultBlockList);
            }).catch((err) => {
                console.log(err);
                res.set('Connection', 'close');
                res.status(404);
                res.send(`getBlockByWalletAddress output: error message: ${err}`);
            });
        });
    }

    /**
     * GET Endpoint to retrieve a block by hash, url: "/block/:height"
     */
    getBlockByHeight() {
        let self = this;
        this.app.get('/block/:height', (req, res) => {
            console.log(`BlockController.js - getBlockByHeight input: height ${req.params.height}`);
            self.myBlockChain.getBlock(req.params.height).then((block) => {

                // Decode the star story into a new property storyDecoded
                let resultObject = block;
                resultObject.body.star.storyDecoded = hex2ascii(resultObject.body.star.story);

                console.log(`BlockController.js - getBlockByHeight output: ${JSON.stringify(resultObject)}`);
                res.status(200);
                res.type('application/json');
                res.set('Cache-Control', 'no-cache');
                res.set('Accept-Ranges', 'bytes');
                res.set('Connection', 'close');
                res.send(JSON.stringify(resultObject));
            }).catch((err) => {
                console.log(err);
                res.set('Connection', 'close');
                res.status(404);
                res.send(`getBlockByHash output: error message: ${err}`);
            });
        });
    }

}

/**
 * Exporting the BlockController class
 * @param {*} app
 */
module.exports = (app) => { return new BlockController(app);}