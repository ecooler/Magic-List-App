/** @namespace employee.employee_id */
/** @namespace employee.is_current_employee */
/** @namespace user.user_id */

$(document).ready(function () {
    var $search = $('#employee-search');
    $search.on('keyup', function () {
        onSearchForEmployees();
    });
    $search.on("change", function () {
        onSearchForEmployees();
    });

});


function onManagerCheckChanged() {
    const isChecked = $('#is_manager_checkbox').prop("checked");
    doPost("/manager/set", {"is_manager": isChecked}, function () {
            if (!isChecked) {
                $('.manager_content').hide();
            } else {
                $('.manager_content').show();

                $('#read_only_dialog_title').html("Notice");
                $('#read_only_dialog_content').html("You are now set as a manager. Add users to your team to get " +
                    "started by going <a href=''>here</a>");
                showReadOnlyDialog();
            }
        }, function () {
            showToast("There was an error setting your account as a manager. Please try again or submit a bug report");
            $('#is_manager_checkbox').prop("checked", !isChecked);
        }
    );
}

var searchCurrentValue = "";

function onSearchForEmployees() {
    var $searchInput = $('#employee-search');
    if (searchCurrentValue !== $searchInput.val() && $searchInput.val().trim().length > 0) {
        searchCurrentValue = $searchInput.val().trim();

        $('#employee-search-spinner').addClass("active");
        doGet("/manager/employees/search", {search_key: searchCurrentValue}, function (data) {
                $('#employee-search-spinner').removeClass("active");
                removeAllSearchResults();

                if (data.length > 0) {
                    data.forEach(function (user) {
                        var $anchor = $("<a class='indigo-text waves-effect collection-item'></a>");
                        $anchor.html("<span class='title'>" + user.name + "</span><p>" + user.email + "</p>");
                        $anchor.click(function () {
                            showAddUserAsEmployeeDialog(user);
                        });

                        $('#user-results').append($anchor);
                    });
                } else {
                    var $anchor = $("<a class='indigo-text collection-item'>No users found</a>");
                    $('#user-results').append($anchor);
                }
            }, function () {
                $('#employee-search-spinner').removeClass("active");
                showToast("There was an error completing your search. Please try again or submit a bug report");
            }
        );

    } else if (searchCurrentValue !== $searchInput.val() && $searchInput.val().trim().length === 0) {
        removeAllSearchResults();
    }

    function removeAllSearchResults() {
        $('#user-results').children().each(function () {
            $(this).remove();
        });
    }

    function showAddUserAsEmployeeDialog(user) {
        $('#confirmation_dialog_title').html("Add Team Member");
        $('#confirmation_dialog_content').html("Are you sure you want to add this team member? Doing so will " +
            "send this user a notification and email to confirm your request to be added to your team.");
        showConfirmationDialog(function () {
            doPost("/manager/employees/add/" + user.user_id, {}, successFunction, errorFunction);
        });

        function successFunction() {
            showToast("A request was sent to " + user.name + " to join your team");
            $('#employee-search').val("");
            onSearchForEmployees();
            $('.modal').modal("close");
        }

        function errorFunction(xhr) {
            if (xhr.status === 409) {
                showToast("You cannot add this team member because someone else is managing them");
            } else {
                showToast("There was an error adding this team member. Please try again or submit a bug report");
            }
        }

        function addEmployeeToPage(user) {
            $('.no-results-found').hide();

            var $tr = $("<tr id='employee-" + user.user_id + "'></tr>");
            $('#employee-table').append($tr);

            var $name = $("<td id='employee-name-" + user.user_id + "'>" + user.name + "</td>");
            $tr.append($name);

            var $email = $("<td>" + user.email + "</td>");
            $tr.append($email);

            var $date = $("<td>" + getLongDate(moment().format("x")) + "</td>");
            $tr.append($date);

            var $options = $("<td></td>");
            $tr.append($options);

            var $anchor = $("<a class='btn-flat waves-effect dropdown-button'><i class='material-icons'>more_vert</i></a>");
            $anchor.attr("data-activates", "menu-" + user.user_id);
            $options.append($anchor);

            var $dropdown = $("<ul class='dropdown-content' id='menu-" + user.user_id + "'></ul>");
            $options.append($dropdown);

            var $shareItem = $("<li></li>");
            $dropdown.append($shareItem);

            var $shareAnchor = $("<a class='waves-effect'><i class='material-icons'>save</i>Recover All Contacts</a>");
            $shareAnchor.click(function () {
                showTransferAllContactsDialog(user.user_id);
            });
            $shareItem.append($shareAnchor);

            var $deleteItem = $("<li></li>");
            $dropdown.append($deleteItem);

            var $deleteAnchor = $("<a class='waves-effect'><i class='material-icons'>delete</i>Remove Team Member</a>");
            $deleteAnchor.click(function () {
                showDeleteEmployeeDialog(user.user_id);
            });
            $deleteItem.append($deleteAnchor);

            $('.dropdown-button').dropdown({
                constrainWidth: false,
                alignment: "right"
            });
        }
    }
}

