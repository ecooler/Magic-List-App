/** @namespace dialSheet.dial_sheet_id */
/** @namespace dialSheet.appointments */


$(document).ready(function () {
    $('#dial_sheet_add_dials').click(function () {
        changeDialCount(true);
    });

    $('#dial_sheet_subtract_dials').click(function () {
        changeDialCount(false);
    });

    if ($('#dial_sheet_details_container').length === 0 && $('#dial_sheet_actions').length !== 0) {
        loadDialSheet();
    }
});

function loadDialSheet() {
    $("#all_pages_dial_sheet").hide();

    $('#dial_sheet_content').css('visibility', 'hidden');
    $('#dial_sheet_spinner').css('display', 'block');

    doGet("/dialsheet/current", undefined,
        function (data) {
            renderDialSheet(data);
        },
        function () {
            showToast("There was an error loading your activity sheet. Please refresh the page");
            $('#dial_sheet_spinner').css('display', 'none');
        }
    );

}

function renderDialSheet(dialSheet) {
    var $dialSheetActions = $('#dial_sheet_actions');
    $dialSheetActions.removeClass("hide");
    $dialSheetActions.hide();
    $('#all_pages_dial_sheet-toggle').removeClass("hide");
    $('#dial_sheet_content').css('visibility', 'visible');
    $('#dial_sheet_spinner').css('display', 'none');

    var sheetId = dialSheet.dial_sheet_id;
    var dialCount = dialSheet.dial_count;
    var contactTypesArray = dialSheet.contact_types;
    var appointmentsArray = dialSheet.appointments;
    var contactsCount = dialSheet.contacts_count;

    var cardActionsContainer = document.querySelector("#dial_sheet_actions");

    var detailsAnchor = document.createElement("a");
    detailsAnchor.className = "btn-flat white-text waves-effect";
    detailsAnchor.href = "/dialsheet/details/" + sheetId;
    detailsAnchor.innerHTML = "View Activity Sheet Details";
    cardActionsContainer.appendChild(detailsAnchor);

    $('.dial-sheet-dials-count').html(dialCount);
    $('.dial-sheet-contacts-count').html(contactsCount);

    for (var i = 0; i < contactTypesArray.length; i++) {
        $('#dial_sheet_count_' + contactTypesArray[i].state_type).html(contactTypesArray[i].state_count);
    }

    renderAppointments(appointmentsArray);

    $dialSheetActions.show(300);
}

function renderAppointments(appointmentsArray) {
    var $appointmentsContainer = $('#appointments_container');
    $appointmentsContainer.children().each(function () {
        $(this).remove();
    });

    if (appointmentsArray.length === 0) {
        var $h5 = $('<h5 class="black-text">You have not scheduled any appointments yet today</h5>');
        $appointmentsContainer.append($h5);
    } else {
        const $ul = $('<ul class="collection black-text" id="appointments-list" style="overflow-y: visible"></ul>');
        $appointmentsContainer.append($ul);

        appointmentsArray.forEach(function (appointment) {
            createAppointmentForListUiAndAppend(appointment);
        });
    }
}

