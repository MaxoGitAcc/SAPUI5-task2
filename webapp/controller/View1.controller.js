sap.ui.define([
    "project1/controller/BaseController",
    "sap/ui/model/json/JSONModel"
], (BaseController, JSONModel) => {
    "use strict";

    return BaseController.extend("project1.controller.View1", {
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
        },

        //Buttons
        onAddRecord: function() {
            var oModel = this.getModel("bookModel1");
            var aBooks = oModel.getProperty("/books");

            aBooks.push({
                ID:aBooks.length + 1,
                Name: "",
                Author: "",
                Genre: "",
                ReleaseDate: "",
                AvailableQuantity: 0
            });

            oModel.setProperty("/books", aBooks)
        },

        onDeleteRecord: function() {
            var oTable = this.byId("bookTable");
            var aSelectedItems = oTable.getSelectedItems();
            var oModel = this.getModel("bookModel1");
            var aBooks = oModel.getProperty("/books");

            aSelectedItems.forEach(function(oItem) {
                var oContext = oItem.getBindingContext("bookModel1");
                var sPath = oContext.getPath();
                var iIndex = parseInt(sPath.split("/")[2]);
                aBooks.splice(iIndex, 1);
            });

            oModel.setProperty("/books", aBooks)
        }
    });
});