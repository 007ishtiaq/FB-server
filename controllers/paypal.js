const axios = require("axios");

// Function to get PayPal access token
const getAccessToken = async () => {
  try {
    const response = await axios.post(
      `${process.env.PAYPAL_API}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        auth: {
          username: process.env.PAYPAL_CLIENT_ID,
          password: process.env.PAYPAL_SECRET,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error getting PayPal access token:",
      error.response?.data || error
    );
    throw new Error("Failed to get PayPal access token");
  }
};

// Create a PayPal order
exports.CreatePaypalorder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const accessToken = await getAccessToken();

    const orderResponse = await axios.post(
      `${process.env.PAYPAL_API}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount,
            },
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.json(orderResponse.data);
  } catch (error) {
    console.error(
      "Error creating PayPal order:",
      error.response?.data || error
    );
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
};

// // Capture a PayPal payment
exports.CapturePaypalPayment = async (req, res) => {
  try {
    const { orderID } = req.body; // Order ID should be sent from frontend
    const accessToken = await getAccessToken();

    const captureResponse = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.json(captureResponse.data);
  } catch (error) {
    console.error("Error capturing PayPal payment:", error);
    res.status(500).json({ error: "Failed to capture PayPal payment" });
  }
};
