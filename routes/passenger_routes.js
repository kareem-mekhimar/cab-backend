

const PassengerController = require("../controllers/passengers_controller");
const TripController = require("../controllers/trip_controller") ;

module.exports = (router) => {
        router.route("/passengers").get(PassengerController.findAll),
        router.route("/passengers").post(PassengerController.create),
        router.route("/passengers/calculate-eta").post(PassengerController.calculateDistanceAndFare),
        router.route("/passengers/validate-phone").get(PassengerController.isPhoneExists),
        router.route("/passengers/:id/send-code").get(PassengerController.sendCode),
        router.route("/passengers/:id/verify").post(PassengerController.verify),

/**
 * @swagger
 * /passengers/{id}/trips:
 *   get:
 *     tags:
 *       - Passengers
 *     summary: Get a page of trips for this passenger
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *       - name: "page"
 *         in: "query"
 *         type: number
 *         default: 1
 *       - name: "limit"
 *         in: "query"
 *         type: number
 *         default: 20
 *     responses:
 *       200:
 *         description: Get a page of trips for this passenger
 *         example: 
 *           {
 *                 "data": [
 *                           {
 *                             "_id": "5a3f77582e1ead4d295068e7",
 *                            "passenger": "5a00b71c9935ac0012484883",
 *                            "driver": {
 *                                "_id": "59fdfdd757adab00129770ca",
 *                                "firstName": "Ayman",
 *                                "lastName": "Ayman",
 *                                "address": "Address",
 *                                "email": "demo@demo.com",
 *                                "phone": "01289415321",
 *                                "pin": "12323123",
 *                                "licenceNo": "2132323123",
 *                                "__v": 0,
 *                                "licenceExpireDate": null,
 *                                "remarks": "",
 *                                "img": "59fdfdd757adab00129770ca",
 *                                "cars": [
 *                                          {
 *                                            "color": "gray",
 *                                            "luxury": null,
 *                                            "plateNo": "1231",
 *                                            "carType": "59fdfc0657adab00129770c8",
 *                                            "_id": "5a15b30662df230014fd649b"
 *                                          },
 *                                        ],
 *                                "gender": "MALE"
 *                              },
 *                              "fare": 9,
 *                              "km": 0,
 *                              "min": 0,
 *                              "arriveDate": "2017-12-24T09:45:50.202Z",
 *                              "startDate": "2017-12-24T09:45:57.176Z",
 *                              "endDate": "2017-12-24T09:46:00.143Z",
 *                              "requestLocation": [
 *                                   32.2709978,
 *                                   30.610617
 *                                ], 
 *                              "dropOffLocation": [
 *                                    32.270880682065915,
 *                                    30.611211334389232
 *                                 ],
 *                             }
 *                          ],
 *                     "page": 1,
 *                     "pageCount": 1,
 *                     "limit": "20",
 *                     "totalCount": 1,
 *                     "links": {
 *                           "self": "http://74.207.254.193:3000/api/passengers/5a00b71c9935ac0012484883/trips?page=1&limit=20"
 *                      }
 *              } 
 *       404:
 *         description: Passenger with this id not found
 */

        
        router.route("/passengers/:id/trips").get(TripController.findByPassenger)
        

        
        router.route("/passengers/:id").get(PassengerController.findById),
        router.route("/passengers/:id").put(PassengerController.update)
};