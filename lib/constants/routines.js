export const WEEKLY_ROUTINES = {
  Monday: [
    { title: "Opening the office", targetDuration: 5, priority: "Low" },
    { title: "Open the blinds", targetDuration: 5, priority: "Low" },
    { title: "Open the window", targetDuration: 5, priority: "Low" },
    { title: "Flip sign to open", targetDuration: 2, priority: "Low" },

    { title: "10am", targetDuration: 5, priority: "Medium" },
    { title: "Check emails and reply to any new emails from last night and this morning", targetDuration: 30, priority: "High" },
    { title: "Open up google chats and keep it open all day", targetDuration: 2, priority: "Medium" },
    { title: "Check homeless support emails", targetDuration: 15, priority: "Medium" },
    { title: "Check office mobile/ landline returns any missed calls and reply to messages and whatsapp.", targetDuration: 20, priority: "High" },
    { title: "Send vacancies for all voids via email", targetDuration: 15, priority: "Medium" },
    { title: "Ask emergency for a hand over from the weekend and to come into the office today to hand in all paperwork from the week before", targetDuration: 10, priority: "Medium" },
    { title: "Check team up and add anything extra to the white board for the week", targetDuration: 10, priority: "Low" },
    { title: "- Check with shaila what service charges have been paid and update CRM and google drive log", targetDuration: 20, priority: "Medium" },
    { title: "check nest and ensure all property heating and hot water is on and working", targetDuration: 15, priority: "High" },
    { title: "- Check if fixiit has had any new reported issues - Add to CRM", targetDuration: 15, priority: "Medium" },
    { title: "If any repairs are for the landlord and management agencies send an email to report the repair and book a tradesman with them.", targetDuration: 20, priority: "High" },
    { title: "Check emails every 15 minutes", targetDuration: 480, priority: "Medium" },

    { title: "10.30-11am", targetDuration: 5, priority: "Medium" },
    { title: "Ask Amaani if all claims are active for housing benefit if not call housing benefit", targetDuration: 30, priority: "High" },
    { title: "receive photos from support workers regarding fire risk (bins, boiler, repairs, house photos, etc)", targetDuration: 30, priority: "High" },
    { title: "If any repairs needed urgently call-in the contractor and send Burton to property if no staff onsite.", targetDuration: 15, priority: "Urgent" },
    { title: "View ring cameras and play back is working on all cameras", targetDuration: 15, priority: "Medium" },
    { title: "check all if HIK cameras and make sure all working and play back visible", targetDuration: 15, priority: "Medium" },

    { title: "12pm onwards", targetDuration: 5, priority: "Medium" },
    { title: "Check emails throughout the day, do not close the outlook app, make sure emails are replied to straight away.", targetDuration: 300, priority: "High" },
    { title: "12:30-13:30 staff lunches", targetDuration: 60, priority: "Low" },
    { title: "Update board vacancies, check if anything new needs to be added from team up.", targetDuration: 15, priority: "Medium" },
    { title: "Check council tax online check there are no notices or missed payments", targetDuration: 20, priority: "Medium" },
    { title: "Check support notes have been merged from support worker make a copy of this document and save to combined google drive folder", targetDuration: 20, priority: "Medium" },

    { title: "3pm onwards", targetDuration: 5, priority: "Medium" },
    { title: "check all UC photos have been uploaded to support folders for all tenants for today", targetDuration: 30, priority: "High" },
    { title: "Check in with Shaila 4pm talk about any problems that may have come about", targetDuration: 15, priority: "Medium" },
    { title: "Check support notes have been merged from support worker make a copy of this document and save to combined google drive folder ", targetDuration: 20, priority: "Medium" },

    { title: "4pm onwards", targetDuration: 5, priority: "Medium" },
    { title: "Check support notes have been merged from support worker make a copy of this document and save to combined google drive folder", targetDuration: 20, priority: "Medium" },
    { title: "clean office desks with Dettol wipes, empty bins and declutter empty shredder, vacuum floor, file away all paperwork and take out rubbish.", targetDuration: 30, priority: "Low" },
    { title: "Check all emails and reply to any before leaving", targetDuration: 20, priority: "High" },
    { title: "Check google chats and reply to all messages", targetDuration: 15, priority: "Medium" },
    { title: "Check team up and update white board if anything new has been added", targetDuration: 10, priority: "Low" },
    { title: "Check nest and make sure all heating is working correctly", targetDuration: 10, priority: "Medium" },
    { title: "Check Hik and ring and make sure all cameras are working", targetDuration: 10, priority: "Medium" },
    { title: "Hand over to emergency anything they need to know", targetDuration: 10, priority: "High" },

    { title: "Closing down the office:", targetDuration: 5, priority: "Medium" },
    { title: "Flip sign to closed", targetDuration: 2, priority: "Low" },
    { title: "Lock front door and close window", targetDuration: 5, priority: "High" },
    { title: "Close blinds", targetDuration: 5, priority: "Low" },
    { title: "Put all paperwork and laptops away", targetDuration: 10, priority: "Medium" },
    { title: "Set alarm", targetDuration: 2, priority: "High" },
    { title: "Lock front door ", targetDuration: 2, priority: "High" }
  ],
  Tuesday: [
    { title: "Follow up with all jobs currently in progress", targetDuration: 120, priority: "High" },
    { title: "check emails every minute", targetDuration: 480, priority: "Medium" },
    { title: "Lunch", targetDuration: 60, priority: "Low" }
  ],
  Wednesday: [
    { title: "Call all lead clients (not currently in progress jobs)", targetDuration: 180, priority: "High" },
    { title: "check emails every minute", targetDuration: 480, priority: "Medium" },
    { title: "Lunch", targetDuration: 60, priority: "Low" }
  ],
  Thursday: [
    { title: "Fiixit / CRM", targetDuration: 60, priority: "High" },
    { title: "Monday.com / CRM", targetDuration: 60, priority: "High" },
    { title: "check emails every minute", targetDuration: 480, priority: "Medium" },
    { title: "Lunch", targetDuration: 60, priority: "Low" }
  ],
  Friday: [
    { title: "Fiixit / CRM", targetDuration: 60, priority: "High" },
    { title: "Monday.com / CRM", targetDuration: 60, priority: "High" },
    { title: "Postage", targetDuration: 30, priority: "Medium" },
    { title: "check emails every minute", targetDuration: 480, priority: "Medium" },
    { title: "Lunch", targetDuration: 60, priority: "Low" }
  ]
};

export const ROUTINE_TITLES = Array.from(new Set(
  Object.values(WEEKLY_ROUTINES).flatMap(day => day.map(r => r.title))
));
