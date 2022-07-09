/** @namespace dial_sheet.contacts_count */
/** @namespace dial_sheet.appointments_count */
/** @namespace dial_sheet.activity_count */
/** @namespace dial_sheet.contact_types */
/** @namespace contact_type.state_type */
/** @namespace contact_type.state_count */
/** @namespace contact_type.state_description */
/** @namespace contact_type.is_indeterminate */
/** @namespace contact_type.is_objection */
/** @namespace contact_type.is_inventory */

$.fn.right = function () {
    return $(document).width() - (this.offset().left + this.outerWidth());
};

$(document).ready(function () {
    $('.hide-on-load-only').removeClass("hide-on-load-only");

    if (isInternetExplorer()) {
        // Ewwwwwwwwww
        $('#read_only_dialog_title').html("Browser Impairment");
        $('#read_only_dialog_content').html("Unfortunately, Magic List is not optimized for Internet Explorer." +
            "<br>" +
            "<br>" +
            "You may use Microsoft Edge, but for you to best take advantage of our service, we recommend upgrading " +
            "to Google Chrome." +
            "<br>" +
            "<br>" +
            "Sorry for the inconvenience," +
            "<br>" +
            "<i>The Magic List Team</i>");
        showReadOnlyDialog();
    }

    checkIfAllowScrolling();
});

$(window).resize(function () {
    checkIfAllowScrolling();
});

function checkIfAllowScrolling() {
    $('.scroll-overflow-x').each(function () {
        var isOverflowAllowed = false;
        const width = $(this).width();

        var sumOfWidths = 0;
        const $self = $(this);
        $(this).children().each(function () {
            if ($self.css("white-space") === "nowrap") {
                sumOfWidths += $(this).width();
            } else {
                sumOfWidths = $(this).width();
            }

            if (sumOfWidths > width) {
                $self.css("overflow-x", "scroll");
                isOverflowAllowed = true;
            }
        });

        if (!isOverflowAllowed) {
            $(this).css("overflow-x", "visible");
        }
    });
}

function isInternetExplorer() {
    var ua = window.navigator.userAgent;

    // IE 10
    // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';

    // IE 11
    // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }
    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    return false;
}

function isEmailValid(email) {
    var atPosition = email.indexOf("@");
    var dotPosition = email.lastIndexOf(".");
    return !(atPosition < 1 || dotPosition < atPosition + 2 || dotPosition + 2 >= email.length);
}

function updateQueryStringParameter(uri, key, value) {
    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
    if (uri.match(re)) {
        return uri.replace(re, '$1' + key + "=" + value + '$2');
    }
    else {
        return uri + separator + key + "=" + value;
    }
}

function showToast(text, duration) {
    if (!duration) {
        duration = 4000;
    }
    Materialize.toast(text, duration);
}

function sanitizePerson(name, email, phone, companyName, jobTitle, $errorNode) {
    if (!name || name.trim().length === 0) {
        $errorNode.html("The name cannot be empty");
        $errorNode.show(300);
        return false;
    } else if (email && !email.match(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/)) {
        $errorNode.html("The email entered is invalid");
        $errorNode.show(300);
        return false;
    } else {
        $errorNode.html(null);
        $errorNode.hide(300);
        return true;
    }
}

function onDialSheetChanged(dialSheet, personId) {
    var objections = dialSheet.contact_types;
    for (var i = 0; i < objections.length; i++) {
        $('#dial_sheet_count_' + objections[i].state_type).html(objections[i].state_count);
    }

    $('.dial-sheet-contacts-count').html(dialSheet.contacts_count);
    $('.dial-sheet-activity-count').html(dialSheet.activity_count);
    $('#contact_time_' + personId).html("<b>" + getShortDateWithTime() + "</b>");
}

/**
 * @param dateWithTime A UNIX milli timestamp
 * @returns {string} The date, as "3/30/2017 at 4:00 PM"
 */
function getShortDateWithTime(dateWithTime) {
    if (dateWithTime && typeof dateWithTime !== 'number') {
        dateWithTime = parseInt(dateWithTime);
    }
    return moment(dateWithTime).format("M/D/YY") + " at " + moment(dateWithTime).format("h:mm A");
}

/**
 * @param date A UNIX milli timestamp
 * @returns {string} The date, as "Mar 30, 2017"
 */
function getLongDate(date) {
    if (typeof date !== 'number') {
        date = parseInt(date);
    }
    return moment(date).format("MMM D, YYYY");
}

/**
 * @param dateWithTime A UNIX milli timestamp
 * @returns {string} The date, as "Mar 30, 2017 at 4:00 PM"
 */
