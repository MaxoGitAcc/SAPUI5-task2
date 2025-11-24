sap.ui.define([], function () {
    "use strict";
    return {
        formatYear: function (sDate) {
            var oDate = new Date(sDate);
            return "Published: " + oDate.getFullYear();
        }
    };
});
