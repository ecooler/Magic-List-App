/** @namespace data.appointment */
/** @namespace data.dial_sheet */
/** @namespace json.appointment_id */
/** @namespace data.template_id */
/** @namespace data.template_name */
/** @namespace json.field_name */


$('.modal').modal();

$('.close').click(function () {
    $('.modal').modal('close');
});

function showProgressDialog() {
    $('#progress_dialog').modal("open");
}

function closeProgressDialog() {
    $('#progress_dialog').modal("close");
}

function showReadOnlyDialog() {
    $('#read_only_dialog').modal('open');
}

function showEditNotesDialog(submitClickFunction) {
    Materialize.updateTextFields();
    $('#edit_notes_submit')[0].onclick = submitClickFunction;
    $('#edit_notes_dialog').modal('open');
}

function showSingleLineDialog(submitClickFunction) {
    Materialize.updateTextFields();
    $('#edit_single_line_submit')[0].onclick = submitClickFunction;
    $('#edit_single_line_dialog').modal('open');
}

function showDateWithTimeDialog(submitClickFunction) {
    Materialize.updateTextFields();
    $('#date_with_time_dialog_submit')[0].onclick = submitClickFunction;
    $('#date_with_time_dialog').modal("open");
}

function showDeleteDialog(submitClickFunction) {
    $('#delete_dialog_submit')[0].onclick = submitClickFunction;
    $('#delete_dialog').modal('open');
}


function showConfirmationDialog(submitClickFunction) {
    $('#confirmation_dialog_submit')[0].onclick = submitClickFunction;
    $('#confirmation_dialog').modal("open");
}

function showDeleteCardDialog(cardId, lastFour) {
    $('#delete_dialog_title').html("Delete Card?");
    $('#delete_dialog_content').html("Are you sure you want to delete the card ending with " + lastFour + "? " +
        "This action cannot be undone.");

    showDeleteDialog(function () {
            var json = {};
            json.card_id = cardId;

            $('.submit').addClass("disabled");
            $('.close').addClass("disabled");

            doPost("/api/plan/cards/delete", json, function () {
                    var $node = $('#' + cardId);
                    $node.hide(300, function () {
                        $node.remove();
                    });

                    $('.submit').removeClass("disabled");
                    $('.close').removeClass("disabled");
                    $('.modal').modal('close');
                }, function (xhr) {
                    if (xhr.status !== 409) {
                        showToast("There was an error deleting your card. Please try again or submit a bug report");

                        $('.submit').removeClass("disabled");
                        $('.close').removeClass("disabled");
                        $('.modal').modal('close');
                    } else {
                        showToast("You cannot delete your only payment method");

                        $('.submit').removeClass("disabled");
                        $('.close').removeClass("disabled");
                        $('.modal').modal('close');
                    }
                }
            );
        }
    );
}

// PERSON

function showEditPersonPreviewNotesDialog(personId) {
    $('#edit_notes_dialog_text').val($('#notes_text_' + personId).html());
    showEditNotesDialog(function () {
        $('#notes_text_' + personId).html($('#edit_notes_dialog_text').val());
        $('.modal').modal("close");
    });
}

function showDeletePersonDialog(personId, completionFunction) {
    $('#delete_dialog_content').html("Are you sure you want to delete this prospect? This will delete all of their " +
        "appointments, notifications and affect your activity sheet\'s statistics. This will <b>not</b> delete the " +
        "prospect from any co-workers with which you may have shared this prospect. This action <b>cannot</b> be undone.");
    $('#delete_dialog_title').html("Delete Person?");

    showDeleteDialog(function () {
        $('.submit').addClass("disabled");
        $('.close').addClass("disabled");

        doPost("/person/delete/" + personId, {}, function () {
            $('.submit').removeClass("disabled");
            $('.close').removeClass("disabled");

            $('.modal').modal("close");
            showToast("Prospect deleted");

            $('#person-row-' + personId).remove();

            if (completionFunction) {
                completionFunction(personId);
            }
        }, function () {
            $('.submit').removeClass("disabled");
            $('.close').removeClass("disabled");

            showToast("There was an error deleting this prospect. Please try again or submit a bug report");
        });
    });
}

function showEditPersonNotesDialog(personId) {
    $('#edit_notes_dialog_text').val($("#notes_text_" + personId).html());

    showEditNotesDialog(function () {
        $('.submit').addClass("disabled");
        $('.close').addClass("disabled");

        var notes = $("#edit_notes_dialog_text").val();
        var json = {};
        json.person_notes = notes;

        doPost("/person/notes/edit/" + personId, json, function () {
                showToast("Person notes successfully updated");
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");

                $('#notes_text_' + personId).html(notes);
                $('.modal').modal('close');
            }, function () {
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");

                showToast("Could not save person notes");
            }
        );
    });
}

/**
 * @param listId An optional list ID, which means the user can add this person to a list too.
 * @param listName An optional name for the list, to be displayed in the dialog, if available.
 */
