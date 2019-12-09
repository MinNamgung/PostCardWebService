/*
This file contains functions related to the postcard and editing it.
*/

//References the currently selected element
let selectedElement;
//Callback functions for undo commands.
let undo = new Array();
//Callback functions for redo commands.
let redo = new Array();
//array for storing image files
let imageFiles = new Map();
//store original value of private/public
let isPrivateOnLoad = false;

/*
Allows the target to receive dropped elements.
Must be attached to the ondragover event for an element that receives
dropped elements.
*/
function allowDrop(event) {
    event = event.originalEvent;
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
}

/*
Handles the drop event for an image being dropped onto an element.
*/
function imageDrop(event) {
    event = event.originalEvent;
    event.stopPropagation();
    event.preventDefault();
    let elementType = event.dataTransfer.getData("text");
    if (elementType === "chosenFile") {
        let files = document.getElementById("filePicker").files;
        Array.from(files).forEach(file => setBackgroundImage(file, event.currentTarget));
    }
    else if (event.dataTransfer.files) {
        Array.from(event.dataTransfer.files)
            .forEach(file => setBackgroundImage(file, event.currentTarget));
    }
}

/*
Handles the drop event of a draggable element.
Creates a new element with the specified type in the 
dataTransfer's text data, and adds this element to the target
of the drop event.
*/
function drop(e) {
    e = e.originalEvent;
    e.stopPropagation();
    e.preventDefault();
    let elementType = e.dataTransfer.getData("text");
    if (elementType === "input") {
        let textBox = createTextBox();
        let postcardWidth = textBox.parentElement.offsetWidth;
        let postcardHeight = textBox.parentElement.offsetHeight;
        let boxWidth = textBox.offsetWidth;
        let boxHeight = textBox.offsetHeight;
        let outlineWidth = Number($(".postcard-textbox").css("outline-width").replace("px", "")) * 2;

        textBox.style.left = e.offsetX - boxWidth / 2 + "px";
        textBox.style.top = e.offsetY - boxHeight / 2 + "px";

        //Adjust left and top bounds so the textbox cannot be partially outside of the postcard
        if (Number(textBox.style.left.replace("px", "")) < 0) {
            textBox.style.left = "0px";
        }
        else if (Number(textBox.style.left.replace("px", "")) > postcardWidth - (boxWidth + outlineWidth)) {
            textBox.style.left = postcardWidth - (boxWidth + outlineWidth) + "px";
        }
        if (Number(textBox.style.top.replace("px", "")) < 0) {
            textBox.style.top = "0px";
        }
        else if (Number(textBox.style.top.replace("px", "")) > postcardHeight - (boxHeight + outlineWidth)) {
            textBox.style.top = postcardHeight - (boxHeight + outlineWidth) + "px";
        }
    }
}

//Can probably be refactored to handle all element types
function sidebarClickTextBoxWithoutDrag(e) {
    let textBox = createTextBox();

    //Place box in middle of the postcard
    textBox.style.left = textBox.parentElement.clientWidth / 2 - textBox.offsetWidth / 2 + "px";
    textBox.style.top = textBox.parentElement.clientHeight / 2 - textBox.offsetHeight / 2 + "px";
}

//Creates a div with a textbox in it to allow dragging and resizing
function createTextBox(e) {
    let box = document.createElement("div");
    box.className = "postcard-box";
    box.id = Date.now();
    box.style.zIndex = 1;
    let textBox = document.createElement("div");
    textBox.className = "postcard-textbox";
    $(box).append(textBox);
    $("#postcardContainer").append(box);

    setTextboxEventHandlers(textBox);
    setBoxDraggable(box);
    setBoxResizable(box);

    let textArea = document.createElement("textarea");
    textArea.className = "postcard-textarea";
    textArea.spellcheck = false;
    setTextAreaEventHandlers(textArea);

    textBox.append(textArea);

    setSelected(textBox);
    bringToFront(); //Will move the new selected textBox to front

    //Set focus on the textbox textarea
    $(textArea).focus();

    //Manually update font family, size, and color
    $("#fontFamilySelector").trigger("change");
    $("#fontSizeSelector").trigger("change");
    $("#fontColorPicker").trigger("change");

    textboxUndo(textBox);

    return box;
}

