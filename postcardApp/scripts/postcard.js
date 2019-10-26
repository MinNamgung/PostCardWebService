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
    let postcard = $("#postcardContainer");
    let elementType = e.dataTransfer.getData("text");
    let files = e.dataTransfer.files;
    Array.from(files).forEach(file => appendImageFile(file, postcard));
    if (elementType === "chosenFile") {
        let files = document.getElementById("filePicker").files;
        Array.from(files).forEach(file => appendImageFile(file, postcard));
    }
    else if (elementType === "input"){
        
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
        else if (Number(textBox.style.left.replace("px", "")) > postcardWidth - (boxWidth + outlineWidth)){
            textBox.style.left = postcardWidth - (boxWidth + outlineWidth) + "px";
        }
        if (Number(textBox.style.top.replace("px", "")) < 0) {
            textBox.style.top = "0px";
        }
        else if (Number(textBox.style.top.replace("px", "")) > postcardHeight - (boxHeight + outlineWidth)){
            textBox.style.top = postcardHeight - (boxHeight + outlineWidth) + "px";
        }
    }
    else {
        console.log(elementType + " dropped onto postcard!");
    }
}

//Can probably be refactored to handle all element types
function sidebarClickTextBoxWithoutDrag(e){
    let textBox = createTextBox();

    //Place box in middle of the postcard
    textBox.style.left = textBox.parentElement.clientWidth / 2 - textBox.offsetWidth / 2 + "px";
    textBox.style.top = textBox.parentElement.clientHeight / 2 -  textBox.offsetHeight / 2 + "px";
}

//Creates a div with a textbox in it to allow dragging and resizing
function createTextBox(e) {
    let textBox = document.createElement("div");
    textBox.className = "postcard-textbox";
    textBox.addEventListener("mouseover", dragHover);

    let textArea = document.createElement("textarea");
    textArea.className = "postcard-textarea";

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

    textBox.append(textArea);

    //Hover events
    textBox.addEventListener("mouseover", setHoverStyling);
    textBox.addEventListener("mouseout", exitHoverStyling);

    setSelected(textBox);

    $("#postcardContainer").append(textBox);

    //Make textbox draggable and resizable
    $(textBox).draggable({ containment: "#postcardContainer", scroll: false});
        
    $(textBox).resizable({
         containment: "#postcardContainer",
         handles: "ne, nw, se, sw"
         
    });
    //Add event listeners to all the corner resize handles
    $(".ui-resizable-handle").on("mouseover", disableDragHover);
    $(".ui-resizable-handle").on("mouseout", enableDragHover);
    $(".ui-resizable-handle").on("mouseover", resizeHover);
    $(".ui-resizable-handle").on("click", selectParent);
    $(".ui-resizable-handle").on("mouseover", setParentHoverStyling);
    $(".ui-resizable-handle").on("mouseout", exitParentHoverStyling);
    

    return textBox;
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
                appendTo[0].style.background = "url(" + img.src + ")";
                appendTo[0].style.backgroundSize = "100% 100%";
                //setup undo/redo callbacks
                undo.push(() => {
                    img.remove();
                    redo.push(() => appendImageFile(file, appendTo));
                })
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
    setSelected(event.target);
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
}