function showCreatePersonDialog(listId, listName) {
    $('#edit_name_field').val("");
    $('#edit_email_field').val("");
    $('#edit_phone_field').val("");
    $('#edit_company_name_field').val("");
    $('#edit_job_title_field').val("");

    $('#edit_person_dialog_title').html("Create Contact");

    //noinspection JSUnresolvedFunction,JSUnresolvedVariable
    Materialize.updateTextFields();

    if (listId) {
        $('#list-checkbox-wrapper').show();
        $('#list-checkbox').prop("checked", true);
    } else {
        $('#list-checkbox-wrapper').hide();
    }

    if (listName) {
        $('#list-checkbox-list-name').html("(" + listName + ")");
    } else {
        $('#list-checkbox-list-name').html("");
    }

    $('#edit_person_dialog').modal('open');

    $('#edit_person_dialog_submit')[0].onclick = function () {
        var name = $("#edit_name_field").val();
        var email = $("#edit_email_field").val();
        var phone = $("#edit_phone_field").val();
        var companyName = $("#edit_company_name_field").val();
        var jobTitle = $("#edit_job_title_field").val();

        var $errorNode = $('#edit_person_dialog_error');
        if (!sanitizePerson(name, email, phone, companyName, jobTitle, $errorNode)) {
            return;
        }

        var json = {};
        json.person_name = name;
        json.email = email;
        json.phone_number = phone;
        json.company_name = companyName;
        json.job_title = jobTitle;

        var didAddToList = false;
        if ($('#list-checkbox').is(":checked")) {
            json.list_id = listId;
            didAddToList = true;
        }

        $('.submit').addClass("disabled");
        $('.close').addClass('disabled');

        doPost("/person/create", json, function () {
                showToast("Contact created");
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");

                $('.modal').modal('close');

                if (didAddToList) {
                    location.reload();
                }
            }, function (xhr) {
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");

                json = JSON.parse(xhr.responseText);
                if (xhr.status === 400 && json.field_name === 'email') {
                    showToast("The email you entered is invalid");
                } else {
                    showToast("There was an error processing your request");
                }
            }
        );
    };
}

function showEditPersonDialog(personId) {
    $('#edit_name_field').val($('.person_name_' + personId).html());
    $('#edit_email_field').val($('.person_email_' + personId).html());
    $('#edit_phone_field').val($('.person_phone_' + personId).html());
    $('#edit_company_name_field').val($('.person_company_name_' + personId).html());
    $('#edit_job_title_field').val($('.person_job_title_' + personId).html());

    //noinspection JSUnresolvedFunction,JSUnresolvedVariable
    Materialize.updateTextFields();

    $('#edit_person_dialog_title').html("Edit Contact");

    $('#edit_person_dialog').modal('open');

    $('#edit_person_dialog_submit')[0].onclick = function () {
        var name = $("#edit_name_field").val();
        var email = $("#edit_email_field").val();
        var phone = $("#edit_phone_field").val();
        var companyName = $("#edit_company_name_field").val();
        var jobTitle = $("#edit_job_title_field").val();

        var $errorNode = $('#edit_person_dialog_error');
        if (!sanitizePerson(name, email, phone, companyName, jobTitle, $errorNode)) {
            return;
        }

        var json = {};
        json.person_name = name;
        json.email = email;
        json.phone_number = phone;
        json.company_name = companyName;
        json.job_title = jobTitle;

        $('.submit').addClass("disabled");
        $('.close').addClass('disabled');

        doPost("/person/update/" + personId, json, function () {
                showToast("Person edited successfully");
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");

                $('.person_name_' + personId).html($('#edit_name_field').val());
                $('.person_email_' + personId).html($('#edit_email_field').val());
                $('.person_phone_' + personId).html($('#edit_phone_field').val());
                $('.person_company_name_' + personId).html($('#edit_company_name_field').val());
                $('.person_job_title_' + personId).html($('#edit_job_title_field').val());

                $('.modal').modal('close');
            }, function () {
                showToast("There was an error processing your request");
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");
            }
        );
    };
}

// DIAL SHEETS

/**
 * @param sheetId The dial sheet ID.
 * @param callback An optional callback function to be invoked if the dial count is edited successfully
 */
function showEditDialCountDialog(sheetId, callback) {
    const dialSheetDate = $('#' + sheetId).find(" > .title").html();
    if (dialSheetDate) {
        $('#edit_single_line_title').html("Change Dial Count - " + dialSheetDate);
    } else {
        $('#edit_single_line_title').html("Change Dial Count");
    }
    $('#edit_single_line_label').html("Dial Count");
    $('#edit_single_line_field').val($('.dial-sheet-dials-count').html());
    showSingleLineDialog(function () {
        var amount = parseInt($('#edit_single_line_field').val());

        if (isNaN(amount) || amount < 0) {
            showToast("You must enter a valid number that is greater than or equal to 0");
            return;
        }

        var json = {};
        json.dial_count = amount;

        $('.submit').addClass("disabled");
        $('.close').addClass("disabled");

        doPost("/dialsheet/dials/change/" + sheetId, json, function () {
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");

                $('.dial-sheet-dials-count').html(amount);
                $('.modal').modal("close");

                if (callback && typeof callback === 'function') {
                    callback();
                }
            }, function () {
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");
                showToast("There was an error updating the dial count. Please try again or submit a bug report");
            }
        );
    });
}

