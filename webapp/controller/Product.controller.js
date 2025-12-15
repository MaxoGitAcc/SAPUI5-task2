sap.ui.define([
    "project1/controller/BaseController"
],(BaseController) => {
    "use strict";

    return BaseController.extend("project1.controller.Product",{
        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("Product").attachPatternMatched(this._onObjectMatched, this);
        },
        

        _onObjectMatched: function (oEvent) {
            const sProductId = oEvent.getParameter("arguments").ProductID;
            const sPath = "/Products(" + sProductId + ")";
        
            this.getView().bindElement({
                path: sPath,
                model: "oDataV2Model",
                parameters: {
                    expand: "Supplier"
                }
            });
        }        
    })
})