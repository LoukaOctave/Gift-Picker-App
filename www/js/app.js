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
  
  // WHAT IS THIS FOR?
  // let authWorkerApp = firebase.initializeApp(firebase.app().options, 'auth-worker');
  // let authWorkerAuth = firebase.auth(authWorkerApp);
  // authWorkerAuth.setPersistence(firebase.auth.Auth.Persistence.NONE); // disables caching of account credentials

  //#endregion FIREBASE

  //#region HOME

    //#region CALENDAR

/* https://framework7.io/docs/calendar.html#examples */
var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August' , 'September' , 'October', 'November', 'December'];
var calendarInline = app.calendar.create({
  containerEl: '#demo-calendar-inline-container',
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
      addDateRangeDatesToCalendarEvents();
    },
    monthYearChangeStart: function (c) {
      $$('.calendar-custom-toolbar .center').text(monthNames[c.currentMonth] +', ' + c.currentYear);
    } 
  }
});

/* Adds all Firestore events to the calendar
  No parameters, no return

  Gets all Events from Firestore
    Iterates list of Events
      Converts necessary Event document data to a format that can populate the calendar.params.events (Date Range format)
    Updates calendar
*/
function addDateRangeDatesToCalendarEvents() {
  // TODO: limit Events to ones owned by logged in user
  db.collection('Events').get().then((snapshot) => {
    snapshot.docs.forEach(doc => {
      calendarInline.params.events.push(createDateRangeDate(doc.data().Date.toDate(), "#00ff00", doc.id));
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

    //#endregion CALENDAR

  //#endregion HOME

  //#region CREATE/UPDATE-EVENT

  // All the event type options available for event creation.
  var eventTypeOptions = [{value:"birthday" , name:"Birthday"}, {value:"christmas" , name:"Christmas"}, {value:"newyear" , name:"New Year"}, {value:"chinesenewyear" , name:"Chinese New Year"}, {value:"valentinesday" , name:"Valentine's Day"}, {value:"mothersday" , name:"Mother's Day"}, {value:"fathersday" , name:"Father's Day"}, {value:"anniversary" , name:"Anniversary"}, {value:"hannukah" , name:"Hannukah"}, {value:"bartmitzvah" , name:"Bar/bat Mitzvah"}, {value:"wedding" , name:"Wedding"}, {value:"other" , name:"Other"}];

  /* Fills the select input with the available options
  */
  function fillSelectWithOptions() {
    eventTypeOptions.forEach(option => {
      var tlines = "";
      tlines += "<option value='" + option.value + "' selected>" + option.name + "</option>" // (https://framework7.io/docs/smart-select.html#examples see default setup)
      $$("#input-type").append(tlines);
    })
    document.getElementById("input-type").item(0).selected = 'selected'; // Auto select the first option (https://stackoverflow.com/a/10911660)
  }

  /* Checks if the form fields are empty.
  For all fields that are empty, there will be an error message. 
  If at least one field is empty, it will return false, otherwise it returns true.
  */
  function checkFormFields(title, allDay, date, start, end, type, description) {
    let bool = true;
    let fieldsToCheck = [title, date, type, description];
    if(!allDay.checked) { fieldsToCheck.push(start, end); }
    fieldsToCheck.forEach(field => {
      if(field.value == "") {
        bool = false;
        // TODO: write function for when field is empty (error, alert, etc.)
        console.log("Please fill in a " + field.name + ".");
      }
    })
    return bool;
  }

  /* Will hide or show the time inputs depending on the state of the toggle
  */
  function hideTimeInputs() {
    let toggle = document.getElementById("input-all-day");
    let time = document.getElementById("input-time");
    if(toggle.checked) { time.classList = "display-none"; } // (https://framework7.io/docs/typography.html#element-display see display-none)
    else { time.classList = ""; }
  }

  /* Resets the form.
  */
  function eraseData() {
    document.getElementById("form-create-event").reset();
    hideTimeInputs();
  }

  $$(document).on('page:init', '.page[data-name="createEvent"]', function (e) { // (https://framework7.io/docs/page.html#page-events see page:init)
    
    /* The user can decide if the event to be created should be for a whole day, or for a specific time of the day (start and end time)
    Whenever the createEvent page is initialised, an eventListener will be placed on the "All-day" toggle.
    Whenever the toggle is clicked, it will check whether it is checked or not.
    Based on the status of the toggle, the time inputs will be hidden or shown.
    */
    document.getElementById("input-all-day").addEventListener("click", function() {
      hideTimeInputs();
    });
    fillSelectWithOptions();  
  });
  
  /* Feeds all the input elements to the necessary functions to create an event.
  Activates when the "Create Event" button is clicked.
  */
  $$(document).on('click', '#button-create-event', function() {
    let title = document.getElementById("input-title");
    let allDay = document.getElementById("input-all-day");
    let date = document.getElementById("input-date");
    let start = document.getElementById("input-start");
    let end = document.getElementById("input-end");
    let type = document.getElementById("input-type");
    let description = document.getElementById("input-description");
    if(checkFormFields(title, allDay, date, start, end, type, description)){ createEvent(title, allDay, date, start, end, type, description); };
  });

  /* Adds an event to the Cloud Firestore.
  If event is added succesfully, form will be emptied and reset.
  Function based on: https://firebase.google.com/docs/firestore/manage-data/add-data?authuser=0#add_a_document
  */
  function createEvent(title, allDay, date, start, end, type, description) {
    db.collection("Events").add({
      Title: title.value,
      AllDay: allDay.checked,
      Date: firebase.firestore.Timestamp.fromDate(new Date(date.value + "T00:00:00")),
      Start: start.value,
      End: end.value,
      Type: type.value,
      Description: description.value,
    })
    .then(function() {
      console.log("Document successfully written!");
      eraseData();
    })
    .catch(function(error) {
      console.error("Error writing document: ", error);
    });
  }

  /* Resets the form.
  Activates when the "Erase Data" button is clicked.
  */
  $$(document).on('click', '#button-clear-form', function() {
    eraseData();
  });

  //#endregion CREATE/UPDATE-EVENT

//#endregion APP

// TODO: Stick calendar to bottom, and add a date information panel on top of the page
// TODO: 