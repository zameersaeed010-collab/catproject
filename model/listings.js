const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('../model/review.js');


 const listingSchema = new Schema({

    title:{
        type:String,
        required:true,
    },

    description:{
        type:String,
        required:true,
    },

    image:{
      url:String,
      filename:String
    },

    price:{
        type:String,
        required:true,
    },

    location:{
        type:String,
        required:true,
    },

    country:{
        type:String,
        required:true,
    },

    reviews:
[
    {
        type:Schema.Types.ObjectId,
        ref:"Review",
    }
],

  category: {
    type: String,
    enum: ["Trending","Rooms","Iconic City","Mountains","Castles","Amazing Pool","Camping","Farms","Arctic"]
  },


owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
}
})

listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
        await Review.deleteMany({_id:{$in:listing.reviews}})
    }
})

module.exports = mongoose.model("listing",listingSchema)