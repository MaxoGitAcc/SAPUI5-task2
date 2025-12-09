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
    "sap/ui/model/Sorter",
], (BaseController, Validation, v2Validations, Filter, FilterOperator, Dialog, DialogType, Text, Button, Fragment, MessageToast, formatter, MessageBox, Sorter) => {
    "use strict";

    return BaseController.extend("project1.controller.View1", {
        onInit() {
            const oBookModel = this.getOwnerComponent().getModel("bookModel1");
            const oGenreModel = this.getOwnerComponent().getModel("genreModel");
        
            //Edit Mode 
            oBookModel.dataLoaded().then(() => {
                let aBooks = oBookModel.getProperty("/books") || [];
        
                aBooks.forEach(oBook => {
                    if (!oBook.editMode) {
                        oBook.editMode = false;
                    }                    
                });
        
                oBookModel.setProperty("/books", aBooks);
            });
        
            this._selectedGenre = oGenreModel.getProperty("/defaultGenre");

            //Tab router
            const oRouter = this.getOwnerComponent().getRouter();

            oRouter.getRoute("RouteView1").attachPatternMatched(() => {
                oRouter.navTo("tab", { tabName: "JSONModel" }, true);
            });
            oRouter.getRoute("tab").attachPatternMatched(this._onTabMatched, this);
        },

        formatter: formatter,

        //links
        _onTabMatched(oEvent) {
            const tabName = oEvent.getParameter("arguments").tabName;
      
            const oIconTabBar = this.byId("idIconTabBarIcons");
            oIconTabBar.setSelectedKey(tabName);
          },
      
          onTabSelect(oEvent) {
            const key = oEvent.getParameter("key");
            this.getOwnerComponent().getRouter().navTo("tab", { tabName: key });
          },

        //Buttons
        _createAddDialog: async function () {
            if (!this._oAddDialog) {
                this._oAddDialog = await this.loadFragment({
                    name: "project1.view.addBookDialog",
                });
                
                this.getView().addDependent(this._oAddDialog);

                const oComboBox = this.byId("newGenre");
                const oBinding = oComboBox.getBinding("items");
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

            const oModel = this.getModel("bookModel1");
            let aBooks = oModel.getProperty("/books");
            const sName = this.byId("newName").getValue();
            const sAuthor = this.byId("newAuthor").getValue();
            const sGenre = this.byId("newGenre").getSelectedKey();
            const sDate = this.byId("newDate").getValue();
            const sQuantity = parseInt(this.byId("newQuantity").getValue()) || 0;

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
            
            const oBundle = this.getModel("i18n").getResourceBundle();
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
                            const oTable = this.byId("bookTable");
                            const aSelectedItems = oTable.getSelectedItems();
                            const oModel = this.getModel("bookModel1");
                            const aBooks = oModel.getProperty("/books");
                        
                            const aSelectedIds = aSelectedItems.map(function(oItem) {
                                return oItem.getBindingContext("bookModel1").getProperty("ID");
                            });
                        
                            const aRemainingBooks = aBooks.filter(function(oBook) {
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
            const oContext = oEvent.getSource().getBindingContext("bookModel1");
            const oModel = this.getModel("bookModel1");
        
            oModel.setProperty(oContext.getPath() + "/editMode", true);
        },
        

        onSaveTitle: function(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("bookModel1");
            const oModel = this.getModel("bookModel1");
            const sName = oModel.getProperty(oContext.getPath() + "/Name");
            
            if (!sName) {
                const oBundle = this.getModel("i18n").getResourceBundle();
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
            const oTable = this.byId("bookTable");
            const oBinding = oTable.getBinding("items");
            let aFilters = [];
            const sDefaultGenre = this.getModel("genreModel").getProperty("/defaultGenre");
        
            if (sQuery) {
                aFilters.push(new Filter("Name", FilterOperator.Contains, sQuery));
            }
        
            if (this._selectedGenre && this._selectedGenre !== sDefaultGenre) {
                aFilters.push(new Filter("Genre", FilterOperator.EQ, this._selectedGenre));
            }
        
            oBinding.filter(aFilters);
        },

        //////oDataV2//////
        onDeleteRecordBtnPressV2: function() {
            const oTable = this.byId("productTableV2");
            const aItems = oTable.getSelectedItems().map(item => {
                return item.getBindingContext("oDataV2Model").getObject()["ID"]
            });
            const oModel = this.getModel("oDataV2Model");

            let iDeletedCount = 0;
        
            aItems.forEach(id => {
                const sPath = `/Products(${id})`
                oModel.remove(sPath, {
                    success: () => {
                        const oBundle = this.getModel("i18n").getResourceBundle();
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
                        const oBundle = this.getModel("i18n").getResourceBundle();
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
        onAddRecordBtnPressV2: async function () {
            this._isEditMode = false;
            this._editedProductPath = null;

            const oModel = this.getModel("oDataV2Model");
            const oDialog = await this._createAddDialogV2();
            const oContext = oModel.createEntry("/Products", {
                properties: {
                    Name: "",
                    Description: "",
                    ReleaseDate: null,
                    DiscontinuedDate: null,
                    Rating: 0,
                    Price: 0
                }
            });
            
            oDialog.setBindingContext(oContext, "oDataV2Model");
            
            this._resetDialogFieldsV2();
            oDialog.open();
        },
        
        _createAddDialogV2: async function () {
            if (!this._oV2AddDialog) {
                this._oV2AddDialog = await this.loadFragment({
                  name: "project1.view.V2AddProductDialog",
                });
                
                this._setupValidatorsV2();
                this.getView().addDependent(this._oV2AddDialog);
            }
        
            return this._oV2AddDialog;
        },

        onDialogCancelBtnPressV2: function() {
            const oDialog = this._oV2AddDialog;
            const oModel = this.getModel("oDataV2Model");
            if(this._isEditMode && this._editedProductPath) {
                oModel.resetChanges([this._editedProductPath]);
            }else {
                const oContext = oDialog.getBindingContext("oDataV2Model");
                if(oContext) {
                    oModel.deleteCreatedEntry(oContext);
                }
            }
            
            this._isEditMode = false;
            this._editedProductPath = null;
            oDialog.close();
        },

        onDialogSaveBtnPressV2: function () {
            if (!this._validateRequredFieldsV2()) {
                return;
            }

            const oDialog = this._oV2AddDialog;
            const oModel = this.getModel("oDataV2Model");
        

            if (this._isEditMode) {
                oModel.submitChanges({
                    success: () => {
                        const oBundle = this.getModel("i18n").getResourceBundle();
                        MessageToast.show(oBundle.getText("v2EditProductSuccess"));
                        
                        this._isEditMode = false;
                        this._editedProductPath = null;
            
                        oDialog.close();
                    },
            
                    error: (oError) => { this._showODataErrorV2(oError, "v2EditProductError");}
                });
            
                return;
            }            
        
        
            oModel.submitChanges({
                success: () => {
                    const oBundle = this.getModel("i18n").getResourceBundle();
                    MessageToast.show(oBundle.getText("v2AddingProductSuccess"));
                    oDialog.close();
                },
                error: (oError) => {this._showODataErrorV2(oError, "v2EditProductError");
                }    
            });
        },

        _showODataErrorV2: function (oError, sI18nKey) {
            const oBundle = this.getModel("i18n").getResourceBundle();
            const sFallback = oBundle.getText(sI18nKey);
        
            let sMessage = "";
        
            try {
                if (oError?.responseText) {
                    const oErrObj = JSON.parse(oError.responseText);
                    sMessage = oErrObj?.error?.message?.value || "";
                } else if (oError?.message) {
                    sMessage = oError.message;
                }
            } catch (e) {
                console.warn("Error parsing backend response:", e);
            }
        
            MessageBox.error(sMessage || sFallback);
        },

        _setupValidatorsV2: function() {
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

        onLiveValidationChangeV2: function(oEvent) {
            const oControl = oEvent.getSource();
            const sId = oControl.getId().split("--").pop();
            const validator = this._v2Validators[sId];
        
            if (validator) {
                validator.fn(oControl, validator.msg);
            }
        },

        _validateRequredFieldsV2: function () {
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

        _resetDialogFieldsV2: function() {
            const aInputs = Object.keys(this._v2Validators);
            aInputs.forEach(id => {
                const oControl = this.byId(id);
                if (oControl) {
                    oControl.setValueState("None");
                }
            });
        },

        //Edit button v2
        onEditBtnPressV2: async function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("oDataV2Model");
            const sPath = oContext.getPath();
        
            this._isEditMode = true;
            this._editedProductPath = sPath;
        
            const oDialog = await this._createAddDialogV2();
            
            oDialog.setBindingContext(oContext, "oDataV2Model");
        
            oDialog.open();
        },
        
        //Search V2
        onSearchByNameFieldLiveChangeV2: function (oEvent) {
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
        onColumnSelectChangeV2: function (oEvent) {
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