//Undo the creation of a text box
function textboxUndo(textBox){
    /*
    Get the parent element, so that it is captured in the closure below.
    Once you remove the element, you cannot use element.parentElement in the undo callback
    b/c it evaluates to null.
    */
   let parentElement = textBox.parentElement
   undo.push(() => {
       deleteElement(textBox)
       redo.push(() => {
           parentElement.appendChild(textBox)
           setSelected(textBox)
           textboxUndo(textBox);
       })
   })
}

//Undo latest change to text contents
function textUndo(event){
    //Get the text area and current/previous text contents for capturing in the closure
    let textArea = event.target;
    let previousText = textArea.previousText;
    let currentText = textArea.value;
    if (textArea.previousText !== undefined && textArea.previousText !== ""){
        undo.push(() => {
            console.log("Undo text: " + previousText);
            redo.push(() => {
                console.log("Redo text: " + currentText);
                textArea.previousText = textArea.value;
                textArea.value = currentText;
                textUndo(event);
            })
            textArea.value = previousText;
        })
    }
    textArea.previousText = currentText;
}

/*
Sets event handlers for a postcard's textbox.
*/
function setTextboxEventHandlers(textBox) {
    //Hover events
    textBox.addEventListener("mouseover", setHoverStyling);
    textBox.addEventListener("mouseout", exitHoverStyling);
    /* Because of the structure of a textbox's elements, it requires its own
    image drop handler and the dropImage handler cannot be reused. 
    If you try to use the dropImage handler, then the image can be place on the 
    textbox element, the resize handles, and the textarea.
    This handler only places the image on the background of the textarea.   */
    $(textBox).on("drop", (event) => {
        event = event.originalEvent;
        event.stopPropagation();
        event.preventDefault();
        let files = event.dataTransfer.files;
        if (event.dataTransfer.getData("text") === "chosenFile") {
            files = document.getElementById("filePicker").files;
        }
        Array.from(files).forEach(file => setBackgroundImage(file, textBox));
    });
}

/*
Makes the textbox resizable and attaches event handlers to the resize handles.
*/
function setBoxResizable(box) {
    $(box).resizable({
        containment: "#postcardContainer",
        handles: "ne, nw, se, sw"
    });
    setBoxResizeHandlesEventHandlers(box);
}

/*
Makes the textbox draggable.
*/
function setBoxDraggable(box) {
    $(box).draggable({ containment: "#postcardContainer", scroll: false });
    //Mouse indicator
    box.firstChild.addEventListener("mouseover", dragHover);
}

/*
Sets event handlers for a textboxes' textarea element.
*/
function setTextAreaEventHandlers(textArea) {
    //TextBox hover events
    textArea.addEventListener("mouseover", setHoverStyling);
    textArea.addEventListener("mouseout", exitHoverStyling);

    //Text cursor on hover
    textArea.addEventListener("mouseover", textHover);

    //Select text box on click
    textArea.addEventListener("click", selectTextBox);

    //For text undo/redo
    textArea.addEventListener("input", textUndo);
}

/*
Sets the event handlers for a textboxes' resize handles.
*/
function setBoxResizeHandlesEventHandlers(box) {
    //remove event listeners to all the corner resize handles
    let resizeHandles = Array.from(box.getElementsByClassName("ui-resizable-handle"));
    resizeHandles.forEach(handle => setResizeHandleEventHandlers(handle));
}

/*
Sets the event handlers for a resize handle element.
*/
function setResizeHandleEventHandlers(resizeHandle) {
    $(resizeHandle).on("mouseover", resizeHover);
    $(resizeHandle).on("click", selectTextBox);
    $(resizeHandle).on("mouseover", setHoverStyling);
    $(resizeHandle).on("mouseout", exitHoverStyling);
}

/*
Move the selected element's box in front of all other elements
*/
function bringToFront() {
    if (selectedElement != $("#postcardContainer")[0]) {
        selectedElement.parentElement.style.zIndex = getFrontZ() + 1;
    }
}

