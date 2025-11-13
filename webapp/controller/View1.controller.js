sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        onInit() {
            var oBookModel = new JSONModel(jQuery.sap.getModulePath("project1.model.books", ".json"));

            this.getView().setModel(oBookModel, "bookModel1");
        },
        
        //Search
        onSearch: function(oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("bookTable");
            var oBinding = oTable.getBinding("items");

            if(sQuery) {
                var oFilter = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sQuery);
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([])
            }
            console.log("Search triggered:", sQuery);
            console.log("Table:", oTable);
            console.log("Binding:", oBinding);

        }
    });
});