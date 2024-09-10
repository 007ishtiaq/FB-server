const mg = require("mailgun-js");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

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
     <td style="text-align: right;">-$(${newOrder.paymentIntent.discounted})</td>
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
      <td colspan="2">Sub Total:</td>
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
       <p>For further details <strong>"Detailed PDF Invoice"</strong> attached.</p>
      <hr/>
      <p>
      Thanks for shopping with us.
      </p>
    `;
};

// Function to generate PDF
const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const pdfPath = path.join(__dirname, "invoice.pdf");
    const writeStream = fs.createWriteStream(pdfPath);

    doc.pipe(writeStream);

    // Header
    doc
      .fontSize(9)
      .fillColor("grey")
      .text(`Print Date: ${new Date().toLocaleString()}`, {
        align: "right",
      });
    doc.moveDown();

    // Add logo
    const logoPath = path.join(__dirname, "invoiceLogo.png");
    doc.image(logoPath, { fit: [200, 40] });
    doc.moveDown(3.5);

    // Company Information
    doc
      .fontSize(10)
      .fillColor("#3a4553")
      .text("Phone: 0300-1234567", 82, doc.y);
    doc.moveDown(0.3);
    doc.text("Email: Billing@Pearlytouch.com", 82, doc.y);
    doc.moveDown(2);

    // Customer Info
    // Set background color
    doc.fillColor("white").rect(50, doc.y, 200, 18).fill("#787878"); // Background color
    // Change text color and write the text
    doc
      .fillColor("white") // Set the text color
      .fontSize(11)
      .text("Bill To", 55, doc.y + 5);
    doc.moveDown();

    doc
      .fontSize(10)
      .fillColor("#3a4553")
      .text(`Name: ${order?.shippingto?.Name}`);
    doc.moveDown(0.3);
    doc.text(`Contact: ${order?.shippingto?.Contact}`);
    doc.moveDown(0.3);
    doc.text(`Email: ${order?.email}`);
    doc.moveDown(0.3);
    doc.text(
      `Address: ${order?.shippingto?.Address}, ${order?.shippingto?.Province}, ${order?.shippingto?.Area}, ${order?.shippingto?.LandMark}, ${order?.shippingto?.City}`
    );
    doc.moveDown(2);

    // Table Header
    doc
      .fillColor("white")
      .fontSize(11)
      .rect(50, doc.y, 515, 20)
      .fill("#787878");
    // Set text color to white and properly align each header column
    doc
      .fillColor("white")
      .text("Description", 55, doc.y + 5, { width: 100, align: "left" }) // Adjust x-coordinate for Description
      .text("Quantity", 350, doc.y - 13, { width: 50, align: "center" }) // Adjust x-coordinate for Quantity
      .text("Price", 425, doc.y - 12, { width: 50, align: "center" }) // Adjust x-coordinate for Price
      .text("Amount", 500, doc.y - 13, { width: 50, align: "center" }); // Adjust x-coordinate for Amount
    doc.moveDown(1);

    // Table Rows (Products)
    doc.fontSize(10).fillColor("#3a4553");
    order.products.forEach((item) => {
      doc.text(
        `[Article: ${item.product.art}] ${item.product.title} - Color: ${item.color}`,
        55,
        doc.y,
        // { continued: true, width: 350 }
        { width: 325, align: "left" }
      );
      doc.text(item.count.toString(), 325, doc.y - 11, {
        width: 100,
        align: "center",
      });
      doc.text(`${item.price}`, 400, doc.y - 12, {
        width: 100,
        align: "center",
      });
      doc.text(`${item.price * item.count}`, 475, doc.y - 12, {
        width: 100,
        align: "center",
      });
      doc.moveDown(0.7);
    });

    // Discount (if available)
    if (order?.paymentIntent?.dispercent != null) {
      const discountText =
        order.paymentIntent.discountType === "Discount"
          ? `${order.paymentIntent.dispercent}%`
          : order.paymentIntent.discountType === "Cash"
          ? `Rs. ${order.paymentIntent.dispercent}`
          : "Shipping discount";

      doc
        .fontSize(10)
        .fillColor("#3a4553")
        .text(`Discount (${discountText} off coupon used): `, 55, doc.y, {
          width: 325,
          align: "left",
        });
      doc.text(`-(${order.paymentIntent.discounted})`, 477, doc.y - 11, {
        width: 100,
        align: "center",
      });

      doc.moveDown(0.7);
    }

    // Shipping Charges
    doc.fontSize(10).fillColor("#3a4553").text("Shipping Charges:", 55, doc.y, {
      width: 325,
      align: "left",
    });
    doc.text(`${order?.shippingfee}`, 475, doc.y - 11, {
      width: 100,
      align: "center",
    });

    doc.moveDown(0.7);

    // Total Amount
    doc
      .fontSize(11)
      .fillColor("white")
      .rect(50, doc.y, 515, 20)
      .fill("#787878");

    doc
      .fillColor("white")
      .text("Total Amount:", 55, doc.y + 5, { continued: true, width: 495 });
    doc.text(`$ ${order?.paymentIntent?.amount}.00`, { align: "right" });

    doc.moveDown(3);

    // Order Information
    // Set background color
    doc.fillColor("white").rect(50, doc.y, 200, 18).fill("#787878"); // Background color
    // Change text color and write the text
    doc
      .fillColor("white") // Set the text color
      .fontSize(11)
      .text("Order Information", 55, doc.y + 5);
    doc.moveDown();

    doc.fontSize(10).fillColor("#3a4553").text(`Order ID: ${order?.OrderId}`);
    doc.moveDown(0.3);
    doc.text(`Placed On: ${new Date(order?.createdAt).toLocaleString()}`);
    doc.moveDown(0.3);
    doc.text(`Order Status: ${order?.orderStatus}`);
    doc.moveDown(0.3);
    doc.text(`Mode of Payment: ${order?.paymentStatus}`);
    doc.moveDown(0.3);
    doc.text(`Payment Status: ${order?.isPaid ? "Paid" : "Unpaid"}`);
    doc.moveDown(3);

    // Footer
    doc
      .fontSize(10)
      .fillColor("#616161")
      .text("Thank you for shopping with us", { align: "center" });

    // Finalize PDF file
    doc.end();

    writeStream.on("finish", () => {
      resolve(pdfPath);
    });

    writeStream.on("error", (err) => {
      reject(err);
    });
  });
};

module.exports = {
  transporter,
  mailgun,
  orderReceipttemplate,
  generateInvoicePDF,
};
