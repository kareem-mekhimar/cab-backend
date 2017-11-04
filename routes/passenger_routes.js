

const PassengerController = require("../controllers/passengers_controller");

module.exports = (router) => {
        router.route("/passengers").get(PassengerController.findAll),
        router.route("/passengers").post(PassengerController.create),
        router.route("/passengers/calculate-eta").post(PassengerController.calculateDistanceAndFare),
        router.route("/passengers/validate-phone").get(PassengerController.isPhoneExists),
        router.route("/passengers/:id/send-code").get(PassengerController.sendCode),
        router.route("/passengers/:id/verify").post(PassengerController.verify),
        router.route("/passengers/:id").get(PassengerController.findById),
        router.route("/passengers/:id").put(PassengerController.update)
};