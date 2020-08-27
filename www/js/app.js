//#region APP

  //#region GENERAL
  var $$ = Dom7;

  var app = new Framework7({
    // App root element
    root: '#app',
    // App Name
    name: 'Gift Picker App',
    // App id
    id: 'be.odisee.loukaoctave.giftpickerapp',
    // Add default routes (see routes.js)
    routes: routes,
    view: {
      iosDynamicNavbar: false,
      xhrCache: false,
      router: true  
    },
    on: {
      init: function() {
        var f7 = this;
        if (f7.device.cordova) {
          // Init cordova APIs (see cordova-app.js)
          cApp.init(f7);
        }
      }
    }
  });
    
  var mainView = app.views.create('.view-main');

  /* Returns the userID that is currently stored.
  */
  function getCurrentUserId() {
    /* We need to fill in the currentUserID variable,
    otherwise on when app is launched (no ID in local or session storage),
    this value will be null and the database function in updateDateRangeDatesInCalendarEvents() will lack arguments and fail calendar creation.
    Calendar will not be able to update after login, because it hasn't been created properly.
    */
    let currentUserID = "no ID"; 
    if (sessionStorage.getItem("userID")) { currentUserID = sessionStorage.getItem("userID"); }
    else if (localStorage.getItem("userID")) { currentUserID = localStorage.getItem("userID"); }
    return currentUserID;
  }

  /* Converts a JS Date object to the following string format: "Weekday, DD Month YYYY"
  */
  function dateToCustomString(date, months, weekdays) {
    let splitDate = date.toString().split(' ', 4);
    let customString = "";
    weekdays.forEach(weekday => {
      if(weekday.slice(0, 3) == splitDate[0]){ customString += weekday + ", "; }
    })
    customString += splitDate[2] + " ";
    months.forEach(month => {
      if(month.slice(0, 3) == splitDate[1]){ customString += month + " "; }
    })
    customString += splitDate[3];
    return customString;
  }

  /* Converts a JS Date object to the following string format: "YYYY-MM-DD"
  */
  function dateToYYYYMMDD(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    if (month < 10) { month = "0" + month; }
    let day = date.getDate();
    return year + "-" + month + "-" + day;
  }

  //#endregion GENERAL

  //#region FIREBASE

  /* https://firebase.google.com/docs/web/setup#add-sdks-initialize */
  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCaLqpl-6HU0gn3i-q9NqodfVqmU_tOhk0",
    authDomain: "gift-picker-app-1b88e.firebaseapp.com",
    databaseURL: "https://gift-picker-app-1b88e.firebaseio.com",
    projectId: "gift-picker-app-1b88e",
    storageBucket: "gift-picker-app-1b88e.appspot.com",
    messagingSenderId: "941913951573",
    appId: "1:941913951573:web:3b124508711e0fb0aff3dc"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  // Initialize Firebase Services
  var storage = firebase.storage();
  const db = firebase.firestore();
  const auth = firebase.auth();
  
  //#endregion FIREBASE

  //#region HOME  

    //#region CALENDAR

    /* https://framework7.io/docs/calendar.html#examples */
    const monthNames = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August' , 'September' , 'October', 'November', 'December' ];
    var calendarInline = app.calendar.create({
      containerEl: '#demo-calendar-inline-container',
      value: [new Date()],
      weekHeader: true,
      events: [],
      renderToolbar: function () {
        return '<div class="toolbar calendar-custom-toolbar no-shadow">' +
          '<div class="toolbar-inner">' +
            '<div class="left">' +
              '<a href="#" class="link icon-only"><i class="icon icon-back ' + (app.theme === 'md' ? 'color-black' : '') + '"></i></a>' +
            '</div>' +
            '<div class="center"></div>' +
            '<div class="right">' +
              '<a href="#" class="link icon-only"><i class="icon icon-forward ' + (app.theme === 'md' ? 'color-black' : '') + '"></i></a>' +
            '</div>' +
          '</div>' +
        '</div>';
      },
      on: {
        init: function (c) {
          $$('.calendar-custom-toolbar .center').text(monthNames[c.currentMonth] +', ' + c.currentYear);
          $$('.calendar-custom-toolbar .left .link').on('click', function () {
            calendarInline.prevMonth();
          });
          $$('.calendar-custom-toolbar .right .link').on('click', function () {
            calendarInline.nextMonth();
          });
          // Execute custom function
          updateDateRangeDatesInCalendarEvents();
        },
        monthYearChangeStart: function (c) {
          $$('.calendar-custom-toolbar .center').text(monthNames[c.currentMonth] +', ' + c.currentYear);
        }
      }
    });

    /* Adds Firestore Events to the calendar.
      No parameters, no return value.
      Gets all Events from Firestore
        Iterates list of Events
          Converts necessary Event document data to a format that can populate the calendar.params.events (Date Range format)
        Updates calendar
    */
    function updateDateRangeDatesInCalendarEvents() {
      db.collection('Events').where('Creator', '==', getCurrentUserId()).where('Date', '==', true).get().then((snapshot) => {
        calendarInline.params.events = [];
        snapshot.docs.forEach(doc => {
          calendarInline.params.events.push(createDateRangeDate(doc.data().Date.toDate(), "#ff0000", doc.id));
        });
        // IMPORTANT: update calendar when Date Range array has been added to calendar.params.events
        calendarInline.update(); // (https://forum.framework7.io/t/dynamic-events-on-calendar/3679)
      })
    }

    /* Creates an object to populate a Date Range array
    Parameters:
        NAME    FORMAT    DESCRIPTION
      - date    Date()    Date of the event, already converted from firebase.firestore.Timestamp using the firebase.firestore.Timestamp.toDate() function.
      - color   string    Color (chosen by the user) for the event. Hexadecimal notation. Straight from the Firestore.
      - id      string    The ID for the Firestore document containing the event. This won't affect the calendar visually, but setting this property is needed for retrieving the correct information when clicking a date.
    Return:
      -         Object    Format information see: https://framework7.io/docs/calendar.html#date-range. I refer to this particular object as a Date Range Date.
    */
    function createDateRangeDate(date, color, id) {
      return {
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()), // date property as supported by Framework7's Date Range format.
        color: color,
        id: id,
      };
    }

    /* When the selected value on the calendar changes, data will be shown at the bottom of the page.
    */
    calendarInline.on('change', function() {
      updateDateInfoCard();
    })

    //#endregion CALENDAR
  
  /* Updates the information within the #date-info-card element.
  Both the card header and card content will be updated (emptied and then filled again).
  Card header displays a date in the following human-readable format: "Weekday, DD Month YYYY"
  Card content contains an unordered list of links with events title as text. Clicking a link opens /readUpdateEvent/ page for that event.
  */
  function updateDateInfoCard() {
    // Get the currently selected date from the calendar
    selectedDate = calendarInline.getValue()[0];
    // Fill the card header
    document.querySelector("#date-info-card .card-header").textContent = dateToCustomString(selectedDate, monthNames, weekdayNames);
    db.collection('Events').where('Creator', '==', getCurrentUserId()).where('Date', '==', firebase.firestore.Timestamp.fromDate(selectedDate)).get().then((snapshot) => {
      /*BUG [FIXED]: When selecting a date, async function firebase.firestore().get() is called.
      When switching rapidly between dates, the function won't finish executing before the next one is called, which can cause events of previously selected dates to appear in the card when they shoudln't.
      This is fixed by making sure the card gets emptied in this callback, right BEFORE it gets filled up again.
      The next line was previously located before the firebase.firestore().get(). The order of the instructions caused the bug.
      */
      $$("#date-info-card .card-content .links-list ul li").remove();
      // Fill the card content
      if(snapshot.docs.length == 0) {
        $$("#date-info-card .card-content .links-list ul").append("<li><p class='date-info-card-no-events'>No events found that day</p></li>");
      }
      else {
        snapshot.docs.forEach(doc => {
          var tlines = "";
          tlines += "<li><a class='date-info-card-link' href='/readUpdateEvent/' data-eventID='" + doc.id + "'>" + doc.data().Title + "</a></li>"
          $$("#date-info-card .card-content .links-list ul").append(tlines);
        });
      }
    })
  }  

  // List of full weekday names.
  const weekdayNames = [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ];

  // Functions to be executed at the start.
  updateDateInfoCard();

  /* Opens the readUpdateEvent page for the clicked event.
  Passes the event ID as an argument.
  */
  $$(document).on('click', 'a.date-info-card-link', function() {
    readEvent($$(this).attr("data-eventID"));
  })

  //#endregion HOME

  //#region SETTINGS

  //#endregion SETTINGS

  //#region EVENT

  // All the event type options available for event creation.
  const eventTypes = [{value:"birthday" , name:"Birthday"}, {value:"christmas" , name:"Christmas"}, {value:"newyear" , name:"New Year"}, {value:"chinesenewyear" , name:"Chinese New Year"}, {value:"valentinesday" , name:"Valentine's Day"}, {value:"mothersday" , name:"Mother's Day"}, {value:"fathersday" , name:"Father's Day"}, {value:"anniversary" , name:"Anniversary"}, {value:"hannukah" , name:"Hannukah"}, {value:"bartmitzvah" , name:"Bar/bat Mitzvah"}, {value:"wedding" , name:"Wedding"}, {value:"other" , name:"Other"}];

  const formCreateEventID = "#form-create-event";
  const formUpdateEventID = "#form-update-event";
  const formInputTitleClass = ".input-title";
  const formInputAllDayClass = ".input-all-day";
  const formInputDateClass = ".input-date";
  const formInputTimeClass = ".input-time";
  const formInputStartClass = ".input-start";
  const formInputEndClass = ".input-end";
  const formInputTypeClass = ".input-type";
  const formInputDescriptionClass = ".input-description";
  const formOutputMessageClass = ".output-message"

  /* Fills the select input with the available options
  */
  function fillSelectWithOptions(form) {
    eventTypes.forEach(type => {
      var tlines = "";
      tlines += "<option value='" + type.value + "' selected>" + type.name + "</option>" // (https://framework7.io/docs/smart-select.html#examples see default setup)
      $$(form + " " + formInputTypeClass).append(tlines);
    })
  }

  /* Updates the message below the form.
  If the new message is the same as the current one, then the text will be put in bold for 1 second.
  This is for users who spam the button to see that it does work and the action has (probably) been performed already. 
  */
  function updateFormMessage(form, newMessage) {
    let formMsgTextBox = document.querySelector(form + " " + formOutputMessageClass);
    if (newMessage == formMsgTextBox.textContent) {
      formMsgTextBox.style = "font-weight: bold;"
      setTimeout(function() { formMsgTextBox.removeAttribute('style'); }, 1000);
    }
    else { formMsgTextBox.textContent = newMessage }
    setTimeout(function() { formMsgTextBox.textContent = ""; }, 3000);
  }

  /* Checks if the form fields are empty.
  For all fields that are empty, there will be an error message. 
  If at least one field is empty, it will return false, otherwise it returns true.
  */
  function checkFormFields(form, title, allDay, date, start, end, type, description) { 
    let bool = true;
    let emptyFieldsAmount = 0;
    let message;
    let fieldsToCheck = [ title, date, type, description ];
    if (!allDay.checked) { fieldsToCheck.push(start, end); }
    fieldsToCheck.forEach(field => {
      if(field.value == "") {
        emptyFieldsAmount ++;
        message = "Please fill in a " + field.name + ".";
      }
    })
    if(emptyFieldsAmount > 0) { bool = false; }
    if(emptyFieldsAmount > 1) { message = "Multiple fields need to be filled in."; }
    updateFormMessage(form, message);
    return bool;
  }

  /* Will hide or show the time inputs depending on the state of the toggle.
  Accepts HTML ID attribute of the form (with the '#' prefix) as an argument.
  */
  function updateTimeInputVisibility(form) {
    if (document.querySelector(form + " " + formInputAllDayClass).checked) { document.querySelector(form + " " + formInputTimeClass).classList.add("display-none"); } // (https://framework7.io/docs/typography.html#element-display see display-none)
    else { document.querySelector(form + " " + formInputTimeClass).classList.remove("display-none"); }
  }

  /* Resets the create form.
  */
  function formCreateEventEraseData() {
    document.querySelector(formCreateEventID).reset();
    updateTimeInputVisibility(formCreateEventID);
    document.querySelector(formCreateEventID + " " + formInputTypeClass).item(0).selected = 'selected';
    updateFormMessage(formCreateEventID, "Fields emptied ");
  }

  $$(document).on('page:init', '.page[data-name="createEvent"]', function (e) { // (https://framework7.io/docs/page.html#page-events see page:init)
    
    /* The user can decide if the event to be created should be for a whole day, or for a specific time of the day (start and end time)
    Whenever the createEvent page is initialised, an eventListener will be placed on the "All-day" toggle.
    Whenever the toggle is clicked, it will check whether it is checked or not.
    Based on the status of the toggle, the time inputs will be hidden or shown.
    */
   document.querySelector(formCreateEventID + " " + formInputAllDayClass).addEventListener("click", function() {
      updateTimeInputVisibility(formCreateEventID);
    });
    fillSelectWithOptions(formCreateEventID);
    document.querySelector(formCreateEventID + " " + formInputTypeClass).item(0).selected = 'selected'; // Auto select the first option (https://stackoverflow.com/a/10911660)
  });

  /* Feeds all the input elements to the necessary functions to create an event.
  Event will only be created if the fields pass the check.
  Activates when the "Create Event" button is clicked.
  */
  $$(document).on('click', '#button-create-event', function() {
    let title = document.querySelector(formCreateEventID + " " + formInputTitleClass);
    let allDay = document.querySelector(formCreateEventID + " " + formInputAllDayClass);
    let date = document.querySelector(formCreateEventID + " " + formInputDateClass);
    let start = document.querySelector(formCreateEventID + " " + formInputStartClass);
    let end = document.querySelector(formCreateEventID + " " + formInputEndClass);
    let type = document.querySelector(formCreateEventID + " " + formInputTypeClass);
    let description = document.querySelector(formCreateEventID + " " + formInputDescriptionClass);

    if (checkFormFields(formCreateEventID, title, allDay, date, start, end, type, description)){ createEvent(title, allDay, date, start, end, type, description); };
  });

  /* Adds an event to the Cloud Firestore.
  If event is added succesfully, form will be emptied and reset.
  Function based on: https://firebase.google.com/docs/firestore/manage-data/add-data?authuser=0#add_a_document
  */
  function createEvent(title, allDay, date, start, end, type, description) {
    db.collection("Events").add({
      Creator: getCurrentUserId(),
      Title: title.value,
      AllDay: allDay.checked,
      Date: firebase.firestore.Timestamp.fromDate(new Date(date.value + "T00:00:00")),
      Start: start.value,
      End: end.value,
      Type: type.value,
      Description: description.value,
    })
    .then(function() {
      formCreateEventEraseData();
      updateFormMessage(formCreateEventID, "Event successfully created!");
    })
    .catch(function(error) {
      updateFormMessage(formCreateEventID, "Error creating event: " + error);
    });
  }

  /* Updates the event in the Cloud Firestore.
  On success it will make the /readUpdateEvent/ page go back into read mode (with the info being updated).
    */
  function updateEvent(eventID, title, allDay, date, start, end, type, description) {
    db.collection('Events').doc(eventID).update({
      Title: title.value,
      AllDay: allDay.checked,
      Date: firebase.firestore.Timestamp.fromDate(new Date(date.value + "T00:00:00")),
      Start: start.value,
      End: end.value,
      Type: type.value,
      Description: description.value,
    })
    .then(function() {
      showLoadingIcon();
      readEvent(eventID);
      updateFormMessage(formUpdateEventID, "Event successfully updated!");
    })
    .catch(function(error) {
      updateFormMessage(formUpdateEventID, "Error updating event: " + error);
    });
  }


  /* Resets the form.
  Activates when the "Erase Data" button is clicked.
  */
  $$(document).on('click', '#button-clear-form', function() {
    formCreateEventEraseData();
  });

  /* Converts a firebase.firestore.Timestamp object to a Date object.
  https://www.youtube.com/watch?v=_3BtbFr-2X8
  */
  function convertTimestampToDate(timestamp) {
    return new Date(timestamp.seconds * 1000);
  }

  $$(document).on('page:init', '.page[data-name="readUpdateEvent"]', function (e) {
   document.querySelector(formUpdateEventID + " " + formInputAllDayClass).addEventListener("click", function() {
      updateTimeInputVisibility(formUpdateEventID);
    });
    showLoadingIcon();
    fillSelectWithOptions(formUpdateEventID);
  });

  /* Fills the read UI of the /readUpdateEvent/ page with the event data.
  Then: Shows only the read UI and hides the update UI.
  */
  function readEvent(eventID) {
    db.collection('Events').doc(eventID).get().then( function(doc) {
      $$("#button-update-event").attr("data-eventID",(doc.id));
      $$("#button-delete-event").attr("data-eventID",(doc.id));
      $$("#read-event-title").html(doc.data().Title);
      $$("#read-event-date").html(convertTimestampToDate(doc.data().Date).toLocaleDateString()); // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString)
      if(doc.data().AllDay) { document.getElementById("read-event-time").classList.add("display-none"); } // Doesn't display start and end time if they don't exist.
      else {
        $$("#read-event-start").html(doc.data().Start);
        $$("#read-event-end").html(doc.data().End);
      }
      eventTypes.forEach(type => { // Searches the eventTypes to display the type name and not the type value.
        if(type.value == doc.data().Type) { $$("#read-event-type").html(type.name); }
      })
      $$("#read-event-description").html(doc.data().Description);
    }).then( function() {
      loadReadOrUpdateMode("read");
    })
  }

  /* Fills the update UI of the /readUpdateEvent/ page with the event data.
  Then: Shows only the update UI and hides the read UI.
  */
  function openUpdateEvent(eventID) {
    db.collection('Events').doc(eventID).get().then( function(doc) {
      $$("#button-confirm-update-event").attr("data-eventID",(doc.id));
      $$(formUpdateEventID + " " + formInputTitleClass).attr("value", doc.data().Title);
      $$(formUpdateEventID + " " + formInputAllDayClass).attr("checked", doc.data().AllDay);
      $$(formUpdateEventID + " " + formInputDateClass).attr("value", dateToYYYYMMDD(convertTimestampToDate(doc.data().Date)));
      if (!doc.data().AllDay) {
        $$(formUpdateEventID + " " + formInputStartClass).attr("value", doc.data().Start);
        $$(formUpdateEventID + " " + formInputEndClass).attr("value", doc.data().End);
      }
      document.querySelector(formUpdateEventID + " " + formInputTypeClass).item(eventTypes.findIndex(t => t.value == doc.data().Type)).selected = 'selected';
      $$(formUpdateEventID + " " + formInputDescriptionClass).attr("value", doc.data().Description);
    }).then( function() {
      loadReadOrUpdateMode("update");
    })
  }

  /*Gets everything off the screen to show the loading animation
  */
  function showLoadingIcon() {
    document.querySelector(".loading-gif").classList.remove("display-none");
    document.getElementById("read-event-UI").classList.add("display-none");
    document.getElementById("update-event-UI").classList.add("display-none");
  }

  function loadReadOrUpdateMode(mode) {
    if (mode == "read") {
      document.querySelector(".loading-gif").classList.add("display-none");
      document.getElementById("read-event-UI").classList.remove("display-none");
      document.getElementById("update-event-UI").classList.add("display-none");
    }
    else if (mode == "update") {
      document.querySelector(".loading-gif").classList.add("display-none");
      document.getElementById("update-event-UI").classList.remove("display-none");
      document.getElementById("read-event-UI").classList.add("display-none");
      updateTimeInputVisibility(formUpdateEventID);
    }
  }

  /* Changes the readUpdateEvent page to update mode.
  */
  $$(document).on('click', '#button-update-event', function() {
    showLoadingIcon();
    openUpdateEvent($$(this).attr("data-eventID"));
  })

  /* Deletes the currently consulted event.
  Passes the event ID as an argument.
  */
  $$(document).on('click', '#button-delete-event', function() { deleteEvent($$(this).attr("data-eventID")); })

  /* Updates the event in the Firestore.
  Only updates the event if the fields pass the check.
  Passes the event ID as an argument.
  */
 $$(document).on('click', '#button-confirm-update-event', function() {
  let title = document.querySelector(formUpdateEventID + " " + formInputTitleClass);
  let allDay = document.querySelector(formUpdateEventID + " " + formInputAllDayClass);
  let date = document.querySelector(formUpdateEventID + " " + formInputDateClass);
  let start = document.querySelector(formUpdateEventID + " " + formInputStartClass);
  let end = document.querySelector(formUpdateEventID + " " + formInputEndClass);
  let type = document.querySelector(formUpdateEventID + " " + formInputTypeClass);
  let description = document.querySelector(formUpdateEventID + " " + formInputDescriptionClass);
  if (checkFormFields(formUpdateEventID, title, allDay, date, start, end, type, description)) { updateEvent($$(this).attr("data-eventID"), title, allDay, date, start, end, type, description); };
  })

  /* Changes the readUpdateEvent page back to read mode for the currently consulted event.
    */
  $$(document).on('click', '#button-cancel-update-event', function() { 
    showLoadingIcon();
    loadReadOrUpdateMode("read");
  })

//#endregion EVENT

//#endregion APP

/*********
***TODO***
*********/

/* General */

/* Home */
// TODO: Filtering/sorting events
// TODO: Different views (calendar/schedule)

/* Create event */
// TODO: Close event type selector on select (if possible, suggestions: look for existing method or use eventListener to create one from scratch)
// TODO: Allow events to recur yearly. (keep year in form, will be used as first occurence; add recurence boolean into firebase) !!!(when filling up calendar look for the recurrence bool first then add up to 5 years in the future for those events, others use their standard date year)

/* Update event */
// TODO: Fix toggle. Checked status is set when openUpdateEvent() is called, but visually it doesn't correspond. Dangerous: maybe when updating event it can cause problems.

/* Settings */
// TODO: Add possibility to change password
// TODO: Add possibility to change GUI color
// TODO: Add dark mode toggle
// TODO: Add weekday toggle

// ...
