
const PlacesController = require("../controllers/places.controller");

module.exports = (router) => {
    router.route("/places").get(PlacesController.findAll)
                           .post(PlacesController.create),
    router.route("/places/:id").get(PlacesController.findById) .put(PlacesController.update)                         
};