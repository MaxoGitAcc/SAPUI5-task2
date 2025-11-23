sap.ui.define([], function () {
    "use strict";

    return {

        isNotEmpty: function (oInput, sMessage) {
            if (!oInput.getValue().trim()) {
                oInput.setValueState("Error");
                oInput.setValueStateText(sMessage);
                return false;
            }
            oInput.setValueState("None");
            return true;
        },

        isDropdownSelected: function (oSelect, sMessage) {
            if (!oSelect.getSelectedKey()) {
                oSelect.setValueState("Error");
                oSelect.setValueStateText(sMessage);
                return false;
            }
            oSelect.setValueState("None");
            return true;
        },

        isValidDate: function (oDatePicker, sMessage) {
            if (!oDatePicker.getDateValue()) {
                oDatePicker.setValueState("Error");
                oDatePicker.setValueStateText(sMessage);
                return false;
            }
            oDatePicker.setValueState("None");
            return true;
        },

        isPositiveNumber: function (oInput, sMessage) {
            const iNum = parseInt(oInput.getValue(), 10);
            if (isNaN(iNum) || iNum < 0) {
                oInput.setValueState("Error");
                oInput.setValueStateText(sMessage);
                return false;
            }
            oInput.setValueState("None");
            return true;
        }
    };
});