/*
Gets the frontmost element's z-index. Returns 0 if there are no textboxes yet
*/
function getFrontZ() {
    let elements = zSortedElements();
    //Largest z is now the first element
    if (elements) {
        return Number(elements[0].style.zIndex);
    }
}

//Move the selected element in front of the element immediately in front of it
function bringForward() {
    if (selectedElement != $("#postcardContainer")[0]) {
        let nextZ = getNextFrontZ();
        selectedElement.parentElement.style.zIndex = nextZ + 1;
    }
}

/*
Finds the z-index of the closests element in front of the selected element
*/
function getNextFrontZ() {
    let currentZ = Number(selectedElement.parentElement.style.zIndex);
    let elements = zSortedElements();

    //Sequential search backwards until a closer or even element is found
    for (let i = elements.length - 1; i >= 0; i--) {
        if (elements[i].firstChild != selectedElement) {
            let tempZ = Number(elements[i].style.zIndex);
            if (tempZ == currentZ) {
                return tempZ + 1;
            }
            else if (tempZ > currentZ) {
                return tempZ;
            }
        }
    }
}

/*
Places the selected element behind all others
*/
function sendToBack() {
    if (selectedElement != $("#postcardContainer")[0]) {
        selectedElement.parentElement.style.zIndex = getBackZ() - 1;
    }
}

/*
Gets the backmost element's z-index
*/
function getBackZ() {
    let elements = zSortedElements();
    //Now lowest z-index is the first element
    if (elements) {
        return Number(elements[elements.length - 1].style.zIndex);
    }
}

/*
Places the element behind the closest back element
*/
function sendBackwards() {
    if (selectedElement != $("#postcardContainer")[0]) {
        let nextZ = getNextBackZ();
        selectedElement.parentElement.style.zIndex = nextZ - 1;
    }
}

/*
Finds the z-index of the closests element behind the selected element
*/
function getNextBackZ() {
    let currentZ = Number(selectedElement.parentElement.style.zIndex);
    let elements = zSortedElements();

    for (let i = 0; i < elements.length; i++) {
        if (elements[i].firstChild != selectedElement) {
            let tempZ = Number(elements[i].style.zIndex);
            if (tempZ == currentZ) {
                return tempZ - 1;
            }
            else if (tempZ < currentZ) {
                return tempZ;
            }
        }
    }

}

/*
Sort the postcard elements by z index descending (frontmost elements are first)
*/
function zSortedElements() {
    let elements = $("#postcardContainer").children().toArray();

    //If any elements have z index of 0, shift all elements forward
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].style.zIndex <= 0){
            zShift(10);
            break;
        }
    }

    if (elements.length === 0) {
        return null;
    }
    elements.sort((a, b) => {
        if (Number(a.style.zIndex) >= Number(b.style.zIndex)) {
            return -1;
        }
        else {
            return 1;
        }
    });

    //elements are now sorted
    return elements;
}

//Shift all elements forward to avoid any elements having a z-index < 0
function zShift(shiftAmount){
    $("#postcardContainer").children().toArray().forEach((element) => {
        let z = Number(element.style.zIndex);
        element.style.zIndex = z + shiftAmount;
    });
}

