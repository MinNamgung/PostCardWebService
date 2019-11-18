/*
This file contains functions related to the postcard and editing it.
*/

//References the currently selected element
let selectedElement;
//Callback functions for undo commands.
let undo = new Array();
//Callback functions for redo commands.
let redo = new Array();

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
    let textBox = document.createElement("div");
    textBox.id = Date.now();
    textBox.className = "postcard-textbox";
    $("#postcardContainer").append(textBox);

    setTextboxEventHandlers(textBox);
    setTextboxDraggable(textBox);
    setTextboxResizable(textBox);

    let textArea = document.createElement("textarea");
    textArea.className = "postcard-textarea";
    textArea.spellcheck = false;
    setTextAreaEventHandlers(textArea);

    textBox.append(textArea);

    setSelected(textBox);
    sendToFront();

    //Set focus on the textbox textarea
    $(textArea).focus();

    //Manually update font family, size, and color
    $("#fontFamilySelector").trigger("change");
    $("#fontSizeSelector").trigger("change");
    $("#fontColorPicker").trigger("change");

    return textBox;
}

/*
Sets event handlers for a postcard's textbox.
*/
function setTextboxEventHandlers(textBox) {
    textBox.addEventListener("mouseover", dragHover);
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
function setTextboxResizable(textBox) {
    $(textBox).resizable({
        containment: "#postcardContainer",
        handles: "ne, nw, se, sw"
    });
    setTextboxResizeHandlesEventHandlers(textBox);
}

/*
Makes the textbox draggable.
*/
function setTextboxDraggable(textBox) {
    $(textBox).draggable({ containment: "#postcardContainer", scroll: false });
}

/*
Sets event handlers for a textboxes' textarea element.
*/
function setTextAreaEventHandlers(textArea) {
    //Mouse indicator events
    textArea.addEventListener("mouseover", disableDragHover);
    textArea.addEventListener("mouseout", enableDragHover);

    //Parent hover events
    textArea.addEventListener("mouseover", setParentHoverStyling);
    textArea.addEventListener("mouseout", exitParentHoverStyling);

    //Text cursor on hover
    textArea.addEventListener("mouseover", textHover);

    //Select parent on click
    textArea.addEventListener("click", selectParent);
}

/*
Sets the event handlers for a textboxes' resize handles.
*/
function setTextboxResizeHandlesEventHandlers(textbox) {
    //Add event listeners to all the corner resize handles
    let resizeHandles = Array.from(textbox.getElementsByClassName("ui-resizable-handle"));
    resizeHandles.forEach(handle => setResizeHandleEventHandlers(handle));
}

/*
Sets the event handlers for a resize handle element.
*/
function setResizeHandleEventHandlers(resizeHandle) {
    $(resizeHandle).on("mouseover", disableDragHover);
    $(resizeHandle).on("mouseout", enableDragHover);
    $(resizeHandle).on("mouseover", resizeHover);
    $(resizeHandle).on("click", selectParent);
    $(resizeHandle).on("mouseover", setParentHoverStyling);
    $(resizeHandle).on("mouseout", exitParentHoverStyling);
}

/*
Move the selected element in front of all other elements
*/
function sendToFront() {
    if (selectedElement != $("#postcardContainer")[0]) {
        selectedElement.style.zIndex = getFrontZ() + 1;
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
function sendForwards() {
    if (selectedElement != $("#postcardContainer")[0]) {
        let nextZ = getNextFrontZ();
        selectedElement.style.zIndex = nextZ + 1;
    }
}

/*
Finds the z-index of the closests element in front of the selected element
*/
function getNextFrontZ() {
    let currentZ = Number(selectedElement.style.zIndex);
    let elements = zSortedElements();

    //Sequential search backwards until a closer or even element is found
    for (let i = elements.length - 1; i >= 0; i--) {
        if (elements[i] != selectedElement) {
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
        selectedElement.style.zIndex = getBackZ() - 1;
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
        selectedElement.style.zIndex = nextZ - 1;
    }
}

/*
Finds the z-index of the closests element behind the selected element
*/
function getNextBackZ() {
    let currentZ = Number(selectedElement.style.zIndex);
    let elements = zSortedElements();

    for (let i = 0; i < elements.length; i++) {
        if (elements[i] != selectedElement) {
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
    let elements = $("#postcardContainer").children();
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

/*
Set default values and attach event handlers.
*/
$(document).ready(function () {
    selectedElement = $("#postcardContainer")[0];
    //Waits on a promise to initialize the postcard as empty or load from db using ajax
    loadPostcard().then(
        result => {
            selectedElement = $("#postcardContainer")[0];
            setSelectedStyling();
            $("#postcardContainer").on("click", onSelect);
            $("#postcardContainer").on("drop", imageDrop);
            $("#postcardContainer").on("drop", drop);
            $("#postcardContainer").on("dragover", allowDrop);
        },
        error => {
            alert(error);
        }
    );

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
            e.stopPropagation();
            let undoCallback = undo.pop();
            if (undoCallback) {
                undoCallback();
            }
        }
        else if (e.ctrlKey && e.keyCode === keyCodes.y) {
            e.stopPropagation();
            let redoCallback = redo.pop();
            if (redoCallback) {
                redoCallback();
            }
        }
    })
    $("#saveBtn").on("click", () => {
        savePostcard();
    });
})

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
    /*
    Get the parent element, so that it is captured in the closure below.
    Once you remove the element, you cannot use element.parentElement in the undo callback
    b/c it evaluates to null.
    */
    let parentElement = element.parentElement;
    undo.push(() => {
        parentElement.appendChild(element)
        redo.push(() => deleteElement(element));
    });
    element.remove();
}

function colorPickerChanged(event) {
    let color = event.target.value;
    setBackground(selectedElement, color);
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
                redo.push(() => setBackgroundImage(file, element));
            })
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
    let backgroundStyle = "linear-gradient(" + orientation + "," + firstColor + " 0%, " + secondColor + " 100%)";
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
    let textboxes = postcardElement.getElementsByClassName("postcard-textarea");
    let postcardTextboxes = new Array();
    Array.from(textboxes).forEach(textbox => {
        let textboxElement = textbox.parentElement;
        let postcardTextbox = { id: textboxElement.id, value: textbox.value };
        postcardTextboxes.push(postcardTextbox);
    })
    let html = postcardElement.outerHTML;
    let id = null;
    if (postcardElement.dataset.postcardId) {
        id = postcardElement.dataset.postcardId
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
function deserializePostcard(json, parent) {
    let postcard = JSON.parse(json);
    let postcardElement = document.createElement("div");
    postcardElement.dataset["_id"] = postcard._id;
    parent.appendChild(postcardElement);
    postcardElement.outerHTML = postcard.outerHTML;
    deserializePostcardTextboxes(postcard);
}

/*
Deserializes the postcard's textboxes from the json object.
Adds event handlers and recreates the resize handles.
*/
function deserializePostcardTextboxes(postcard) {
    if (postcard.textboxes) {
        Array.from(postcard.textboxes).forEach(textbox => {
            let textboxElement = document.getElementById(textbox.id);
            /*Adding the event handlers to the resize handles 
            doesn't work, so recreating them acts as a workaround.*/
            Array.from(textboxElement.children).forEach(child => {
                if (child.classList.contains("ui-resizable-handle")) {
                    textboxElement.removeChild(child);
                }
            })
            setTextboxEventHandlers(textboxElement);
            setTextboxDraggable(textboxElement);
            setTextboxResizable(textboxElement);
            let textarea = textboxElement.getElementsByClassName("postcard-textarea")[0];
            setTextAreaEventHandlers(textarea);
            textarea.value = textbox.value;
        })
    }
}

/*
Sends the postcard to the server to be saved.
*/
function savePostcard() {
    disableCanvasModificationButtons();
    clearSelectedStyling();
    let postcard = serializePostcard();
    let data = {};
    data.postcard = postcard;
    data.isPrivate = $("#isPrivateCheckbox")[0].checked;
    let postcardElement = document.getElementById("postcardContainer");
    elementToCanvas(postcardElement, (canvas) => {
        let url = canvas.toDataURL("image/png");
        let image = document.createElement("img");
        image.src = url;
        data.postcard.image = url;
        $.post("/postcards", data).done(data => {
            displayToast("Saving Postcard", data.message);
            enableCanvasModificationButtons();
        });
    });
    setSelectedStyling();
}

/*
Load the postcard from the server to be displayed
*/
function loadPostcard() {
    return new Promise((resolve, reject) => {
        let postcardContainer = $("#postcardContainer")[0];

        //Check if a postcard needs to be loaded
        let url = document.location.pathname.trim().split("/").splice(1);
        //If the url has more than length one, we need to load a postcard
        if (url.length > 1) {
            url[0] = "/postcard";
            $.get(url.join("/")).done(data => {
                $("#content-container").empty();
                deserializePostcard(data, $("#content-container")[0]);
                resolve();
            });
        }
        else {
            resolve();
        }
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