function createAppointmentForListUiAndAppend(appointment) {
    if (!$('#appointments-list').length) {
        return;
    }

    var appointmentId = appointment.appointment_id;
    var appointmentCount = $('#appointments_count');
    appointmentCount.html(parseInt(appointmentCount.html()) + 1);

    var person = appointment.person;
    var listItem = document.createElement("li");
    listItem.className = "collection-item avatar appointment-collection-item appointment_" + appointmentId;
    $(listItem).attr("data-person-name", person.person_name);
    document.querySelector('#appointments-list').appendChild(listItem);

    var primaryContentSpan = document.createElement("span");
    primaryContentSpan.className = "title";
    listItem.appendChild(primaryContentSpan);

    var icon = document.createElement("i");
    icon.className = "material-icons circle";
    icon.innerHTML = "person";
    primaryContentSpan.appendChild(icon);

    var anchor = document.createElement("a");
    anchor.className = "indigo-text person_name_" + person.person_id;
    anchor.href = "/person/" + person.person_id;
    anchor.innerHTML = person.person_name;
    primaryContentSpan.appendChild(anchor);

    var innerParagraphBody = document.createElement("p");

    var companySpan = document.createElement("span");
    companySpan.innerHTML = person.company_name;
    companySpan.className += "person_company_name_" + person.person_id;
    innerParagraphBody.appendChild(companySpan);
    innerParagraphBody.innerHTML += "<br>";

    var jobTitleSpan = document.createElement("span");
    jobTitleSpan.innerHTML = person.job_title;
    jobTitleSpan.className += "person_job_title_" + person.person_id;
    innerParagraphBody.appendChild(jobTitleSpan);
    innerParagraphBody.innerHTML += "<br>";

    if (person.email) {
        var emailSpan = document.createElement("span");
        emailSpan.innerHTML = person.email;
        emailSpan.className += "person_email_" + person.person_id;
        innerParagraphBody.appendChild(emailSpan);
        innerParagraphBody.innerHTML += "<br>";
    }

    if (person.phone_number) {
        var phoneNumberSpan = document.createElement("span");
        phoneNumberSpan.innerHTML = person.phone_number;
        phoneNumberSpan.className += "person_phone_" + person.person_id;
        innerParagraphBody.appendChild(phoneNumberSpan);
        innerParagraphBody.innerHTML += "<br>";
    }

    primaryContentSpan.appendChild(innerParagraphBody);

    var appointmentLocation = $("<span></span>");
    var isConferenceCall = appointment.is_conference_call;
    if (isConferenceCall) {
        appointmentLocation.html("Conference Call");
    } else {
        appointmentLocation.html("In Person");
    }
    appointmentLocation.attr("data-is-conference-call", isConferenceCall);
    appointmentLocation.addClass("appointment_location_" + appointmentId);

    var notes = appointment.notes === null ? "" : appointment.notes;
    var secondarySpan = document.createElement("span");
    secondarySpan.style.top = "8px";
    secondarySpan.className = "secondary-content indigo-text";
    secondarySpan.append(appointmentLocation[0]);
    secondarySpan.innerHTML += "<br>";
    secondarySpan.innerHTML +=
        "<b><span class='appointment_date_" + appointmentId + "' data='" + appointment.appointment_date + "'>" +
        getShortDateWithTime(appointment.appointment_date) +
        "</span></b>";
    secondarySpan.innerHTML +=
        "<span>" +
        "   Type: &nbsp; " +
        "   <span class=\"appointment_type_" + appointmentId + "\" " +
        "   data=\"" + appointment.appointment_type.state_type + "\">" + appointment.appointment_type.state_description + "</span> " +
        "</span>";
    secondarySpan.innerHTML +=
        "<span class='hide appointment_notes_" + appointmentId + "'>" + notes + "</span><br>" +
        "<button style='padding: 0' class='btn-flat' " +
        "onclick='showAppointmentNotesDialog(\"" + appointmentId + "\", \"" + person.person_name + "\")'> " +
        "Notes" +
        "<i class='material-icons black-text left'>speaker_notes</i> " +
        "</button>";
    secondarySpan.innerHTML +=
        "<br>" +
        "<button class='btn-flat side-padding-small dropdown-button' data-beloworigin='false' " +
        "data-activates='dropdown-" + appointmentId + "'>" +
        "<i class='material-icons'>more_horiz</i>" +
        "</button>";
    var $optionsDropdown = $("<ul id='dropdown-" + appointmentId + "' class='dropdown-content'></ul>");
    $optionsDropdown.addClass("dropdown-content");
    var $editListItem = $("<li></li>");
    var $editAnchor = $("<a>Edit</a>");
    $editAnchor.click(function () {
        showEditAppointmentDialog(appointmentId, person.person_id);
    });
    $editListItem.append($editAnchor);

    var $deleteListItem = $("<li></li>");
    var $deleteAnchor = $("<a>Delete</a>");
    $deleteAnchor.click(function () {
        showDeleteAppointmentDialog(appointmentId);
    });
    $deleteListItem.append($deleteAnchor);

    $optionsDropdown.append($editListItem);
    $optionsDropdown.append($deleteListItem);

    secondarySpan.appendChild($optionsDropdown[0]);

    listItem.appendChild(secondarySpan);

    $('.dropdown-button').dropdown({
            inDuration: 300,
            outDuration: 225,
            constrainWidth: false,
            hover: false,
            gutter: 0,
            belowOrigin: false,
            alignment: 'left',
            stopPropagation: false
        }
    );
}