/*
Set default values and attach event handlers.
*/
function init(postcard, editable=true) {
    
    if(editable){        
        selectedElement = $("#postcardContainer")[0];

        if(postcard._id !== ""){
            deserializePostcard(postcard)
        }     

        setSelectedStyling();
        $("#postcardContainer").on("click", onSelect);
        $("#postcardContainer").on("drop", imageDrop);
        $("#postcardContainer").on("drop", drop);
        $("#postcardContainer").on("dragover", allowDrop);

        //set the private checkbox selected based on if a public or private postcard is loaded
        let urlParts = document.location.pathname.trim().split("/");
        if (urlParts.length === 5) {
            if (urlParts[3] === "private") {
                $("#isPrivateCheckbox").attr("checked", true);
            }
            else {
                $("#isPrivateCheckbox").attr("checked", false);
            }
        }

        $("#imgPickerIcon").click(() => {
            $("#filePicker").trigger("click");
        });
        $("#downloadBtn").on("click", () => downloadPostcard("postcard.png"));
        $("#colorPicker").on("change", colorPickerChanged);
        $("#fontFamilySelector").on("change", fontFamilyChanged);
        $("#fontSizeSelector").on("change", fontSizeChanged);
        $("#fontColorPicker").on("change", fontColorChanged);

        $(document).keydown(function (e) {
            let keyCodes =
            {
                Backspace: 8,
                Delete: 46,
                q: 81,
                y: 89,
                z: 90,
            }
            if (e.keyCode === keyCodes.Delete || (e.ctrlKey && e.keyCode === keyCodes.q)) {
                deleteElement(selectedElement);
            }
            else if (e.ctrlKey && e.keyCode === keyCodes.z) {
                e.preventDefault();
                e.stopPropagation();
                let undoCallback = undo.pop();
                if (undoCallback) {
                    undoCallback();
                }
            }
            else if (e.ctrlKey && e.keyCode === keyCodes.y) {
                e.preventDefault();
                e.stopPropagation();
                let redoCallback = redo.pop();
                if (redoCallback) {
                    redoCallback();
                }
            }
        })
    }else{
        selectedElement = $("#postcardContainer")[0];
        deserializePostcard(postcard, editable) 
        setSelectedStyling();       
    }
}

/*
Deletes the element.
*/
function deleteElement(element) {
    if (element.classList.contains("no-remove")) {
        return;
    }
    if (element === selectedElement) {
        //set the postcardContainer as the selectedElement
        $("#postcardContainer").click();
    }
    element.remove();
}

function colorPickerChanged(event) {
    let color = event.target.value;
    setBackground(selectedElement, color);
}

function clearColor() {
    setBackground(selectedElement, "transparent");
}

function fontFamilyChanged(event) {
    let element = event.target;
    let fontFamily = element.value;
    if (selectedElement.classList[0] === "postcard-textbox") {
        selectedElement.style.fontFamily = fontFamily;
    }
}

function fontSizeChanged(event) {
    let element = event.target;
    let fontSize = element.value;
    if (selectedElement.classList[0] === "postcard-textbox") {
        selectedElement.style.fontSize = getFontSizeEM(fontSize);
    }
}

//Change font on first child because clicking the color picker makes the outter div the selected element
function fontColorChanged(event) {
    let element = event.target;
    let fontColor = element.value;
    if (selectedElement.classList[0] === "postcard-textbox") {
        selectedElement.getElementsByClassName("postcard-textarea")[0].style.color = fontColor;
    }
}

//Scale font size by 12 to use reasonable em units
function getFontSizeEM(selectedFontSize) {
    return selectedFontSize / 12 + "em";
}

/*
Append each file in files that is an image to the postcard.
*/
function setBackgroundImage(file, element) {
    if (file && file.type.match(/image.*/)) {
        if (!element.id) {
            element.id = Date.now();
        }
        if (!imageFiles.has(element.id)) {
            imageFiles.set(element.id, new Array());
        }
        imageFiles.get(element.id).push(file);
        let reader = new FileReader();
        reader.onload = function (event) {
            let img = document.createElement('img');
            img.src = event.target.result;
            let previousBackground = element.style.background;
            element.style.background = "url(" + img.src + ")";
            element.style.backgroundSize = "100% 100%";
            //setup undo/redo callbacks
            undo.push(() => {
                element.style.background = previousBackground;
                imageFiles.get(element.id).pop();
                redo.push(() => setBackgroundImage(file, element));
            });
        }
        reader.readAsDataURL(file);
    }
}

/*
Sets the background style of element to the color.
*/
function setBackground(element, backgroundStyle) {
    const currentColor = element.style.background;
    element.style.background = backgroundStyle;
    undo.push(() => {
        element.style.background = currentColor;
        redo.push(() => setBackground(element, backgroundStyle));
    });
}

