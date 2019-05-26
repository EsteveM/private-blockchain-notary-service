/* ===== BLOCK.JS file ===================================
/*
/* This file contains the Block class with a constructor for block.
/* All the attributes that make up a block are included.
/*
/* ==============================================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

module.exports.Block = Block;