function showEditContactTimeDialog(personId, originalActivitySheetId, contactTime) {
    $('#date_with_time_dialog_title').html("Edit Contact Time");

    $('#date_with_time_dialog_content').html("");

    contactTime = moment(contactTime, "x");
    $('#date_with_time_dialog_date_picker').val(contactTime.format("D MMMM, YYYY"));
    $('#date_with_time_dialog_time_picker').val(contactTime.format("hh:mmA"));

    showDateWithTimeDialog(function () {
            const dateWithTime = moment($('#date_with_time_dialog_date_picker').val(), "D MMMM, YYYY");
            const time = moment($('#date_with_time_dialog_time_picker').val(), "hh:mmA");

            dateWithTime.hour(time.hour());
            dateWithTime.minute(time.minute());

            if (moment().isBefore(dateWithTime)) {
                showToast("You must input a contact time that is before the current time");
                return;
            }

            var json = {
                person_id: personId,
                original_activity_sheet_id: originalActivitySheetId,
                new_contact_time: dateWithTime.format("x")
            };

            doPost("/dialsheet/contact/editTime", json, success, error);

            function success(dialSheet) {
                const $contactTime = $('#activity-sheet-contact-' + originalActivitySheetId);
                $contactTime.html(getShortDateWithTime(dateWithTime.format("x")));
                $contactTime.attr("id", "activity-sheet-contact-" + dialSheet.dial_sheet_id);

                const $auditItem = $('#audit-item-' + originalActivitySheetId);
                $auditItem.attr("id", "audit-item-" + dialSheet.dial_sheet_id);
                $auditItem.attr("data-sheet-id", dialSheet.dial_sheet_id);
                $auditItem.attr("data-date", dateWithTime.format("x"));

                showToast("Contact time successfully updated");
                $('.modal').modal("close");
            }

            function error() {
                showToast("There was an error updating the contact time");
            }
        }
    );
}

function showEditTimeDialogForNotification(notificationDateTime, notificationId, entityName, stateType,
                                           stateDescription, stateClass) {
    const contactTimeMoment = moment(parseInt(notificationDateTime), "x");

    var isBeforeOneHour = contactTimeMoment.isBefore(moment().subtract(1, "hour"));
    var isAfterOneHour = contactTimeMoment.isAfter(moment().add(1, "hour"));
    if (isBeforeOneHour || isAfterOneHour) {
        // The current time is NOT within a one hour window of the notification
        // Let's prompt the user for when they contacted them to make sure we're accurate.

        $('#date_with_time_dialog_title').html("When did you contact this person for this notification?");
        var text = "Your notification for " + entityName + " was scheduled for <b>" +
            getLongDateWithTime(notificationDateTime) + "</b>.<br><br>";
        if (isBeforeOneHour) {
            text += "This notification was scheduled for a while ago.";
        } else {
            text += "This notification hasn\'t occurred yet.";
        }
        text += " Since <i>Magic List</i> defaults to the current time when setting a contact status, please verify " +
            "the time you contacted " + entityName + ".";

        $('#date_with_time_dialog_content').html(text);

        const currentTime = moment();

        $('#date_with_time_dialog_date_picker').val(currentTime.format("D MMMM, YYYY"));
        $('#date_with_time_dialog_time_picker').val(currentTime.format("hh:mmA"));

        showDateWithTimeDialog(function () {
                const dateWithTime = moment($('#date_with_time_dialog_date_picker').val(), "D MMMM, YYYY");
                const time = moment($('#date_with_time_dialog_time_picker').val(), "hh:mmA");

                dateWithTime.hour(time.hour());
                dateWithTime.minute(time.minute());

                if (moment().isBefore(dateWithTime)) {
                    showToast("You must input a contact time that is before the current time");
                    return;
                }

                onSubmitDateWithTime(dateWithTime);
            }
        );

    } else {
        onSubmitDateWithTime(contactTimeMoment);
    }

    function onSubmitDateWithTime(dateWithTimeMoment) {
        contactStatus.notificationOutcomeClickFunction(notificationId, entityName, stateType, dateWithTimeMoment);
        contactStatus.onStateClick(notificationId, stateType, stateDescription, stateClass);
    }
}


// LISTS

function showCreateListDialog(filterCriteria) {
    var total = parseInt($('#total_search_results').attr('data-total'));
    if (total > 1000) {
        showToast("You can only create new lists that have less than 1,000 rows");
        return;
    }

    $('#create_list_dialog').modal('open');

    $('#create_list_dialog_submit')[0].onclick = function () {
        var $error = $('.error');

        var listName = $('#create_list_dialog_field').val();
        if (!listName || listName.trim().length === 0) {
            $error.css("display", "block");
            $error.html("Search name cannot be blank");
        } else {
            $error.css("display", "none");
            $error.html("");

            var json = filterCriteria;
            json.list_name = listName;

            $('.submit').addClass("disabled");
            $('.close').addClass("disabled");

            doPost("/api/list/create", json, function () {
                    $('.submit').removeClass("disabled");
                    $('.close').removeClass("disabled");
                    $('#list_name_text').val("");

                    $('.modal').modal('close');
                    showToast("List created");
                }, function () {
                    $('.submit').removeClass("disabled");
                    $('.close').removeClass("disabled");

                    showToast("There was an error creating your new list. Please retry or submit a bug report");
                }
            );
        }
    };
}

