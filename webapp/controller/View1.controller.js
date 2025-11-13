sap.ui.define([
    "project1/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (BaseController, JSONModel, Filter, FilterOperator) => {
    "use strict";

    return BaseController.extend("project1.controller.View1", {
        onInit() {
            var oBookModel = new JSONModel()
            oBookModel.loadData(jQuery.sap.getModulePath("project1.model.books", ".json"));
            this.getView().setModel(oBookModel, "bookModel1");

            this._selectedGenre = "All"
        },
        
        //Search
        onSearch: function(oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("bookTable");
            var oBinding = oTable.getBinding("items");

            var aFilters = [];

            if (sQuery) {
                aFilters.push(new Filter("Name", FilterOperator.Contains, sQuery));
            }
            //Combained Filter and Search
            if (this._selectedGenre && this._selectedGenre !== "All") {
                aFilters.push(new Filter("Genre", FilterOperator.EQ, this._selectedGenre));
            }

            oBinding.filter(aFilters);
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
        },

        //Filter
        onGenreChange: function(oEvent) {
            this._selectedGenre = oEvent.getParameter("selectedItem").getKey();
        },

        onApplyFilter: function() {
            var oTable = this.byId("bookTable");
            var oBinding = oTable.getBinding("items");

            var aFilters = [];
            var sQuery = this.byId("searchField").getValue();
            if(sQuery) {
                aFilters.push(new Filter("Name", FilterOperator.Contains, sQuery))
            }
            if(this._selectedGenre && this._selectedGenre !== "All") {
                aFilters.push(new Filter("Genre", FilterOperator.EQ, this._selectedGenre))
            }

            oBinding.filter(aFilters);
        }
    });
});