function showTransferAllContactsDialog(originEmployeeId) {
    const originEmployeeName = $('#employee-name-' + originEmployeeId).html();
    $('#coworkers_dialog_title').html("Select an Team Member to Receive the Contacts");

    showProgressForCoworkerDialog();

    $('#coworkers_dialog').modal("open");

    getCoWorkers(originEmployeeId, successFunction, errorFunction);

    function successFunction(data) {
        renderCoworkersForDialog(data, employeeClickFunction);
    }

    function employeeClickFunction(employee) {
        $('#coworkers_dialog_confirmation_text').html("Are you sure you want to recover all of " + originEmployeeName + "\'s " +
            "contacts and lists by sending them to " + employee.name + "? Doing so copies all contacts and lists to " +
            employee.name + ". This action cannot be undone.");

        $('#coworkers_dialog_submit')[0].onclick = function () {
            transferAllContacts(originEmployeeId, employee.employee_id);
        };

        showConfirmationForCoworkerDialog();
    }

    function errorFunction(xhr) {
        showListForCoworkerDialog();
        if (xhr.status === 409) {
            showGetCoworkersError("You have no team members to share the contacts with.<br>Add more team members to " +
                "transfer contacts.");
        } else {
            showGetCoworkersError("An error occurred getting your team members.<br>Please try again or submit a bug " +
                "report.");
        }
    }

    function transferAllContacts(originId, destinationId) {
        showProgressForCoworkerDialog();
        doPost("/manager/employees/transfer", {origin_id: originId, destination_id: destinationId}, function () {
            $('.modal').modal("close");
            showToast("The team member's contacts were successfully shared");
        }, function () {
            showConfirmationForCoworkerDialog();
            showToast("There was an error transferring the contacts. Please try again or submit a bug report");
        });
    }
}

function showTransferManagerProspectsDialog(prospectIds, originId) {
    if (!Array.isArray(prospectIds)) {
        prospectIds = [prospectIds];
    }

    $('#coworkers_dialog_title').html("Select an Team Member to be the Recipient");

    showProgressForCoworkerDialog();

    $('#coworkers_dialog').modal("open");

    getCoWorkers(originId, successFunction, errorFunction);

    const grammar = prospectIds.length === 1 ? "this contact" : "these contacts";
    const grammar2 = prospectIds.length === 1 ? "contact was" : "contacts were";

    function successFunction(data) {
        renderCoworkersForDialog(data, coworkerClickFunction);
    }

    function coworkerClickFunction(employee) {
        $('#coworkers_dialog_confirmation_text').html("Are you sure you want to share " + grammar + " with " + employee.name + "? Doing so " +
            "makes a live copy of the data for " + employee.name + ". This action cannot be undone.");

        $('#coworkers_dialog_submit')[0].onclick = function () {
            transferProspects(employee.employee_id);
        };

        showConfirmationForCoworkerDialog();
    }

    function errorFunction(xhr) {
        showListForCoworkerDialog();
        if (xhr.status === 409) {
            showGetCoworkersError("You have no team members to share contacts with.<br>Add more team members to " +
                "transfer contacts.");
        } else {
            showGetCoworkersError("An error occurred getting your team members.<br>Please try again or submit a " +
                "bug report.");
        }
    }

    function transferProspects(destinationId) {
        showProgressForCoworkerDialog();
        doPost("/manager/employees/transferProspects", {
            origin_id: originId,
            destination_id: destinationId
        }, function () {
            $('.modal').modal("close");
            showToast("The team member's " + grammar2 + " successfully shared");
        }, function () {
            showConfirmationForCoworkerDialog();
            showToast("An error occurred while attempting to share from this team member. Please try again or submit " +
                "a bug report");
        });
    }
}