function setSelectedElementGradientBackground() {
    let firstColor = $("#gradientColor1").val();
    let secondColor = $("#gradientColor2").val();
    let orientation = $("#gradientOrientationSelector").val();

    let orientations = new Map();
    orientations["Bottom"] = "to bottom";
    orientations["Top"] = "to top";
    orientations["Right"] = "to right";
    orientations["Left"] = "to left";
    orientations["Top Right"] = "to top left";
    orientations["Top Left"] = "to top right";
    orientations["Bottom Right"] = "to bottom left";
    orientations["Bottom Left"] = "to bottom right";

    let backgroundStyle = "linear-gradient(" + orientations[orientation] + "," + firstColor + " 0%, " + secondColor + " 100%)";
    setBackground(selectedElement, backgroundStyle);
}

/*
Sets the selectedElement to the target of the event for which this function is attached to.
*/
function onSelect(event) {
    //prevent the event from triggering layered UI elements that have this same listener.
    if (event) {
        event.stopPropagation();
        if (selectedElement) {
            clearSelectedStyling();
        }
        setSelected(event.target);
    }
}

/*
Sets element as the selectedElement
*/
function setSelected(element) {
    customClearSelectedStyling();
    selectedElement = element;
    setSelectedStyling();
}

/*
Styles the selectedElement, so that the user knows what is selected.
*/
function setSelectedStyling() {
    let outlineBeforeSelect = selectedElement.style.outline;
    customClearSelectedStyling = () => selectedElement.style.outline = outlineBeforeSelect;
    selectedElement.style.outlineColor = "black";
}

//A more modifiable style clearing function for the selected item.
let customClearSelectedStyling = () => clearSelectedStyling();

/*
Undoes the styling caused by setSelectedStyling.
*/
function clearSelectedStyling() {
    selectedElement.style.outlineColor = "transparent";
    selectedElement.style.border = "none";
}

/*
Convers element to a canvas and calls onConversion when the conversion is completed.
*/
function elementToCanvas(element, onConversion) {
    let canvas = $("#canvas")[0];
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = element.offsetWidth;
    canvas.height = element.offsetHeight;
    let options = { canvas: canvas, scale: 1};
    html2canvas(element, options).then(function(canvas) { 
        onConversion(canvas); 
    });
}

/*
Creates an image element containing a canvas.
*/
function canvasToImage(canvas) {
    let image = document.createElement("img");
    image.crossOrigin = "Anonymous";
    image.src = canvas.toDataURL("image/png");
    return image;
}

/*
Transforms a postcard to an image.
*/
function postcardToImage(postcard, onImageLoad) {
    elementToCanvas(postcard, (canvas) => {
        let image = canvasToImage(canvas);
        onImageLoad(image);
    })
}

