/** @namespace notification.person */
/** @namespace notification.person.state.state_description */
/** @namespace notification.outcome */
/** @namespace person.person_name */

/**
 * @type {{onDocumentReady: notificationCallbacks.onDocumentReady, onPushNotification: undefined, onDeleteNotification: undefined, onArchiveNotification: undefined, onUnarchiveNotification: undefined}}
 */
const notificationCallbacks = {
    onDocumentReady: function () {
        $('.load-more').click(function () {
            const state = getNotificationStateFromType($(this).attr("data-type"));
            state.current_page += 1;
            doGetForNotifications(state, true);
        });

        $('#notification-form-' + notificationTypes.past).submit(function (e) {
            const type = $(this).attr('data-type');
            notificationCallbacks.onFormSubmit(e, type);
        });

        $('#notification-form-' + notificationTypes.current).submit(function (e) {
            const type = $(this).attr('data-type');
            notificationCallbacks.onFormSubmit(e, type);
        });

        $('#notification-form-' + notificationTypes.upcoming).submit(function (e) {
            const type = $(this).attr('data-type');
            notificationCallbacks.onFormSubmit(e, type);
        });

    },

    onFormSubmit: function onFormSubmit(e, type) {
        e.preventDefault();

        const state = getNotificationStateFromType(type);

        if (!notificationState.isStateSame(state)) {
            // only do a GET if the form changes

            // remove all of the notification items, we're wiping everything
            const $notificationItems = $('.notification-' + state.notification_type);
            $notificationItems.fadeOut(300);
            setTimeout(function () {
                $notificationItems.remove();
            });

            state.current_page = 1;

            state.sort_by = $('#sort-by-notification-' + state.notification_type).val();
            state.ascending = $('#ascending-notification-' + state.notification_type).val() === 'true';

            doGetForNotifications(state, false);
        }

    },

    onPushNotification: undefined,
    onDeleteNotification: undefined,
    onArchiveNotification: undefined,
    onUnarchiveNotification: undefined
};

/**
 * DO NOT MODIFY
 * @type {{past: string, current: string, upcoming: string}}
 */
const notificationTypes = {
    past: "past",
    current: "current",
    upcoming: "upcoming"
};

/**
 * DO NOT MODIFY
 * @type {{notification_date: string, last_contacted: string, person_name: string, area_code: string}}
 */
const notificationSortTypes = {
    notification_date: "notification_date",
    last_contacted: "last_contacted",
    person_name: "person_name",
    area_code: "area_code",
    company_name: "company_name"
};

/**
 * @type {{past: {sort_by: string, ascending: boolean, current_page: number, url: string, notification_type: string}, current: {sort_by: string, ascending: boolean, current_page: number, url: string, notification_type: string}, upcoming: {sort_by: string, ascending: boolean, current_page: number, url: string, notification_type: string}}}
 */
const notificationState = {
    past: {
        sort_by: notificationSortTypes.notification_date,
        ascending: false,
        current_page: 1,
        url: "/notification/past",
        notification_type: notificationTypes.past
    },
    current: {
        sort_by: notificationSortTypes.notification_date,
        ascending: false,
        current_page: 1,
        url: "/notification/current",
        notification_type: notificationTypes.current
    },
    upcoming: {
        sort_by: notificationSortTypes.notification_date,
        ascending: true,
        current_page: 1,
        url: "/notification/upcoming",
        notification_type: notificationTypes.upcoming
    },

    isStateSame: function (state) {
        const $sortBy = $('#sort-by-notification-' + state.notification_type);
        const $ascending = $('#ascending-notification-' + state.notification_type);
        return state.sort_by === $sortBy.val() && state.ascending === ($ascending.val() === 'true');
    }
};

function getNotificationStateFromType(type) {
    if (type === notificationTypes.past) {
        return notificationState.past;
    } else if (type === notificationTypes.current) {
        return notificationState.current;
    } else if (type === notificationTypes.upcoming) {
        return notificationState.upcoming;
    } else {
        console.error("Invalid type! Found: ", type);
        return null;
    }
}

