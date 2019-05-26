/* ===== BLOCKCHAIN.JS file ===================================
/*
/* This file contains the Blockchain class with a constructor for blockchain,
/* and a number of functionalities:
/*        generateGenesisBlock()
/*        getBlockHeight()
/*        getBlock(blockHeight)
/*        addBlock(newBlock)
/*        validateBlock(blockHeight)
/*        validateBlockLink(blockHeight)
/*        validateChain()
/*        getBlockByHash(blockHash)
/*        getBlockByWalletAddress(blockWalletAddress)
/*        _modifyBlock
/*
/* Each functionality is further described below.
/*
/* ==============================================================
/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');

class Blockchain{

  constructor() {
    this.bd = new LevelSandbox.LevelSandbox();
    // Genesis block included in the chain at creation time
    this.generateGenesisBlock();
  }

  // Helper method to create a Genesis Block (always with height = 0)
  generateGenesisBlock() {
    let self = this;
    this.getBlockHeight().then(function(height) {
      if (height < 0) {

        // Block instance and block data
        let genesisBlockBody = {
          address: `1JsrVe7pHZGUrJB4NnjfXwDckAMmiXsDHN`,
          star: {
            ra: `17h 22m 13.1s`,
            dec: `-27° 14' 8.2`,
            story: `466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f`
          }
        };

        let newBlock = new Block.Block(genesisBlockBody);
        // Block height
        newBlock.height = 0;
        // UTC timestamp
        newBlock.time = new Date().getTime().toString().slice(0,-3);
        // previous block hash
        newBlock.previousBlockHash = '';
        // Block hash with SHA256 using newBlock and converting to a string
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

        self.bd.addDataToLevelDB(JSON.stringify(newBlock)).then(function(result) {
            console.log(`generateGenesisBlock: Genesis block successfully inserted: ${JSON.stringify(newBlock)}`);
          }, function(error) {
            console.log(`generateGenesisBlock: Error found when calling addDataToLevelDB: ${error}`);
          }
        );
      } else {
        console.log(`generateGenesisBlock: Error found because genesis block already exists. Current height is ${height}`);
      }
    }, function(error) {
        console.log(`generateGenesisBlock: Error found when calling at getBlockHeight: ${error}`);
    });
  }

  // Get block height, it is a helper method that returns the height of the blockchain
  getBlockHeight() {
    let self = this;
    return new Promise(function(resolve, reject) {
      self.bd.getBlocksCount().then(function(result) {
            resolve(result - 1);
        },function(error) {
            reject(error);
        }
      );
    });
  }

  // get a block given its block height
  getBlock(blockHeight){
    let self = this;
    console.log(`BlockChain.js - getBlock: height ${blockHeight}`);
    return new Promise(function(resolve, reject) {
        self.bd.getLevelDBData(blockHeight).then(function(result) {
            // return object as a single string
            resolve(JSON.parse(result));
          }, function(error) {
            reject(error);
        }
      );
    });
  }

  // Add new block into the blockchain
  // Note that the block height is the key in LevelDB objects
  addBlock(newBlock) {
    let self = this;
    return new Promise(function(resolve, reject) {
      self.getBlockHeight().then(function(height) {
        // Check if a genesis block already exists. If not, create one before adding the new block
        if (height < 0) {

          // Block instance and block data
          let genesisBlock = new Block.Block("First block in the chain - Genesis block");
          // Block height
          genesisBlock.height = 0;
          // UTC timestamp
          genesisBlock.time = new Date().getTime().toString().slice(0,-3);
          // previous block hash
          genesisBlock.previousBlockHash = '';
          // Block hash with SHA256 using newBlock and converting to a string
          genesisBlock.hash = SHA256(JSON.stringify(genesisBlock)).toString();

          self.bd.addDataToLevelDB(JSON.stringify(genesisBlock)).then(function(result) {
              console.log(`addBlock: Genesis block successfully inserted: ${JSON.stringify(genesisBlock)}`);

              // Once the genesis block has been successfully created, the new block is also added

              // Block height
              newBlock.height = 1;
              // UTC timestamp
              newBlock.time = new Date().getTime().toString().slice(0,-3);
              // previous block hash
              newBlock.previousBlockHash = genesisBlock.hash;
              // Block hash with SHA256 using newBlock and converting to a string
              newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

              self.bd.addDataToLevelDB(JSON.stringify(newBlock)).then(function(result) {
                  console.log(`addBlock: New block successfully inserted after creating genesis block: ${JSON.stringify(newBlock)}`);
                  resolve(`${JSON.stringify(newBlock)}`);

                }, function(error) {
                  console.log(`addBlock: Error found when adding newBlock after creating genesisBlock (addDataToLevelDB): ${error}`);
                  reject(`addBlock: Error found when adding newBlock after creating genesisBlock (addDataToLevelDB): ${error}`);
                }
              );
            }, function(error) {
              console.log(`addBlock: Error found when creating genesisBlock (addDataToLevelDB): ${error}`);
              reject(`addBlock: Error found when creating genesisBlock (addDataToLevelDB): ${error}`);
            }
          );
        // Genesis block already exists, so simply add newBlock
        } else {
            self.getBlock(height).then(function(previousBlock) {
                // Block height
                newBlock.height = height + 1;
                // UTC timestamp
                newBlock.time = new Date().getTime().toString().slice(0,-3);
                // previous block hash
                newBlock.previousBlockHash = previousBlock.hash;
                // Block hash with SHA256 using newBlock and converting to a string
                newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

                self.bd.addDataToLevelDB(JSON.stringify(newBlock)).then(function(result) {
                    console.log(`addBlock: New block successfully inserted without creating genesis block: ${JSON.stringify(newBlock)}`);
                    resolve(`${JSON.stringify(newBlock)}`);
                  }, function(error) {
                    console.log(`addBlock: Error found when adding newBlock without creating genesisBlock (addDataToLevelDB): ${error}`);
                    reject(`addBlock: Error found when adding newBlock without creating genesisBlock (addDataToLevelDB): ${error}`);
                  }
                );
              }, function(error) {
                  console.log(`addBlock: Error found when calling getBlock without creating genesisBlock: ${error}`);
                  reject(`addBlock: Error found when calling getBlock without creating genesisBlock: ${error}`);
              }
            );
        }
      }, function(error) {
          console.log(`addBlock: Error found when calling getBlockHeight: ${error}`);
          reject(`addBlock: Error found when calling getBlockHeight: ${error}`);
      });
    });
  }

  // validate block integrity (block hash vs block contents)
  validateBlock(blockHeight){
    let self = this;
    return new Promise(function(resolve, reject) {
        // get block object
        self.getBlock(blockHeight).then(function(block) {
            // get block hash
            let blockHash = block.hash;
            // remove block hash to test block integrity
            block.hash = '';
            // generate block hash
            let validBlockHash = SHA256(JSON.stringify(block)).toString();
            // Compare
            if (blockHash === validBlockHash) {
                resolve(true);
            } else {
                resolve(false);
            }
          }, function(error) {
            reject(`validateBlock: Error found when calling getBlock: ${error}`);
          }
        );
    });
  }

  // validate block link (chain) integrity (current block hash vs previous block hash)
  validateBlockLink(blockHeight) {
    let self = this;
    return new Promise(function(resolve, reject) {
        // get block object
        self.getBlock(blockHeight).then(function(block) {
            // If genesis block, previous block hash of genesis block must be '' to be valid
            if (block.height === 0) {
                if (block.previousBlockHash === '') {
                    resolve(true);
                } else {
                   resolve(false);
                }
            }
            // If not genesis block, previous block hash of current block must be equal to hash of previous block to be valid
            else {
                self.getBlock(blockHeight - 1).then(function(previousBlock) {
                    if (block.previousBlockHash === previousBlock.hash) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                  }, function(error) {
                    reject(`validateBlockLink: Error found when calling getBlock of previous block: ${error}`);
                  }
                );
            }
          }, function(error) {
            reject(`validateBlockLink: Error found when calling getBlock of current block: ${error}`);
          }
        );
    });
  }

  // Validate blockchain validity
  validateChain() {
    let self = this;
    return new Promise(function(resolve, reject) {
        let errorLog = [];
        self.getBlockHeight().then(function(chainHeight) {
          let chainLength = chainHeight + 1;
          // For each block in the chain, block immutability and links between blocks are validated
            let arrayofPromises = [];
            for (var i = 0; i < chainLength; i++) {
              // Validate each chain block is valid
                arrayofPromises.push(self.validateBlock(i));
            }
            for (var i = 0; i < chainLength; i++) {
              // Validate links between blocks are valid
                arrayofPromises.push(self.validateBlockLink(i));
            }
            // An array of promises is created which will allow us to check each block's integrity and link to previous block
            Promise.all(arrayofPromises).then(function(responses) {
                for (var i = 0; i < chainLength; i++) {
                    if (!responses[i]) {
                      errorLog.push(`block hash invalid for block ${i}`);
                    }
                }
                for (var i = chainLength; i < responses.length; i++) {
                    if (!responses[i]) {
                      errorLog.push(`previous block hash invalid for block ${(i - chainLength)}`);
                    }
                }
                resolve(errorLog);
              }, function(error) {
                reject(`validateChain: Error found when executing Promise.all (validateBlock and validateBlockLink): ${error}`);
              }
            )
          }, function(error) {
            reject(`validateChain: Error found when calling at getBlockHeight: ${error}`);
          }
        );
    });
  }

  // get a block given its hash
  getBlockByHash(blockHash){
    let self = this;
    console.log(`BlockChain.js - getBlockByHash: hash ${blockHash}`);
    return new Promise(function(resolve, reject) {
      self.bd.getLevelDBDatabyHash(blockHash).then(function(result) {
        // return object as a single string
        resolve(result);
        }, function(error) {
        reject(error);
        }
      );
    });
  }

  // get a block given its wallet address
  getBlockByWalletAddress(blockWalletAddress){
    let self = this;
    console.log(`BlockChain.js - getBlockByWalletAddress: wallet address ${blockWalletAddress}`);
    return new Promise(function(resolve, reject) {
        self.bd.getLevelDBDatabyWalletAddress(blockWalletAddress).then(function(result) {
            // return object as a single string
            resolve(result);
          }, function(error) {
            reject(error);
        }
      );
    });
  }

  // Utility Method to Tamper a Block for Test Validation
  // This method is for testing purpose
  _modifyBlock(height, block) {
    let self = this;
    return new Promise( (resolve, reject) => {
        self.bd.addLevelDBData(height, JSON.stringify(block).toString()).then((blockModified) => {
          resolve(blockModified);
        }).catch((err) => { console.log(err); reject(err)});
    });
  }

}

module.exports.Blockchain = Blockchain;
