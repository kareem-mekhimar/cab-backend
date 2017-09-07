const UserController = require("../controllers/user_controller");


module.exports = (router) => {
        router.route("/admin").post(UserController.createNewAdminUser);
};