function showListCommentDialog(listId) {
    $('#read_only_dialog_title').html("List Notes");
    $('#read_only_dialog_content').html($('#comment_text_' + listId).html());
    showReadOnlyDialog();
}

function showEditListCommentDialog(listId) {
    $('#edit_notes_dialog_text').val($('#comment_text_' + listId).html());
    showEditNotesDialog(function () {
            var $submitButton = $('#edit_notes_submit');
            var $closeButton = $('.close');

            var comment = $('#edit_notes_dialog_text').val();
            var json = {};
            json.comment = comment;

            $submitButton.addClass("disabled");
            $closeButton.addClass("disabled");

            doPost("/api/list/comment/edit/" + listId, json, function () {
                    showToast("List notes saved");
                    $submitButton.removeClass("disabled");
                    $closeButton.removeClass("disabled");

                    $('#comment_text_' + listId).html(comment);
                    $('.modal').modal('close');
                }, function () {
                    $submitButton.removeClass("disabled");
                    $closeButton.removeClass("disabled");

                    showToast("There was an error saving your list\'s notes. Please try again or submit a bug report");
                }
            );
        }
    );
}

function showEditListNameDialog(listId) {
    $('#edit_single_line_title').html("Edit List Name");
    $('#edit_single_line_field').val($("#list_name_anchor_" + listId).html());
    $('#edit_single_line_label').html("List Name");

    showSingleLineDialog(function () {
        var json = {};
        var listName = $('#edit_single_line_field').val();
        json.list_name = listName;

        $('.submit').addClass("disabled");
        $('.close').addClass("disabled");

        doPost("/api/list/name/edit/" + listId, json, function () {
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");

                $("#list_name_anchor_" + listId).html(listName);
                $('.modal').modal('close');
            }, function () {
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");

                showToast("An error occurred and your new list name could not be saved");
            }
        );
    });
}

function showDeleteListDialog(listId) {
    $('#delete_dialog_title').html("Delete List?");
    $('#delete_dialog_content').html("Are you sure you want to delete this list? Note, this <i>will not</i> delete your contacts.");

    showDeleteDialog(function () {

        var json = {};

        $('.submit').addClass("disabled");
        $('.close').addClass("disabled");

        doPost("/api/list/delete/" + listId, json, function () {
                showToast("List deleted");
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");

                $('#row_' + listId).remove();
                $('.modal').modal("close");
            }, function () {
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");
                showToast("There was an error deleting your list. Please try again or submit a bug report");
            }
        );
    });
}

// APPOINTMENTS

function showAppointmentDialog(submitFunction) {
    $('#appointment_dialog_submit')[0].onclick = submitFunction;
    $('#appointment_create_edit_dialog').modal("open");
}

function showCreateAppointmentDialog(personId, inventoryStateType) {
    const state = contactStatus.getContactStatusFromStateType(inventoryStateType);
    if (state && state.is_introduction) {
        $('#appointment_dialog_title').html("Create Introduction Appointment");
    } else if (state && state.is_inventory) {
        $('#appointment_dialog_title').html("Create Inventory Appointment");
    } else {
        $('#appointment_dialog_title').html("Create Appointment");
    }

    $('#appointment_dialog_submit').html("Create");

    var currentDate = moment()
        .add(userSettings.appointmentQuantity, userSettings.appointmentUnit)
        .hour(userSettings.appointmentHour)
        .minute(userSettings.appointmentMinute);

    $('#appointment_dialog_conference_call').prop('checked', true);
    $('#appointment_dialog_message_text').val("");
    $('#appointment_dialog_date_picker').val(currentDate.format("DD MMMM, YYYY"));
    $('#appointment_dialog_time_picker').val(currentDate.format("hh:mmA"));

    const $select = $('#appointment_dialog_appointment_type');
    contactStatus.destroyInventoryDropdown($select);
    contactStatus.setupInventoryDropdown($select, inventoryStateType);

    showAppointmentDialog(function () {
        // Validate
        var date = moment($('#appointment_dialog_date_picker').val() + " " + $('#appointment_dialog_time_picker').val(), "DD MMMM, YYYY hh:mmA");
        if (!date.isValid()) {
            showToast("You must enter a valid date");
            return;
        }

        var isConferenceCall = !!$('#appointment_dialog_conference_call').is(":checked");
        var dateInUnixMillis = date.format("x");
        var notes = $('#appointment_dialog_message_text').val();

        var json = {};
        json.person_id = personId;
        json.is_conference_call = isConferenceCall;
        json.appointment_date = dateInUnixMillis;
        json.notes = notes;
        json.appointment_type = $('#appointment_dialog_appointment_type').val();

        $('.submit').addClass("disabled");
        $('.close').addClass("disabled");

        doPost("/dialsheet/appointment/create", json, function (data) {
                showToast("Appointment scheduled successfully");

                const dialSheet = data.dial_sheet;
                onDialSheetChanged(dialSheet, personId);

                const appointment = data.appointment;
                if ($('#appointments-list').length >= 1) {
                    createAppointmentForListUiAndAppend(appointment);
                } else {
                    const $appointmentContainer = $('#appointments_container');
                    $appointmentContainer.children().remove();

                    const $ul = $('<ul class="collection black-text"></ul>');
                    $ul.attr("id", "appointments-list");
                    $ul.css("overflowY", "visible");
                    $appointmentContainer.append($ul);

                    createAppointmentForListUiAndAppend(appointment);
                }

                addAppointmentToTableUi(appointment);

                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");

                $('#appointment_create_edit_dialog').modal('close');

                showGetAppointmentTemplatesDialog(appointment.appointment_id);
            }, function () {
                showToast("There was an error scheduling your appointment");

                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");
            }
        );
    });
}