/*
Downloads the image element with the given name.
*/
function downloadImage(image, name) {
    let downloadLink = document.createElement("a");
    downloadLink.href = image.src;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

/*
Downloads the postcard as an image.
*/
function downloadPostcard(name) {
    disableCanvasModificationButtons();
    //remove outline, so it's not included in image
    clearSelectedStyling();
    let postcard = document.getElementById("postcardContainer");
    elementToCanvas(postcard, (canvas) => {
        canvas.toBlob((blob) => {
            let url = URL.createObjectURL(blob);
            let image = document.createElement("img");
            image.src = url;
            image.onload = () => URL.revokeObjectURL(url);
            downloadImage(image, name);
            enableCanvasModificationButtons();
        }, "image/png", 1);
    });
    setSelectedStyling();
}

/*
Transforms the HTML representation of a postcard to a JSON string.
JSON object for a postcard is as follows: 
{
    id: "",
    outerHTML: "",
    textboxes: [
        0: {id: "", value: ""}
    ]
}
*/
function serializePostcard() {
    let postcardElement = $("#postcardContainer")[0];
    let textAreas = postcardElement.getElementsByClassName("postcard-textarea");
    let postcardTextboxes = new Array();
    Array.from(textAreas).forEach(textArea => {
        let textBox = textArea.parentElement;
        let box = textBox.parentElement;
        let postcardTextbox = { id: box.id, value: textArea.value };
        postcardTextboxes.push(postcardTextbox);
    })
    let html = postcardElement.outerHTML;
    let id = null;
    if (postcardElement.dataset["postcardId"]) {
        id = postcardElement.dataset["postcardId"];
    }
    let postcard = {
        _id: id,
        outerHTML: html,
        textboxes: postcardTextboxes
    }
    return postcard;
}

/*
Transforms the JSON string representing a postcard to HTML content.
See the serializePostcard function for the contents of the json parameter.
*/
function deserializePostcard(json, editable=true) {
    let postcard = json
    let postcardElement = $("#postcardContainer")[0];
    postcardElement.outerHTML = postcard.outerHTML;
    $("#postcardContainer")[0].dataset["postcardId"] = postcard._id;
    deserializePostcardTextboxes(postcard, editable);
}

/*
Deserializes the postcard's textboxes from the json object.
Adds event handlers and recreates the resize handles.
*/
function deserializePostcardTextboxes(postcard, editable=true) {
    if (postcard.textboxes) {
       for(data of postcard.textboxes){
            let box = document.getElementById(data.id);
            /*Adding the event handlers to the resize handles 
            doesn't work, so recreating them acts as a workaround.*/    
            Array.from(box.children).forEach(child => {
                if (child.classList.contains("ui-resizable-handle")) {
                    box.removeChild(child);
                }
            })
            let textBox = box.firstChild;
            if(editable){
                setTextboxEventHandlers(textBox);
                setBoxDraggable(box);
                setBoxResizable(box);
            }
            let textarea = box.getElementsByClassName("postcard-textarea")[0];
            if(editable){
                setTextAreaEventHandlers(textarea);
            }
            textarea.value = data.value;
        }
    }
}

/*
Sends the postcard to the server to be saved.
isUpdate - boolean indicating if the postcard should be saved
by updating it, or saved by creating a new postcard.
*/
function savePostcard(isUpdate, username) {
    disableCanvasModificationButtons();
    clearSelectedStyling();
    let postImagePromises = new Array();
    /*save each image on the postcard, and update the element's
     background property to point to the image on the server.*/
    imageFiles.forEach((files, elementId, imageFilesMap) => {
        let element = document.getElementById(elementId);
        let currentImage = files[files.length - 1];
        postImagePromises.push(new Promise(
            function (resolve, reject) {
                postImage(currentImage, (imageUrl) => {
                    if (imageUrl) {
                        element.style.backgroundImage = decodeURI(imageUrl);
                        resolve();
                    }else{
                        reject();
                    }
                })
            })
        );
    });
    //Only save the postcard after all images have been saved
    Promise.all(postImagePromises).then(() => {
        let postcard = serializePostcard();
        let data = {};
        data.postcard = postcard;
        let isPrivate = $("#isPrivateCheckbox")[0].checked;
        //determine if the postcard has been moved from private to public
        data.isPrivateStateChanged = isPrivateOnLoad != isPrivate;
        data.isPrivate = isPrivate;
        data.isUpdate = isUpdate;
        data.username = username;
        data.title = $("#title").val()  
        $.post("/postcard", data).done(data => {
            displayToast("Saving Postcard", data.message);
            enableCanvasModificationButtons();
        });
        setSelectedStyling();
    });
}

/*
Displays a toast with the given header and body message
*/
function displayToast(header, message) {
    $("#toastHeader").text(header);
    $("#toastBody").text(message);
    $("#toaster").toast({ delay: 3000 });
    $("#toaster").toast("show");
}

/*
Disables the download and save buttons to 
prevent the canvas from being changed while it is in
the middle of rendering something.
*/
function disableCanvasModificationButtons() {
    $("#downloadBtn").prop("disabled", true);
    $("#saveBtn").prop("disabled", true);
}

/*
Enables the download and save buttons.
*/
function enableCanvasModificationButtons() {
    $("#downloadBtn").prop("disabled", false);
    $("#saveBtn").prop("disabled", false);
}

/*
POSTS an image file to the server for saving.
*/
function postImage(imageFile, successCallback) {
    let formData = new FormData();
    formData.append("imageFile", imageFile);
    formData.append("fileName", imageFile.name);
    $.ajax({
        url: "/images",
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        method: 'POST', 
        complete: function(data){
            let response = data.responseJSON;
            if (response.success) {
                displayToast(imageFile.name, "Saved to " + response.src);
                successCallback(response.src);
            }
            else {
                displayToast("Failed to save " + imageFile.name, "An error occurred on the server.");
            }
        }
    });
}