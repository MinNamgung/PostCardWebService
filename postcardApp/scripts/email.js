
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

//Delete cookies once user send txt message 
function clearsmsInput() {
  document.getElementById("number").value="";
  document.getElementById("txtMessage").value="";
}

function clearWhatsapp() {
  document.getElementById("whatsapNumeber").value="";
  document.getElementById("whatsappMessage").value="";
}

/*
Validates each email against the regex.
If any don't match, false is returned.
*/
function validateEmails(emails) {
  var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  for (let i = 0; i < emails.length; i++) {
    if (!emails[i].match(mailformat)) {
      alert("You must enter a valid email address!")
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
    return true 
  }
}

//txt message validation 
function validatesmsInput(number, txtMessage){
  if(number === "") {
    alert("You must enter a number!");
    return false;
  }
  else if(txtMessage === "") {
    alert("You must enter a txtMessage!");
    return false;
  }
  else{
    clearsmsInput()
    off();
    return true 
  }
}

//txt message validation 
function validateWhatsappInput(whatsapNumeber){
  if(whatsapNumeber === "") {
    alert("You must enter a number!");
    return false;
  }
  else{
    clearWhatsapp()
    off();
    return true 
  }
}

$(document).ready(function(){
  var address = "http://localhost:8080/facebookSend";
  $("#FacebookBtn").click(function(){
    let postcard = document.getElementById("postcardContainer");
      elementToCanvas(postcard, (canvas) => {
        let dataURL = canvas.toDataURL();
        let data = {
          dataURL: dataURL
        };
        $.post( address, data, (data) => {});
      });
  });
});

$(document).ready(function(){
  var address = "http://localhost:8080/send";
  $("#btnContactUs").click(function(){      
    let from = $("#name").val().trim();
    let emails =$("#email").val().trim();
    emails = emails.split(",").map(email => email.trim());
    let message = $("#message").val().trim();
    if(validateInput(from, message) && validateEmails(emails)){
      clearInput()
      off();
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


$(document).ready(function(){
  var address2 = "http://localhost:8080/sendtxt";
  $("#sendTextMessage").click(function(){      
    let number = $("#number").val().trim();
    let txtMessage =$("#txtMessage").val().trim();
    if(validatesmsInput(number,txtMessage)){
      let postcard = document.getElementById("postcardContainer");
      elementToCanvas(postcard, (canvas) => {
        let dataURL = canvas.toDataURL();
        let data = {
          number: number,
          text: txtMessage, 
          postcard: dataURL
        };
        $.post( address2, data, (data) => {});
      });
    }
  });
});


$(document).ready(function(){
  var address= "http://localhost:8080/sendwhatsapp";
  $("#sendWhatsAppMessage").click(function(){      
    let recipient = $("#whatsapNumeber").val().trim();
    let whatsappMessage =$("#whatsappMessage").val().trim();

    if(validateWhatsappInput(recipient) && whatsappMessage){
      let postcard = document.getElementById("postcardContainer");
      elementToCanvas(postcard, (canvas) => {
        let dataURL = canvas.toDataURL();
        let data = {
          recipient: recipient,
          text: whatsappMessage, 
          postcard: dataURL
        };
        $.post( address, data, (data) => {});
      });
    }
  });
});


function tabOpen(evt, tabname) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabname).style.display = "block";
  evt.currentTarget.className += " active";
}

