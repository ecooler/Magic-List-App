/** @namespace notification.manager_email */
/** @namespace notification.manager_name */
/** @namespace notification.notification_id */
/** @namespace notification.sender_name */
/** @namespace notification.is_fulfilled */
/** @namespace item.is_seen */
/** @namespace notification.manager_id */

$(document).ready(function () {
    real_notifications.getAllNotifications();

    $('#messages_request_button').click(function () {
        real_notifications.seeAllNotifications();
    });

    $('#phone_messages_request_button').click(function () {
        real_notifications.seeAllNotifications();
    });
});

var real_notifications = {

    unreadCount: 0,

    getAllNotifications: function () {

        doGet("/user/notifications", {},
            function (data) {
                if (data.length === 0) {
                    var $item = $("<li class='account-notification-item'>" +
                        "<a class='no-click account-notification-item'>You have no new messages to show</a>" +
                        "</li>");
                    $("#messages_menu").append($item);
                    $("#phone_messages_menu").append($item.clone());
                } else {
                    data.forEach(function (item) {
                        real_notifications.renderNotificationItem(item);
                        if (!item.is_seen) {
                            real_notifications.unreadCount += 1;
                        }
                    });

                    if (real_notifications.unreadCount > 0) {
                        var $span = $(
                            "<span id='notification-count-badge' class='badge red white-text left top-margin left-margin circle " +
                            "notification_badge messages_notification scale-transition scale-out'>" +
                            real_notifications.unreadCount +
                            "</span>"
                        );
                        $('.manager_request_menu_item').append($span);
                        setTimeout(function () {
                            $('.messages_notification.scale-transition').addClass("scale-in");
                        }, 200);
                    }
                }
            }, function () {
                var $item = $("<li class='account-notification-item'>" +
                    "<a class='no-click account-notification-item'>There was an error loading your messages</a>" +
                    "</li>");
                $('#messages_menu').append($item);
                $('#phone_messages_menu').append($item.clone());
            });
    },

    renderNotificationItem: function (notification) {
        var TYPE_MESSAGE = "message";
        var TYPE_EMPLOYEE_REQUEST = "employee_request";

        var $listItem = $("<li class='account-notification-item'></li>");
        $("#messages_menu").append($listItem);

        var $item = $("<a class='account-notification-item'></a>");
        $item.attr("id", notification.notification_id);
        $listItem.append($item);

        if (!notification.is_fulfilled) {
            $item.addClass("indigo lighten-5");
            $item.click(function () {
                real_notifications.fulfillNotification(notification);
            });
        }

        if (TYPE_MESSAGE === notification.type) {
            var senderName = notification.sender_name;
            $item.html("Message from <b>" + senderName + "</b>");
            $item.click(function () {
                $('#read_only_dialog_content').html(notification.message.replace(/\\n/g, "<br>"));
                $('#read_only_dialog_title').html("Message from " + senderName);
                $('#read_only_dialog').modal("open");
            });
        } else if (TYPE_EMPLOYEE_REQUEST === notification.type) {
            var managerName = notification.manager_name;
            $item.html("You have a new request from <b>" + managerName + "</b> to be your manager");
            $item.click(function () {
                var employeeId = notification.employee_id;
                var managerId = notification.manager_id;
                var managerName = notification.manager_name;
                var managerEmail = notification.manager_email;
                var requestId = notification.notification_id;
                onEmployeeClickManagerRequest(employeeId, managerId, managerName, managerEmail, requestId);
            });
        } else {
            console.error("Notification: ", notification);
            $item.html("There was an error reading the response from the server");
        }

        var momentObject = moment(parseInt(notification.date));
        var date = momentObject.format("M/D/YYYY") + " at " + momentObject.format("h:mm a");
        var $dateItem = $("<h6 class='grey-text text-darken-1'>&nbsp;" + date + "</h6>");
        $dateItem.css("font-size", "12px");
        $item.append($dateItem);
        $listItem.append($("<div class='divider'></div>"));

        $("#phone_messages_menu").append($listItem.clone());

        function onEmployeeClickManagerRequest(employeeId, managerId, managerName, managerEmail, requestId) {
            $('#confirmation_dialog_title').html("Accept Manager Request");
            $('#confirmation_dialog_content').html("You have a new request from " + managerName + " " +
                "(" + managerEmail + ") to be listed as your manager. Magic List offers a number of great " +
                "features for those that are enlisted to their manager's team. Would you like to join " +
                managerName + "\'s team?");

            $('#confirmation_dialog').modal("open");

            showConfirmationDialog(function () {
                $('.modal').modal("close");

                window.location.href = "/manager/employees/accept" +
                    "?employee_id=" + employeeId +
                    "&manager_id=" + managerId +
                    "&request_id=" + requestId;
            });
        }

    },

    seeAllNotifications: function () {
        if (!!real_notifications.unreadCount) {
            doPost("/user/notifications/readAll", {}, function () {
                console.log("Successfully read all notifications");
                $('.messages_notification').remove();
                real_notifications.unreadCount = 0;
            }, function () {
                console.log("There was an error reading all of your notifications");
            }, true);
        }
    },

    fulfillNotification: function (notification) {
        doPost("/user/notifications/fulfill/" + notification.notification_id, {}, function () {
            console.log("Successfully fulfilled notification: ", notification.notification_id);
            notification.is_fulfilled = true;
            $('#' + notification.notification_id).removeClass("indigo lighten-5");

            const $currentMessageCountBadge = $('#notification-count-badge');
            const currentAmount = parseInt($currentMessageCountBadge.html()) - 1;
            if(currentAmount <= 0) {
                $currentMessageCountBadge.remove();
            } else {
                $currentMessageCountBadge.html(currentAmount);
            }
        }, function () {
            console.error("There was an error fulfilling notification: " + notification.notification_id);
        }, true);
    }

};