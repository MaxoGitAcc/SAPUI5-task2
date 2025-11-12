sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        onInit() {
            var oBookModel = new JSONModel(jQuery.sap.getModulePath("project1.model.books", ".json"));

            this.getView().setModel(oBookModel, "bookModel1");
        }
    });
});