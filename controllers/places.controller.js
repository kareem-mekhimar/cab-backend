
const Place = require("../models/place") ;

module.exports = {
    
    findAll(req,res){
        res.contentType("application/json");
        
        var limit = 10 ;
        var pageParam = req.param('page') ;

        var page = pageParam && pageParam > 0 ? pageParam : 1 ;

        Place.find({ }).limit(limit).skip((page - 1) * limit).then(data =>{
            Place.count().then(count => {
                res.send({
                    page : page,
                    limit : limit,
                    pageCount:  Math.ceil(count / limit),
                    total:count,
                    data:data
                });  
            });
        });
    },


    create(req,res){
        const placeBody = req.body ;
        
        res.contentType("application/json");
        
        Place.create(placeBody).then(type => {
             res.status(201).send(type) ;
        }).catch(model => {
            res.status(422).send(model.errors);
        });
    },

    findById(req, res) {
        res.contentType("application/json");

        var id = req.params.id;

        Place.findById(id).then(place => {
            if (!place)
                res.status(404).end();
            else
                res.status(200).send(place);
        }).catch(err => {
            console.log(err);
            res.status(404).end();
        });
    },

    update(req, res) {
        const placeBody = req.body;

        var id = req.params.id;
        res.contentType("application/json");

        Place.findByIdAndUpdate(id, placeBody, { new: true }).then(place => {
            res.status(200).send(place);
        }).catch(err => {
            res.status(404).end();
        })
    },

}