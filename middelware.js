const listing = require("./model/listings.js")

module.exports.IsloggedIn = (req,res,next)=>{
    if (!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","You have to loggedIn first")
        return res.redirect("/login")
    }
    next()
}

module.exports.savedUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl
        
    }
    next();
}

module.exports.IsOwner = async(req,res,next) =>{
    let {id} = req.params;
    let newlisting = await listing.findById(id)
    if(!newlisting.owner.equals(res.locals.CurrentUser._id)){
        req.flash("error","You are not Authorized for this listing")
        return res.redirect(`/listings/${id}`)
    }
    next();
}

module.exports.IsAuthor = async(req,res,next)=>{
    let {reviewId} = req.params;
    let review = await review.findById(reviewId)
    if(!review.Author.equals(res.locals.CurrentUser._id)){
        req.flash("error","You are not Authorized for this listing")
        return res.redirect("/listings/${id}")
    }
    next();
}