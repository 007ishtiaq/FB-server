const Contact = require("../models/contact");

exports.submitContact = async (req, res) => {
  try {
    const { contactForm, image } = req.body.contactdata;
    res.json(
      await new Contact({
        fullname: contactForm.fullname,
        subject: contactForm.subject,
        email: contactForm.email,
        text: contactForm.text,
        image,
      }).save()
    );
  } catch (err) {
    // console.log(err);
    res.status(400).send("Conatct Submittion failed");
  }
};

exports.list = async (req, res) =>
  res.json(await Contact.find({}).sort({ createdAt: 1 }).exec());

exports.readform = async (req, res) => {
  try {
    const contactForm = await Contact.findById(req.params.id).exec();

    if (!contactForm) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(contactForm);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error contact forms" });
  }
};

exports.setReplied = async (req, res) => {
  const { formId } = req.body;
  try {
    // Find the form by OrderId
    const form = await Contact.findById(formId);

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Contact Form not found" });
    }

    if (!form.isReplied) {
      form.isReplied = true;
    } else {
      form.isReplied = false;
    }
    // Save the updated form
    await form.save();
    // Return the updated order to the frontend
    res.json({ success: true, isReplied: form.isReplied });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
