const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholderKey";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_placeholderSecret";
  return new Razorpay({ key_id, key_secret });
};

module.exports.renderBookingForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  const razorpayKey = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholderKey";
  res.render("bookings/new", { listing, razorpayKey });
};

module.exports.createOrder = async (req, res) => {
  const { listingId, name, mobile, email, startDate, endDate } = req.body;

  try {
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    const basePrice = (listing.price || 0) * nights;
    const taxes = Math.round(basePrice * 0.05);
    const totalAmount = basePrice + taxes;

    let razorpayOrderId = `order_${Date.now()}`;
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    // Use Razorpay SDK if valid credentials are provided
    if (key_id && key_secret && !key_id.includes("placeholder")) {
      const razorpay = getRazorpayInstance();
      const options = {
        amount: totalAmount * 100, // paise
        currency: "INR",
        receipt: `rcpt_${Date.now()}`.slice(0, 40),
        notes: {
          listingId: listing._id.toString(),
          userId: req.user._id.toString(),
        }
      };
      const order = await razorpay.orders.create(options);
      razorpayOrderId = order.id;
    }

    // Persist pending booking
    const booking = new Booking({
      listing: listingId,
      user: req.user._id,
      name,
      mobile,
      email,
      startDate: start,
      endDate: end,
      totalPrice: totalAmount,
      paymentStatus: "pending",
      razorpayOrderId
    });

    await booking.save();

    res.json({
      success: true,
      orderId: razorpayOrderId,
      amount: totalAmount * 100,
      currency: "INR",
      key: key_id || "rzp_test_placeholderKey",
      bookingId: booking._id,
      listingTitle: listing.title,
      totalPrice: totalAmount,
      isTestSimulated: !Boolean(key_id && key_secret && !key_id.includes("placeholder"))
    });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ success: false, message: "Could not create payment order" });
  }
};

module.exports.verifyPayment = async (req, res) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature, simulated } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (simulated || !key_secret || key_secret.includes("placeholder")) {
      // Test mode / demo simulation confirmation
      booking.paymentStatus = "paid";
      booking.razorpayPaymentId = razorpay_payment_id || `pay_sim_${Date.now()}`;
      booking.razorpaySignature = razorpay_signature || "simulated_test_sig";
      await booking.save();

      req.flash("success", "Payment successful! Your stay is booked 🎉");
      return res.json({ success: true, redirectUrl: `/bookings` });
    }

    // Cryptographic signature verification using HMAC SHA-256
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      booking.paymentStatus = "paid";
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.razorpaySignature = razorpay_signature;
      await booking.save();

      req.flash("success", "Payment verified and stay booked 🎉");
      return res.json({ success: true, redirectUrl: `/bookings` });
    } else {
      booking.paymentStatus = "failed";
      await booking.save();
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (err) {
    console.error("Payment Verification Error:", err);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

module.exports.createBooking = async (req, res) => {
  const { listingId, name, mobile, email, startDate, endDate } = req.body;

  try {
    const listing = await Listing.findById(listingId);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    const base = listing ? listing.price * nights : 0;
    const totalPrice = base + Math.round(base * 0.05);

    const booking = new Booking({
      listing: listingId,
      user: req.user._id,
      name,
      mobile,
      email,
      startDate: start,
      endDate: end,
      totalPrice,
      paymentStatus: "paid"
    });

    await booking.save();
    req.flash("success", "Booking confirmed!");
    res.redirect(`/bookings`);
  } catch (err) {
    console.log(err);
    req.flash("error", "Something went wrong with booking.");
    res.redirect(`/listings/${listingId}`);
  }
};

module.exports.index = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate("listing")
    .sort({ createdAt: -1 });
  res.render("bookings/index.ejs", { bookings });
};
