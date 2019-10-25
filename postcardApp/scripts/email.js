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
   
function onSendAlert(){
    alert('Success!');
    off();
}

//Email validation 
function validateInput(email){
  var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  if(document.getElementById("name").value.trim()===""){
    alert("You must enter a name!");
    return false;
  }
  else if(!email.match(mailformat)){
    alert("You must enter a valid email address!")
    return false;
  } 
  else if(document.getElementById("message").value.trim()===""){
    alert("You must enter a message!");
    return false;
  }
  else{
    onSendAlert()
    clearInput()
    return true 
  }
}