function showEditAppointmentDialog(appointmentId, personId) {
    const appointmentType = $('.appointment_type_' + appointmentId).attr("data");

    const state = contactStatus.getContactStatusFromStateType(appointmentType);
    if (state.is_introduction) {
        $('#appointment_dialog_title').html("Edit Introduction Appointment");
    } else if (state.is_inventory) {
        $('#appointment_dialog_title').html("Edit Inventory Appointment");
    } else {
        $('#appointment_dialog_title').html("Edit Appointment");
    }

    $('#appointment_dialog_submit').html("Save");

    var $appointmentNotes = $('#appointment_dialog_message_text');
    $appointmentNotes.val($('.appointment_notes_' + appointmentId).html());
    $appointmentNotes.addClass("active");

    var dateInMillis = $('.appointment_date_' + appointmentId).attr("data");
    var date = moment(parseFloat(dateInMillis));
    $('#appointment_dialog_date_picker').val(date.format("DD MMMM, YYYY"));
    $('#appointment_dialog_time_picker').val(date.format("hh:mmA"));

    var isConferenceCall = !!$('.appointment_location_' + appointmentId).attr('data-is-conference-call');
    $('#appointment_dialog_conference_call').prop("checked", isConferenceCall);
    $('#appointment_dialog_in_person').prop("checked", !isConferenceCall);

    const $select = $('#appointment_dialog_appointment_type');
    contactStatus.destroyInventoryDropdown($select);
    contactStatus.setupInventoryDropdown($select, appointmentType);

    Materialize.updateTextFields();

    showAppointmentDialog(function () {
            // Validate
            var chosenDate = $('#appointment_dialog_date_picker').val();
            var chosenTime = $('#appointment_dialog_time_picker').val();
            var date = moment(chosenDate + " " + chosenTime, "DD MMMM, YYYY hh:mmA");
            var dateInUnixMillis = date.format("x");
            var isConferenceCall = !!$('#appointment_dialog_conference_call').prop("checked");

            if (!date.isValid()) {
                showToast("Invalid date or time selected");
                return;
            }

            var json = {};
            json.person_id = personId;
            json.is_conference_call = isConferenceCall;
            json.appointment_date = dateInUnixMillis;
            json.notes = $('#appointment_dialog_message_text').val();
            json.appointment_type = $('#appointment_dialog_appointment_type').val();

            $('.submit').addClass("disabled");
            $('.close').addClass("disabled");

            doPost("/dialsheet/appointment/edit/" + appointmentId, json, function () {
                    showToast("Appointment edited successfully");

                    var $dateNode = $('.appointment_date_' + appointmentId);
                    date = moment(parseFloat(dateInUnixMillis));
                    $dateNode.html("<b>" + date.format("M/D/YY") + " at " + date.format("h:mmA") + "</b>");
                    $dateNode.attr("data", date.format('x'));

                    var $isConferenceCallSpan = $('.appointment_location_' + appointmentId);
                    $isConferenceCallSpan.html(isConferenceCall ? "Conference Call" : "In Person");
                    $isConferenceCallSpan.attr("data-is-conference-call", isConferenceCall);

                    $('.appointment_notes_' + appointmentId).html($('#appointment_dialog_message_text').val());

                    const $appointmentType = $('.appointment_type_' + appointmentId);
                    $appointmentType.attr("data", json.appointment_type);
                    $appointmentType.html(contactStatus.getContactStateDescriptionFromType(json.appointment_type));

                    $('.modal').modal('close');

                    $('.submit').removeClass("disabled");
                    $('.close').removeClass("disabled");
                }, function () {
                    showToast("There was an error editing your appointment");

                    $('.submit').removeClass("disabled");
                    $('.close').removeClass("disabled");
                }
            );
        }
    );
}

function showAppointmentNotesDialog(appointmentId, personId) {
    const personName = $('.person_name_' + personId).html();
    $('#read_only_dialog_title').html("Appointment Notes for " + personName);
    $('#read_only_dialog_content').html($('.appointment_notes_' + appointmentId).html());
    $('#read_only_dialog').modal('open');
}

