const mg = require("mailgun-js");
const nodemailer = require("nodemailer");

// Create a transporter using Mailjet's SMTP
const transporter = nodemailer.createTransport({
  service: "Mailjet",
  auth: {
    user: process.env.MAILJET_API_KEY,
    pass: process.env.MAILJET_SECRET_KEY,
  },
});

// Configuration of mailgun's SMTP
const mailgun = mg({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

const orderReceipttemplate = (newOrder) => {
  const getTotal = () => {
    return newOrder.products.reduce((currentValue, nextValue) => {
      return currentValue + nextValue.count * nextValue.price;
    }, 0);
  };

  // Conditionally create the discount row if discount exists
  const discountRow = newOrder.paymentIntent.discounted
    ? `<tr>
     <td colspan="2">Discount:</td>
     <td style="text-align: right;">-$${newOrder.paymentIntent.discounted}</td>
   </tr>`
    : "";

  return `<h1> Thanks for shopping with us </h1>
    <p> Hi ${newOrder.shippingto.Name}, </p>
    <p>We have finished processing your order.</p>
    <h2>[Order ID ${newOrder.OrderId}] (${newOrder.createdAt
    .toString()
    .substring(0, 10)})</h2>
    <table>
    <thead>
    <tr>
    <td><strong>Product</strong></td>
    <td style="text-align: center;"><strong>Quantity</strong></td>
    <td style="text-align: right;"><strong>Price</strong></td>
    </tr>
    </thead>

    <tbody>
    ${newOrder.products
      .map(
        (p) => `
      <tr>
      <td>${p.product.title}</td>
      <td style="text-align: center;">${p.count}</td>
      <td style="text-align: right;"> $${p.price}</td>
      </tr>
    `
      )
      .join("\n")}
      </tbody>

      <tfoot>
      <tr>
      <td colspan="2">Items Price:</td>
      <td style="text-align: right;"> $${getTotal()}</td>
      </tr>
      <tr>
      <td colspan="2">Tax Price:</td>
      <td style="text-align: right;"> $${"0"}</td>
      </tr>
      <tr>
      <td colspan="2">Shipping Charges:</td>
      <td style="text-align: right;"> $${newOrder.shippingfee}</td>
      </tr>
       ${discountRow}
      <tr>
      <td colspan="2"><strong>Total Price:</strong></td>
      <td style="text-align: right;"><strong> $${
        newOrder.paymentIntent.amount
      }</strong></td>
      </tr>
      <tr>
      <td colspan="2">Payment Method:</td>
      <td style="text-align: right;">${newOrder.paymentStatus}</td>
      </tr>
      </tfoot>
      </table>

      <h2>Shipping address</h2>
      <p>
      ${newOrder.shippingto.Name},<br/>
      ${newOrder.shippingto.Address},<br/>
      ${newOrder.shippingto.City},<br/>
      ${newOrder.shippingto.Province},<br/>
      ${newOrder.shippingto.Area}<br/>
      ${newOrder.shippingto.LandMark}<br/>
      </p>
      <hr/>
      <p>
      Thanks for shopping with us.
      </p>
    `;
};

module.exports = {
  transporter,
  mailgun,
  orderReceipttemplate,
};
