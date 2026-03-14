if(process.env.NODE_ENV != "production"){
    require('dotenv').config()

}


const express = require('express');
const mongoose = require('mongoose');
const path = require("path")
const app = express();
const port = 3000;
const Listing = require("./model/listings")
const singlelisting = require("./model/listings")
const editlisting = require("./model/listings")
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const review = require('./model/review');
const listing = require("./model/listings")
const cookieparser = require("cookie-parser")

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./model/user.js")
const flash = require("connect-flash")
const {IsloggedIn, IsOwner, IsAuthor} = require("./middelware.js")
const {savedUrl} = require("./middelware.js")
const multer  = require('multer')
const {storage} = require("./cloudconfig.js")
const upload = multer({storage})

const dburl = process.env.ATLASDB_URL;

const session = require("express-session");
const MongoStore = require("connect-mongo").default;


const store = MongoStore.create({
  mongoUrl: dburl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600
});

store.on("error", () => {
  console.log("Session Store Error", err);
});

const sessionOptions = {
  store: store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true
  }
};

app.use(express.static(path.join(__dirname,"public")))
app.use(express.urlencoded({extended:true}))
app.set("view engine","ejs")
app.set("views",path.join(__dirname,"/views"))
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

app.use(session(sessionOptions))
app.use(cookieparser());
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

main()
.then(()=>{
    console.log(`Successfully connected to the Server`);
})
.catch((err)=>{
    console.log(err);
})

async function main(){
    await mongoose.connect(dburl);
}

app.use((req,res,next)=>{
    res.locals.successMsg = req.flash("success")
    res.locals.errorMsg = req.flash("error")
    res.locals.CurrentUser = req.user;
    next();
})


app.get("/",(req,res)=>{
    res.render("listings/home.ejs")
})

app.get("/listings",async(req,res)=>{
    let allListing = await Listing.find()
    res.render("listings/show.ejs",{allListing})
})

app.get("/listings/new",IsloggedIn,(req,res)=>{
    res.render("listings/new.ejs")
})

app.post("/listings",upload.single('listing[image]'),async(req,res)=>{
   let url = req.file.path;
   let filename = req.file.filename;
    let newlisting = new Listing(req.body.listing)

//    this is for when you create a new listing and show the owner only one line below
   newlisting.owner = req.user._id;
    newlisting.image = {url,filename}
   await newlisting.save()
   
    req.flash("success","NewListing is saved properly!")
   
   res.redirect("/listings")

})


app.get("/listings/:id/edit", IsloggedIn, async (req, res) => {
    let { id } = req.params;

    let listing = await editlisting.findById(id);

    let originalimageurl = listing.image.url;
    originalimageurl = originalimageurl.replace("/upload/", "/upload/w_200/");
    
    res.render("listings/edit.ejs", { listing, originalimageurl });
});

app.put("/listings/:id",IsOwner,IsloggedIn,upload.single('listing[image]'),async(req,res)=>{
    let {id} = req.params;
    // let newlisting = await listing.findById(id)
    // if(!newlisting.owner.equals(res.locals.CurrentUser._id)){
    //     req.flash("error","you are not authorized for updating the listing")
    //    return res.redirect(`/listings/${id}`)
    // }

    let listing = await editlisting.findByIdAndUpdate(id,{...req.body.listing})

    if(typeof req.file !== "undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {url,filename}
    await listing.save();
    }
    res.redirect(`/listings/${id}`)
})

app.delete("/listings/:id",IsOwner,IsloggedIn,async(req,res)=>{
    let {id} = req.params;
    await Listing.findByIdAndDelete(id)
    res.redirect("/listings")
})

// Tranding page
app.get("/listings/Trending", (req,res)=>{
    res.render("listings/Trending.ejs");
});

app.get("/listings/:id", async (req, res) => {
    let { id } = req.params;

    let listing = await singlelisting
        .findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" }
        })
        .populate("owner");

    if (!listing) {
        return res.redirect("/listings");
    }

    res.render("listings/single.ejs", { listing });
});

app.post("/listings/:id/reviews",IsloggedIn,async(req,res)=>{
    let Listing = await listing.findById(req.params.id);
    let newreview = new review(req.body.review)

    newreview.Author = req.user._id;
    console.log(newreview)

    Listing.reviews.push(newreview);
    await Listing.save();
    await newreview.save();
    console.log("Review saved")
    res.redirect("/listings");
})

app.delete("/listings/:id/reviews/:reviewId",IsAuthor,IsloggedIn,async(req,res)=>{
let {id,reviewId} = req.params;
await listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}})
await review.findByIdAndDelete(reviewId);
console.log("Review Deleted")
res.redirect(`/listings/${id}`)
})


// signup and login routes will be added later

app.get("/signup",(req,res)=>{
    res.render("listings/signup.ejs")
})

app.post("/signup",async(req,res)=>{
  try {
      let {username,email,password} = req.body;
      let newuser = new User({username,email})
      let registeruser = await User.register(newuser,password)
      console.log(registeruser)

      req.login(registeruser,(err)=>{
        if(err){
            next(err);
        }
        req.flash("success","Welcome Back")
        res.redirect("/listings")
      })

    
  } catch (err) {
    req.flash("err",err.message)
    res.redirect("/signup")
    
  }  
})

app.get("/login",(req,res)=>{
    res.render("listings/login")
})

app.post("/login",savedUrl,passport.authenticate("local",{
    failureRedirect:"/login",
    failureFlash:true,
    }
),async(req,res)=>{
    req.flash("success","Welcome Back dear!")
    let savedredirectUrl = res.locals.redirectUrl || "/listings"
    res.redirect(savedredirectUrl)
})

app.get("/logout",async(req,res)=>{
    req.logOut((err)=>{
        if(err){
            next(err)
        }
        req.flash("success","You are logged out")
        res.redirect("/listings")
    })
})

app.listen((port),()=>{
    console.log(`Server is running on ${port}`)
})