sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function(Controller) {
    "use strict";

    return Controller.extend("project1.controller.BaseController", {

        getModel: function(sName) {
            return this.getView().getModel(sName);
        },

        setModel: function(oModel, sName) {
            return this.getView().setModel(oModel, sName);
        }

    });
});