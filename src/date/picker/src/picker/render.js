/**
 * render for year panel
 * @author yiminghe@gmail.com
 */
KISSY.add('date/picker/render', function (S, Node, Control, GregorianCalendar, DateTimeFormat, PickerTpl) {
    var dateRowTplStart = '<tr role="row">';
    var dateRowTplEnd = '</tr>';
    var dateCellTpl = '<td role="gridcell" data-index="{index}" title="{title}" class="{cls}">{content}</td>';
    var weekNumberCellTpl = '<td role="gridcell" class="{cls}">{content}</td>';
    var dateTpl = '<a ' +
        ' id="{id}" ' +
        ' hidefocus="on" ' +
        ' unselectable="on" ' +
        ' tabindex="-1" ' +
        ' class="{cls}" ' +
        ' href="#" ' +
        ' aria-selected="{selected}" ' +
        ' aria-disabled="{disabled}">{content}</a>';
    var DATE_ROW_COUNT = 6;
    var DATE_COL_COUNT = 7;

    function getIdFromDate(d) {
        return 'ks-date-picker-date-' + d.get(GregorianCalendar.YEAR) +
            '-' + d.get(GregorianCalendar.MONTH) + '-' +
            d.get(GregorianCalendar.DAY_OF_MONTH);
    }

    function isSameDay(one, two) {
        return one.get(GregorianCalendar.YEAR) == two.get(GregorianCalendar.YEAR) &&
            one.get(GregorianCalendar.MONTH) == two.get(GregorianCalendar.MONTH) &&
            one.get(GregorianCalendar.DAY_OF_MONTH) == two.get(GregorianCalendar.DAY_OF_MONTH);
    }

    function isSameMonth(one, two) {
        return one.get(GregorianCalendar.YEAR) == two.get(GregorianCalendar.YEAR) &&
            one.get(GregorianCalendar.MONTH) == two.get(GregorianCalendar.MONTH);
    }

    function beforeCurrentMonthYear(current, today) {
        if (current.get(GregorianCalendar.YEAR) < today.get(GregorianCalendar.YEAR)) {
            return 1;
        }
        return current.get(GregorianCalendar.YEAR) == today.get(GregorianCalendar.YEAR) &&
            current.get(GregorianCalendar.MONTH) < today.get(GregorianCalendar.MONTH);
    }

    function afterCurrentMonthYear(current, today) {
        if (current.get(GregorianCalendar.YEAR) > today.get(GregorianCalendar.YEAR)) {
            return 1;
        }
        return current.get(GregorianCalendar.YEAR) == today.get(GregorianCalendar.YEAR) &&
            current.get(GregorianCalendar.MONTH) > today.get(GregorianCalendar.MONTH);
    }

    function renderDatesCmd() {
        return this.config.view.renderDates();
    }

    return Control.getDefaultRender().extend({
        getMonthYearLabel: function () {
            var self = this;
            var control = self.control;
            var locale = control.get('locale');
            var value = control.get('value');
            var dateLocale = value.getLocale();
            return new DateTimeFormat(locale.monthYearFormat, dateLocale).format(value);
        },

        getTodayTimeLabel: function () {
            var self = this;
            var control = self.control;
            var locale = control.get('locale');
            var value = control.get('value');
            var dateLocale = value.getLocale();
            var today = value.clone();
            today.setTimeInMillis(S.now());
            return new DateTimeFormat(locale.dateFormat, dateLocale).format(today);
        },

        beforeCreateDom: function (renderData, childrenSelectors, renderCommands) {
            var self = this;
            var control = self.control;
            var locale = control.get('locale');
            var value = control.get('value');
            var dateLocale = value.getLocale();
            S.mix(childrenSelectors, {
                monthSelectEl: '#ks-date-picker-month-select-{id}',
                monthSelectContentEl: '#ks-date-picker-month-select-content-{id}',
                previousMonthBtn: '#ks-date-picker-previous-month-btn-{id}',
                nextMonthBtn: '#ks-date-picker-next-month-btn-{id}',
                previousYearBtn: '#ks-date-picker-previous-year-btn-{id}',
                nextYearBtn: '#ks-date-picker-next-year-btn-{id}',
                todayBtnEl: '#ks-date-picker-today-btn-{id}',
                clearBtnEl: '#ks-date-picker-clear-btn-{id}',
                tbodyEl: '#ks-date-picker-tbody-{id}'
            });
            var veryShortWeekdays = [];
            var weekDays = [];
            var firstDayOfWeek = value.getFirstDayOfWeek();
            for (var i = 0; i < DATE_COL_COUNT; i++) {
                var index = (firstDayOfWeek + i) % DATE_COL_COUNT;
                veryShortWeekdays[i] = locale.veryShortWeekdays[index];
                weekDays[i] = dateLocale.weekdays[index];
            }
            S.mix(renderData, {
                monthSelectLabel: locale.monthSelect,
                monthYearLabel: self.getMonthYearLabel(),
                previousMonthLabel: locale.previousMonth,
                nextMonthLabel: locale.nextMonth,
                previousYearLabel: locale.previousYear,
                nextYearLabel: locale.nextYear,
                weekdays: weekDays,
                veryShortWeekdays: veryShortWeekdays,
                todayLabel: locale.today,
                clearLabel: locale.clear,
                todayTimeLabel: self.getTodayTimeLabel()
            });
            renderCommands.renderDates = renderDatesCmd;
        },

        renderDates: function () {
            var self = this,
                i, j,
                dateTable = [],
                current,
                control = self.control,
                isClear = control.get('clear'),
                showWeekNumber = control.get('showWeekNumber'),
                locale = control.get('locale'),
                value = control.get('value'),
                today = value.clone(),
                cellClass = self.getBaseCssClass('cell'),
                weekNumberCellClass = self.getBaseCssClass('week-number-cell'),
                dateClass = self.getBaseCssClass('date'),
                dateRender = control.get('dateRender'),
                disabledDate = control.get('disabledDate'),
                dateLocale = value.getLocale(),
                dateFormatter = new DateTimeFormat(locale.dateFormat, dateLocale),
                todayClass = self.getBaseCssClass('today'),
                selectedClass = self.getBaseCssClass('selected-day'),
                lastMonthDayClass = self.getBaseCssClass('last-month-cell'),
                nextMonthDayClass = self.getBaseCssClass('next-month-btn-day'),
                disabledClass = self.getBaseCssClass('disabled-cell');

            today.setTimeInMillis(S.now());
            var month1 = value.clone();
            month1.set(value.get(GregorianCalendar.YEAR), value.get(GregorianCalendar.MONTH), 1);
            var day = month1.get(GregorianCalendar.DAY_OF_WEEK);
            var lastMonthDiffDay = (day + 7 - value.getFirstDayOfWeek()) % 7;
            // calculate last month
            var lastMonth1 = month1.clone();
            lastMonth1.add(GregorianCalendar.DAY_OF_MONTH, -lastMonthDiffDay);
            var passed = 0;
            for (i = 0; i < DATE_ROW_COUNT; i++) {
                for (j = 0; j < DATE_COL_COUNT; j++) {
                    current = lastMonth1;
                    if (passed) {
                        current = current.clone();
                        current.add(GregorianCalendar.DAY_OF_MONTH, passed);
                    }
                    dateTable.push(current);
                    passed++;
                }
            }
            var tableHtml = '';
            passed = 0;
            for (i = 0; i < DATE_ROW_COUNT; i++) {
                var rowHtml = dateRowTplStart;
                if (showWeekNumber) {
                    rowHtml += S.substitute(weekNumberCellTpl, {
                        cls: weekNumberCellClass,
                        content: dateTable[passed].get(GregorianCalendar.WEEK_OF_YEAR)
                    });
                }
                for (j = 0; j < DATE_COL_COUNT; j++) {
                    current = dateTable[passed];
                    var cls = cellClass;
                    var disabled = false;
                    var selected = false;

                    if (isSameDay(current, today)) {
                        cls += ' ' + todayClass;
                    }
                    if (!isClear && isSameDay(current, value)) {
                        cls += ' ' + selectedClass;
                        selected = true;
                    }
                    if (beforeCurrentMonthYear(current, value)) {
                        cls += ' ' + lastMonthDayClass;
                    }
                    if (afterCurrentMonthYear(current, value)) {
                        cls += ' ' + nextMonthDayClass;
                    }
                    if (disabledDate && disabledDate(current, value)) {
                        cls += ' ' + disabledClass;
                        disabled = true;
                    }

                    var dateHtml = '';
                    if (dateRender && (dateHtml = dateRender(current, value))) {
                    } else {
                        dateHtml = S.substitute(dateTpl, {
                            cls: dateClass,
                            id: getIdFromDate(current),
                            selected: selected,
                            disabled: disabled,

                            content: current.get(GregorianCalendar.DAY_OF_MONTH)
                        });
                    }
                    rowHtml += S.substitute(dateCellTpl, {
                        cls: cls,
                        index: passed,
                        title: dateFormatter.format(current),
                        content: dateHtml
                    });
                    passed++;
                }
                tableHtml += rowHtml + dateRowTplEnd;
            }
            control.dateTable = dateTable;
            return tableHtml;
        },

        createDom: function () {
            this.$el.attr('aria-activedescendant', getIdFromDate(this.control.get('value')));
        },

        '_onSetClear': function (v) {
            var control = this.control;
            var value = control.get('value');
            var selectedCls = this.getBaseCssClass('selected-day');
            var id = getIdFromDate(value);
            var currentA = this.$('#' + id);
            if (v) {
                currentA.parent().removeClass(selectedCls);
                currentA.attr('aria-selected', false);
                this.$el.attr('aria-activedescendant', '');
            } else {
                currentA.parent().addClass(selectedCls);
                currentA.attr('aria-selected', true);
                this.$el.attr('aria-activedescendant', id);
            }
        },

        // re render after current value change
        _onSetValue: function (value, e) {
            var control = this.control;
            var preValue = e.prevVal;
            if (isSameMonth(preValue, value)) {
                var disabledDate = control.get('disabledDate');
                var selectedCls = this.getBaseCssClass('selected-day');
                var prevA = this.$('#' + getIdFromDate(preValue));
                prevA.parent().removeClass(selectedCls);
                prevA.attr('aria-selected', false);
                if (disabledDate && disabledDate(value, value)) {
                } else {
                    var currentA = this.$('#' + getIdFromDate(value));
                    currentA.parent().addClass(selectedCls);
                    currentA.attr('aria-selected', true);
                }
            } else {
                var tbodyEl = control.get('tbodyEl');
                var monthSelectContentEl = control.get('monthSelectContentEl');
                var todayBtnEl = control.get('todayBtnEl');
                monthSelectContentEl.html(this.getMonthYearLabel());
                todayBtnEl.attr('title', this.getTodayTimeLabel());
                tbodyEl.html(this.renderDates());
            }
            this.$el.attr('aria-activedescendant', getIdFromDate(value));
        }
    }, {
        name: 'date-picker-render',

        ATTRS: {
            contentTpl: {
                value: PickerTpl
            }
        }
    });
}, {
    requires: [
        'node',
        'component/control',
        'date/gregorian',
        'date/format',
        './picker-tpl']
});