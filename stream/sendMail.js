var nodemailer = require("nodemailer");
var smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "glance.live.game@gmail.com",
    pass: "ziylgxcrsxxhigct",
  },
});
async function sendemail(sendto, subject, htmlbody, calendarObj) {
  mailOptions = {
    to: sendto,
    subject: subject,
    html: htmlbody,
  };
  if (calendarObj) {
    let alternatives = {
      "Content-Type": "text/calendar",
      method: "REQUEST",
      content: new Buffer(calendarObj.toString()),
      component: "VEVENT",
      "Content-Class": "urn:content-classes:calendarmessage",
    };
    mailOptions["alternatives"] = alternatives;
    mailOptions["alternatives"]["contentType"] = "text/calendar";
    mailOptions["alternatives"]["content"] = new Buffer(calendarObj.toString());
  }
  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log("Message sent: ", response);
    }
  });
}
module.exports = {
  sendemail,
};
