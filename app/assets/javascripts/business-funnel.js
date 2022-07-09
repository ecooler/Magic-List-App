function showContactsHelpDialog() {
    var text = "<i>Contacts Made</i> is the proportion of dials made to contacts achieved. The contact statuses " +
        "that are considered to be \"contacts\" are the following:";
    const statuses = contactStatus.getAllContactsStatuses();
    text += getTextToAddForListFromStatuses(statuses);
    text += ".";
    $('#read_only_dialog_content').html(text);
    $('#read_only_dialog_title').html("Help - Contacts Made Statistic");
    showReadOnlyDialog();
}

function showFollowUpsHelpDialog() {
    var text = "<i>Follow Ups Converted</i> is the proportion of contacts that have had a \"follow up\" status set " +
        "in the past and were converted to an introduction meeting. The contact statuses that are considered to be " +
        "\"follow ups\" are the following:";
    const statuses = contactStatus.getAllFollowUpStatuses();
    text += getTextToAddForListFromStatuses(statuses);
    text += ".";
    $('#read_only_dialog_content').html(text);
    $('#read_only_dialog_title').html("Help - Follow Ups Converted Statistic");
    showReadOnlyDialog();
}

function showObjectionsReceivedHelpDialog() {
    var text = "<i>Objections Received</i> is the proportion of contacts that have ended with an objection. The " +
        "contact statuses that are considered to be \"objections\" are the following:";

    const statuses = contactStatus.getAllObjectionStatuses();

    text += getTextToAddForListFromStatuses(statuses);

    text += ".";
    $('#read_only_dialog_content').html(text);
    $('#read_only_dialog_title').html("Help - Objections Received Statistic");
    showReadOnlyDialog();
}

function showNewAppointmentsScheduledHelpDialog() {
    var text = "<i>New Appointments Scheduled</i> is the proportion of introduction appointments compared to the " +
        "rest of the appointments scheduled.";

    $('#read_only_dialog_content').html(text);
    $('#read_only_dialog_title').html("Help - New Appointments Scheduled Statistic");
    showReadOnlyDialog();
}


function showNewAppointmentsKeptHelpDialog() {
    var text = "<i>New Appointments Kept</i> is the proportion of introduction appointments whose outcome is not a " +
        "missed appointment status. The following statuses are considered to be \"missed appointments\":";

    const statuses = contactStatus.getAllMissedAppointmentStatuses();

    text += getTextToAddForListFromStatuses(statuses);

    text += ".";
    $('#read_only_dialog_content').html(text);
    $('#read_only_dialog_title').html("Help - New Appointments Kept Statistic");
    showReadOnlyDialog();
}

function showClosesHelpDialog() {
    var text = "<i>Closes</i> is the proportion of contacts that have achieved an inventory status, and made it to the " +
        "\"review\" status. The following are considered to be \"inventory\" statuses:";

    const statuses = contactStatus.getAllInventoryStatuses();

    text += getTextToAddForListFromStatuses(statuses);

    text += ".";
    $('#read_only_dialog_content').html(text);
    $('#read_only_dialog_title').html("Help - New Appointments Kept Statistic");
    showReadOnlyDialog();
}

function getTextToAddForListFromStatuses(arrayOfStatuses) {
    var text = "";
    arrayOfStatuses.forEach(function (status, index) {
        text += " " + status.state_description;
        if (index === arrayOfStatuses.length - 2) {
            text += ", and ";
        } else if (index < arrayOfStatuses.length - 2) {
            text += ",";
        }
    });
    return text;
}