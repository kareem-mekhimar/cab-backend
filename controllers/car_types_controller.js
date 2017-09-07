
const CarType = require("../models/car_type") ;

module.exports = {
    
    findAll(req,res){
        res.contentType("application/json");
        
        var limit = 10 ;
        var pageParam = req.param('page') ;

        var page = pageParam && pageParam > 0 ? pageParam : 1 ;

        CarType.find({ }).limit(limit).skip((page - 1) * limit).then(data =>{
            CarType.count().then(count => {
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
        const carTypeBody = req.body ;
        
        res.contentType("application/json");
        
        CarType.create(carTypeBody).then(type => {
             res.status(201).send(type) ;
        }).catch(model => {
            res.status(422).send(model.errors);
        });
    },

    findById(req, res) {
        res.contentType("application/json");

        var id = req.params.id;

        CarType.findById(id).then(car => {
            if (!car)
                res.status(404).end();
            else
                res.status(200).send(car);
        }).catch(err => {
            res.status(404).end();
        });
    },

    update(req, res) {
        const typeBody = req.body;

        var id = req.params.id;
        res.contentType("application/json");

        CarType.findByIdAndUpdate(id, typeBody, { new: true }).then(type => {
            res.status(200).send(type);
        }).catch(err => {
            res.status(404).end();
        })
    },

}