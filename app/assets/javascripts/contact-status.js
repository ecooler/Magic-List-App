/** @namespace state.state_description */
/** @namespace state.is_dial_sheet_state */
/** @namespace state.is_indeterminate */
/** @namespace state.is_objection */
/** @namespace state.is_introduction */
/** @namespace state.is_inventory */
/** @namespace state.is_missed_appointment */
/** @namespace state.is_parent */
/** @namespace state.children */
/** @namespace state.state_class */

/**
 * @type {{isReady: boolean, key: string, allStatuses: undefined, clickTypes: {person: string, notifications: string, appointments: string}, onClickFunctions: {person: Array, notifications: Array, appointments: Array}, successFunctions: {person: Array, notifications: Array, appointments: Array}, personStateClickFunction: contactStatus.personStateClickFunction, notificationOutcomeClickFunction: contactStatus.notificationOutcomeClickFunction, appointmentOutcomeClickFunction: contactStatus.appointmentOutcomeClickFunction, showDialogForStateClickIfNecessary: contactStatus.showDialogForStateClickIfNecessary, getContactStatusFromStateType: contactStatus.getContactStatusFromStateType, createDropdown: contactStatus.createDropdown, getSetupMarkup: contactStatus.getSetupMarkup, getAllContactsStatuses: contactStatus.getAllContactsStatuses, getAllFollowUpStatuses: contactStatus.getAllFollowUpStatuses, getAllObjectionStatuses: contactStatus.getAllObjectionStatuses, getAllInventoryStatuses: contactStatus.getAllInventoryStatuses, getAllAppointmentStatuses: contactStatus.getAllAppointmentStatuses, getAllMissedAppointmentStatuses: contactStatus.getAllMissedAppointmentStatuses, isAppointmentStatus: contactStatus.isAppointmentStatus, isInventoryStatus: contactStatus.isInventoryStatus, isMissedAppointmentStatus: contactStatus.isMissedAppointmentStatus, setupInventoryDropdown: contactStatus.setupInventoryDropdown, destroyInventoryDropdown: contactStatus.destroyInventoryDropdown, getContactStateDescriptionFromType: contactStatus.getContactStateDescriptionFromType, setupDropdown: contactStatus.setupDropdown, onStateClick: contactStatus.onStateClick, onStateClickFailure: contactStatus.onStateClickFailure}}
 */
