const ical = require("ical-generator");
function getIcalObjectInstance(
  starttime,
  endtime,
  summary,
  description,
  location
) {
  console.log(new Date(starttime).toDateString());
  const cal = ical({
    domain: "glance.live.com",
    name: "My test calendar event",
  });
  cal.createEvent({
    start: starttime, // eg : moment()
    end: endtime, // eg : moment(1,'days')
    summary: summary, // 'Summary of your event'
    description: description, // 'More description'
    location: location, // 'Delhi'
    url: "https://discord.gg/Bn38eK9yUD", // 'event url'
    organizer: {
      // 'organizer details'
      name: "Glance live",
      email: "glance.live.game@gmail.com",
    },
  });
  return cal;
}

module.exports = {
  getIcalObjectInstance,
};
