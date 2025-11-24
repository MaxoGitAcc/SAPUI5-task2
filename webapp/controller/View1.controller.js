sap.ui.define([
    "project1/controller/BaseController",
    "project1/util/Validation",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Dialog",
    "sap/m/DialogType",
    "sap/m/Text",
    "sap/m/Button",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast"
], (BaseController, Validation, Filter, FilterOperator, Dialog, DialogType, Text, Button, Fragment, MessageToast) => {
    "use strict";

    return BaseController.extend("project1.controller.View1", {
        onInit() {
            var oBookModel = this.getOwnerComponent().getModel("bookModel1");
            var oGenreModel = this.getOwnerComponent().getModel("genreModel");
        
            //Edit Mode 
            oBookModel.dataLoaded().then(() => {
                var aBooks = oBookModel.getProperty("/books") || [];
        
                aBooks.forEach(oBook => {
                    if (oBook.editMode === undefined) {
                        oBook.editMode = false;
                    }
                });
        
                oBookModel.setProperty("/books", aBooks);
            });
        
            this._selectedGenre = oGenreModel.getProperty("/defaultGenre");
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
            var sDefaultGenre = this.getModel("genreModel").getProperty("/defaultGenre");

            if (this._selectedGenre && this._selectedGenre !== sDefaultGenre) {
                aFilters.push(new Filter("Genre", FilterOperator.EQ, this._selectedGenre));
            }

            oBinding.filter(aFilters);
        },

        //Buttons
        _createAddDialog: async function () {
            if (!this._oAddDialog) {
                this._oAddDialog = await this.loadFragment({
                    name: "project1.view.addBookDialog",
                });
                
                this.getView().addDependent(this._oAddDialog);

                var oComboBox = this.byId("newGenre");
                var oBinding = oComboBox.getBinding("items");
                if (oBinding) {
                    oBinding.filter(new Filter("isOnlyFilterOption", FilterOperator.NE, true));
                }

                this._setupLiveValidation();
            }

            return this._oAddDialog;
        },

        _validateRequiredFields: function () {
            let bValid = true;

            Object.keys(this._validators).forEach(sId => {
                const oControl = this.byId(sId);
                const validator = this._validators[sId];
        
                if (validator && !validator.fn(oControl, validator.msg)) {
                    bValid = false;
                }
            });

            return bValid;
        },

        _setupLiveValidation: function() {
            this._validators = {
                "newName": { fn: Validation.isNotEmpty, msg: "Name is required" },
                "newAuthor": { fn: Validation.isNotEmpty, msg: "Author is required" },
                "newGenre": { fn: Validation.isDropdownSelected, msg: "Select a genre" },
                "newDate": { fn: Validation.isValidDate, msg: "Enter a valid date" },
                "newQuantity": { fn: Validation.isPositiveNumber, msg: "Enter a valid positive number" }
            };
        },

        onLiveValidate: function(oEvent) {
            const oControl = oEvent.getSource();
            const sId = oControl.getId().split("--").pop();
            const validator = this._validators[sId];
        
            if (validator) {
                validator.fn(oControl, validator.msg);
            }
        },
        
        handleAddButton: async function () {
            if (!this._validateRequiredFields()) {
                return;
            }

            var oModel = this.getModel("bookModel1");
            var aBooks = oModel.getProperty("/books");
            var sName = this.byId("newName").getValue();
            var sAuthor = this.byId("newAuthor").getValue();
            var sGenre = this.byId("newGenre").getSelectedKey();
            var sDate = this.byId("newDate").getValue();
            var sQuantity = parseInt(this.byId("newQuantity").getValue()) || 0;

            const aExistingIDs = aBooks.map(b => b.ID);
            const newID = aExistingIDs.length ? Math.max(...aExistingIDs) + 1 : 1;
        
            aBooks.push({
                ID: newID,
                Name: sName,
                Author: sAuthor,
                Genre: sGenre,
                ReleaseDate: sDate,
                AvailableQuantity: sQuantity,
                editMode: false
            });
        
            oModel.setProperty("/books", aBooks);
            
            const oDialog = await this._createAddDialog();
            oDialog.close()
            
            MessageToast.show("Book Added");
            
            this._resetDialogFields();
        },
        
        handleCancelButton: async function() {
            const oDialog = await this._createAddDialog();
            oDialog.close();
        
            this._resetDialogFields();
        },

        _resetDialogFields: function() {
            const aInputs = Object.keys(this._validators);
            aInputs.forEach(id => {
                const oControl = this.byId(id);
                if (oControl) {
                    oControl.setValue("");
                    oControl.setValueState("None");
                }
            });
        },
        
        onAddRecord: function() {
            this._createAddDialog().then(function (oDialog) {
                oDialog.open()
            })
        },

        onDeleteRecord: function() {
            if(!this.oDeleteDialog){
                this.oDeleteDialog = new Dialog({
                    type: DialogType.Message,
                    title: "Confirm",
                    content: new Text({text: "Are you sure you want to delete selected records?"}),
                    beginButton: new Button({
                        text: "Yes",
                        press: function() {
                            var oTable = this.byId("bookTable");
                            var aSelectedItems = oTable.getSelectedItems();
                            var oModel = this.getModel("bookModel1");
                            var aBooks = oModel.getProperty("/books");
                        
                            var aSelectedIds = aSelectedItems.map(function(oItem) {
                                return oItem.getBindingContext("bookModel1").getProperty("ID");
                            });
                        
                            var aRemainingBooks = aBooks.filter(function(oBook) {
                                return !aSelectedIds.includes(oBook.ID);
                            });
                        
                            oModel.setProperty("/books", aRemainingBooks);
                            oTable.removeSelections()

                            this.oDeleteDialog.close();
                        }.bind(this)
                    }),
                    endButton: new Button({
                        text: "No",
                        press: function() {
                            this.oDeleteDialog.close();
                        }.bind(this)
                    })
                });
            }

            this.oDeleteDialog.open();
        },

        onEditTitle: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("bookModel1");
            var oModel = this.getModel("bookModel1");
        
            oModel.setProperty(oContext.getPath() + "/editMode", true);
        },
        

        onSaveTitle: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("bookModel1");
            var oModel = this.getModel("bookModel1");
            var sName = oModel.getProperty(oContext.getPath() + "/Name");
            
            if (!sName) {
                MessageToast.show("Title cannot be empty.");
                return;
            }
        
            oModel.setProperty(oContext.getPath() + "/editMode", false);
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

            var sDefaultGenre = this.getModel("genreModel").getProperty("/defaultGenre");

            if (this._selectedGenre && this._selectedGenre !== sDefaultGenre) {
                aFilters.push(new Filter("Genre", FilterOperator.EQ, this._selectedGenre));
            }

            oBinding.filter(aFilters);
        }
    });
});