function doGetForNotifications(state, isLoadMore) {
    $('#' + state.notification_type + '-no-results').hide(200);

    const $progressSpinner = $('#progress-' + state.notification_type);
    $progressSpinner.show(300);

    const json = getSortObject(state.sort_by, state.ascending);
    json.page = state.current_page;

    doGet(state.url, json, success, error);

    function success(data) {
        data = data.list;
        $progressSpinner.hide();
        const paginationId = "notification-" + state.notification_type;

        const total = data.length + getPaginationCurrentAmount(state.notification_type);
        if (total === getPaginationTotal(paginationId)) {
            // there are no more notifications to load
            $('#load-more-' + state.notification_type).hide();
        }

        if (!isLoadMore) {
            // Reset pagination to initial amount
            resetPaginationRange(paginationId);
        }

        data.forEach(function (item) {
            updatePaginationRange(true, paginationId);
            addNotificationToListUi(item, state.notification_type);
        });

        contactStatus.setupDropdown();

        if (getPaginationTotal(paginationId) === getPaginationCurrentAmount(paginationId)) {
            setTimeout(function () {
                $('#load-more-' + state.notification_type).remove();
            }, 100);
        }

        notificationCountWatcher.onChange(state.notification_type);
    }

    function error() {
        showToast("There was an error refreshing your notifications. Please reload the page or submit a bug report");
        $progressSpinner.hide(300);
    }
}

function addNotificationToTableUi(notification, type) {
    var notificationId = notification.notification_id;

    const $row = $("<tr id='" + notificationId + "' data-person-id='" + notification.person.person_id + "' " +
        "class='notification-" + type + "' data-type='" + type + "'></tr>");
    $('#notification-table-' + type + ' > tbody').append($row);

    const $dateCell = $('<td id="' + notificationId + '-date" class="left-content notification_date"></td>');
    $dateCell.attr("data-date", notification.notification_date);
    $dateCell.html(getShortDateWithTime(notification.notification_date));
    $row.append($dateCell);

    const personState = notification.person.state;
    const $contactStatusCell = $('<td class="center-align"></td>');
    $contactStatusCell.html(contactStatus.getSetupMarkup(notificationId, notification.person.person_name,
        personState.state_type, personState.state_description, personState.state_class, true, false,
        contactStatus.clickTypes.notifications, false));
    $row.append($contactStatusCell);

    const $notesCell = $('<td class="center-align"></td>');
    $row.append($notesCell);

    const $notesSpan = $('<span class="hide" id="' + notificationId + '-message"></span>');
    $notesSpan.text(notification.message);
    $notesCell.append($notesSpan);

    const $notesAnchor = $('<a class="btn-flat btn-icon waves-effect center-align"><i class="material-icons">speaker_notes</i></a>');
    $notesAnchor.click(function () {
        showNotificationMessageDialog(notificationId);
    });
    $notesCell.append($notesAnchor);

    const $optionsCell = $('<td class="center-align allow-overflow"></td>');
    $row.append($optionsCell);

    const $optionsAnchor = $('<a class="btn-flat waves-effect btn-icon dropdown-button" data-beloworigin="false" ' +
        'data-alignment="right" data-activates="notification-options-menu-' + notificationId + '" ' +
        'data-constrainwidth="false"><i class="material-icons">more_vert</i></a>');
    $optionsCell.append($optionsAnchor);

    const $optionsMenu = $('<ul id="notification-options-menu-' + notificationId + '" class="dropdown-content"></ul>');
    $optionsCell.append($optionsMenu);

    if (type === notificationTypes.past || type === notificationTypes.current) {
        const $pushItem = $("<li><a class='waves-effect'><i class='material-icons left'>forward</i>Push</a></li>");
        $pushItem.click(function () {
            pushNotificationForward(notificationId, notificationCallbacks.onPushNotification);
        });
        $optionsMenu.append($pushItem);
    }

    if (type === notificationTypes.current) {
        const $archiveItem = $('<li id="' + notificationId + '-archive"><a class="waves-effect">' +
            '<i class="material-icons left">done</i>Done</a></li>');
        $archiveItem.click(function () {
            archiveNotification(notificationId);
        });
        $optionsMenu.append($archiveItem);
    }

    if (type === notificationTypes.past) {
        const $listItem = $('<li id="' + notificationId + '-unarchive"><a class="waves-effect">' +
            '<i class="material-icons left">unarchive</i>Unarchive</a></li>');
        $listItem.click(function () {
            unArchiveNotification(notificationId);
        });
        $optionsMenu.append($listItem);
    }

    const $editItem = $('<li><a class="waves-effect"><i class="material-icons left">mode_edit</i>Edit</a></li>');
    $editItem.click(function () {
        showEditNotificationDialog(notificationId);
    });
    $optionsMenu.append($editItem);

    const $deleteItem = $('<li><a class="waves-effect"><i class="material-icons left">delete</i>Delete</a></li>');
    $deleteItem.click(function () {
        showDeleteNotificationDialog(notificationId, notificationCallbacks.onDeleteNotification);
    });
    $optionsMenu.append($deleteItem);

    $('.dropdown-button').dropdown({});
}

