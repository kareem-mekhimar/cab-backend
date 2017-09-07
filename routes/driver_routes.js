
const DriverController = require("../controllers/drivers_controller");

module.exports = (router) => {
    router.route("/drivers").get(DriverController.findAll),
    router.route("/drivers").post(DriverController.create),
    router.route("/drivers/validate-phone").get(DriverController.isPhoneExists),
    router.route("/drivers/validate-email").get(DriverController.isEmailExists),
    router.route("/drivers/near").get(DriverController.findNear),
    router.route("/drivers/:id/img").post(DriverController.uploadImg),
    router.route("/drivers/:id/verify").put(DriverController.verify),
    router.route("/drivers/:id").get(DriverController.findById),
    router.route("/drivers/:id").put(DriverController.update)
};