/** @namespace chartData.datasets */
/** @namespace chartData.graph_data */
/** @namespace chartData.is_employee_graph */
/** @namespace chartData.item_id_index_array */
/** @namespace item.item_id */
/** @namespace graphData.datasets[0].item_ids */

var isGraphsInitialized = false;

var graphUrl;

$(document).ready(function () {
    $('.datepicker').pickadate({
        selectMonths: true,
        selectYears: 15,
        closeOnSelect: true
    });

    $('#date-range-submit').click(function () {
        DateManager.doGetForNewDate($('.custom').attr("data-range"), graphUrl);
    });

    $('#theme-swap').click(function () {
        $('#sidebar').toggleClass('dark-theme');
        $('#stats').toggleClass('dark-theme');
        $('body').toggleClass('dark-theme');
    });

    const $employeeNodes = $('.employee');
    $employeeNodes.each(function () {
        const id = $(this).attr('id').substring(1);
        const name = $(this).attr('data-name');

        EmployeeManager.registerEmployee(id, name);
    });

    $('#sidebar-title').click(function () {
        EmployeeManager.toggleVisibility();
    });

    $employeeNodes.click(function () {
        const id = $(this).attr("id").substring(1);
        const $employee = $('#c' + id);
        $employee.toggleClass('removed');
        const isRemoved = $employee.hasClass("removed");
        GraphManager.toggleEmployeeForGraph(id, isRemoved);
    });

    DateManager.initialize();

    loadGraphs();

    adjustTopBar();
});

$(window).scroll(function () {
    adjustTopBar();
});

function adjustTopBar() {
    const toolbarHeight = $(window).width() < 601 ? 56 : 64;
    const $sidebar = $('#sidebar');
    const $datebar = $('#date-chooser-wrapper');
    if ($(window).scrollTop() < toolbarHeight) {
        const offset = toolbarHeight - $(window).scrollTop();
        const ratio = (offset / windowHeight) * 100;

        $sidebar.css("top", offset);
        $datebar.css("top", offset);
    } else {
        if (parseInt($sidebar.css("top")) !== 0) {
            $sidebar.css("top", "0");
            $datebar.css("top", "0");
        }
    }
}

function loadGraphs() {
    DateManager.doGetForNewDate(DateManager.dateTypes.days, graphUrl, function () {
        onGraphsInitialized();
    });
}

function onGraphsInitialized() {
    isGraphsInitialized = true;

    $('.checkbox-stacked').on('change', function () {
        const newValue = $(this).is(":checked");
        const chartId = parseInt($(this).attr("data-id"));
        GraphManager.charts.forEach(function (chart) {
            if (chart.id === chartId) {
                chart.options.scales.yAxes[0].stacked = newValue;
                chart.options.scales.xAxes[0].stacked = newValue;
                chart.update();
            }
        });
    });

    $('.tooltipped').tooltip({delay: 150});

    const $materialBox = $('.materialbox_overwrite');
    $materialBox.materialbox_overwrite(function (id) {
        const $chart = $('#myChart-wrapper' + id);
        $chart.css("width", "480px");
        $chart.css("height", "480px");
    });

    $materialBox.click(function() {
        const $chart = $('#myChart-wrapper' + $(this).attr("data-id"));
        $chart.css("width", "100%");
        $chart.css("height", "90%");
    });

    setTimeout(function () {
        $('.grid-item').each(function (index) {
            const $element = $(this);
            setTimeout(function () {
                $element.addClass("scale-in");
            }, (index + 1) * 175);
        });
    }, 25);

    setTimeout(function () {
        $('.date-tab').removeClass("disabled");

        $('.non-custom').click(function () {
            DateManager.hideRangePicker();
            DateManager.doGetForNewDate($(this).attr("data-range"), graphUrl);
        });

        $('.custom').click(function () {
            const $dateWrapper = $('#date-chooser-wrapper');
            $dateWrapper.removeClass("no-transition");
            DateManager.showRangePicker();
            $('#date-range-picker').slideDown(300);

            setTimeout(function () {
                $dateWrapper.addClass("no-transition");
            }, 300);
        });
    }, 300);
}