function addNotificationToListUi(notification, type) {
    const notificationId = notification.notification_id;
    const person = notification.person;
    const $item = $('<li class="collection-item avatar allow-overflow notification-' + type + '"></li>');
    $item.attr("data-type", type);
    $item.attr("data-person-id", person.person_id);
    $item.attr("id", notificationId);

    $item.insertBefore('#progress-' + type);

    $item.append('<i class="material-icons indigo-text white circle">notifications</i>');

    $item.append('<span class="title inline">' +
        '<b>' +
        '<a class="black-text waves-effect person_name_' + person.person_id + '" href="/person/' + person.person_id + '">' +
        person.person_name +
        '</a>' +
        '</b>' +
        '</span>');

    if (person.email) {
        $item.append('<p>' + person.email + '</p>');
    }

    if (person.phone_number) {
        $item.append('<p>' + person.phone_number + '</p>');
    }

    if (person.job_title && person.company_name) {
        $item.append('<p>' + person.job_title + " at " + person.company_name + '</p>');
    } else if (person.company_name) {
        $item.append('<p>Works at: ' + person.company_name + '</p>');
    } else if (person.job_title) {
        $item.append("<p>Job Title: " + person.job_title + "</p>");
    }

    $item.append($("<div class='row'></div>"));

    var lastContacted;
    if (notification.last_contacted !== -1) {
        lastContacted = getLongDateWithTime(notification.last_contacted);
    } else {
        lastContacted = "Not Contacted";
    }
    $item.append($("<p>Last Contacted: &nbsp; " +
        "<span id='last-contacted-" + notificationId + "'>" + lastContacted + "</span>" +
        "</p>"));

    $item.append($("<div class='row'></div>"));

    const personState = notification.person.state;

    $item.append($("<p>Current Status: &nbsp; " +
        "<span id='current-status-" + notificationId + "' " +
        "class='regular-padding-small status-state " + personState.state_class + "'>" + personState.state_description + "</span>" +
        "</p>"));

    $item.append($('<div class="row"></div>'));

    const notificationState = notification.outcome;
    $item.append($('<p>Call Outcome: &nbsp; ' + contactStatus.getSetupMarkup(notificationId, person.person_name,
        notificationState.state_type, notificationState.state_description, notificationState.state_class, true,
        type === notificationTypes.past, contactStatus.clickTypes.notifications, false) +
        '</p>'));

    const $secondaryContent = $('<span class="secondary-content indigo-text"></span>');
    $item.append($secondaryContent);
    $secondaryContent.append('<span id="' + notificationId + '-date" ' +
        'data-date="' + notification.notification_date + '">' + getShortDateWithTime(notification.notification_date) + '</span>');
    $secondaryContent.append('<br>');

    const $noteAnchor = $(
        '<a class="btn-flat waves-effect"><i class="material-icons left">speaker_notes</i>Notes' +
        '</a>');
    const $notesSpan = $('<span class="hide" id="' + notificationId + '-message"></span>');
    $notesSpan.text(notification.message);
    $noteAnchor.append($notesSpan);
    $noteAnchor.click(function () {
        showNotificationMessageDialog(notificationId);
    });
    $secondaryContent.append($noteAnchor);

    if (type === notificationTypes.past || type === notificationTypes.current) {
        const $pushAnchor = $('<a id="' + notificationId + '-push" class="btn-flat waves-effect">' +
            '<i class="material-icons left ">forward</i>Push Forward' +
            '</a>');
        $pushAnchor.click(function () {
            pushNotificationForward(notificationId, notificationCallbacks.onPushNotification);
        });
        $secondaryContent.append($pushAnchor);
    }

    if (type === notificationTypes.current) {
        const $archiveAnchor = $(
            '<a id="' + notificationId + '-archive" class="btn-flat waves-effect">' +
            '<i class="material-icons left">done</i>Done' +
            '</a>');
        $archiveAnchor.click(function () {
            archiveNotification(notificationId);
        });
        $secondaryContent.append($archiveAnchor);
    }

    if (type === notificationTypes.past) {
        const $unarchiveAnchor = $(
            '<a id="' + notificationId + '-unarchive" class="btn-flat waves-effect side-padding-small">' +
            '<i class="material-icons left">unarchive</i>Unarchive' +
            '</a>');
        $unarchiveAnchor.click(function () {
            unArchiveNotification(notificationId);
        });
        $secondaryContent.append($unarchiveAnchor);
    }

    $secondaryContent.append(
        '<a class="btn-flat dropdown-button" data-activates="' + notificationId + '-menu" data-alignment="true" ' +
        'data-beloworigin="true" data-constrainwidth="false">' +
        '<i class="material-icons left">more_vert</i>Options' +
        '</a>');

    contactStatus.setupDropdown();

    renderDropdownList($item);

    $('.dropdown-button').dropdown({});

    function renderDropdownList($item) {
        const $list = $('<ul id="' + notification.notification_id + '-menu" class="dropdown-content"></ul>');
        $item.append($list);

        const $editItem = $('<li><a class="waves-effect">' +
            '<i class="material-icons left">mode_edit</i>' +
            'Edit' +
            '</a></li>');
        $editItem.click(function () {
            showEditNotificationDialog(notification.notification_id);
        });
        $list.append($editItem);

        const $deleteItem = $(
            '<li><a class="waves-effect"><i class="material-icons left">delete</i> Delete</a>' +
            '</li>');
        $deleteItem.click(function () {
            showDeleteNotificationDialog(notificationId, function () {
                notificationCallbacks.onDeleteNotification(notificationId);
            });
        });
        $list.append($deleteItem);
    }
}

