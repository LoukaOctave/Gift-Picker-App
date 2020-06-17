var email = document.getElementById("login-email");
var password = document.getElementById("login-password");

$$(document).on('click', '#button-sign-in', function() {

})

$$(document).on('click', '#button-sign-up', function() {
    auth.createUserWithEmailAndPassword(email.value, password.value).then(cred => {
        console.log(cred);
    });
})