function showTransferManagerListDialog(listId, originId) {
    $('#coworkers_dialog_title').html("Select an Team Member to be the Recipient");

    showProgressForCoworkerDialog();

    $('#coworkers_dialog').modal("open");

    getCoWorkers(originId, successFunction, errorFunction);

    function successFunction(data) {
        renderCoworkersForDialog(data, coworkerClickFunction);
    }

    function coworkerClickFunction(employee) {
        $('#coworkers_dialog_confirmation_text').html("Are you sure you want to share this list with " +
            employee.name + "? Doing so makes a live copy of the data for " + employee.name + ". This action cannot be " +
            "undone.");

        $('#coworkers_dialog_submit')[0].onclick = function () {
            transferList(employee.employee_id);
        };

        showConfirmationForCoworkerDialog();
    }

    function errorFunction(xhr) {
        showListForCoworkerDialog();
        if (xhr.status === 409) {
            showGetCoworkersError("You have no team members to share the list with.<br>Add more members to your team " +
                "to transfer lists.");
        } else {
            showGetCoworkersError("An error occurred getting your team members.<br>Please try again or submit a bug " +
                "report.");
        }
    }

    function transferList(destinationId) {
        showProgressForCoworkerDialog();
        doPost("/manager/employees/transferList", {
            list_id: listId,
            origin_id: originId,
            destination_id: destinationId
        }, function () {
            $('.modal').modal("close");
            showToast("List successfully shared");
        }, function () {
            showConfirmationForCoworkerDialog();
            showToast("There was an error sharing the list. Please try again or submit a bug report");
        });
    }
}

function showTransferUserProspectsDialog(prospectIds) {
    if (!Array.isArray(prospectIds)) {
        prospectIds = [prospectIds];
    }

    $('#coworkers_dialog_title').html("Select a Team Member to be the Recipient");

    showProgressForCoworkerDialog();

    $('#coworkers_dialog').modal("open");

    getCoWorkers(null, successFunction, errorFunction);

    const grammar = prospectIds.length === 1 ? "this contact" : "these contacts";
    const grammar2 = prospectIds.length === 1 ? "contact was" : "contacts were";

    function successFunction(data) {
        renderCoworkersForDialog(data, coworkerClickFunction);
    }

    function coworkerClickFunction(employee) {
        $('#coworkers_dialog_confirmation_text').html("Are you sure you want to share " + grammar + " with " +
            employee.name + "? Doing so makes a live copy of the data for " + employee.name + ". This action cannot be " +
            "undone.");
        $('#coworkers_dialog_submit')[0].onclick = function () {
            transferProspects(employee.employee_id);
        };

        showConfirmationForCoworkerDialog();
    }

    function errorFunction(xhr) {
        showListForCoworkerDialog();
        if (xhr.status === 409) {
            showGetCoworkersError("You have no team members to share with.<br>Have your manager add you to their " +
                "team to use this feature.");
        } else {
            showGetCoworkersError("An error occurred getting your team members.<br>Please try again or submit a bug " +
                "report.");
        }
    }

    function transferProspects(destinationId) {
        showProgressForCoworkerDialog();
        doPost("/user/transferProspects", {
            person_ids: prospectIds,
            destination_id: destinationId
        }, function () {
            $('.modal').modal("close");
            showToast("Your " + grammar2 + " successfully shared");
        }, function () {
            showConfirmationForCoworkerDialog();
            showToast("An error occurred while attempting to share to this team member. Please try again or submit a bug report");
        });
    }
}

