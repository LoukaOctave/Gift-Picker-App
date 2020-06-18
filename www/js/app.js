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
      db.collection('Events').where('Creator', '==', getCurrentUserId()).get().then((snapshot) => {
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
      $$("#date-info-card .card-content .links-list ul li").remove();
      fillDateInfoCardHeader(monthNames, weekdayNames);
      fillDateInfoCardContent();
    })

    //#endregion CALENDAR

  // List of full weekday names.
  const weekdayNames = [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ];

  // Functions to be executed at the start.
  fillDateInfoCardHeader(monthNames, weekdayNames);
  fillDateInfoCardContent();

  /* Fills the header of the info date card with a readable date.
  */
  function fillDateInfoCardHeader(months, weekdays) {
    let splitDate = calendarInline.getValue()[0].toString().split(' ', 4);
    let readableDate = "";
    weekdays.forEach(weekday => {
      if(weekday.slice(0, 3) == splitDate[0]){ readableDate += weekday + ", "; }
    })
    readableDate += splitDate[2] + " ";
    months.forEach(month => {
      if(month.slice(0, 3) == splitDate[1]){ readableDate += month + " "; }
    })
    readableDate += splitDate[3];
    document.querySelector("#date-info-card .card-header").textContent = readableDate;
  }

  /* Fills the content of the info date card with events that take place that day.
  Event ID will be kept in the element data for future use.
  */
  function fillDateInfoCardContent() {
    db.collection('Events').where('Creator', '==', getCurrentUserId()).where('Date', '==', firebase.firestore.Timestamp.fromDate(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()))).get().then((snapshot) => {
      snapshot.docs.forEach(doc => {
        var tlines = "";
        tlines += "<li><a class='date-info-card-link' href='/readEvent/' data-eventID='" + doc.id + "'>" + doc.data().Title + "</a></li>"
        $$("#date-info-card .card-content .links-list ul").append(tlines);
      });
    })
  }

  /* Opens the readEvent page for the clicked event.
  Passes the event ID as an argument.
  */
  $$(document).on('click', 'a.date-info-card-link', function() {
    readEvent($$(this).attr("data-eventID"));
  })

  //#endregion HOME

  //#region CREATE/UPDATE-EVENT

  // All the event type options available for event creation.
  const eventTypes = [{value:"birthday" , name:"Birthday"}, {value:"christmas" , name:"Christmas"}, {value:"newyear" , name:"New Year"}, {value:"chinesenewyear" , name:"Chinese New Year"}, {value:"valentinesday" , name:"Valentine's Day"}, {value:"mothersday" , name:"Mother's Day"}, {value:"fathersday" , name:"Father's Day"}, {value:"anniversary" , name:"Anniversary"}, {value:"hannukah" , name:"Hannukah"}, {value:"bartmitzvah" , name:"Bar/bat Mitzvah"}, {value:"wedding" , name:"Wedding"}, {value:"other" , name:"Other"}];

  /* Fills the select input with the available options
  */
  function fillSelectWithOptions(crud) {
    let elementID;
    if (crud == "create") { elementID = "input-type"; }
    else if (crud == "update") { elementID = "update-input-type"; }
    eventTypes.forEach(type => {
      var tlines = "";
      tlines += "<option value='" + type.value + "' selected>" + type.name + "</option>" // (https://framework7.io/docs/smart-select.html#examples see default setup)
      $$("#" + elementID).append(tlines);
    })
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
  function formEventEraseData() {
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
    fillSelectWithOptions("create");
    document.getElementById("input-type").item(0).selected = 'selected'; // Auto select the first option (https://stackoverflow.com/a/10911660)
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
      console.log("Document successfully written!");
      formEventEraseData();
    })
    .catch(function(error) {
      console.error("Error writing document: ", error);
    });
  }

  function loadUpdateEvent(eventID) {
    db.collection('Events').doc(eventID).get().then( function(doc) {
      fillSelectWithOptions("update");

      var formData = {
        'title': doc.data().Title,
        // 'all-day': doc.data().AllDay,
        // 'date': doc.data().Date,
        // 'start': doc.data().Start,
        // 'end': doc.data().End,
        // 'type': doc.data().Type,
        'description': doc.data().Description
      }
      app.form.fillFromData('#form-update-event', formData);
    })
  }

  /* Resets the form.
  Activates when the "Erase Data" button is clicked.
  */
  $$(document).on('click', '#button-clear-form', function() {
    formEventEraseData();
  });

  //#endregion CREATE/UPDATE-EVENT

  //#region READ-EVENT

  /* Converts a firebase.firestore.Timestamp object to a Date object.
  https://www.youtube.com/watch?v=_3BtbFr-2X8
  */
  function convertTimestampToDate(timestamp) {
    return new Date(timestamp.seconds * 1000);
  }

  /* Opens a new page displaying the details of the event that was clicked.
  */
  function readEvent(eventID) {
    db.collection('Events').doc(eventID).get().then( function(doc) {
      document.querySelector(".read-event-ID").setAttribute('id', doc.id);
      $$("#read-event-title").html(doc.data().Title);
      $$("#read-event-date").html(convertTimestampToDate(doc.data().Date).toLocaleDateString()); // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString)
      if(doc.data().AllDay) { document.getElementById("read-event-time").classList = "display-none"; } // Doesn't display start and end time if they don't exist.
      else {
        $$("#read-event-start").html(doc.data().Start);
        $$("#read-event-end").html(doc.data().End);
      }
      eventTypes.forEach(type => { // Searches the eventTypes to display the type name and not the type value.
        if(type.value == doc.data().Type) { $$("#read-event-type").html(type.name); }
      })
      $$("#read-event-description").html(doc.data().Description);
    })
  }

  /* Opens the updateEvent page for the clicked event.
  Passes the event ID as an argument.
  */
  $$(document).on('click', '#button-update-event', function() {
    loadUpdateEvent(document.querySelector('.read-event-ID').getAttribute('id'));
  })

  /* Opens the readEvent page for the clicked event.
  Passes the event ID as an argument.
  */
  $$(document).on('click', '#button-delete-event', function() {
    $$('#read-event-ID').attr("data-eventID");
  })

  //#endregion READ-EVENT

  //#region READ-PROFILE

  

  //#endregion READ-PROFILE

//#endregion APP

// TODO: Stick calendar to bottom, and add a date information panel on top of the page
// TODO: Add pull to refresh for home page
// TODO: clicking back twice leaves you stranded