const contactStatus = {
    isReady: false,
    key: "contactStatus",
    allStatuses: undefined,

    clickTypes: {
        person: "person",
        notifications: "notifications",
        appointments: "appointments"
    },

    /**
     * The list of functions that override the native click function, IE person clicks, notification clicks, or
     * appointment clicks
     */
    onClickFunctions: {

        /**
         * A list of functions that takes following: entityId, entityName, stateType, stateDescription, stateClass
         */
        person: [],

        /**
         * A list of functions that takes following: entityId, entityName, stateType, stateDescription, stateClass
         */
        notifications: [],

        /**
         * A list of functions that takes following: entityId, entityName, stateType, stateDescription, stateClass
         */
        appointments: []
    },

    successFunctions: {

        /**
         * A list of functions that take the prospect ID as a parameter. Called after a prospect status was
         * successfully changed.
         */
        person: [],

        /**
         * A list of functions that take the notification ID as a parameter. Called after a notification status was
         * successfully changed.
         */
        notifications: [],

        /**
         * A list of functions that take the appointment ID as a parameter. Called after a appointment status was
         * successfully changed.
         */
        appointments: []
    },

    personStateClickFunction: function (personId, personName, selectedState) {
        var $stateNode = $('#contact-status-button-' + personId);

        var oldStateType = $stateNode.attr("data-state");
        var oldStateDescription = $stateNode.html();
        var oldStateClass = $stateNode.attr("data-state-class");

        contactStatus.showDialogForStateClickIfNecessary(selectedState, personId);

        if (oldStateType === selectedState) {
            return;
        }

        var json = {};
        json.state = selectedState;

        doPost("/person/state/edit/" + personId, json, function (dialSheet) {
                onDialSheetChanged(dialSheet, personId);
            },
            function () {
                showToast('Could not change the contact status of ' + personName);

                contactStatus.onStateClickFailure(personId, oldStateType, oldStateDescription, oldStateClass);
            }
        );
    },

    notificationOutcomeClickFunction: function (notificationId, entityName, selectedState, dateWithTimeMoment) {
        const $currentStateNode = $('#contact-status-button-' + notificationId);
        const currentState = $currentStateNode.attr("data-state");
        const currentStateDescription = $currentStateNode.html();
        const currentStateClass = $currentStateNode.attr("data-state-class");

        const personId = $('#' + notificationId).attr('data-person-id');

        contactStatus.showDialogForStateClickIfNecessary(selectedState, personId);

        if (!dateWithTimeMoment) {
            dateWithTimeMoment = moment();
        }

        if (!entityName) {
            entityName = $('.person_name_' + personId).html();
        }

        const json = {
            state: selectedState,
            contact_time: dateWithTimeMoment.format("x")
        };

        doPost("/notification/updateStatus/" + notificationId, json, success, error);

        function success(dialSheet) {
            $('#last-contacted-' + notificationId).html(getShortDateWithTime(undefined));
            $('#date_with_time_dialog').modal("close");

            onDialSheetChanged(dialSheet, personId);
        }

        function error() {
            showToast("There was an error updating the status of your notification for " + entityName + ". Please try again or submit a bug report");
            contactStatus.onStateClickFailure(notificationId, currentState, currentStateDescription, currentStateClass);
        }
    },

    /**
     * @param entityId
     * @param entityName
     * @param stateType
     */
    appointmentOutcomeClickFunction: function (entityId, entityName, stateType) {
        const $currentStateNode = $('#contact-status-button-' + entityId);
        const currentState = $currentStateNode.attr("data-state");
        const currentStateDescription = $currentStateNode.html();
        const currentStateClass = $currentStateNode.attr("data-state-class");

        const personId = $('#appointment-' + entityId).attr('data-person-id');

        contactStatus.showDialogForStateClickIfNecessary(stateType, personId);

        if (currentState === stateType) {
            return;
        }

        doPost("/appointments/updateStatus/" + entityId, {state: stateType}, success, error);

        function success(dialSheet) {
            const appointmentDate = $('#appointment-date-' + entityId).attr('data-date');
            $('#last-contacted-' + entityId).html(getShortDateWithTime(appointmentDate));

            onDialSheetChanged(dialSheet, personId);

            if (contactStatus.successFunctions.appointments.length) {
                contactStatus.successFunctions.appointments.forEach(function (callbackFunction) {
                    callbackFunction(entityId);
                });
            }
        }

        function error(xhr) {
            console.error("Status: ", xhr.statusText);
            showToast("There was an error updating the outcome of your appointment. Please try again or submit a bug report");

            contactStatus.onStateClickFailure(entityId, currentState, currentStateDescription, currentStateClass);
        }
    },

    showDialogForStateClickIfNecessary: function (stateType, personId) {
        if (stateType === 'call_back') {
            showCreateCallbackNotificationDialog(personId);
        } else if (contactStatus.isAppointmentStatus(stateType)) {
            showCreateAppointmentDialog(personId, stateType);
        } else if (contactStatus.isMissedAppointmentStatus(stateType)) {
            showCreateCallbackNotificationDialog(personId);
        }
    },

    getContactStatusFromStateType: function (stateType) {
        if (!contactStatus.isReady) {
            console.error("Contact statuses did not load yet!");
            return null;
        }

        const allStatuses = contactStatus.allStatuses;
        for (var i = 0; i < allStatuses.length; i++) {
            if (allStatuses[i].state_type === stateType) {
                return allStatuses[i];
            }

            if (allStatuses[i].is_parent) {
                const children = allStatuses[i].children;
                for (var j = 0; j < children.length; j++) {
                    if (children[j].state_type === stateType) {
                        return children[j];
                    }
                }
            }
        }

        return null;
    },

    /**
     * @param entityId The unique ID of the entity
     * @param entityName The name of the entity, IE a person name
     * @param currentState The current state object
     * @param isDisabled True to disable the dropdown anchor, false to enable it
     * @param clickType The ClickType of the contact status drop down
     * @param isAppointment True if this dropdown is for an appointment, false otherwise. If true, it will augment
     * "Not Contacted" to read "No Outcome"
     * @return A jQuery object, to append to the DOM for a dropdown. Use the selector ".contact-status-item" to bind
     * all click events to the dropdown anchor items.
     */
    createDropdown: function (entityId, entityName, currentState, isDisabled, clickType, isAppointment) {
        if (!contactStatus.isReady) {
            console.error("Contact statuses are not ready yet");
            return undefined;
        }

        const $baseNode = $('<div class="inline"></div>');

        const contactStatusDropdownId = entityId + '-contact-status-dropdown';
        const $dropdownAnchor = $('<a class="dropdown-button btn-flat side-padding-small no-transform contact-status-dropdown" ' +
            'data-activates="' + contactStatusDropdownId + '"></a>');
        $dropdownAnchor.attr("data-state", currentState.state_type);
        $dropdownAnchor.attr("data-state-class", currentState.state_class);
        $dropdownAnchor.attr("data-alignment", "right");
        $dropdownAnchor.attr("id", 'contact-status-button-' + entityId);

        if (isDisabled) {
            $dropdownAnchor.addClass("disabled");
        }

        var stateDescription = augmentNotContactedIfIsAppointment(currentState);

        $dropdownAnchor.html(stateDescription);
        $dropdownAnchor.addClass(currentState.state_class);
        $baseNode.append($dropdownAnchor);

        const $list = $('<ul id="' + contactStatusDropdownId + '" class="dropdown-content"></ul>');
        $baseNode.append($list);

        contactStatus.allStatuses.forEach(function (state) {
            const $listItem = $('<li></li>');
            $list.append($listItem);

            const $listItemAnchor = createStateAnchorItem(entityId, state);
            $listItem.append($listItemAnchor);

            if (state.is_parent) {
                // Add the list of child states
                $listItemAnchor.removeClass("contact-status-item");
                $listItemAnchor.removeClass("opacity-hover");
                $listItemAnchor.off("click");
                $listItemAnchor.addClass("regular-cursor");
                const listId = entityId + '-' + state.state_type + '-contact-status-dropdown';

                $listItemAnchor.append($('<i class="material-icons no-margin right">chevron_right</i>'));

                $listItemAnchor.addClass("dropdown-button");
                $listItemAnchor.attr('data-activates', listId);
                $listItemAnchor.attr('data-hover', true);
                $listItemAnchor.attr('data-alignment', "left");
                $listItemAnchor.attr('data-constrainwidth', false);

                const $childList = $('<ul id="' + listId + '" class="dropdown-content"></ul>');
                $baseNode.append($childList);

                const childStates = state.children;
                childStates.forEach(function (childState) {
                    const $listItem = $('<li></li>');
                    $childList.append($listItem);

                    $listItem.append(createStateAnchorItem(entityId, childState));
                });
            }

            function createStateAnchorItem(entityId, state) {
                const $anchor = $('<a class="no-transform side-padding-small opacity-hover left-align contact-status-item"></a>');
                $anchor.addClass(state.state_class);
                $anchor.attr("data-state", state.state_type);

                var stateDescription = augmentNotContactedIfIsAppointment(state);

                $anchor.attr("data-state-description", stateDescription);
                $anchor.attr("data-state-class", state.state_class);
                $anchor.attr("data-id", entityId);
                $anchor.html(stateDescription);
                $anchor.click(function () {
                    clickFunction($(this));
                });

                return $anchor;
            }

            function clickFunction($self) {
                const state = $self.attr("data-state");
                const stateDescription = $self.attr("data-state-description");
                const stateClass = $self.attr("data-state-class");

                var fun;
                var overrideFun;
                if (clickType === contactStatus.clickTypes.person) {
                    fun = contactStatus.personStateClickFunction;
                    if (contactStatus.onClickFunctions.person.length) {
                        overrideFun = contactStatus.onClickFunctions.person[0];
                    }
                } else if (clickType === contactStatus.clickTypes.notifications) {
                    fun = contactStatus.notificationOutcomeClickFunction;
                    if (contactStatus.onClickFunctions.notifications.length) {
                        overrideFun = contactStatus.onClickFunctions.notifications[0];
                    }
                } else if (clickType === contactStatus.clickTypes.appointments) {
                    fun = contactStatus.appointmentOutcomeClickFunction;
                    if (contactStatus.onClickFunctions.appointments.length) {
                        overrideFun = contactStatus.onClickFunctions.appointments[0];
                    }
                } else {
                    console.error("Invalid click type, found: ", clickType);
                    return;
                }

                if (overrideFun) {
                    overrideFun(entityId, entityName, state, stateDescription, stateClass);
                } else {
                    if (fun && typeof fun === 'function') {
                        fun(entityId, entityName, state);
                    }
                    contactStatus.onStateClick(entityId, state, stateDescription, stateClass);
                }
            }
        });

        function augmentNotContactedIfIsAppointment(state) {
            if (state.state_type === 'not_contacted' && isAppointment) {
                return "No Outcome";
            } else {
                return state.state_description;
            }
        }

        return $baseNode;
    },

    /**
     * @param entityId
     * @param entityName
     * @param stateType
     * @param stateClass
     * @param stateDescription
     * @param sendClicksToServer
     * @param isDisabled
     * @param clickType
     * @param isAppointment True if the contact status will be for an appointment. If true, it will augment
     * "Not Contacted" to "No Outcome"
     * @returns {string} Raw HTML that can be appended to a jQuery object and initialized with contactStatus.setupDropdown
     */
    getSetupMarkup: function (entityId, entityName, stateType, stateDescription, stateClass, sendClicksToServer, isDisabled,
                              clickType, isAppointment) {
        return '<span class="contact-status-wrapper btn contact-status-button" ' +
            'id="' + entityId + '-contact-status" ' +
            'data-id="' + entityId + '" ' +
            'data-name="' + entityName + '" ' +
            'data-state="' + stateType + '" ' +
            'data-state-description="' + stateDescription + '" ' +
            'data-state-class="' + stateClass + '" ' +
            'data-send-clicks-to-server="' + sendClicksToServer + '" ' +
            'data-is-disabled="' + isDisabled + '" ' +
            'data-click-type="' + clickType + '" ' +
            'data-is-appointment="' + isAppointment + '"></span>';
    },

    getAllContactsStatuses: function () {
        const statuses = [];
        contactStatus.allStatuses.forEach(function (item) {
            if (item.is_dial_sheet_state && item.state_type !== 'not_contacted') {
                statuses.push(item);
            } else if (item.is_parent) {
                item.children.forEach(function (item) {
                    if (item.is_dial_sheet_state) {
                        statuses.push(item);
                    }
                });
            }
        });
        return statuses;
    },

    getAllFollowUpStatuses: function () {
        const statuses = [];
        contactStatus.allStatuses.forEach(function (item) {
            if (item.is_indeterminate) {
                statuses.push(item);
            } else if (item.is_parent) {
                item.children.forEach(function (item) {
                    if (item.is_indeterminate) {
                        statuses.push(item);
                    }
                });
            }
        });
        return statuses;
    },

    getAllObjectionStatuses: function () {
        const statuses = [];
        contactStatus.allStatuses.forEach(function (item) {
            if (item.is_objection) {
                statuses.push(item);
            } else if (item.is_parent) {
                item.children.forEach(function (item) {
                    if (item.is_objection) {
                        statuses.push(item);
                    }
                });
            }
        });
        return statuses;
    },

    getAllInventoryStatuses: function () {
        const statuses = [];
        contactStatus.allStatuses.forEach(function (state) {
            if (state.is_inventory && !state.is_parent) {
                statuses.push(state);
            }
            else if (state.is_inventory && state.is_parent) {
                state.children.forEach(function (childState) {
                    statuses.push(childState);
                });
            }
        });
        return statuses;
    },

    getAllAppointmentStatuses: function () {
        const statuses = [];
        contactStatus.allStatuses.forEach(function (state) {
            if ((state.is_inventory || state.is_introduction) && !state.is_parent) {
                statuses.push(state);
            }
            else if (state.is_inventory && state.is_parent) {
                state.children.forEach(function (childState) {
                    statuses.push(childState);
                });
            }
        });
        return statuses;
    },

    getAllMissedAppointmentStatuses: function () {
        const statuses = [];
        contactStatus.allStatuses.forEach(function (item) {
            if (item.is_parent && item.is_missed_appointment) {
                item.children.forEach(function (item) {
                    statuses.push(item);
                });
            }
        });
        return statuses;
    },

    isAppointmentStatus: function (stateType) {
        var isAppointmentStatus = false;
        contactStatus.allStatuses.forEach(function (item) {
            if (item.state_type === stateType && (item.is_introduction || item.is_inventory)) {
                isAppointmentStatus = true;
            } else if (item.is_parent) {
                item.children.forEach(function (childItem) {
                    if (childItem.state_type === stateType && (childItem.is_introduction || childItem.is_inventory)) {
                        isAppointmentStatus = true;
                    }
                });
            }
        });

        return isAppointmentStatus;
    },

    isInventoryStatus: function (stateType) {
        var isInventoryStatus = false;
        contactStatus.allStatuses.forEach(function (item) {
            if (item.state_type === stateType && item.is_inventory) {
                isInventoryStatus = true;
            } else if (item.is_parent) {
                item.children.forEach(function (childItem) {
                    if (childItem.state_type === stateType && childItem.is_inventory) {
                        isInventoryStatus = true;
                    }
                });
            }
        });

        return isInventoryStatus;
    },

    isMissedAppointmentStatus: function (stateType) {
        var isMissedAppointmentStatus = false;
        contactStatus.allStatuses.forEach(function (item) {
            if (item.state_type === stateType && item.is_missed_appointment) {
                isMissedAppointmentStatus = true;
            } else if (item.is_parent) {
                item.children.forEach(function (childItem) {
                    if (childItem.state_type === stateType && childItem.is_missed_appointment) {
                        isMissedAppointmentStatus = true;
                    }
                });
            }
        });

        return isMissedAppointmentStatus;
    },

    setupInventoryDropdown: function ($select, selectedState) {
        $select.children().remove();

        contactStatus.getAllAppointmentStatuses().forEach(function (state, index) {
            var $option;

            if (selectedState === state.state_type) {
                $option = $('<option selected></option>');
            } else if (!selectedState && index === 0) {
                $option = $('<option selected></option>');
            } else {
                $option = $('<option></option>');
            }

            $option.attr("name", "appointment_type");
            $option.attr("value", state.state_type);
            $option.html(state.state_description);

            $select.append($option);
        });

        $select.material_select();
    },

    destroyInventoryDropdown: function ($select) {
        $select.material_select('destroy');
    },

    getContactStateDescriptionFromType: function (stateType) {
        for (var i = 0; i < contactStatus.allStatuses.length; i++) {
            const status = contactStatus.allStatuses[i];
            if (status.state_type === stateType) {
                return contactStatus.allStatuses[i].state_description;
            }
            if (status.is_parent) {
                for (var j = 0; j < status.children.length; j++) {
                    const childStatus = status.children[j];
                    if (childStatus.state_type === stateType) {
                        return childStatus.state_description;
                    }
                }
            }
        }
        return null;
    },

    setupDropdown: function () {
        $('.contact-status-wrapper:not(.contact-status-initialized)').each(function () {
            const entityId = $(this).attr("data-id");
            const entityName = $(this).attr("data-name");
            const currentState = {
                state_type: $(this).attr("data-state"),
                state_description: $(this).attr("data-state-description"),
                state_class: $(this).attr("data-state-class")
            };

            const isDisabled = $(this).attr("data-is-disabled") === "true";

            const clickType = $(this).attr("data-click-type");

            const isAppointment = $(this).attr("data-is-appointment") === "true";

            const $dropdown = contactStatus.createDropdown(entityId, entityName, currentState, isDisabled, clickType, isAppointment);

            $(this).append($dropdown);

            $('#' + entityId + '-contact-status-dropdown > li > a.dropdown-button').on("mouseover", function () {
                const $menu = $('#' + $(this).attr("data-activates"));

                if ($(this).right() < $menu.width()) {
                    $menu.css("margin-left", "-100%");
                } else {
                    $menu.css("margin-left", "100%");
                }
            });

            $(this).addClass("contact-status-initialized");
        });

        $('.dropdown-button').dropdown();
    },

    onStateClick: function (entityId, stateType, stateDescription, stateClass) {
        const $stateButton = $('#contact-status-button-' + entityId);

        setTimeout(function () {
            // Wait a couple ms for the network call in the other method to fire.
            $stateButton.removeClass($stateButton.attr("data-state-class"));
            $stateButton.addClass(stateClass);
            $stateButton.attr('data-state', stateType);
            $stateButton.attr('data-state-description', stateDescription);
            $stateButton.attr('data-state-class', stateClass);
            $stateButton.html(stateDescription);
        }, 15);

        // From notifications & Appointments
        if (stateType !== 'not_contacted') {
            const $currentStatus = $('#current-status-' + entityId);
            $currentStatus.removeClass($currentStatus.attr("data-state-class"));
            $currentStatus.addClass(stateClass);
            $currentStatus.attr("data-state-class", stateClass);
            $currentStatus.attr("data-state", stateType);
            $currentStatus.attr("data-state-description", stateDescription);
            $currentStatus.html(stateDescription);
        }

        // From Activity
        const $activityRow = $('#activity-row-' + entityId);
        $activityRow.removeClass($activityRow.attr("data-state-class"));
        $activityRow.addClass(stateClass);
        $activityRow.attr("data-state-class", stateClass);

        if (stateType === 'not-contacted') {
            setTimeout(function () {
                $activityRow.remove();
            }, 300);
        }

        // From search rows
        var $row = $('#person-row-' + entityId);
        $row.removeClass($row.attr("data-state-class"));
        $row.addClass(stateClass);
        $row.attr("data-state-class", stateClass);
    },

    onStateClickFailure: function (entityId, oldStateType, oldStateDescription, oldStateClass) {
        // From standard dropdown anchor
        const $stateButton = $('#contact-status-button-' + entityId);
        $stateButton.removeClass($stateButton.attr("data-state-class"));
        $stateButton.addClass(oldStateClass);
        $stateButton.attr("data-state", oldStateType);
        $stateButton.attr("data-state-description", oldStateDescription);
        $stateButton.attr("data-state-class", oldStateClass);
        $stateButton.html(oldStateDescription);

        // From notifications
        const $currentStatus = $('#current-status-' + entityId);
        $currentStatus.removeClass($currentStatus.attr("data-state-class"));
        $currentStatus.addClass(oldStateClass);
        $currentStatus.attr("data-state-class", oldStateClass);
        $currentStatus.attr("data-state", oldStateType);
        $currentStatus.attr("data-state-description", oldStateDescription);
        $currentStatus.html(oldStateDescription);

        // From search rows
        var $row = $('#person-row-' + entityId);
        $row.removeClass($row.attr("data-state-class"));
        $row.addClass(oldStateClass);
        $row.attr("data-state-class", oldStateClass);

        // From activity
        const $activityRow = $('#activity-row-' + entityId);
        $activityRow.removeClass($activityRow.attr("data-state-class"));
        $activityRow.attr("data-state-class", oldStateClass);
        $activityRow.addClass(oldStateClass);
    }
};

$(document).ready(function () {
    var contactStatuses;

    if (isProduction) {
        contactStatuses = localStorage.getItem(contactStatus.key);
    }

    if (contactStatuses) {
        contactStatuses = JSON.parse(contactStatuses);
        if (moment(parseInt(contactStatuses.time)).add(15, "minutes").isAfter(moment())) {
            // the cache expired
            doGet("/settings/contactStatuses", {}, success, error);
        } else {
            success(contactStatuses.data);
        }
    } else {
        doGet("/settings/contactStatuses", {}, success, error);
    }

    function success(data) {
        contactStatus.allStatuses = data;

        contactStatus.isReady = true;

        if (isProduction) {
            localStorage.setItem(contactStatus.key, JSON.stringify({data: data, time: moment().format("x")}));
        }

        contactStatus.setupDropdown();
        contactStatus.setupInventoryDropdown($('#appointment_dialog_appointment_type'));
    }

    function error(xhr) {
        console.log("Error: ", xhr.status);
        showToast("There was an error retrieving the contact statuses. Please reload the page or submit a bug report");
    }
});