function showTransferUserListDialog(listId) {
    $('#coworkers_dialog_title').html("Select a Team Member to be the Recipient");

    showProgressForCoworkerDialog();

    $('#coworkers_dialog').modal("open");

    getCoWorkers(null, successFunction, errorFunction);

    function successFunction(data) {
        renderCoworkersForDialog(data, coworkerClickFunction);
    }

    function coworkerClickFunction(employee) {
        $('#coworkers_dialog_confirmation_text').html("Are you sure you want to share this list with " +
            employee.name + "? Doing so makes a live copy of the data for " + employee.name + ". This action cannot be " +
            "undone.");
        $('#coworkers_dialog_submit')[0].onclick = function () {
            transferList(employee.employee_id);
        };

        showConfirmationForCoworkerDialog();
    }

    function errorFunction(xhr) {
        showListForCoworkerDialog();

        if (xhr.status === 409) {
            showGetCoworkersError("You have no team members to share with.<br>Have your manager add you to their " +
                "team to use this feature.");
        } else {
            showGetCoworkersError("An error occurred getting your team members.<br>Please try again or submit a bug " +
                "report.");
        }
    }

    function transferList(destinationId) {
        showProgressForCoworkerDialog();

        doPost("/user/transferList", {
            list_id: listId,
            destination_id: destinationId
        }, function () {
            $('.modal').modal("close");
            showToast("Your list was successfully shared");
        }, function () {
            showConfirmationForCoworkerDialog();

            showToast("An error occurred sharing the list. Please try again or submit a bug report");
        });
    }
}

function getCoWorkers(employeeIdToIgnore, successFunction, errorFunction) {
    var json = employeeIdToIgnore ? {employee_id: employeeIdToIgnore} : {};
    doGet("/manager/employees/coworkers", json, successFunction, errorFunction);
}

function showGetCoworkersError(message) {
    var $list = $('#coworkers_dialog_list');
    $list.children().each(function () {
        $(this).remove();
    });

    $list.append($("<a class='collection-item'>" + message + "</a>"));
}

function showListForCoworkerDialog() {
    $('#coworkers_dialog_progress_container').hide();
    $('#coworkers_dialog_confirmation_text').hide();
    $('#coworkers_dialog_submit').hide();
    $('#coworkers_dialog_list').show(300);
}

function showProgressForCoworkerDialog() {
    $('#coworkers_dialog_list').hide();
    $('#coworkers_dialog_confirmation_text').hide();
    $('#coworkers_dialog_submit').hide();
    $('#coworkers_dialog_progress_container').show(300);
}

function showConfirmationForCoworkerDialog() {
    $('#coworkers_dialog_list').hide();
    $('#coworkers_dialog_progress_container').hide();
    $('#coworkers_dialog_confirmation_text').show(300);
    $('#coworkers_dialog_submit').show(300);
}

function renderCoworkersForDialog(employeeList, employeeClickFunctionFunction) {
    $('#coworkers_dialog_confirmation_text').hide();
    $('#coworkers_dialog_submit').hide();
    $('#coworkers_dialog_progress_container').hide(300, function () {
        $('#coworkers_dialog_list').show(300);
    });

    var $list = $('#coworkers_dialog_list');
    $list.children().each(function () {
        $(this).remove();
    });

    employeeList.forEach(function (employee) {
        var color = employee.is_current_employee ? "green lighten-3" : "";

        var $item = $("<a class='collection-item avatar waves-effect " + color + "'>" +
            "<i class='material-icons indigo circle'>person</i> " +
            "<span class='title'>" + employee.name + "</span>" +
            "<p class='indigo-text text-lighten-1'>" + employee.email + "</p>" +
            "</a>");
        $item.click(function () {
            $list.hide(300, function () {
                $('#coworkers_dialog_progress_container').hide();
                $('#coworkers_dialog_list').hide(300, function () {
                    if (employeeClickFunctionFunction) {
                        employeeClickFunctionFunction(employee);
                    }
                });
            });
        });
        $list.append($item);
    });
}

function showDeleteEmployeeDialog(employeeId) {
    $('#delete_dialog_title').html("Delete Employee");

    $('#delete_dialog_content').html("Are you sure you want to delete this team member? Doing so will prevent you from " +
        "tracking their statistics, viewing their activity sheets, transferring their contacts, and allowing other " +
        "team members to share their contacts with this person.");

    showDeleteDialog(function () {
        doPost("/manager/employees/delete/" + employeeId, {}, successFunction, errorFunction);
    });

    function successFunction() {
        $("#employee-" + employeeId).remove();

        if ($("#employee-table").find("> tbody > tr").length === 1) {
            $('.no-results-found').show(300);
        }

        $('.modal').modal("close");
        showToast("Team member successfully removed");
    }

    function errorFunction() {
        showToast("There was an error removing this team member. Please try again or submit a bug report");
    }

}