function showDeleteAppointmentDialog(appointmentId) {
    const personName = $(".appointment_" + appointmentId).attr("data-person-name");
    $('#delete_dialog_title').html("Delete Appointment?");
    $('#delete_dialog_content').html("Are you sure you want to delete this appointment with " + personName + "? " +
        "This action cannot be undone, and doing so will unlink this appointment from any calendar invites you " +
        "sent. Note, this will <i>not</i> delete the calendar invites you may have sent for this appointment.");

    showDeleteDialog(function () {
            $('.submit').addClass("disabled");
            $('.close').addClass('disabled');

            var json = {};

            doPost("/dialsheet/appointment/delete/" + appointmentId, json, function () {
                    showToast("Appointment deleted");
                    $('.submit').removeClass("disabled");
                    $('.close').removeClass("disabled");

                    $('.appointment_' + appointmentId).remove();

                    if ($('#appointments_table').find('> tbody > tr').length === 1) {
                        $('#no-appointments').show();
                    }

                    $('.modal').modal('close');

                    if ($grid) {
                        $grid.masonry();
                    }

                    var $appointmentCountNode = $('#appointments_count');
                    $appointmentCountNode.html(parseInt($appointmentCountNode.html()) - 1);
                }, function () {
                    showToast("There was an error deleting your appointment. Please try again or submit a bug report");
                    $('.submit').removeClass("disabled");
                    $('.close').removeClass("disabled");
                }
            );
        }
    );
}

// NOTIFICATION

function showNotificationHelpDialog() {
    $('#read_only_dialog_title').html("Notifications Help");
    $('#read_only_dialog_content').html("" +
        "<p>" +
        "Notifications are like a dynamic TO-DO list that allows you to " +
        "easily manage and follow-up with your contacts." +
        "</p>" +
        "<p>" +
        "Each notification can be treated as a single TO-DO item, and when you complete it, you " +
        "should select the <b>DONE</b> option. In most cases, completing a notification means setting " +
        "a <i>Call Outcome</i>. Keep in mind that by setting a call outcome, you are changing the " +
        "current status of that contact." +
        "</p>" +
        "<p>" +
        "If you need to create a new notification based on the one you are currently " +
        "working on, you should press the <b>PUSH</b> button. Pressing this button will allow you to " +
        "quickly re-create a new notification based on the one you clicked on. Keep in mind, you may " +
        "press the <b>DONE</b> button afterward to archive the old notification once you are finished " +
        "with it. Typically, you will want to push a notification if you need to call the contact back " +
        "or the contact is a missed discovery." +
        "</p>" +
        "<p>" +
        "By taking advantage of this system, you can easily track progress, call times, and call " +
        "outcomes with specific contacts. Staying on top of your contacts has never been so easy!" +
        "</p>");
    showReadOnlyDialog();
}

function showNotificationMessageDialog(notificationId) {
    $('#read_only_dialog_title').html("Notification Message");
    $('#read_only_dialog_content').html($('#' + notificationId + "-message").html());
    $('#read_only_dialog').modal('open');
}

function showNotificationDialog(completionFunction) {
    //noinspection JSUnresolvedFunction,JSUnresolvedVariable
    Materialize.updateTextFields();
    $('#notification_dialog_submit')[0].onclick = completionFunction;
    $('#notification_dialog').modal('open');
}

function showCreateNotificationDialog(personId, successFunction, notificationIdForPopulatingMessage) {
    if (notificationIdForPopulatingMessage) {
        $('#notification_dialog_title').html("Create a New Notification");
    } else {
        $('#notification_dialog_title').html("Create a Notification");
    }

    var date = moment()
        .add(userSettings.notificationQuantity, userSettings.notificationUnit)
        .hour(userSettings.notificationHour)
        .minute(userSettings.notificationMinute);

    if (!notificationIdForPopulatingMessage) {
        $('#notification_message_text').val("");
    } else {
        $('#notification_message_text').val($('#' + notificationIdForPopulatingMessage + '-message').html());
    }

    $('#notification_date_picker').val(date.format("D MMMM, YYYY"));
    $('#notification_timepicker').val(date.format("hh:mmA"));
    $('#notification_dialog_submit').html("Create");

    showNotificationDialog(function () {
        doAjaxForCreateNotification(personId, successFunction);
    });
}

function showCreateCallbackNotificationDialog(personId) {
    $('#notification_dialog_title').html("Set a Callback Notification");

    var date = moment()
        .add(userSettings.notificationQuantity, userSettings.notificationUnit)
        .hour(userSettings.notificationHour)
        .minute(userSettings.notificationMinute);

    $('#notification_message_text').val("");
    $('#notification_date_picker').val(date.format("D MMMM, YYYY"));
    $('#notification_timepicker').val(date.format("hh:mmA"));
    $('#notification_dialog_submit').html("Create");

    showNotificationDialog(function () {
        doAjaxForCreateNotification(personId);
    });
}

