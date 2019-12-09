/*
This file contains the javascript related to the top navigation bar of the design page(design.html).
*/

let username = "";

$(document).ready( function() {
    //set the private checkbox selected based on if a public or private postcard is loaded
    let urlParts = document.location.pathname.trim().split("/");
    if (urlParts.length === 5) {
        if (urlParts[3] === "private") {
            isPrivateOnLoad = true;
            $("#isPrivateCheckbox").attr("checked", isPrivateOnLoad);
        }
        else {
            isPrivateOnLoad = false;
            $("#isPrivateCheckbox").attr("checked", isPrivateOnLoad);
        }
        //get the username of the profile
        username = urlParts[2];
    }

    /* Conditionally render save/save_as buttons based on if the user 
     is logged in and designing another user's public postcard */
    $("#saveBtn").on("click", () => {
        savePostcard(true, username);
    });
    $("#saveAsBtn").on("click", () => {
        savePostcard(false, username);
    })
});
