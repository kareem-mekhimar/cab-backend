

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
 *               {
 *                   "links": {
 *                       "self": "http://localhost:3000/api/v1/auctions?page=6&limit=2",
 *                       "first": "http://localhost:3000/api/v1/auctions?page=1&limit=2",
 *                       "prev": "http://localhost:3000/api/v1/auctions?page=5&limit=2",
 *                       "next": "http://localhost:3000/api/v1/auctions?page=7&limit=2",
 *                       "last": "http://localhost:3000/api/v1/auctions?page=7&limit=2"
 *                   },
 *                   "data": [
 *                       {
 *                           "title": "oppo",
 *                           "description": "good device",
 *                           "startPrice": 100000,
 *                           "relatedCategory": {
 *                               "name": "مجديات",
 *                               "id": "5a2443970b92ff001421a3b9"
 *                           },
 *                           "relatedUser": {
 *                               "email": "hazem.tarek@gmail.com",
 *                               "fullName": "Hazem Tarek",
 *                               "phone": "01014466503",
 *                               "country": "مصر",
 *                               "address": "بورسعيد",
 *                               "img": "http://kayed-api.herokuapp.com/uploads/5a24117b4bc62c0014489e43.png",
 *                               "id": "5a24117b4bc62c0014489e43"
 *                           },
 *                           "endDate": "2017-12-31T00:00:00.000Z",
 *                           "highestPrice": 1300025,
 *                           "creationDate": "2017-12-03T19:27:58.447Z",
 *                           "finished": false,
 *                           "imgs": [
 *                               "http://kayed-api.herokuapp.com/uploads/auctions/5a24503e7585730014f103c61512329278453.jpeg"
 *                           ],
 *                           "id": "5a24503e7585730014f103c6",
 *                           "inMyOffers": true,
 *                           "inMyFavourites": false
 *                       },
 *                       {
 *                           "title": "opel astra",
 *                           "description": "good car",
 *                           "startPrice": 1000,
 *                           "relatedCategory": {
 *                               "name": "سيارات",
 *                               "id": "5a2442fb4311cd0014c1bfb9"
 *                           },
 *                           "relatedUser": {
 *                               "email": "hazem.tarek@gmail.com",
 *                               "fullName": "Hazem Tarek",
 *                               "phone": "01014466503",
 *                               "country": "مصر",
 *                               "address": "بورسعيد",
 *                               "img": "http://kayed-api.herokuapp.com/uploads/5a24117b4bc62c0014489e43.png",
 *                               "id": "5a24117b4bc62c0014489e43"
 *                           },
 *                           "endDate": "2017-12-24T00:00:00.000Z",
 *                           "highestPrice": 10000000000002,
 *                           "creationDate": "2017-12-04T16:14:53.719Z",
 *                           "finished": false,
 *                           "imgs": [
 *                               "http://kayed-api.herokuapp.com/uploads/auctions/5a25747dcda9950014db1bc11512404093721.jpeg",
 *                               "http://kayed-api.herokuapp.com/uploads/auctions/5a25747dcda9950014db1bc11512404093722.jpeg",
 *                               "http://kayed-api.herokuapp.com/uploads/auctions/5a25747dcda9950014db1bc11512404093722.jpeg"
 *                           ],
 *                           "id": "5a25747dcda9950014db1bc1",
 *                           "inMyOffers": true,
 *                           "inMyFavourites": false
 *                       }
 *                   ],
 *                   "page": 6,
 *                   "pageCount": 7,
 *                   "limit": "2",
 *                   "totalCount": 14
 *               }
 */

        
        router.route("/passengers/:id/trips").post(TripController.findByPassenger)
        

        
        router.route("/passengers/:id").get(PassengerController.findById),
        router.route("/passengers/:id").put(PassengerController.update)
};