/** @namespace appointment.calendar_events */
/** @namespace appointment.appointment_outcome */
/** @namespace calendar_event.event_id */
/** @namespace calendar_event.hyper_link */

/**
 * @type {{onFormSubmit: appointmentCallbacks.onFormSubmit}}
 */
const appointmentCallbacks = {

    /**
     * @param e The event that fired
     * @param state The current (unchanged) state of the form being submitted
     */
    onFormSubmit: function (e, state) {
        e.preventDefault();

        if (!appointmentState.isStateSame(state)) {
            // only do a GET if the form changes

            // remove all of the notification items, we're wiping everything
            const $appointmentItems = $('.appointment-item');
            $appointmentItems.fadeOut(300);
            setTimeout(function () {
                $appointmentItems.remove();
            });

            state.current_page = 1;
            state.sort_by = $('#sort-by-appointment').val();
            state.ascending = $('#ascending-appointment').val() === 'true';

            doGetForAppointmentAlerts(state, false);
        }

    }

};

/**
 * @type {{getAppointmentItem: appointments.getAppointmentItem}}
 */
const appointments = {

    /**
     * @param appointment The appointment JSON object sent back from the server
     * @returns {JQuery | * | jQuery | HTMLElement}
     */
    getAppointmentItem: function (appointment) {
        const appointmentId = appointment.appointment_id;
        const person = appointment.person;
        const $item = $('<li class="collection-item avatar allow-overflow appointment-item" id="appointment-' + appointmentId + '" ' +
            'data-person-id="' + person.person_id + '"></li>');
        $item.append('<i class="material-icons indigo-text white circle">person</i>');

        const $content = $('<div style="min-height: 96px;"></div>');
        $item.append($content);

        appendJqueryForContent();

        $item.append(getJqueryForSecondaryContent());

        $item.append(getJqueryForCollapsible());

        // Wait 20ms to initialize the jQuery
        setTimeout(function () {
            $('.collapsible').collapsible();
            contactStatus.setupDropdown();
        }, 20);

        return $item;

        function appendJqueryForContent() {
            const $title = $('<span class="title"><b>' +
                '<a class="black-text waves-effect person_name_' + person.person_id + '" ' +
                'href="/person/' + person.person_id + '">' + person.person_name + '</a>' +
                '</b></span>');
            $content.append($title);

            if (person.email) {
                $content.append($('<p>' + person.email + '</p>'));
            }

            if (person.phone_number) {
                $content.append($('<p>' + person.phone_number + '</p>'));
            }

            if (person.job_title && person.company_name) {
                $content.append($('<p>' + person.job_title + ' at ' + person.company_name + '</p>'));
            } else if (person.company_name) {
                $content.append($('<p>Works at ' + person.company_name + '</p>'));
            } else if (person.job_title) {
                $content.append($('<p>Job Title: ' + person.job_title + '</p>'));
            }

            $content.append($('<div class="row"></div>'));

            var contactTime = appointment.last_contacted === -1 ? "Not Contacted" : getShortDateWithTime(appointment.last_contacted);
            $content.append($('<p>Last Contacted: &nbsp;' +
                '<span id="last-contacted-@appointment.getAppointmentId">' + contactTime + '</span>' +
                '</p>'));

            $content.append($('<div class="row"></div>'));

            $content.append($('<p>Current Status: &nbsp;' +
                '<span data-state="' + person.state.state_type + '" id="current-status-' + appointmentId + '" ' +
                'data-state-class="' + person.state.state_class + '" ' +
                'class="regular-padding-small status-state ' + person.state.state_class + '">' +
                person.state.state_description +
                '</span> ' +
                '</p>'));

            $content.append($('<div class="row"></div>'));

            const outcome = appointment.appointment_outcome;
            const $meetingOutcome = $('<p>Meeting Outcome: &nbsp;</p>');
            $meetingOutcome.append(
                contactStatus.getSetupMarkup(appointmentId, person.person_name, outcome.state_type,
                    outcome.state_description, outcome.state_class, false, false, contactStatus.clickTypes.appointments,
                    true)
            );

            $content.append($meetingOutcome);

            $content.append($('<div class="row"></div>'));
        }

        function getJqueryForSecondaryContent() {
            const $span = $('<span class="secondary-content indigo-text">' +
                '<span id="appointment-date-' + appointmentId + '" data-date="' + appointment.appointment_date + '">' +
                getShortDateWithTime(appointment.appointment_date) +
                '</span>' +
                '<br>' +
                '<span>' +
                'Type: &nbsp; ' +
                '   <span class="appointment_type_' + appointmentId + '" ' +
                '   data="' + appointment.appointment_type.state_type + '">' + appointment.appointment_type.state_description + '</span>' +
                '</span>' +
                '<br>' +
                '<span class="hide appointment_notes_' + appointmentId + '">' + appointment.notes + '</span>' +
                '</span>');

            const $notesAnchor = $('<a class="btn-flat waves-effect side-padding-small">' +
                'Notes' +
                '<i class="material-icons black-text left">speaker_notes</i>' +
                '</a>');
            $notesAnchor.click(function () {
                showAppointmentNotesDialog(appointmentId, person.person_id);
            });
            $span.append($notesAnchor);
            $span.append($('<br>'));

            return $span;
        }

        function getJqueryForCollapsible() {
            const $collapsible = $('<ul class="collapsible" data-collapsible="popout"></ul>');
            $content.append($collapsible);

            const $listItem = $('<li></li>');
            $collapsible.append($listItem);

            $listItem.append($('<div class="collapsible-header">' +
                '<i class="material-icons green-text left">event</i>' +
                'Linked Calendar Events' +
                '</div>'));

            const $collapsibleBody = $('<div class="collapsible-body"></div>');
            $listItem.append($collapsibleBody);

            const calendarEvents = appointment.calendar_events;
            if (!calendarEvents.length) {
                $collapsibleBody.append($('<h6 class="grey-text">' +
                    'There are no calendar events linked to this appointment. ' +
                    '<a id="appointment-templates-button-' + appointmentId + '">Get Started</a>' +
                    '</h6>'));
            } else {
                calendarEvents.forEach(function (event) {
                    const $div = $('' +
                        '<div id="calendar-event-' + event.event_id + '">' +
                        '<div>' +
                        '   <img class="outlook-logo-extra-small no-vertical-margin left horizontal-margin" src="/assets/images/outlook.png">' +
                        '   <div>' +
                        '       <a class="calendar-event-link" target="_blank" href="' + event.hyper_link + '">' +
                        '           <span class="truncate">' + event.subject + '</span>' +
                        '       </a>' +
                        '       <a class="btn-icon btn-flat waves-effect right" ' +
                        '           onclick="showDeleteCalendarProviderEventDialog(' + event.event_id + ')">' +
                        '           <i class="material-icons">delete</i>' +
                        '       </a>' +
                        '   </div>' +
                        '</div>' +
                        '<div class="row"></div>' +
                        '<div class="divider"></div>' +
                        '<div class="row"></div>' +
                        '</div>');
                    $collapsibleBody.append($div);
                });
                $collapsibleBody.append($(
                    '<h6 class="grey-text">' +
                    '<a id="appointment-templates-button-' + appointmentId + '">' +
                    'Link more calendar events' +
                    '</a>' +
                    '</h6>'
                ));
            }

            $collapsibleBody.find('#appointment-templates-button-' + appointmentId).click(function () {
                showGetAppointmentTemplatesDialog(appointmentId);
            });

            return $collapsible;
        }
    }

};

