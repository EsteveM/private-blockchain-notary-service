# Build a Private Blockchain Notary Service

This project is intended to build a Star Registry Service. This service will make it possible for its users to claim ownership of the data of their favourite stars in the sky. To this end, they will have added that data into the underlying blockchain. This project builds on the blockchain dataset implemented on [this Github repo](https://github.com/EsteveM/RESTful-web-API-for-private-blockchain).

## Table of Contents

* [Description of the Project](#description-of-the-project)
* [Getting Started](#getting-started)
* [Contributing](#contributing)

## Description of the Project

As has already been mentioned, this project implements a Star Registry Service, which allows its users to claim ownership of the star data they have incorporated into the underlying blockchain. It builds on the blockchain created on [this Github repo](https://github.com/EsteveM/RESTful-web-API-for-private-blockchain), creates a mempool component, and a RESTful API that makes it possible for users to interface with the application. With this aim in view, a Node.js framework is used ([Express.js](https://expressjs.com/)), and a number of endpoints are implemented. The work that has been done is best described by explaining its main areas:

### The blockchain dataset

Stars are stored in the blockchain. Data is persisted with LevelDB, and star data is associated with its owner.

### The mempool component

It stores validation and valid requests for 5 minutes, and deals with the time left to the end of the validation window.

### Configuration of the endpoints provided by the REST API

Six Web API endpoints have been configured:

* POST to submit a validation request: the URL path used is *url: "/requestValidation"*. It receives a wallet address. The response is a request object in JSON format. A validation window of 5 minutes is established. If a validation request is resubmitted, the current one is returned with a decreased validation window.

* POST to validate the message signature of a request: the URL path used is */message-signature/validate*. It receives a wallet address and a signature. The response is a valid request object in JSON format. It is verified that the validation window of 5 minutes has not expired. Once the signature is validated, the user is allowed to store one star into the blockchain.

* POST to submit a request to store star data into the blockchain: the URL path used is */block*. It receives a star object to be stored into the body of a block of the blockchain. The response is the added blockchain block object in JSON format. It is verified that the wallet address that submits the storage request satisfied the previous validations and is still valid, otherwise, an error is returned.

* GET to retrieve a star block by hash: the URL path used is */stars/hash:[HASH]*. As can be observed, it receives a hash as parameter. The response is the corresponding blockchain block in JSON format, but including an additional property containing the star story decoded to ASCII.

* GET to retrieve star blocks by wallet address (user identity in the blockchain): the URL path used is */stars/address:[ADDRESS]*. As can be seen, it receives a wallet address as parameter. The response is a list of the corresponding blockchain blocks in JSON format, but again including an additional property for each one containing the star story decoded to ASCII. Please, note that this time the result is a list of objects because more than one block can contain the same wallet address.

* GET to retrieve a star block by block height: the URL path used is */block/[HEIGHT]*. As can be observed, it receives a block height as parameter. The response is the corresponding blockchain block in JSON format, but including an additional property containing the star story decoded to ASCII.

Finally, it is noteworthy that [Postman](https://www.getpostman.com/) has been used to test the endpoints. In addition, an [Electrum wallet](https://electrum.org/#home) has been used to work with wallet addresses, and sign messages using them.

### README.md update

This step creates the README.md file that you are viewing right now.

## Getting Started

The procedure to obtain functional a copy of the project on your local machine so that you can further develop and/or test it is explained in this section:

* Firstly, you have to download the project files from this repository onto your local machine.
* Secondly, you have to install Node.js® and NPM, which can be done from the [Node.js® site](https://nodejs.org/en/).
* Thirdly, you have to initialize the project by typing `npm init` on a terminal shell on your project main directory. Then, install bitcoinjs-lib, bitcoinjs-message, body-parser, crypto-js, express, hex2ascii and level by typing `npm install bitcoinjs-lib --save`, `npm install bitcoinjs-message --save`, `npm install body-parser --save`, `npm install crypto-js --save`, `npm install express --save`,  `npm install hex2ascii --save`, and `npm install level --save` respectively.
* Once that has been done, you can test the project. One way to do this is by using [Postman](https://www.getpostman.com/), which tests endpoints. In addition, a wallet such as the [Electrum wallet](https://electrum.org/#home) can be used to work with wallet addresses, and sign messages using them.

## Contributing

This repository contains all the work that makes up the project. Individuals and I myself are encouraged to further improve this project. As a result, I will be more than happy to consider any pull requests.


