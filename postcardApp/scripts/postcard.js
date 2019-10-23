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
function allowDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
}

/*
Handles the drop event of a draggable element.
Creates a new element with the specified type in the 
dataTransfer's text data, and adds this element to the target
of the drop event.
*/
function drop(e) {
    e.stopPropagation();
    e.preventDefault();
    let elementType = e.dataTransfer.getData("text");
    let files = e.dataTransfer.files;
    Array.from(files).forEach(file => appendImageFile(file, e.target));
    if (elementType === "chosenFile") {
        let files = document.getElementById("filePicker").files;
        Array.from(files).forEach(file => appendImageFile(file, e.target));
    }
    else {
        console.log(elementType + " dropped onto postcard!");
    }
}

/*
Append each file in files that is an image to the postcard.
*/
function appendImageFile(file, appendTo) {
    if (file) {
        if (file.type.match(/image.*/)) {
            let reader = new FileReader();
            reader.onload = function(e) {
                let img = document.createElement('img');
                img.src= e.target.result;
                appendTo.appendChild(img);
                //setup undo/redo callbacks
                undo.push(() => {
                    img.remove();
                    redo.push(() => appendImageFile(file, appendTo));
                })
                img.style.width = "auto";
                img.style.height = "auto";
            }
            reader.readAsDataURL(file);
        }
    }
}

/*
Set default values and attach event handlers.
*/
$(document).ready(function() {
    selectedElement = $("#postcardContainer")[0];
    setSelectedStyling();
    $("#postcardContainer").on("click", onSelect);
    $("#colorPicker").on("change", colorPickerChanged);
    $(document).keydown(function(e) {
        let keyCodes = 
        {
            Backspace: 8,
            Delete: 46,
            y: 89,
            z: 90,
        }
        if (e.keyCode === keyCodes.Backspace || e.keyCode === keyCodes.Delete) {
            deleteElement(selectedElement);
        }
        else if (e.keyCode === keyCodes.z && e.ctrlKey) {
            let undoCallback = undo.pop();
            if (undoCallback) {
                undoCallback();
            }
        }
        else if (e.keyCode === keyCodes.y && e.ctrlKey) {
            let redoCallback = redo.pop();
            if (redoCallback) {
                redoCallback();
            }
        }
    })
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
    setSelectedBackground(color);
}

/*
Eventhandler for the input event of #colorPicker.
Sets the background style to the value of #colorPicker.
*/
function setSelectedBackground(color) {
    let currentColor = selectedElement.style.background;
    undo.push(() => {
        selectedElement.style.background = currentColor;
        redo.push(() => setSelectedBackground(color));
    });
    selectedElement.style.background = color;
    $("#postcardContainer").on("click", setSelected);
    $("#colorPicker").on("change", setBackground);
}

function setSelectedElementGradientBackground() {
    let firstColor = $("#gradientColor1").val();
    let secondColor = $("#gradientColor2").val();
    let orientation = $("#gradientOrientationSelector").val();
    let backgroundStyle = "linear-gradient(" + orientation + "," + firstColor + " 0%, " +  secondColor + " 100%)";
    selectedElement.style.background = backgroundStyle;
}

function setSelectedElementGradientBackground() {
    let firstColor = $("#gradientColor1").val();
    let secondColor = $("#gradientColor2").val();
    let orientation = $("#gradientOrientationSelector").val();
    let backgroundStyle = "linear-gradient(" + orientation + "," + firstColor + " 0%, " +  secondColor + " 100%)";
    selectedElement.style.background = backgroundStyle;
}

function setSelectedElementGradientBackground() {
    let firstColor = $("#gradientColor1").val();
    let secondColor = $("#gradientColor2").val();
    let orientation = $("#gradientOrientationSelector").val();
    let backgroundStyle = "linear-gradient(" + orientation + "," + firstColor + " 0%, " +  secondColor + " 100%)";
    selectedElement.style.background = backgroundStyle;
}

/*
Sets the selectedElement to the target of the event for which this function is attached to.
*/
function onSelect(event) {
    //prevent the event from triggering layered UI elements that have this same listener.
    event.stopPropagation();
    if (selectedElement) {
        clearSelectedStyling();
    }
    selectedElement = event.target;
    setSelectedStyling();
}

/*
Sets element as the selectedElement
*/
function setSelected(element) {
    clearSelectedStyling();
    customClearSelectedStyling();
    selectedElement = element;
    setSelectedStyling();
}

/*
Styles the selectedElement, so that the user knows what is selected.
*/
function setSelectedStyling() {
    let borderBeforeSelect = selectedElement.style.border;
    customClearSelectedStyling = () => selectedElement.style.border = borderBeforeSelect;
    selectedElement.style.border = "dashed 2px black";
}

//A more modifiable style clearing function for the selected item.
let customClearSelectedStyling = () => clearSelectedStyling();

/*
Undoes the styling caused by setSelectedStyling.
*/
function clearSelectedStyling() {
    selectedElement.style.border = "none";
}

function setSelected(event) {
    selectedElement = event.target;
}