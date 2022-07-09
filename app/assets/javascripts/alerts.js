const alerts = {

    onDocumentReady: function () {
        $(document).ready(function () {
            contactStatus.successFunctions.appointments.push(alerts.onAppointmentOutcomeSet);
            appointmentState.url = "/appointments/unfulfilled";
            notificationState.current.url = "/notification/current/completed";

            doGetForAppointmentAlerts(appointmentState, true);
            doGetForNotifications(notificationState.current, true);
            doGetForActivitySheetAlerts(activitySheetState, true);

            $('#load-more-appointments-anchor').click(function () {
                appointmentState.current_page += 1;
                doGetForAppointmentAlerts(appointmentState, true);
            });

            $('#load-more-notifications-anchor').click(function () {
                notificationState.current.current_page += 1;
                doGetForNotifications(notificationState.current, true);
            });

            $('#load-more-activity-sheets-anchor').click(function () {
                activitySheetState.current_page += 1;
                doGetForActivitySheetAlerts(activitySheetState);
            });

            $('#appointments-form').submit(function (e) {
                appointmentCallbacks.onFormSubmit(e, appointmentState);
            });

            $('#notifications-form').submit(function (e) {
                notificationCallbacks.onFormSubmit(e, notificationTypes.current);
            });

            notificationCallbacks.onArchiveNotification = function() {
                alerts.updateAlertBadgeCount();
            };

        });
    },

    onNotificationActionButtonClick: function () {
        $('#confirmation_dialog_title').html("Archive All Current Notifications?");
        $('#confirmation_dialog_content').html("Are you sure you want to archive all of your current notifications? " +
            "This will automatically press the <i>done</i> button for all of your notifications in this alert." +
            "<br>" +
            "<br>" +
            "Note, if you would like to automatically mark notifications as <i>done</i> " +
            "after pushing them, you may enable that in your settings " +
            "<a href='/settings#settings-notifications-automatically-press-done'>here</a>.");
        showConfirmationDialog(function () {
            var notificationIds = [];
            $('#notifications-' + notificationTypes.current).find('> .notification-current').each(function () {
                notificationIds.push($(this).attr("id"));
            });

            doPost("/notification/archive/batch", {notification_ids: notificationIds}, success, error, true);

            function success() {
                $('.modal').modal("close");

                const paginationId = "notification-current";

                $('.notification-current').each(function () {
                    $(this).remove();
                    alerts.updateAlertBadgeCount();

                    updatePaginationRange(false, paginationId, true);
                });

                if (!getPaginationTotal(paginationId)) {
                    $('#notification-current-no-results').show(300);
                }
            }

            function error() {
                showToast("There was an error batch archiving your notifications. Please try again or submit a bug report.");
            }
        });
    },

    getActivitySheetItem: function (activitySheet) {
        const $item = $('<li id="' + activitySheet.dial_sheet_id + '" class="collection-item avatar activity-sheets"></li>');
        $item.append($('<i class="material-icons circle white indigo-text">perm_phone_msg</i>'));
        $item.append($('<a class="title indigo-text waves-effect" ' +
            'href="/dialsheet/details/' + activitySheet.dial_sheet_id + '">' +
            getLongDate(activitySheet.date) +
            '</a>'));
        $item.append($('<p>Dial Count: ' + activitySheet.dial_count + '</p>'));
        $item.append($('<p>Contacts Count: ' + activitySheet.contacts_count + '</p>'));
        $item.append($('<p>Appointments Count: ' + activitySheet.appointments_count + '</p>'));

        const $secondaryContent = $('<span class="secondary-content right-align"></span>');
        $item.append($secondaryContent);

        const $anchor = $('<a class="btn-flat waves-effect"><i class="material-icons indigo-text">mode_edit</i></a>');
        $secondaryContent.append($anchor);
        $anchor.click(function () {
            showEditDialCountDialog(activitySheet.dial_sheet_id, function () {
                showToast("Dial count updated successfully");
                const $item = $('#' + activitySheet.dial_sheet_id);
                $item.hide(300, function () {
                    $item.remove();
                    alerts.updateAlertBadgeCount();
                    if (!$('.activity-sheets').length) {
                        $('#activity-sheets-no-results').show(300);
                    }
                });
                updatePaginationRange(false, "activity-sheets", true);
            });
        });

        return $item;
    },

    onAppointmentOutcomeSet: function (appointmentId) {
        showToast("Meeting outcome successfully set");

        $('#appointment-' + appointmentId).remove();
        updatePaginationRange(false, "appointments", true);

        alerts.updateAlertBadgeCount();

        if (!$('.appointment-item').length) {
            $('#appointments-no-results').show(300);
        }
    },

    updateAlertBadgeCount: function () {
        const $badge = $('#alerts-badge');
        var newCount = parseInt($badge.html()) - 1;
        if (newCount <= 0) {
            $('#alerts-navigation-item').remove();
        } else {
            $badge.html(newCount);
        }
    }

};