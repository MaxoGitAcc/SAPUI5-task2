sap.ui.define([
    "project1/controller/BaseController",
    "sap/ui/model/json/JSONModel"
],(BaseController, JSONModel) => {
    "use strict";

    return BaseController.extend("project1.controller.Product",{
        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("Product").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            const sProductId = oEvent.getParameter("arguments").ProductID;
            const sPath = "/Products(" + sProductId + ")";
            const oView = this.getView();

            oView.setModel(new JSONModel({ Suppliers: [] }), "supplierModel");
        
            oView.bindElement({
                path: sPath,
                model: "oDataV2Model",
                parameters: {
                    expand: "Supplier"
                },
                events: {
                    dataReceived: function () {
                        const oSupplier = oView.getBindingContext("oDataV2Model").getProperty("Supplier");
        
                        const oSupplierModel = new JSONModel({
                            Suppliers: [oSupplier]
                        });
        
                        oView.setModel(oSupplierModel, "supplierModelV2");
                    }
                }
            });
        }
    })
})