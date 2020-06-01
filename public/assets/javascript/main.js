$(function () {
    // Shows the available files
    $('#lets-go').click((event) => {
        event.preventDefault();
        $('#front-page').hide()
        $('#file-upload-zone').removeClass('d-none')
        $('#file-upload-zone').addClass('d-flex')
        
        // Gets available files from server
        $.ajax({
            url: '/app/directory',
            method: 'get',
            success: function (data) {
                console.log(data);
                for (let i = 0; i < data.length; i++){
                    dropFiles(data[i])
                }
            }
        })
    })
    // Returns to homepage
    $('#back').click((event) => {
        event.preventDefault();
        $('#file-upload-zone').removeClass('d-flex')
        $('#file-upload-zone').addClass('d-none')
        $('#front-page').show()
    })
})

function dropHandler(ev) {
    console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (ev.dataTransfer.items[i].kind === 'file') {
                var file = ev.dataTransfer.items[i].getAsFile();
                console.log('... file[' + i + '].name = ' + file.name);
                console.log(file)
                
                dropFiles(file.name)
                postRequest(file)
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
            console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);

            dropFiles(ev.dataTransfer.files[i].name)
            postRequest(ev.dataTransfer.files[i])
        }
    }
}

function dragOverHandler(ev) {
    console.log('File(s) in drop zone');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
}

function postRequest(input) {
    // Creates a blank form and appends the file information
    var formData = new FormData();
    formData.append('file', input);

    // Sends an ajax request to post the information to the server
    $.ajax({
        url: '/app/upload',
        method: 'POST',
        data: formData,
        processData: false,  // tell jQuery not to process the data
        contentType: false,  // tell jQuery not to set contentType
        success: function (data) {
            console.log(data);
            alert(data);
        }
    });
}

function dropFiles(name) {
    // Checks if the input is already in the HTML document, if not it adds the link.
    if ($(`[id='${name}']`).length === 0){
        // Appends link with URL to download the file / delete the file
        // onclick="window.location.href = '/download/${name}';" will add functionality to the button as a whole but overrides the close button
        $('#drop_zone').append(`<div id='${name}' class="white-btn grey-background btn btn-outline-primary btn-lg btn-block text-left off-white-color"><a href='/download/${name}' name='${name}' class='links off-white-color'>${name}</a><button type="button" class="close" onclick="removeButton('${name}')">&times;</button></div>`)
    }
}

function removeButton(name) {
    let element = $(`[id='${name}']`)
    // Checks if the element exists and removes it if it does
    if (element){
        element.remove();
    }

    // Calls an ajax request to delete from the server
    $.ajax({
        url: '/app/delete',
        method: 'DELETE',
        data: {'name': name},
        success: function (data) {
            console.log(data);
            alert(data);
        }
    })
}