function getLongDateWithTime(dateWithTime) {
    if (dateWithTime && typeof dateWithTime !== 'number') {
        dateWithTime = parseInt(dateWithTime);
    }
    return moment(dateWithTime).format("MMM D, YYYY") + " at " + moment(dateWithTime).format("h:mm A");
}

/**
 * @param id Optional parameter for pagination total retrieval
 * @return Number The total amount from pagination, parsed as an integer.
 */
function getPaginationTotal(id) {
    if (id) {
        return parseInt($('#page_pagination_total-' + id).html());
    } else {
        return parseInt($('#page_pagination_total').html());
    }
}

/**
 * @param id Optional parameter for pagination total retrieval
 * @return Number - The total amount from pagination, parsed as an integer.
 */
function getPaginationCurrentAmount(id) {
    if (id) {
        return parseInt($('#page_pagination_max-' + id).html());
    } else {
        return parseInt($('#page_pagination_max').html());
    }
}

/**
 * @param id Optional ID used to get the min and max jQuery nodes
 */
function resetPaginationRange(id) {
    var $pageMinNode;
    var $pageMaxNode;
    if (id) {
        $pageMinNode = $('#page_pagination_min-' + id);
        $pageMaxNode = $('#page_pagination_max-' + id);
    } else {
        $pageMinNode = $('#page_pagination_min');
        $pageMaxNode = $('#page_pagination_max');
    }

    $pageMinNode.html("1");
    $pageMaxNode.html("0");
}

/**
 * @param increment - True to increment, false to decrement the range.
 * @param id - The ID of the pagination content to change, can be null.
 * @param changeTotal - True to change the total amount, false otherwise
 */
function updatePaginationRange(increment, id, changeTotal) {
    var $pageMinNode;
    var $pageMaxNode;
    var $pageTotalNode;
    if (id) {
        $pageMinNode = $('#page_pagination_min-' + id);
        $pageMaxNode = $('#page_pagination_max-' + id);
        $pageTotalNode = $('#page_pagination_total-' + id);
    } else {
        $pageMinNode = $('#page_pagination_min');
        $pageMaxNode = $('#page_pagination_max');
        $pageTotalNode = $('#page_pagination_total');
    }

    if (increment) {
        $pageMaxNode.html(parseInt($pageMaxNode.html()) + 1);

        if (changeTotal) {
            $pageTotalNode.html(parseInt($pageTotalNode.html()) + 1);
        }

        const currentMin = parseInt($pageMinNode.html());
        if (currentMin === 0) {
            $pageMinNode.html("1");
        }
    } else if (parseInt($pageMaxNode.html()) !== 0) {
        const pageMax = parseInt($pageMaxNode.html()) - 1;
        if (pageMax < parseInt($pageMinNode.html())) {
            $pageMinNode.html(parseInt($pageMinNode.html()) - 1);
        }

        $pageMaxNode.html(pageMax);

        if (changeTotal) {
            $pageTotalNode.html(parseInt($pageTotalNode.html()) - 1);
        }
    }
}

function getSortObject(sortBy, isAscending) {
    return {sort_by: sortBy, ascending: isAscending};
}

function goToPage(page) {
    var url = window.location.href;
    url = updateQueryStringParameter(url, "page", page);
    window.location.href = url;
}

function doGet(url, jsonData, successFunction, errorFunction, enableDialogButtons) {
    if (!enableDialogButtons) {
        $('.close').addClass("disabled");
        $('.submit').addClass("disabled");
    }
    $.ajax({
        url: url,
        data: jsonData ? jsonData : undefined,
        dataType: "json",
        success: function (data) {
            if (successFunction) {
                successFunction(data);
            }
            $('.close').removeClass("disabled");
            $('.submit').removeClass("disabled");
        },
        error: function (xhr) {
            if (errorFunction) {
                errorFunction(xhr);
            }
            $('.close').removeClass("disabled");
            $('.submit').removeClass("disabled");
        }
    });
}

function doPost(url, jsonData, successFunction, errorFunction, enableDialogButtons) {
    if (!enableDialogButtons) {
        $('.close').addClass("disabled");
        $('.submit').addClass("disabled");
    }
    $.ajax({
        url: url,
        data: JSON.stringify(jsonData),
        method: "POST",
        headers: {"Content-Type": "application/json", "X-Requested-With": "*", "Csrf-Token": "nocheck"},
        success: function (data) {
            $('.close').removeClass("disabled");
            $('.submit').removeClass("disabled");
            if (successFunction) {
                successFunction(data);
            }
        },
        error: function (xhr) {
            $('.close').removeClass("disabled");
            $('.submit').removeClass("disabled");
            if (errorFunction) {
                errorFunction(xhr);
            }
        }
    });
}