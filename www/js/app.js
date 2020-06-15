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
  
  let authWorkerApp = firebase.initializeApp(firebase.app().options, 'auth-worker');
  let authWorkerAuth = firebase.auth(authWorkerApp);
  authWorkerAuth.setPersistence(firebase.auth.Auth.Persistence.NONE); // disables caching of account credentials

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
      calendarInline.params.events.push(createDateRangeDate(doc.data().Datetime.toDate(), doc.data().Color, doc.id));
    });
    // Consulted https://forum.framework7.io/t/dynamic-events-on-calendar/3679, on 15/06/2020 for additional info
    // IMPORTANT: update calendar when Date Range array has been added to calendar.params.events
    calendarInline.update();
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

  //#region CREATE-EVENT

  /* The user can decide if the event to be created should be for a whole day, or for a specific time of the day (start and end time)
  Whenever the createEvent page is initialised,
    an eventListener will be placed on the "All-day" toggle.
    Whenever the toggle is clicked,
      it will check whether it is checked or not.
        Based on the status of the toggle certain inputs will be hidden and others will be shown.
  */
  $$(document).on('page:init', '.page[data-name="createEvent"]', function (e) { // https://framework7.io/docs/page.html#page-events see page:init
    var toggle = document.getElementById("createEventFormToggleAllDay");
    var datetimeStart = document.getElementById("createEventFormDatetimeStart");
    var datetimeEnd = document.getElementById("createEventFormDatetimeEnd");
    var date = document.getElementById("createEventFormDate");
    toggle.addEventListener("click", function(){
      if(toggle.checked){
        datetimeStart.classList = "display-none"; // https://framework7.io/docs/typography.html#element-display see display-none
        datetimeEnd.classList = "display-none";
        date.classList = "";
      }
      else {
        datetimeStart.classList = "";
        datetimeEnd.classList = "";
        date.classList = "display-none";
      }
    });
  })
  
  //#endregion CREATE-EVENT

//#endregion APP