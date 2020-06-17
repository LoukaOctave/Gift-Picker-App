//#region AUTH

// DOM elements
var loginScreen = document.querySelector(".login-screen");
var loginForm = document.getElementById("login-form");
var loginEmail = document.getElementById("login-email");
var loginPassword = document.getElementById("login-password");
var loginToggle = document.getElementById("login-toggle");
var loginMessage = document.getElementById("login-message");

openLoginScreenIfUserNotLoggedIn();

/* Signs the user in using the credentials filled in in the form.
https://firebase.google.com/docs/auth/web/password-auth?authuser=0#sign_in_a_user_with_an_email_address_and_password
https://www.youtube.com/watch?v=qWy9ylc3f9U
 */
$$(document).on('click', '#button-sign-in', function() {
    auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value)
    .then(cred => {
        storeUserCredentials(cred.user.uid);
        closeLoginScreen();
    })
    .catch(error => {
        loginMessage.textContent = error.message;
    })
})

/* Signs the new user up using the credentials filled in in the form.
https://firebase.google.com/docs/auth/web/password-auth?authuser=0#create_a_password-based_account
https://www.youtube.com/watch?v=qWy9ylc3f9U
 */
$$(document).on('click', '#button-sign-up', function() {
    auth.createUserWithEmailAndPassword(loginEmail.value, loginPassword.value)
    .then(cred => {
        db.collection('Users').doc(cred.user.uid).set({
            CreationTimestamp: firebase.firestore.Timestamp.fromDate(new Date())
        });
        storeUserCredentials(cred.user.uid);
        closeLoginScreen();
    })
    .catch(error => {
        loginMessage.textContent = error.message;
    })
})

/* Stores the uid of the current user.
Depending on whether or not they wish to stay logged on, it'll store it differently.
https://javascript.info/localstorage
 */
function storeUserCredentials(uid) {
    if(loginToggle.checked) { localStorage.setItem("userID", uid); }
    else { sessionStorage.setItem("userID", uid); }
}

/* Opens the login screen if no user is logged in.
*/
function openLoginScreenIfUserNotLoggedIn() {
    if(!localStorage.getItem("userID") && !sessionStorage.getItem("userID")) {
        // These next attributes need to be removed/modified in order to open the login modal.
        document.querySelector('html').classList.add('with-modal-loginscreen');
        loginScreen.classList.add('modal-in');
        loginScreen.style.display = "block";
    }
}

/* Closes the login screen.
*/
function closeLoginScreen() {
    loginForm.reset();
    app.loginScreen.close(loginScreen);
}

/* When login screen closes, we can load in the information into the pages.
*/
$$(document).on('loginscreen:close', function () {
    updateDateRangeDatesInCalendarEvents();
})


/* Signs out user, removes stored credentials and re-opens login screen.
https://firebase.google.com/docs/auth/web/password-auth?authuser=0#next_steps
*/
function userSignOut() {
    auth.signOut()
    .then( e => {
        localStorage.removeItem("userID");
        sessionStorage.removeItem("userID");
        openLoginScreenIfUserNotLoggedIn();
    })
    .catch( error => {
        // TODO: add an onscreen message for error
        console.log(error.message);
    })
}

//#endregion AUTH