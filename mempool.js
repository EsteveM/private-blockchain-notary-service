/* ===== MEMPOOL.JS file ===================================
/*
/* This file contains the Mempool class with a constructor for mempool,
/* and a number of functionalities:
/*          addRequestValidation(walletAddress, requestTimeStamp)
/*          verifyWindowTime(requestTimeStamp)
/*          removeValidationRequest(requestObject)
/*          validateRequestByWallet(walletAddress, signature)
/*          verifyAddressRequest(walletAddress)
/*
/* Each functionality is further described below.
/*
/* ==============================================================
/* ===== Mempool Class ==============================
|  Class with a constructor for new mempool         |
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const bitcoinMessage = require('bitcoinjs-message');
const TimeoutRequestsWindowTime = 5*60*1000;

class Mempool{

    constructor() {
        this.mempool = [];
        this.timeoutRequests = [];
        this.mempoolValid = [];
    }

    // addRequestValidation, it is a helper method that returns a request object
    // The request contains a wallet address and a request timestamp
    // The response contains: a wallet address, a request timestamp, a message and a validation window.
    addRequestValidation(walletAddress, requestTimeStamp) {
        let self = this;
        function checkMempool(request) {
            return request.walletAddress === walletAddress;
        };
        // If the user re-submits an existing request, that existing request is returned. No new request is created
        let index = self.mempool.findIndex(checkMempool);
        if (index >= 0) {
            console.log(`addRequestValidation: request already exists: ${JSON.stringify(self.mempool[index])}`);
            let requestObject = self.mempool[index];
            requestObject.validationWindow = self.verifyWindowTime(requestObject.requestTimeStamp);
            return requestObject;
        } else {
            // The message format is walletAddress:requestTimeStamp:starRegistry
            let message = `${walletAddress}:${requestTimeStamp}:starRegistry`;
            let validationWindow = self.verifyWindowTime(requestTimeStamp);
            let requestObject = {
                walletAddress: walletAddress,
                requestTimeStamp: requestTimeStamp,
                message: message,
                validationWindow: validationWindow
            };
            self.mempool.push(requestObject);
            // Deletion of the request after 5 minutes
            self.timeoutRequests[walletAddress] = setTimeout(function(){self.removeValidationRequest(requestObject.walletAddress);},
                TimeoutRequestsWindowTime);
            return requestObject;
        }
    }

    // verifyWindowTime, it is a helper method that returns the time left to the end of the validation time
    verifyWindowTime(requestTimeStamp) {
        let timeElapse = (new Date().getTime().toString().slice(0,-3)) - requestTimeStamp;
        let timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
        return timeLeft;
    }

    // removeValidationRequest, it is a helper method that removes the validation request from the mempool (mempool,
    // timeoutRequests, and mempoolValid arrays)
    removeValidationRequest(walletAddress) {
        let self = this;
        function checkMempool(request) {
            return request.walletAddress === walletAddress;
        };
        function checkMempoolValid(validRequest) {
            return validRequest.status.address === walletAddress;
        };

        console.log(`removeValidationRequest: Start of mempool listing before`);
        console.log(`--------------------------------------------------------`);
        console.log(`removeValidationRequest: The ${self.mempool.length} contents of the mempool are listed below:`);
        console.log(`removeValidationRequest: The ${self.timeoutRequests.length} contents of the timeoutRequests are listed below:`);
        console.log(`removeValidationRequest: The ${self.mempoolValid.length} contents of the mempoolValid are listed below:`);
        for (let i = 0; i < self.mempool.length; i++) {
            console.log(`removeValidationRequest: This is the ${i} element of the mempool: ${JSON.stringify(self.mempool[i])}`);
            console.log(`removeValidationRequest: This is the ${i} element of the timeoutRequests: ${self.timeoutRequests[self.mempool[i].walletAddress]}`);
            console.log(`removeValidationRequest: This is the ${i} element of the mempoolValid: ${JSON.stringify(self.mempoolValid[i])}`);
        }
        console.log(`removeValidationRequest: End of mempool listing before`);
        console.log(`------------------------------------------------------`);

        // Deletion of requestObject from mempool array
        let index = self.mempool.findIndex(checkMempool);
        if (index >= 0) {
            self.mempool.splice(index, 1);
        }
        // Deletion of contents of the timeoutRequests entry for the wallet address
        delete self.timeoutRequests[walletAddress];
        // Deletion of requestObject from mempool array
        index = self.mempoolValid.findIndex(checkMempoolValid);
        if (index >= 0) {
            self.mempoolValid.splice(index, 1);
        }

        console.log(`removeValidationRequest: Start of mempool listing afterwards`);
        console.log(`------------------------------------------------------------`);
        console.log(`removeValidationRequest: The ${self.mempool.length} contents of the mempool are listed below:`);
        console.log(`removeValidationRequest: The ${self.timeoutRequests.length} contents of the timeoutRequests are listed below:`);
        console.log(`removeValidationRequest: The ${self.mempoolValid.length} contents of the mempoolValid are listed below:`);
        for (let i = 0; i < self.mempool.length; i++) {
            console.log(`removeValidationRequest: This is the ${i} element of the mempool: ${JSON.stringify(self.mempool[i])}`);
            console.log(`removeValidationRequest: This is the ${i} element of the timeoutRequests: ${self.timeoutRequests[self.mempool[i].walletAddress]}`);
            console.log(`removeValidationRequest: This is the ${i} element of the mempoolValid: ${JSON.stringify(self.mempoolValid[i])}`);
        }
        console.log(`removeValidationRequest: End of mempool listing afterwards`);
        console.log(`----------------------------------------------------------`);

        return;
    }

    // validateRequestByWallet, it is a helper method that returns a valid request object
    // The request contains a wallet address and a signature
    // The response contains: a valid request object
    validateRequestByWallet(walletAddress, signature) {
        let self = this;

        function checkMempool(request) {
            return request.walletAddress === walletAddress;
        };

        function checkMempoolValid(validRequest) {
            return validRequest.status.address === walletAddress;
        };

        // request found in the mempool array by wallet address
        let index = self.mempool.findIndex(checkMempool);
        if (index >= 0) {
            console.log(`validateRequestByWallet: request found on mempool: ${JSON.stringify(self.mempool[index])}`);
            let requestObject = self.mempool[index];
            // verify time left to the end of validation period
            // if the request exists on the mempool, that means that the request has not expired yet,
            // because if it had expired, it would have been removed from the mempool
            let validationWindow = self.verifyWindowTime(requestObject.requestTimeStamp);
            // verify signature
            let isValid = false;
            try {
                isValid = bitcoinMessage.verify(requestObject.message, requestObject.walletAddress, signature);
            }
            catch(err) {
                let responseObject = {
                    error: true,
                    data: `validateRequestByWallet: an error has occurred while validating signature: ${err}`
                };
                return responseObject;
            }
            console.log(`validateRequestByWallet: signature validation is: ${isValid}`);
            // signature is valid
            if (isValid) {
                let validRequest = {
                    registerStar: true,
                    status: {
                        address: walletAddress,
                        requestTimeStamp: requestObject.requestTimeStamp,
                        message: requestObject.message,
                        validationWindow: validationWindow,
                        messageSignature: true
                    }
                };
                // Save object in mempoolValid array if it was not already there
                index = self.mempoolValid.findIndex(checkMempoolValid);
                if (index < 0) {
                    self.mempoolValid.push(validRequest);
                }

                let responseObject = {
                    error: false,
                    data: validRequest
                };
                return responseObject;
            // signature is not valid, an error is returned to the web API
            } else {
                let responseObject = {
                    error: true,
                    data: `validateRequestByWallet: signature is not valid: ${walletAddress}`
                };
                return responseObject;
            }
        // request not found on mempool array, an error is returned to the web API
        } else {
            let responseObject = {
                error: true,
                data: `validateRequestByWallet: request not found on mempool: ${walletAddress}`
            };
            return responseObject;
        }
    }

    // verifyAddressRequest, it is a helper method that returns whether a wallet address exists on the mempoolValid array,
    // if this is the case, it is possible to store star data on the blockchain
    // The receives a wallet address
    // The response contains: a boolean that states whether the request for the wallet address exists on the memppolValid array
    verifyAddressRequest(walletAddress) {
        let self = this;

        function checkMempoolValid(validRequest) {
            return validRequest.status.address === walletAddress;
        };

        // If the request for the wallet address is found on the mempoolValid array, it exists and is still valid
        let index = self.mempoolValid.findIndex(checkMempoolValid);
        if (index < 0) {
            return false;
        } else {
            return true;
        }
    }

}

module.exports.Mempool = Mempool;