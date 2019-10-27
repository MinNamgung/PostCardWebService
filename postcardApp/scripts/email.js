//Email modal on and off 
function on() {
  document.getElementById("overlay").style.display = "block";
}

function off() {
  document.getElementById("overlay").style.display = "none";
}


//Delete cookies once user send email 
function clearInput() {
  document.getElementById("name").value="";
  document.getElementById("email").value="";
  document.getElementById("message").value="";
}

/*
Validates each email against the regex.
If any don't match, false is returned.
*/
function validateEmails(emails) {
  var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  for (let i = 0; i < emails.length; i++) {
    if (!emails[i].match(mailformat)) {
      return false;
    }
  };
  return true;
}

//Email validation 
function validateInput(name, message){
  if(name === "") {
    alert("You must enter a name!");
    return false;
  }
  else if(message === "") {
    alert("You must enter a message!");
    return false;
  }
  else{
    clearInput()
    off();
    return true 
  }
}

$(document).ready(function(){
  var address = "http://localhost:8080/send";
  $("#btnContactUs").click(function(){		
    let from = $("#name").val().trim();
    let emails =$("#email").val().trim();
    emails = emails.split(",").map(email => email.trim());
    let message = $("#message").val().trim();
    if(validateInput(from, message) && validateEmails(emails)){
      let postcard = document.getElementById("postcardContainer");
      elementToCanvas(postcard, (canvas) => {
        let dataURL = canvas.toDataURL();
        let data = {
          from: from,
          to: emails, 
          message: message,
          postcard: dataURL
        };
        $.post( address, data, (data) => {});
      });
    }
  });
});