function doAjaxForCreateNotification(personId, successFunction) {
    var $errorNode = $('#notification_error');
    var message = $('#notification_message_text').val();

    if (!message || message.trim().length === 0) {
        $errorNode.html("The notification message cannot be empty");
        $errorNode.css("display", "block");
        return;
    } else {
        $errorNode.css("display", "none");
    }

    var date = $('#notification_date_picker').val();
    var time = $('#notification_timepicker').val();
    var dateMoment = moment(date + " " + time, "D MMMM, YYYY hh:mmA");
    if (!date || date.trim().length === 0) {
        $errorNode.html("The selected date is invalid");
        $errorNode.css("display", "block");
        return;
    } else if (!time || time.trim().length === 0) {
        $errorNode.html("The selected time is invalid");
        $errorNode.css("display", "block");
        return;
    } else if (!dateMoment.isValid()) {
        $errorNode.html("The selected date or time is invalid");
        $errorNode.css("display", "block");
        return;
    } else {
        $errorNode.css("display", "none");
    }

    $('.submit').addClass("disabled");
    $('.close').addClass("disabled");

    var json = {};
    json.person_id = personId;
    json.message = message;
    json.notification_date = parseInt(dateMoment.format("x"));

    doPost("/notification/create", json, function (data) {
            showToast("Notification created");
            $('.submit').removeClass("disabled");
            $('.close').removeClass("disabled");

            $('.modal').modal('close');

            if (successFunction) {
                successFunction(data);
                successFunction = null;
            }
        }, function () {
            showToast("There was an error creating your notification. Please try again or file a bug report");

            $('.submit').removeClass("disabled");
            $('.close').removeClass("disabled");
        }
    );
}

function showEditNotificationDialog(notificationId) {
    $('#notification_dialog_title').html("Edit Notification");
    $('#notification_dialog_submit').html("Save");

    const rawDate = $('#' + notificationId + "-date").attr('data-date');
    var date = moment(parseInt(rawDate));
    $('#notification_date_picker').val(date.format("DD MMMM, YYYY"));

    $('#notification_timepicker').val(date.format("hh:mmA"));

    $('#notification_message_text').val($('#' + notificationId + "-message").html());

    showNotificationDialog(function () {
        var $errorNode = $('#notification_error');
        var message = $('#notification_message_text').val();

        if (!message || message.trim().length === 0) {
            $errorNode.html("The notification message cannot be empty");
            $errorNode.css("display", "block");
            return;
        } else {
            $errorNode.css("display", "none");
        }

        var date = $('#notification_date_picker').val();
        var time = $('#notification_timepicker').val();
        var dateMoment = moment(date + " " + time, "D MMMM, YYYY hh:mmA");
        if (!date || date.trim().length === 0) {
            $errorNode.html("The selected date is invalid");
            $errorNode.css("display", "block");
            return;
        } else if (!time || time.trim().length === 0) {
            $errorNode.html("The selected time is invalid");
            $errorNode.css("display", "block");
            return;
        } else if (!dateMoment.isValid()) {
            $errorNode.html("The selected date or time is invalid");
            $errorNode.css("display", "block");
            return;
        } else {
            $errorNode.css("display", "none");
        }

        var unixDateAsMillis = dateMoment.format("x");

        var json = {};
        json.message = message;
        json.notification_date = parseInt(unixDateAsMillis);

        $('.submit').addClass("disabled");
        $('.close').addClass("disabled");

        doPost("/notification/edit/" + notificationId, json, function () {
                showToast("Notification successfully edited");
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");

                var $dateNode = $('#' + notificationId + "-date");
                $dateNode.html(getShortDateWithTime(unixDateAsMillis));
                $dateNode.attr("data-date", unixDateAsMillis);

                $('#' + notificationId + "-message").html(message);

                $('.modal').modal("close");
            }, function () {
                showToast("There was an error editing your notification. Please try again or submit a bug report");
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");
            }
        );
    });
}

function showDeleteNotificationDialog(notificationId, completionFunction) {
    $('#delete_dialog_title').html("Delete Notification?");
    $('#delete_dialog_content').html("Are you sure you want to delete this notification?");
    $('#delete_dialog').modal('open');

    showDeleteDialog(function () {
            var json = {};

            $('.submit').addClass("disabled");
            $('.close').addClass("disabled");

            doPost("/notification/delete/" + notificationId, json, function () {
                    showToast("Notification deleted");

                    $('.submit').removeClass("disabled");
                    $('.close').removeClass("disabled");

                    const $node = $('#' + notificationId);
                    $node.remove();

                    if ($node.attr("data-type")) {
                        updatePaginationRange(false, $node.attr("data-type"), true);
                        notificationCountWatcher.onChange($node.attr("data-type"));
                    }

                    $('.modal').modal('close');

                    if (completionFunction) {
                        completionFunction(notificationId);
                        completionFunction = null;
                    }
                }, function () {
                    showToast("There was an error deleting your notification. Please try again or submit a bug report");

                    $('.submit').removeClass("disabled");
                    $('.close').removeClass("disabled");
                }
            );
        }
    );
}

// OAUTH
function showDeleteOAuthAccountDialog(email, accountId) {
    $('#delete_dialog_title').html("Delete Third Party Account?");
    $('#delete_dialog_content').html("Are you sure you want to delete <b>" + email + "</b>? This action cannot be " +
        "undone and you will lose any templates that are tied this account.");

    showDeleteDialog(function () {

        $('.submit').addClass("disabled");
        $('.close').addClass("disabled");

        doPost("/auth/accounts/delete/" + accountId, {}, function () {
                $('.modal').modal("close");

                $('#account-' + accountId).remove();

                if ($('.oauth-account').length === 0) {
                    $('.no-accounts').show(300);
                }

                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");
            }, function () {
                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");
            }
        );
    });
}

// Outlook