const appointmentSortTypes = {
    appointment_date: "appointment_date",
    person_name: "person_name",
    company_name: "company_name",
    area_code: "area_code"
};

const appointmentState = {
    current_page: 1,
    sorter: appointmentSortTypes.appointment_date,
    ascending: false,
    url: undefined,

    isStateSame: function (state) {
        const $sortBy = $('#sort-by-appointment');
        const $ascending = $('#ascending-appointment');
        return state.sort_by === $sortBy.val() && state.ascending === ($ascending.val() === 'true');
    }
};

function doGetForAppointmentAlerts(appointmentState, isLoadMore) {
    const json = {
        ascending: appointmentState.ascending,
        page: appointmentState.current_page,
        sort_by: appointmentState.sorter
    };

    $('#appointments-progress-bar').show(300);

    doGet(appointmentState.url, json, success, error);

    function success(data) {
        $('#appointments-progress-bar').hide(300);

        const paginationId = "appointments";

        if (!isLoadMore) {
            // Reset pagination to initial amount
            resetPaginationRange(paginationId);
        }

        data.list.forEach(function (item) {
            updatePaginationRange(true, paginationId, false);
            appointments.getAppointmentItem(item).insertBefore('#appointments-progress-bar');
        });

        if (getPaginationCurrentAmount(paginationId) === getPaginationTotal(paginationId)) {
            // there are no more appointments to load
            $('#load-more-appointments').hide(300);
        }

        if (!$('.appointment-item').length) {
            $('#appointments-no-results').show(300);
        }
    }

    function error() {
        showToast("There was an error getting your appointment alerts. Please refresh the page or submit a bug report.");
    }
}