function pushNotificationForward(notificationId, successFunction) {
    const $node = $('#' + notificationId);
    const personId = $node.attr("data-person-id");
    showCreateNotificationDialog(personId, function (notification) {
        if (userSettings.autoPushNotification && $node.attr('data-type') === notificationTypes.current) {
            archiveNotification(notificationId);
        }

        if (successFunction) {
            successFunction(notification);
        }
    }, notificationId);
}

function archiveNotification(notificationId) {
    showProgressDialog();

    doPost("/notification/archive/" + notificationId, {}, successFunction, errorFunction);

    function successFunction() {
        showToast("Your notification was successfully archived");
        closeProgressDialog();

        updatePaginationRange(false, "notification-" + notificationTypes.current, true);
        updatePaginationRange(true, "notification-" + notificationTypes.past, true);

        const $notificationBadge = $('.notification_badge');
        const rawAmount = $notificationBadge.html();
        if (rawAmount) {
            const currentNotificationCount = parseInt(rawAmount) - 1;
            if (currentNotificationCount === 0) {
                $notificationBadge.remove();
            }
        }

        const $notificationNode = $('#' + notificationId);
        $notificationNode.fadeOut(300, function () {
            $('#' + notificationId + "-archive").remove();
            $notificationNode.removeClass("notification-" + notificationTypes.current);
            $notificationNode.remove();
            notificationCountWatcher.onChange(notificationTypes.current);

            $notificationNode.insertBefore('#progress-' + notificationTypes.past);

            $('#contact-status-button-' + notificationId).addClass("disabled");
            $('.dropdown-button').dropdown({});
            $notificationNode.attr("data-type", notificationTypes.past);
            $notificationNode.addClass("notification-" + notificationTypes.past);
            renderArchiveTypeButtonForNode(notificationId, false);
            $notificationNode.fadeIn(300);

            notificationCountWatcher.onChange(notificationTypes.past);

            if (notificationCallbacks.onArchiveNotification) {
                notificationCallbacks.onArchiveNotification();
            }
        });
    }

    function errorFunction() {
        closeProgressDialog();

        showToast("There was an error archiving your notification. Please try again or submit a bug report.");
    }
}


