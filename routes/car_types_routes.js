
const CarTypesController = require("../controllers/car_types_controller");

module.exports = (router) => {
    router.route("/car-types").get(CarTypesController.findAll),
    router.route("/car-types").post(CarTypesController.create),
    router.route("/car-types/:id").get(CarTypesController.findById),
    router.route("/car-types/:id").put(CarTypesController.update)
};