function showDeleteTemplateDialog(templateId) {
    $('#delete_dialog_title').html("Delete Calendar Template?");
    $('#delete_dialog_content').html("Are you sure you want to delete this calendar template? This action cannot be undone");

    showDeleteDialog(function () {

        $('.submit').addClass("disabled");
        $('.close').addClass("disabled");

        doPost("/outlook/calendar/deleteTemplate/" + templateId, {}, function () {
                $(".modal").modal("close");

                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");

                showToast("Template deleted");
                $('#' + templateId).remove();

                if ($('.calendar-template').length === 0) {
                    $('.no-templates').show(300);
                }
            }, function () {
                showToast("There was an error deleting your template. Please try again or submit a bug report");

                $('.submit').removeClass("disabled");
                $('.close').removeClass("disabled");
            }
        );
    });
}

function showCalendarPreview(templateId) {
    $('#preview_calendar_template_dialog').modal("open");
    $('#preview_calendar_template_dialog_submit').attr("href", "/outlook/calendar/preview/" + templateId);
}

function showGetAppointmentTemplatesDialog(appointmentId) {
    $('.progress-bar').show();
    $('#appointment_templates_container').addClass("hide");
    $('#appointment_templates_list').remove();

    doGet("/api/outlook/calendar/templates", null, function (data) {
            $('.progress-bar').hide();

            var $templateContainer = $('#appointment_templates_container');
            var $collectionContainer = $("<div id='appointment_templates_list' class='collection'></div>");

            var continueUrl = encodeURIComponent(window.location.href);
            $templateContainer.append($collectionContainer);
            for (var i = 0; i < data.length; i++) {
                var url = "/appointments/export/" + appointmentId + "?template_id=" + data[i].template_id + "&continue_url=" + continueUrl;
                var $anchor = $('<a href="' + url + '" class="collection-item">' + data[i].template_name + '</a>');
                $collectionContainer.append($anchor);
            }

            $templateContainer.hide();
            $templateContainer.removeClass("hide");
            $templateContainer.show(400);
        },
        function (xhr) {
            var $templateContainer = $('#appointment_templates_container');
            var $header;
            if (xhr.status === 400) {
                $('.progress-bar').hide();

                $header = $("<br><h5 class='grey-text'>You don\'t have any templates yet. <a href='/outlook/calendar/createTemplate'>Create Now</a></h5>");
                $templateContainer.append($header);
                $templateContainer.hide();
                $templateContainer.removeClass("hide");
                $templateContainer.show(400);
            } else if (xhr.status === 409) {
                $('.progress-bar').hide();

                $header = $("<br><h5 class='grey-text'>You don\'t have any linked accounts yet. <a href='/auth/accounts'>Add One</a></h5>");
                $templateContainer.append($header);
                $templateContainer.hide();
                $templateContainer.removeClass("hide");
                $templateContainer.show(400);
            } else {
                showToast("There was an error retrieving your templates. Please try again or submit a bug report");
                $('.modal').modal("close");
            }
        }
    );

    $('#appointment_templates_dialog').modal("open");
}

function showDeleteCalendarProviderEventDialog(eventId) {
    $('#delete_dialog_title').html("Unlink Calendar Event?");
    $('#delete_dialog_content').html("Are you sure you want to unlink this calendar event from your appointment? This " +
        "action cannot be undone. Note, this will not delete your appointment or your event, just unlink it to Magic List.");
    showDeleteDialog(function () {
        doPost("/appointments/unlink/" + eventId, {}, success, error);

        function success() {
            showToast("Your calendar event has been successfully unlinked from Magic List");
            $('#calendar-event-' + eventId).remove();

            $('.modal').modal("close");
        }

        function error() {
            showToast("There was an error unlinking this calendar event from your appointment on Magic List. Please " +
                "try again or submit a bug report");
        }
    });
}

function showAppointmentAlertsHelpDialog() {
    const amount = getPaginationTotal("appointments");
    const text = "Remember to update the <i>outcomes</i> of your meetings. You have " + amount + " recent meetings " +
        "with no <i>outcomes</i> set. Set them now to dismiss this alert.";
    $('#read_only_dialog_content').html(text);
    showReadOnlyDialog();
}

function showNotificationAlertsHelpDialog() {
    const amount = getPaginationTotal("notification-current");
    const text = "Remember to press the <i>done</i> button after pushing or setting outcomes for your " +
        "notifications. You have " + amount + " current notifications that should be marked as <i>done</i>. Press the " +
        "done button for each notification, or press the <i>check</i> button (on the bottom right of the screen) to " +
        "mark all of them as done and dismiss this alert." +
        "<br>" +
        "<br>" +
        "Note, if you would like to automatically mark notifications as <i>done</i> after pushing them, you may " +
        "enable that in your settings <a href='/settings#settings-notifications-automatically-press-done'>here</a>.";
    $('#read_only_dialog_content').html(text);
    showReadOnlyDialog();
}

function showActivitySheetAlertsHelpDialog() {
    const amount = getPaginationTotal("activity-sheets");
    const text = "Remember to update the number of dials you make. You have " + amount + " activity sheets that do not " +
        "have dials set. Set the correct number of dials made for all of the following activity sheets to dismiss " +
        "this alert.";
    $('#read_only_dialog_content').html(text);
    showReadOnlyDialog();
}