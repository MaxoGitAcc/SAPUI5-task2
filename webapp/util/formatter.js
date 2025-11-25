sap.ui.define([
    "sap/ui/core/date/UI5Date"
], function (UI5Date) {
    "use strict";

    return {
        formatYear: function (sPublishedText, sDate) {
            var oDate = UI5Date.getInstance(sDate);
            return sPublishedText + ": " + oDate.getFullYear();
        }
    };
});
