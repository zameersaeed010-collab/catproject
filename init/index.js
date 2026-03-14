const mongoose = require('mongoose');
const initdata = require("../init/data.js")
const listing = require("../model/listings.js")

main()
.then(()=>{
    console.log(`Successfully connected to the Server`);
})
.catch((err)=>{
    console.log(err);
})

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/catProject");
}

const init = async()=>{
    await listing.deleteMany({})
    
    initdata.data = initdata.data.map((obj) => ({...obj,owner:"6980aa9627b0ae19c459203a"}))

    await listing.insertMany(initdata.data)
    console.log("Data Imported Successfully")
} 
init();

