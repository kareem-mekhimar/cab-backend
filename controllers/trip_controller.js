
const Trip = require("../models/trip") ;
const Passenger = require("../models/passenger") ;
const { ApiResponse } = require("../helpers/ApiResponse") ;


module.exports = {

    findByPassenger(req,res){
        
        let page = req.query.page;
        let limit = req.query.limit;
       
        page = page ? parseInt(page) : 1;
        limit = limit ? limit : 20;
       
        let id = req.params.id ;
        
        Passenger.findById(id).then(pass => {

            if(! pass){
                res.status(404).send({ success:false , error: "Passenger not found" }) ;
                return ;
            }

            let findQuery = Trip.find({ passenger: id });
            findQuery.populate('passenger driver') ;
            let countQuery = Trip.count({ passenger: id  });

            findQuery.sort({ endDate: -1 })
            .limit(parseInt(limit))
            .skip((page - 1) * limit).then(results => {

                countQuery.then(count => {

                    let pageCount = Math.ceil(count / limit);

                    let response = new ApiResponse(results, page, pageCount, limit, count);
                    response.addSelfLink(req);

                    if (page > 1) {
                        response.addPrevLink(req);
                    }
                    if (page < pageCount) {
                        response.addNextLink(req);
                    }
            
                    res.send(response);
                }).catch(err => console.log(err))
                
            }).catch(err => console.log(err) );
        }).catch(err => {
            res.status(404).send({ success:false , error: "Passenger not found" }) ;
        })

    }
}