function unArchiveNotification(notificationId) {
    showProgressDialog();
    doPost("/notification/unarchive/" + notificationId, {}, successFunction, errorFunction);

    function successFunction() {
        showToast("Notification successfully unarchived");

        closeProgressDialog();

        updatePaginationRange(false, "notification-" + notificationTypes.past, true);
        updatePaginationRange(true, "notification-" + notificationTypes.current, true);

        const $notificationNode = $('#' + notificationId);
        $notificationNode.fadeOut(300, function () {
            $('#' + notificationId + "-unarchive").remove();
            $notificationNode.removeClass("notification-" + notificationTypes.past);
            $notificationNode.remove();
            notificationCountWatcher.onChange(notificationTypes.past);

            $notificationNode.insertBefore('#progress-' + notificationTypes.current);

            $('#contact-status-button-' + notificationId).removeClass("disabled");
            $('.dropdown-button').dropdown({});
            $notificationNode.addClass("notification-" + notificationTypes.current);
            $notificationNode.attr("data-type", notificationTypes.current);
            renderArchiveTypeButtonForNode(notificationId, true);
            $notificationNode.fadeIn(300);
            notificationCountWatcher.onChange(notificationTypes.current);

            if (notificationCallbacks.onUnarchiveNotification) {
                notificationCallbacks.onUnarchiveNotification();
            }

        });
    }

    function errorFunction() {
        closeProgressDialog();
        showToast("There was an error archiving your notification, please try again or submit a bug report.");
    }

}

function renderArchiveTypeButtonForNode(notificationId, isArchive) {
    var $anchor;

    if (!isArchive) {
        $anchor = $(
            '<a id="' + notificationId + '-unarchive" class="btn-flat waves-effect btn-icon">' +
            '<i class="material-icons left">unarchive</i>' +
            'Unarchive' +
            '</a>');
        $anchor.click(function () {
            unArchiveNotification(notificationId);
        });
    } else {
        $anchor = $(
            '<a id="' + notificationId + '-archive" class="btn-flat waves-effect btn-icon">' +
            '<i class="material-icons left">done</i>' +
            'Done' +
            '</a>');
        $anchor.click(function () {
            archiveNotification(notificationId);
        });
    }

    var index = -1;
    $('#' + notificationId + ' > .secondary-content').children().each(function (i) {
        if ($(this).html().includes("notes")) {
            index = i;
        }
        if ($(this).html().includes("forward")) {
            index = i;
        }
    });

    if (index === -1) {
        $('#notification-options-menu-' + notificationId).children().each(function (i) {
            if ($(this).html().includes("forward")) {
                index = i;
            }
        });
    }

    if (index > -1) {
        // :nth-child is 1-index based
        $('#' + notificationId + ' > .secondary-content > :nth-child(' + (index + 1) + ')').after($anchor);
        $('#notification-options-menu-' + notificationId + ' > :nth-child(' + (index + 1) + ')').after($anchor);
    }
}

const notificationCountWatcher = {
    onChange: function (notificationType) {
        if (notificationType === notificationTypes.past ||
            notificationType === notificationTypes.current ||
            notificationType === notificationTypes.upcoming) {

            const $noResults = $('#notification-' + notificationType + "-no-results");
            if ($('.notification-' + notificationType).length === 0) {
                $noResults.show(300);
                return true;
            } else {
                $noResults.hide(300);
                return true;
            }
        } else {
            console.error("Invalid notification type, found: ", notificationType);
        }
    }
};