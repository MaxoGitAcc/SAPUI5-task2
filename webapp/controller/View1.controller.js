sap.ui.define([
    "project1/controller/BaseController",
    "project1/util/Validation",
    "project1/util/v2Validations",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Dialog",
    "sap/m/DialogType",
    "sap/m/Text",
    "sap/m/Button",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "project1/util/formatter",
    "sap/m/MessageBox",
    "sap/ui/model/Sorter"
], (BaseController, Validation, v2Validations, Filter, FilterOperator, Dialog, DialogType, Text, Button, Fragment, MessageToast, formatter, MessageBox, Sorter) => {
    "use strict";

    return BaseController.extend("project1.controller.View1", {
        onInit() {
            var oBookModel = this.getOwnerComponent().getModel("bookModel1");
            var oGenreModel = this.getOwnerComponent().getModel("genreModel");
        
            //Edit Mode 
            oBookModel.dataLoaded().then(() => {
                var aBooks = oBookModel.getProperty("/books") || [];
        
                aBooks.forEach(oBook => {
                    if (!oBook.editMode) {
                        oBook.editMode = false;
                    }                    
                });
        
                oBookModel.setProperty("/books", aBooks);
            });
        
            this._selectedGenre = oGenreModel.getProperty("/defaultGenre");
        },

        formatter: formatter,

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
            
            var oBundle = this.getModel("i18n").getResourceBundle();
            MessageToast.show(oBundle.getText("addedNewBook"));
            
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
                var oBundle = this.getModel("i18n").getResourceBundle();
                MessageToast.show(oBundle.getText("changedTitleIncorectly"));
                return;
            }
        
            oModel.setProperty(oContext.getPath() + "/editMode", false);
        },
        
        //Search
        onSearch: function(oEvent) {
            this._applyTableFilters(oEvent.getParameter("query"));
        },

        //Filter
        onGenreChange: function(oEvent) {
            this._selectedGenre = oEvent.getParameter("selectedItem").getKey();
        },

        onApplyFilter: function() {
            this._applyTableFilters(this.byId("searchField").getValue());
        },


        _applyTableFilters: function(sQuery) {
            var oTable = this.byId("bookTable");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];
            var sDefaultGenre = this.getModel("genreModel").getProperty("/defaultGenre");
        
            if (sQuery) {
                aFilters.push(new Filter("Name", FilterOperator.Contains, sQuery));
            }
        
            if (this._selectedGenre && this._selectedGenre !== sDefaultGenre) {
                aFilters.push(new Filter("Genre", FilterOperator.EQ, this._selectedGenre));
            }
        
            oBinding.filter(aFilters);
        },

        //////oDataV2//////
        onDeleteV2: function() {
            var oTable = this.byId("productTableV2");
            var aItems = oTable.getSelectedItems().map(item => {
                return item.getBindingContext("oDataV2Model").getObject()["ID"]
            });
            var oModel = this.getModel("oDataV2Model");

            var iDeletedCount = 0;
        
            aItems.forEach(id => {
                var sPath = `/Products(${id})`
                oModel.remove(sPath, {
                    success: () => {
                        var oBundle = this.getModel("i18n").getResourceBundle();
                        iDeletedCount++;
                        if(iDeletedCount === aItems.length) {
                            if(aItems.length > 1) {
                                MessageToast.show(oBundle.getText("v2SuccessAlertMultiple"));
                            } else {
                                MessageToast.show(oBundle.getText("v2SuccessAlertSingle"));
                            }
                        }
                    },

                    error: (oError) => {
                        let sErrorMessage = "";
                        var oBundle = this.getModel("i18n").getResourceBundle();
                        const sFallback = oBundle.getText("v2ErrorAlert");

                        try {
                            if (oError?.responseText) {
                                const oErrObj = JSON.parse(oError.responseText);
                                sErrorMessage = oErrObj?.error?.message?.value || "";
                            } else if (oError?.message) {
                                sErrorMessage = oError.message;
                            }
                        } catch (e) {
                            console.warn("Error parsing response:", e);
                        }

                        MessageBox.error(sErrorMessage || sFallback);
                    }
                });
            });
        },
        

        // Add Product V2
        onAddRecordV2: async function () {
            const oDialog = await this._createV2addDialog();
            this._isEditMode = false;
            this._editedProductPath = null;

            oDialog.setModel(null, "editModel");
            oDialog.setBindingContext(null, "editModel");

            this._v2ResetDialogFields();
            oDialog.open();
        },
        
        _createV2addDialog: async function () {
            if (!this._oV2AddDialog) {
                this._oV2AddDialog = await this.loadFragment({
                  name: "project1.view.V2AddProductDialog",
                });
                
                this._v2SetupValidators();
                this.getView().addDependent(this._oV2AddDialog);
            }
        
            return this._oV2AddDialog;
        },

        v2CloseProduct: function() {
            const oDialog = this._oV2AddDialog;

            this._isEditMode = false;
            this._editedProductPath = null;

            oDialog.setModel(null, "editModel");
            oDialog.setBindingContext(null, "editModel");

            this._v2ResetDialogFields();
            oDialog.close();
        },

        v2SaveProduct: function () {
            if (!this._v2ValidateRequredFields()) {
                return;
            }

            const oDialog = this._oV2AddDialog;
            const oModel = this.getModel("oDataV2Model");
        
            const sName = this.byId("v2NewProductName").getValue();
            const sDescription = this.byId("v2NewProductDescription").getValue();
            const sReleaseDate = this.byId("v2NewProductReleaseDate").getDateValue();
            const sDiscontinuedDate = this.byId("v2NewProductDiscontinuedDate").getDateValue();
            const sRating = this.byId("v2NewProductRating").getValue();
            const sPrice = this.byId("v2NewProductPrice").getValue();
        
             
            const oNewProduct = {
                Name: sName,
                Description: sDescription,
                ReleaseDate: sReleaseDate,
                DiscontinuedDate: sDiscontinuedDate,
                Rating: Number(sRating),
                Price: Number(sPrice)
            };

            if (this._isEditMode) {
                oModel.update(this._editedProductPath, oNewProduct, {
                    success: () => {
                        const oBundle = this.getModel("i18n").getResourceBundle();
                        MessageToast.show(oBundle.getText("v2EditProductSuccess"));
                        
                        this._isEditMode = false;
                        this._editedProductPath = null;
            
                        oModel.refresh(true);
                        oDialog.close();
                    },
            
                    error: (oError) => {
                        const oBundle = this.getModel("i18n").getResourceBundle();
                        const sFallback = oBundle.getText("v2EditProductError");
                        let sErrorMessage = "";
            
                        try {
                            if (oError?.responseText) {
                                const oErrObj = JSON.parse(oError.responseText);
                                sErrorMessage = oErrObj?.error?.message?.value || "";
                            } else if (oError?.message) {
                                sErrorMessage = oError.message;
                            }
                        } catch (e) {
                            console.warn("Error parsing backend response:", e);
                        }
            
                        MessageBox.error(sErrorMessage || sFallback);
                    }
                });
            
                return;
            }            
        
        
            oModel.create("/Products", oNewProduct, {
                success: () => {
                    const oBundle = this.getModel("i18n").getResourceBundle();
                    MessageToast.show(oBundle.getText("v2AddingProductSuccess"));
                    this._v2ResetDialogFields();  
                    oModel.refresh();
                    oDialog.close();
                },
                error: (oError) => {
                    const oBundle = this.getModel("i18n").getResourceBundle();
                    const sFallback = oBundle.getText("v2AddingProductError");
                    let sErrorMessage = "";
                
                    try {
                        if (oError?.responseText) {
                            const oErrObj = JSON.parse(oError.responseText);
                            sErrorMessage = oErrObj?.error?.message?.value || "";
                        } else if (oError?.message) {
                            sErrorMessage = oError.message;
                        }
                    } catch (e) {
                        console.warn("Error parsing BE response:", e);
                    }
                
                    MessageBox.error(sErrorMessage || sFallback);
                }    
            });
        },  

        _v2SetupValidators: function() {
            const oBundle = this.getModel("i18n").getResourceBundle();
            this._v2Validators = {
                "v2NewProductName": { fn: v2Validations.isNotEmpty, msg: oBundle.getText('v2NameValidator') },
                "v2NewProductDescription": {fn: v2Validations.isNotEmpty, msg: oBundle.getText('v2DescriptionValidator')},
                "v2NewProductReleaseDate": {fn: v2Validations.isValidDate, msg: oBundle.getText('v2ReleaseDateValidator')},
                "v2NewProductDiscontinuedDate": {fn: v2Validations.isValidDate, msg: oBundle.getText('v2DiscontinuedDateValidator')},
                "v2NewProductRating": {fn: v2Validations.isPositiveNumber, msg: oBundle.getText('v2RatingValidator')},
                "v2NewProductPrice": {fn: v2Validations.isPositiveNumber, msg: oBundle.getText('v2PriceValidator')}
            }
        },

        v2OnLiveValidate: function(oEvent) {
            const oControl = oEvent.getSource();
            const sId = oControl.getId().split("--").pop();
            const validator = this._v2Validators[sId];
        
            if (validator) {
                validator.fn(oControl, validator.msg);
            }
        },

        _v2ValidateRequredFields: function () {
            let bValid = true;
        
            for (let sId in this._v2Validators) {
                const oControl = this.byId(sId);
                const validator = this._v2Validators[sId];
        
                if (oControl && validator) {
                    if (!validator.fn(oControl, validator.msg)) {
                        bValid = false;
                    }
                }
            }
        
            return bValid;
        },

        _v2ResetDialogFields: function() {
            const aInputs = Object.keys(this._v2Validators);
            aInputs.forEach(id => {
                const oControl = this.byId(id);
                if (oControl) {
                    oControl.setValue("");
                    oControl.setValueState("None");
                }
            });
        },

        //Edit button v2
        v2OnEditInput: async function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("oDataV2Model");
            const oDialog = await this._createV2addDialog();
        
            this._isEditMode = true;
            this._editedProductPath = oContext.getPath();
        
            oDialog.setModel(this.getModel("oDataV2Model"), "editModel");
        
            oDialog.setBindingContext(oContext, "editModel");
        
            oDialog.open();
        },

        //Search V2
        onSearchByNameField: function (oEvent) {
            const oTable = this.byId("productTableV2");
            const oBinding = oTable.getBinding("items");   
            const sQuery = oEvent.getParameter("newValue");
            let aFilters = [];
        
            if (sQuery) {
                aFilters.push(new Filter("Name", FilterOperator.Contains, sQuery));
            }
        
            oBinding.filter(aFilters);
        },
        
        //Filter
        onColumnSelectV2: function (oEvent) {
            const sKey = oEvent.getParameter("selectedItem").getKey(); 
            const oTable = this.byId("productTableV2");
            const oBinding = oTable.getBinding("items");
            let aSorters = [];
        
            if (sKey) {
                aSorters.push(new Sorter(sKey, true));
            }
        
            oBinding.sort(aSorters);
        },
        
    });
});