/**
 * @param itemId The item's ID
 * @param name The item's name, to be used as a label
 * @param color The item's color, to be used for rendering items on the graph
 * @constructor Creates Graph Items which represent each data type/category belonging to a graph
 */
function GraphItem(itemId, name, color) {
    this.itemId = itemId;
    this.name = name;
    this.color = color;
}

const GraphManager = {

    totalGraphs: 0,

    charts: [],

    chartIds: {},

    graphTypes: {
        line: "line",
        bar: "bar",
        doughnut: "doughnut"
    },

    /**
     * @param graphId - The graph's ID to use. Useful for redrawing graphs instead of creating new ones
     * @param type - Can be one of line, bar, or doughnut
     * @param graphData - The data for the graph, could be for a bar, line, or doughnut graph
     * @param labels - An array of objects containing a name and color for the given graph
     */
    createOrUpdateGraph: function (graphId, type, graphData, labels) {
        var isCreatingGraph = !GraphManager.chartIds[graphId];

        const $statNode = $('#stats');
        if (isCreatingGraph) {
            $statNode.append($(
                '<div id="grid-wrapper' + graphId + '" class="grid-item col s10 m8 l6 white-background z-depth-3 materialbox-parent scale-transition scale-out">' +
                '<a class="btn-flat waves-effect btn-icon graph-zoom materialbox_overwrite tooltipped" data-id="' + graphId + '" ' +
                'data-tooltip="Toggle Graph Zoom">' +
                '<i class="material-icons">zoom_in</i>' +
                '</a> ' +
                '<div id="myChart-wrapper' + graphId + '" class="graph-wrapper">' +
                '<canvas id="myChart' + graphId + '">' +
                '</canvas>' +
                '</div>' +
                '</div>'
            ));
        }

        var $context = $('#myChart' + graphId);

        var fontSize = 18;
        if (graphData.title.length > 40 && graphData.title.length < 45) {
            fontSize = 15;
        } else if (graphData.title.length > 45 && graphData.title.length < 50) {
            fontSize = 14;
        } else if (graphData.title.length > 50) {
            fontSize = 13;
        }

        var i;
        var options = {
            layout: {
                padding: {
                    left: 16,
                    bottom: 16,
                    right: 16,
                    top: 16
                }
            },
            legend: {
                labels: {
                    boxWidth: 16
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: graphData.title,
                fontSize: fontSize,
                padding: 16
            }
        };

        if (type === 'line') {
            addLineGraph();
        }
        else if (type === 'bar') {
            if ((labels || (graphData.datasets.length > 0 && graphData.datasets[0].label)) && isCreatingGraph) {
                $("#grid-wrapper" + graphId).prepend(
                    $(
                        '<div class="checkbox-stacked-wrapper">' +
                        '<input class="checkbox-stacked" type="checkbox" data-id="' + graphId + '" id="bar' + graphId + '" />' +
                        '<label for="bar' + graphId + '">Stacked</label>' +
                        '</div>')
                );
            }

            addBarGraph();
        }
        else if (type === GraphManager.graphTypes.doughnut) {
            addDoughnutGraph();
        }

        if (isCreatingGraph) {
            GraphManager.chartIds[graphId] = true;
            const chart = new Chart($context, {
                type: type,
                data: graphData,
                options: options
            });
            GraphManager.charts.push(chart);
        } else {
            GraphManager.charts.forEach(function (chart) {
                if (chart.id === graphId) {
                    chart.data = graphData;
                    chart.update();
                }
            });
        }

        function addLineGraph() {
            options.scales = {
                yAxes: [{
                    stacked: false,
                    ticks: {
                        beginAtZero: true
                    }
                }],
                xAxes: [{
                    type: 'time',
                    ticks: {
                        minRotation: 45
                    },
                    time: {
                        displayFormats: {
                            'millisecond': 'MMM DD',
                            'second': 'MMM DD',
                            'minute': 'MMM DD',
                            'hour': 'MMM DD',
                            'day': 'MMM DD',
                            'week': 'MMM DD',
                            'month': '\'Week of\' MM/DD',
                            'quarter': 'Q \'qr.\' YYYY',
                            'year': 'MMM DD YYYY'
                        }
                    }
                }]
            };

            options.tooltips = {
                callbacks: {
                    title: function (tooltipItems) {
                        return moment(tooltipItems[0].xLabel).format("M-D-YYYY");
                    }
                }
            };

            if (labels) {
                graphData.datasets.forEach(function (item) {
                    const label = labels[item.item_id];
                    item.label = label.name;
                    item.backgroundColor = label.color.slice(0, -2) + "0.75)";
                    item.borderColor = label.color;
                });
            } else if (graphData.datasets.length > 0) {
                graphData.datasets[0].label = "Data";
                graphData.datasets[0].backgroundColor = GraphManager.ColorManager.generateBackgroundColor(0);
                graphData.datasets[0].borderColor = GraphManager.ColorManager.generateColor(0);
            }
        }

        function addBarGraph() {
            options.scales = {
                yAxes: [{
                    stacked: false,
                    ticks: {
                        beginAtZero: true
                    }
                }],
                xAxes: [{
                    stacked: false,
                    ticks: {
                        minRotation: 45
                    }
                }]
            };

            if (labels) {
                graphData.datasets.forEach(function (item) {
                    const label = labels[item.item_id];

                    item.backgroundColor = [];
                    item.borderColor = [];
                    item.label = label.name;

                    item.data.forEach(function () {
                        item.backgroundColor.push(label.color.slice(0, -2) + "0.8)");
                        item.borderColor.push(label.color);
                    });
                });
            } else if (graphData.datasets.length === 1) {
                graphData.datasets[0].backgroundColor = [];
                graphData.datasets[0].borderColor = [];

                if (!graphData.datasets[0].label) {
                    graphData.datasets[0].label = "Data";
                }

                graphData.datasets[0].data.forEach(function () {
                    graphData.datasets[0].backgroundColor.push(GraphManager.ColorManager.generateColor(0));
                    graphData.datasets[0].borderColor.push(GraphManager.ColorManager.generateBackgroundColor(0));
                });
            } else if (graphData.datasets.length > 1) {
                graphData.datasets.forEach(function (item, index) {
                    item.backgroundColor = [];
                    item.borderColor = [];
                    item.data.forEach(function () {
                        item.backgroundColor.push(GraphManager.ColorManager.generateColor(index));
                        item.borderColor.push(GraphManager.ColorManager.generateBackgroundColor(index));
                    });
                });
            }

            if (graphData.labels.length > 0) {
                graphData.labels.forEach(function (label, index) {

                    if (label.length > 10) {
                        splitLabelToMultipleLines(label);
                    }

                    function splitLabelToMultipleLines(label) {
                        const splitLabel = label.split(" ");

                        var constructedLabel = [];
                        var constructedLabelIndex = 0;
                        var totalSpace = 0;
                        var currentWord = "";
                        splitLabel.forEach(function (item) {
                            totalSpace += item.length;
                            currentWord += item + " ";
                            if (totalSpace > 10) {
                                constructedLabel[constructedLabelIndex] = currentWord;
                                currentWord = "";
                                totalSpace = 0;
                                constructedLabelIndex += 1;
                            }
                        });
                        graphData.labels[index] = constructedLabel;
                    }
                });
            }
        }

        function addDoughnutGraph() {
            graphData.datasets[0].backgroundColor = [];
            graphData.datasets[0].borderColor = [];

            if (labels) {
                graphData.labels = [];
                graphData.datasets[0].data.forEach(function (item, index) {
                    const label = labels[graphData.datasets[0].item_ids[index]];
                    graphData.datasets[0].backgroundColor.push(label.color.slice(0, -2) + "0.8)");
                    graphData.datasets[0].borderColor.push(label.color);
                    graphData.labels.push(label.name);
                });
            } else if (graphData.datasets.length > 0) {
                graphData.datasets[0].data.forEach(function (item, index) {
                    graphData.datasets[0].backgroundColor.push(GraphManager.ColorManager.generateColor(index));
                    graphData.datasets[0].borderColor.push(GraphManager.ColorManager.generateBackgroundColor(index));
                });
            }
        }

    },

    /**
     * @param id - The ID of the toggled item
     * @param isRemoved True if it should be removed, false otherwise
     */
    toggleEmployeeForGraph: function (id, isRemoved) {
        GraphManager.charts.forEach(function (chart) {
            const indexArray = chart.config.data.item_id_index_array;
            var employeeIndex = -1;

            if (indexArray) {
                indexArray.forEach(function (item, index) {
                    if (item === id) {
                        employeeIndex = index;
                    }
                });
            }

            if (employeeIndex !== -1) {
                var meta;
                if (chart.getDatasetMeta(0).type === 'doughnut') {
                    meta = chart.getDatasetMeta(0);
                    meta.data[employeeIndex].hidden = isRemoved ? true : null;
                }
                else {
                    meta = chart.getDatasetMeta(employeeIndex);
                    meta.hidden = isRemoved ? true : null;
                }
                chart.update();
            }
        });
    },

    ColorManager: {

        /**
         * @param colorNumber The 0-based index of the color to be retrieved
         * @returns {*} A color for a graph in the form "rgba(255, 255, 255, 1)" or a randomly generated one for
         * numbers greater than 12
         */
        generateColor: function (colorNumber) {
            const pc0 = "rgba(31, 119, 180, 1)";
            const pc1 = "rgba(255, 127, 14, 1)";
            const pc2 = "rgba(44, 200, 44, 1)";
            const pc3 = "rgba(200, 79, 147, 1)";
            const pc4 = "rgba(108, 120, 69, 1)";
            const pc5 = "rgba(145, 78, 207, 1)";
            const pc6 = "rgba(182, 140, 60, 1)";
            const pc7 = "rgba(75, 54, 118, 1)";
            const pc8 = "rgba(204, 76, 55, 1)";
            const pc9 = "rgba(120, 144, 193, 1)";
            const pc10 = "rgba(93, 47, 47, 1)";
            const pc11 = "rgba(85, 128, 95, 1)";
            const pc12 = "rgba(194, 130, 129, 1)";
            const pc13 = "rgba(239, 45, 86, 1)";
            const pc14 = "rgba(237, 125, 58, 1)";
            const pc15 = "rgba(119, 101, 227, 1)";
            const pc16 = "rgba(200, 173, 192, 1)";
            const pc17 = "rgba(122, 114, 101, 1)";
            const pc18 = "rgba(59, 96, 228, 1)";
            const pc19 = "rgba(237, 211, 196, 1)";
            const pc20 = "rgba(214, 159, 126, 1)";
            const pc21 = "rgba(67, 62, 63, 1)";
            const pc22 = "rgba(173, 215, 246, 1)";
            const pc23 = "rgba(255, 193, 69, 1)";
            const pc24 = "rgba(233, 82, 222, 1)";
            const pc25 = "rgba(192, 208, 118, 1)";

            const presetColors = [pc0, pc1, pc2, pc3, pc4, pc5, pc6, pc7, pc8, pc9, pc10, pc11, pc12, pc13, pc14, pc15,
                pc16, pc17, pc18, pc19, pc20, pc21, pc22, pc23, pc24, pc25];

            if (colorNumber < presetColors.length && colorNumber >= 0) {
                return presetColors[colorNumber];
            }

            var r = (Math.round(Math.random() * 127) + 127);//.toString(16);
            var g = (Math.round(Math.random() * 127) + 127);//.toString(16);
            var b = (Math.round(Math.random() * 127) + 127);//.toString(16);
            return "rgba(" + r + "," + g + "," + b + ",1)";

        },

        generateBackgroundColor: function (colorNumber) {
            return GraphManager.ColorManager.generateColor(colorNumber).slice(0, -2) + "0.8)";
        }

    }

};

const EmployeeManager = {

    totalEmployees: 0,

    employeeObjects: {},

    registerEmployee: function (employeeId, employeeName) {
        if (EmployeeManager.employeeObjects[employeeId]) {
            return false;
        }

        const employeeColor = GraphManager.ColorManager.generateColor(EmployeeManager.totalEmployees);

        const $node = $('#c' + employeeId);
        $node.css("background-color", employeeColor);
        $node.css("border-color", employeeColor);

        EmployeeManager.employeeObjects[employeeId] = new GraphItem(employeeId, employeeName, employeeColor);
        EmployeeManager.totalEmployees += 1;

        return true;
    },

    isVisible: true,

    originalHeight: undefined,

    toggleVisibility: function () {
        EmployeeManager.isVisible = !EmployeeManager.isVisible;

        const paddingDestination = EmployeeManager.isVisible ? "padding-top" : "padding-bottom";
        const paddingStart = EmployeeManager.isVisible ? "padding-bottom" : "padding-top";
        $('#expansion-icon').animate({deg: EmployeeManager.isVisible ? 0 : -180}, {
                step: function (now) {
                    var endPercentage = now / 180;
                    if (endPercentage < 0) {
                        endPercentage = endPercentage * -1;
                    }

                    endPercentage = EmployeeManager.isVisible ? endPercentage : -endPercentage + 1;

                    const startPercentage = 1.0 - endPercentage;
                    $(this).css(paddingDestination, startPercentage * 5);
                    $(this).css(paddingStart, endPercentage * 5);

                    $(this).css('-webkit-transform', 'rotate(' + now + 'deg)');
                    $(this).css('transform', 'rotate(' + now + 'deg)');
                }
            }
        );

        const $sidebar = $('#sidebar');

        if (!EmployeeManager.originalHeight) {
            EmployeeManager.originalHeight = $sidebar.height();
        }

        $('#stats').fadeToggle();
        $sidebar.animate({height: EmployeeManager.isVisible ? EmployeeManager.originalHeight + "px" : "0"}, function () {
            $('#employees-wrapper').css("display", EmployeeManager.isVisible ? "block" : "none");
            const $stats = $('#stats');
            const $progress = $('#graph-progress');
            if (EmployeeManager.isVisible) {
                $stats.css("margin-left", $(this).width());
                $stats.css("justify-content", "center");
                $stats.css("width", $(window).width() - $(this).width());

                $progress.css("margin-left", $(this).width());
                $progress.css("width", $(window).width() - $(this).width());
            } else {
                $stats.css("margin-left", 0);
                $stats.css("justify-content", "flex-start");
                $stats.css("width", $(window).width());

                $progress.css("margin-left", 0);
                $progress.css("width", $(window).width());
            }
            setTimeout(function () {
                $stats.fadeToggle();
            }, 400);
        });
    }

};

const DateManager = {

    initialize: function () {
        $('#include_weekends').change(function () {
            DateManager.doGetForNewDate($('.tab.date-tab > a.active').parent().attr("data-range"), graphUrl);
        });
    },

    dateTypes: {
        days: "days",
        weeks: "weeks",
        months: "months",
        quarters: "quarters",
        years: "years",
        custom: "custom"
    },

    dateOptions: {
        include_weekends: "include_weekends",
        exclude_weekends: "exclude_weekends"
    },

    /**
     * Data already retrieved for the given graph type
     */
    data: {},

    showRangePicker: function () {
        $('#date-range-picker').slideDown({
            duration: 300,
            step: function () {
                const height = parseInt($('#date-chooser-wrapper').height());
                $('#stats').css("margin-top", height);
                $('#graph-progress').css("margin-top", height + 32);

                const $submit = $('#submit-wrapper');
                $submit.css("height", $('#date-picker-start-wrapper').css("height"));
                if (!$submit.hasClass("scale-in")) {
                    $submit.addClass("scale-in");
                }
            }
        });
    },

    hideRangePicker: function () {
        $('#date-range-picker').slideUp({
            duration: 300,
            start: function () {
                $('#submit-wrapper').removeClass("scale-in");
            },
            step: function () {
                const height = parseInt($('#date-chooser-wrapper').height());
                $('#stats').css("margin-top", height);
                $('#graph-progress').css("margin-top", height + 32);
            }
        });
    },

    /**
     * @param dateType
     * @param url
     * @param postInitializationFunction The function to be executed upon initialization, after the charts are first
     * created
     */
    doGetForNewDate: function (dateType, url, postInitializationFunction) {
        $('#graph-progress').show();
        $('#stats').hide();

        if (!DateManager.dateTypes[dateType]) {
            console.error("Invalid type, found: ", dateType);
            return;
        }

        const includeWeekends = $('#include_weekends').is(":checked");
        const dateOptions = includeWeekends ?
            DateManager.dateOptions.include_weekends :
            DateManager.dateOptions.exclude_weekends;
        var data = {include_weekends: includeWeekends};

        if (dateType === 'custom') {
            data = getCustomDate();
            if (!data) {
                return;
            }

            if (data) {
                const startDate = moment(data.start_date, "MM-DD-YYYY");
                const endDate = moment(data.end_date, "MM-DD-YYYY");
                const numberOfDays = endDate.diff(startDate, 'days');

                if (numberOfDays <= 7) {
                    dateType = DateManager.dateTypes.days;
                } else if (numberOfDays > 7 && numberOfDays <= 31) {
                    dateType = DateManager.dateTypes.weeks;
                } else if (numberOfDays > 31 && numberOfDays <= 93) {
                    dateType = DateManager.dateTypes.months;
                } else if (numberOfDays > 93 && numberOfDays <= 365) {
                    dateType = DateManager.dateTypes.quarters;
                } else {
                    dateType = DateManager.dateTypes.years;
                }

                const customFormat = data.start_date + "-" + data.end_date;
                if (DateManager.data.custom &&
                    DateManager.data.custom[customFormat] &&
                    DateManager.data.custom[customFormat][dateOptions]) {
                    // we already retrieved this data, let's present it
                    createOrUpdateCustomGraphs(customFormat);
                } else {
                    url = url + dateType;

                    doGet(url, data, function (data) {
                        customSuccess(customFormat, data);
                    }, error);
                }
            }
        } else {
            if (DateManager.data[dateType] && DateManager.data[dateType][dateOptions]) {
                // we already retrieved this data, let's present it
                createOrUpdateGraphs();
            } else {
                url = url + dateType;
                doGet(url, data, nonCustomSuccess, error);
            }
        }

        function getCustomDate() {
            var $startDate = $('#start-date-range').find('.datepicker');
            var $endDate = $('#end-date-range').find('.datepicker');

            var start;
            var end;

            if ($startDate.val() !== "") {
                start = moment($startDate.val(), "D MMMM, YYYY");
            } else {
                console.log('Invalid start date');
                return false;
            }
            if ($endDate.val() !== "") {
                end = moment($endDate.val(), "D MMMM, YYYY");
            } else {
                console.log('Invalid end date');
                return false;
            }

            if (end.diff(start, "days") < 1) {
                showToast("The start date must be before the end date");
                return false;
            }

            return {
                start_date: moment(start).format("MM-DD-YYYY"),
                end_date: moment(end).format("MM-DD-YYYY")
            };
        }

        function nonCustomSuccess(chartDataArray) {
            if (!DateManager.data[dateType]) {
                DateManager.data[dateType] = {};
            }
            DateManager.data[dateType][dateOptions] = chartDataArray;

            createOrUpdateGraphs();
            if (postInitializationFunction && !isGraphsInitialized) {
                postInitializationFunction();
            }
        }

        function customSuccess(customFormat, chartDataArray) {
            if (!DateManager.data[DateManager.dateTypes.custom]) {
                DateManager.data[DateManager.dateTypes.custom] = {};
            }
            if (!DateManager.data[DateManager.dateTypes.custom][customFormat]) {
                DateManager.data[DateManager.dateTypes.custom][customFormat] = {};
            }
            DateManager.data[DateManager.dateTypes.custom][customFormat][dateOptions] = chartDataArray;

            createOrUpdateCustomGraphs(customFormat);
        }

        function createOrUpdateGraphs() {
            DateManager.data[dateType][dateOptions].forEach(function (chartData, index) {
                const labels = chartData.graph_data.is_employee_graph ? EmployeeManager.employeeObjects : undefined;
                GraphManager.createOrUpdateGraph(index, chartData.type, chartData.graph_data, labels);
            });
            $('#stats').show();
            $('#graph-progress').hide();
        }

        function createOrUpdateCustomGraphs(customFormat) {
            DateManager.data[DateManager.dateTypes.custom][customFormat][dateOptions].forEach(function (chartData, index) {
                const labels = chartData.graph_data.is_employee_graph ? EmployeeManager.employeeObjects : undefined;
                GraphManager.createOrUpdateGraph(index, chartData.type, chartData.graph_data, labels);
            });
            $('#stats').show();
            $('#graph-progress').hide();
        }

        function error(xhr) {
            console.error("XHR: ", xhr.responseText);
            $('#stats').show();
            $('#graph-progress').hide();
            showToast("There was an error retrieving your statistics. Please try again or submit a bug report");
        }
    }

};