function addAppointmentToTableUi(appointment) {
    var $tableNode = $('#no-appointments');
    if ($tableNode.length === 0) {
        return;
    }

    if ($tableNode.is(':visible')) {
        $tableNode.hide();
    }

    var appointmentId = appointment.appointment_id;

    var $tbody = $('#appointments_table').find('> tbody');
    var $tr = $("<tr class='appointment_" + appointmentId + "'></tr>");
    $tr.attr("data-person-name", appointment.person.person_name);
    $tbody.append($tr);

    var $appointmentDateTd = $("<td></td>");
    $appointmentDateTd.addClass('appointment_date_' + appointmentId);
    $appointmentDateTd.attr('data', appointment.date);
    $appointmentDateTd.html(
        "<b>" +
        moment(appointment.date).format('M/D/YY') +
        " at " +
        moment(appointment.date).format('h:mm A') +
        "</b>"
    );

    var $appointmentLocation = $("<td></td>");
    $appointmentLocation.addClass("appointment_location_" + appointmentId);
    if (appointment.is_conference_call) {
        $appointmentLocation.attr("data-is-conference-call", true);
        $appointmentLocation.html("Conference Call");
    } else {
        $appointmentLocation.attr("data-is-conference-call", false);
        $appointmentLocation.html("In Person");
    }

    var $creatorCell = $("<td></td>");
    const name = $('.name').html();
    $creatorCell.append($("<span class='green-text text-darken-1'>" + name + "</span>"));

    var $appointmentTypeCell = $("<td></td>");
    $appointmentTypeCell.addClass("appointment_type_" + appointmentId);
    $appointmentTypeCell.attr("data", appointment.appointment_type.state_type);
    $appointmentTypeCell.html(contactStatus.getContactStateDescriptionFromType(appointment.appointment_type.state_type));

    var $optionsCell = $("<td></td>");
    var $dropDownButton = $("<a></a>");
    $dropDownButton.addClass("btn-flat dropdown-button side-padding-small");
    $dropDownButton.attr("data-beloworigin", "true");
    $dropDownButton.attr("data-alignment", "right");
    $dropDownButton.attr("data-activates", "dropdown-person_details-" + appointmentId);

    var $iconNode = $("<i class='material-icons'>more_vert</i>");
    $dropDownButton.append($iconNode);

    $optionsCell.append($dropDownButton);

    var $dropDownList = $("<ul></ul>");
    $dropDownList.attr("id", "dropdown-person_details-" + appointmentId);
    $dropDownList.addClass("dropdown-content");

    var $dropDownListNotes = $("<li></li>");
    $dropDownList.append($dropDownListNotes);

    var $notesSpan = $("<span></span>");
    $notesSpan.html(appointment.notes);
    $notesSpan.addClass("hide appointment_notes_" + appointmentId);
    $dropDownListNotes.append($notesSpan);

    var $notesButton = $("<a></a>");
    $notesButton.html("View Notes");
    $notesButton.click(function () {
        return showAppointmentNotesDialog(appointmentId, appointment.person.person_id);
    });
    $dropDownListNotes.append($notesButton);

    var $dropDownListEdit = $("<li></li>");
    var $editButton = $("<a>Edit</a>");
    $editButton.click(function () {
        showEditAppointmentDialog(appointmentId, appointment.person.person_id);
    });
    $dropDownListEdit.append($editButton);
    $dropDownList.append($dropDownListEdit);

    var $dropDownListDelete = $("<li></li>");
    var $deleteButton = $("<a>Delete</a>");
    $deleteButton.click(function () {
        showDeleteAppointmentDialog(appointmentId);
    });
    $dropDownListDelete.append($deleteButton);
    $dropDownList.append($dropDownListDelete);

    $optionsCell.append($dropDownList);

    $tr.append($appointmentDateTd);
    $tr.append($appointmentLocation);
    $tr.append($creatorCell);
    $tr.append($appointmentTypeCell);
    $tr.append($optionsCell);

    $('.dropdown-button').dropdown({});

    $grid.masonry();
}

var isShown = false;

function toggleDialSheetHeight() {
    var node = $("#all_pages_dial_sheet");

    node[0].className = "";

    isShown = !isShown;
    if (isShown) {
        $('#all_pages_dial_sheet-toggle').html("Hide Prospecting Sheet");
    } else {
        $('#all_pages_dial_sheet-toggle').html("Show Prospecting Sheet");
    }

    node.toggle("slide");
}

function changeDialCount(shouldAdd) {
    var $dialSheetCountSpan = $('.dial-sheet-dials-count');
    var currentCount = parseInt($dialSheetCountSpan.html());
    if (currentCount === 0 && !shouldAdd) {
        showToast("You cannot have negative dials");
        return;
    }

    var json = {};
    json.should_increment = shouldAdd;

    doPost("/dialsheet/dials/change/today", json,
        function () {
            console.log("Dials updated successfully");
        }, function () {
            showToast("There was an error updating the dial count");
            $dialSheetCountSpan.html("" + currentCount);
        }
    );

    var newCount = shouldAdd ? currentCount + 1 : currentCount - 1;
    $dialSheetCountSpan.html("" + "" + newCount);
}

const activitySheetState = {
    url: "/dialsheet/past/unfulfilled",
    current_page: 1,
    ascending: false
};

function doGetForActivitySheetAlerts(activitySheetState, isLoadMore) {
    const paginationId = "activity-sheets";

    const json = {
        ascending: activitySheetState.ascending,
        page: activitySheetState.current_page
    };

    $('#progress-activity-sheets').show(300);

    doGet(activitySheetState.url, json, success, error);

    function success(data) {
        $('#progress-activity-sheets').hide(300);

        if (!isLoadMore) {
            // Reset pagination to initial amount
            resetPaginationRange(paginationId);
        }

        data.list.forEach(function (item) {
            updatePaginationRange(true, paginationId);
            alerts.getActivitySheetItem(item).insertBefore('#progress-activity-sheets');
        });

        if (getPaginationCurrentAmount(paginationId) === getPaginationTotal(paginationId)) {
            // there are no more appointments to load
            $('#load-more-activity-sheets').hide(300);
        }

        if (!$('.activity-sheets').length) {
            $('#activity-sheets-no-results').show(300);
        }
    }

    function error() {
        $('#progress-activity-sheets').hide(300);

        showToast("There was an error getting your appointment alerts. Please refresh the page or submit a bug report.");
    }

}