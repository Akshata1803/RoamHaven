const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");

router.get("/", isLoggedIn, wrapAsync(bookingController.index));

router.get("/:id/book", isLoggedIn, wrapAsync(bookingController.renderBookingForm));

router.post("/", isLoggedIn, wrapAsync(bookingController.createBooking));

router.post("/create-order", isLoggedIn, wrapAsync(bookingController.createOrder));

router.post("/verify-payment", isLoggedIn, wrapAsync(bookingController.verifyPayment));

module.exports = router;
