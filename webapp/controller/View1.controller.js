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
        _createAddDialog: function () {
            if (!this._oAddDialog) {
                this._oAddDialog = new sap.m.Dialog({
                    title: "Add New Book",
                    contentWidth: "400px",
                    type: "Message",
                    content: [
                        new sap.m.VBox({
                            items: [
                                new sap.m.Input({ placeholder: "Name", id: this.createId("newName") }),
                                new sap.m.Input({ placeholder: "Author", id: this.createId("newAuthor") }),
                                new sap.m.Input({ placeholder: "Genre", id: this.createId("newGenre") }),
                                new sap.m.Input({ placeholder: "Release Date (YYYY-MM-DD)", id: this.createId("newDate") }),
                                new sap.m.Input({ placeholder: "Available Quantity", type: "Number", id: this.createId("newQuantity") })
                            ]
                        })
                    ],
                    beginButton: new sap.m.Button({
                        text: "Add",
                        press: function () {
                            this._saveNewBook();
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            this._oAddDialog.close();
                        }.bind(this)
                    })
                });
            }
            return this._oAddDialog;
        },

        _saveNewBook: function () {
            var oModel = this.getModel("bookModel1");
            var aBooks = oModel.getProperty("/books");
        
            var sName = this.byId("newName").getValue();
            var sAuthor = this.byId("newAuthor").getValue();
            var sGenre = this.byId("newGenre").getValue();
            var sDate = this.byId("newDate").getValue();
            var sQuantity = parseInt(this.byId("newQuantity").getValue()) || 0;
        
            if (!sName || !sAuthor) {
                sap.m.MessageToast.show("Name and Author are required.");
                return;
            }
        
            aBooks.push({
                ID: aBooks.length + 1,
                Name: sName,
                Author: sAuthor,
                Genre: sGenre,
                ReleaseDate: sDate,
                AvailableQuantity: sQuantity
            });
        
            oModel.setProperty("/books", aBooks);
        
            this._oAddDialog.close();
        
            this.byId("newName").setValue("");
            this.byId("newAuthor").setValue("");
            this.byId("newGenre").setValue("");
            this.byId("newDate").setValue("");
            this.byId("newQuantity").setValue("");
        },
        
        

        onAddRecord: function() {
            this._createAddDialog().open()
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