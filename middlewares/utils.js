const mg = require("mailgun-js");

const mailgun = mg({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

const orderReceipttemplate = (newOrder, user) => {
  return `<h1> Thanks for shopping with us </h1>
    <p> Hi ${user.name}, </p>
    <p>We have finished processing your order.</p>
    <h2>[Order ID ${newOrder.OrderId}] (${newOrder.createdAt
    .toString()
    .substring(0, 10)})</h2>
    <table>
    <thead>
    <tr>
    <td><strong>Product</strong></td>
    <td><strong>Quantity</strong></td>
    <td><strong align="right">Price</strong></td>
    </tr>
    </thead>

    <tbody>
    ${newOrder.products
      .map(
        (p) => `
      <tr>
      <td>${p.product.title}</td>
      <td align="center">${p.count}</td>
      <td align="right"> $${p.price}</td>
      </tr>
    `
      )
      .join("\n")}
      </tbody>

      <tfoot>
      <tr>
      <td colspan="2">Items Price:</td>
      <td align="right"> $${"Items Price 000"}</td>
      </tr>
      <tr>
      <td colspan="2">Tax Price:</td>
      <td align="right"> $${"Tax price 000"}</td>
      </tr>
      <tr>
      <td colspan="2">Shipping Price:</td>
      <td align="right"> $${"Shipping price 000"}</td>
      </tr>
      <tr>
      <td colspan="2"><strong>Total Price:</strong></td>
      <td align="right"><strong> $${"Total price 000"}</strong></td>
      </tr>
      <tr>
      <td colspan="2">Payment Method:</td>
      <td align="right">${newOrder.paymentStatus}</td>
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

module.exports = { mailgun, orderReceipttemplate };
