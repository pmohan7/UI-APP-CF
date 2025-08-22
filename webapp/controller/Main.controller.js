sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/BusyDialog",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "te/gas/fi/report/utils/formatter",
    'sap/ui/core/util/Export',
    'sap/ui/core/util/ExportTypeCSV',
], (Controller,
    Fragment,
    JSONModel,
    MessageToast,
    BusyDialog,
    Filter,
    FilterOperator,
    MessageBox,
    formatter,
    Export,
    ExportTypeCSV) => {
    "use strict";

    return Controller.extend("te.gas.fi.report.controller.Main", {
        onInit() {
            this.BusyDialog = new BusyDialog();
            let oLocalModel = new JSONModel();
            let oReportModel = new JSONModel();
            this.getView().setModel(oLocalModel, "oLocalModel");
            this.getView().setModel(oReportModel, "oReportModel");
            this.getView().setModel(this.getOwnerComponent().getModel("mainReport"));
        },
        _onRouteMatchListDisplay: function (oEvent) {

        },

        onSearch:async function(){
            let oView = this.getView();
            oView.setBusy(true);
            //get variant and TCode details
            var Tcode = this.getView().byId("Tcode").getValue();
            var Variant = this.getView().byId("Variant").getValue();
            if(Tcode === '' && Variant === ''){
                oView.setBusy(false);
                return MessageBox.information("Please select Tcode and Varinat.")
            }
            let aReportColumn = [];
            let aReportData = [];
            var filterCollection = []
                filterCollection.push(new Filter("Tcode", FilterOperator.EQ, Tcode));
                filterCollection.push(new Filter("Variant", FilterOperator.EQ, Variant)); 
                this.skip = 0;
                this.top = 1000;
                var oFilter = new Array(new Filter({
                        filters: filterCollection,
                        and: true
                    }));

                aReportColumn = await this._fetchReportColumn(
                        oFilter
                    ).catch(function (oError) {
                        oView.setBusy(false);
                        MessageBox.error(`OData Service failed while fetching Varinat from S4HANA!`)
                    });
                aReportData = await this._fetchReportData(
                        oFilter,
                        this.skip,
                        this.top
                    ).catch(function (oError) {
                        oView.setBusy(false);
                        MessageBox.error(`OData Service failed while fetching Varinat from S4HANA!`)
                    });

            //Read Data for Variant
            //oReportDetail = await this._fetchReportDetails();
            oView.setBusy(false);
            if(aReportColumn["results"].length == 0 ){
                return MessageBox.information("No Records found.");
            }
            //Create Table Columns
            var oTable = this.getView().byId("idReportTable");
            oTable.removeAllColumns();
            var aColumns = Object.keys(aReportColumn.results[0]);
            var aColumnsABAPFieldName = Object.values(aReportColumn.results[0]);
            var aColumnsABAPFieldDescription = Object.values(aReportColumn.results[1]);
            //add 1st 3 column
            var countColumn = 0 ;
            for(var i = 0 ; i < 3 ; i ++){
                oTable.addColumn(new sap.m.Column({
                    header: new sap.m.Label({ text: aColumns[i] }),
                    text: new sap.m.Text({ text: aColumns[i]  })
                    }));
                    countColumn++
            }

            aColumns.forEach(function (col,index) {
                if(col.includes("field") && aColumnsABAPFieldName[index] !== ''){
                    oTable.addColumn(new sap.m.Column({
                        header: new sap.m.Label({ text: aColumnsABAPFieldDescription[index] }),
                        text: new sap.m.Text({ text: aColumnsABAPFieldDescription[index] })
                        }));
                        countColumn++
                }
            }
        );
                // === Bind Data with JSON Model ===
            const oModel = new sap.ui.model.json.JSONModel(aReportData);
            oView.setModel(oModel, "reportModel");

            //Create Table Items
            var aTColumnValue = aReportData.results;
            var oTemplate = new sap.m.ColumnListItem();
            var oFirstRow = aTColumnValue[0];
            for (const key in oFirstRow) {
                if (oFirstRow.hasOwnProperty(key)) {
                    oTemplate.addCell(new sap.m.Text({ text: `{reportModel>${key}}` }));
                }
            }
            oTemplate.removeCell(0);
            oTemplate.removeCell(0);
            // Bind table items
            oTable.bindItems({
                path: "reportModel>/results",
                template: oTemplate
            });
            oTable.removeColumn(0);
            oTable.removeColumn(0);
            this.getView().byId("btnMore").setVisible(true);

        },

        _fetchReportColumn: function (aFilters) { 

            let oReportModel = this.getOwnerComponent().getModel("mainReport");
            var that = this;
            return new Promise(function (resolve, reject) {
                oReportModel.read("/ReportColumnDS4", {
                    filters: aFilters,
                    success: function (response) {
                        resolve(response);
                    },
                    error: function (oError) {
                        reject(oError);
                        that.getView().setBusy(false);
                    },
                });
            });

        },

        _fetchReportData: function (aFilters,aSkip,aTop) { 

            let oReportModel = this.getOwnerComponent().getModel("mainReport");
            var that = this;
            return new Promise(function (resolve, reject) {
                oReportModel.read("/ReportDataDS4", {
                    filters: aFilters,
                    urlParameters: {
                        "$skip": aSkip,
                        "$top": aTop
                    },
                    success: function (response) {
                        resolve(response);
                    },
                    error: function (oError) {
                        reject(oError);
                        that.getView().setBusy(false);
                    },
                });
            });
        },

        _fetchReportDataDG1: function (aFilters,aSkip,aTop) { 
            let oReportModel = this.getOwnerComponent().getModel("mainReport");
            var that = this;
            return new Promise(function (resolve, reject) {
                oReportModel.read("/ReportDataDG1", {
                    filters: aFilters,
                    urlParameters: {
                        "$skip": aSkip,
                        "$top": aTop
                    },
                    success: function (response) {
                        resolve(response);
                    },
                    error: function (oError) {
                        reject(oError);
                        that.getView().setBusy(false);
                    },
                });
            });
        },
        onSelectTCode:function(oEvent){
            var Tcode = oEvent.getSource().getSelectedKey();
            if(Tcode){
                this.getView().byId("Variant").setEnabled(true);
                var oTcodeFilter = new Filter("Tcode", FilterOperator.EQ, Tcode);
                var oFilter = [];
                oFilter.push(oTcodeFilter);
                this.getView().byId("Variant").getBinding("items").filter(oFilter);
            }
        },
        onNext: async function () {
            this.top += this.top;
            this.skip += 500;
            let oView = this.getView();
            oView.setBusy(true);
            //get variant and TCode details
            var Tcode = this.getView().byId("Tcode").getValue();
            var Variant = this.getView().byId("Variant").getValue();
            if(Tcode === '' && Variant === ''){
                oView.setBusy(false);
                return MessageBox.information("Please select Tcode and Varinat.")
            }
            let aReportColumn = [];
            let aReportData = [];
            var filterCollection = []
                filterCollection.push(new Filter("Tcode", FilterOperator.EQ, Tcode));
                filterCollection.push(new Filter("Variant", FilterOperator.EQ, Variant)); 
                var oFilter = new Array(new Filter({
                        filters: filterCollection,
                        and: true
                    }));

                aReportData = await this._fetchReportData(
                        oFilter,
                        this.skip,
                        this.top
                    ).catch(function (oError) {
                        oView.setBusy(false);
                        MessageBox.error(`OData Service failed while fetching Varinat from S4HANA!`)
                    });
                oView.setBusy(false);
                var aData = this.getView().getModel("reportModel").getData()["results"];
                var aNewData = aReportData['d']['results'];
                var concatData = aData.concat(aNewData);
                this.getView().getModel("reportModel").setData({"results":concatData});
                this.getView().getModel("reportModel").refresh(true);
        },
        onDeskTopDownload : function(aReportColumn) {
            var aColumnsName = Object.keys(aReportColumn.results[0]);
            var aColumnsABAPFieldName = Object.values(aReportColumn.results[0]);
            var aColumnsABAPFieldDescription = Object.values(aReportColumn.results[1]);
            var aexcelCol = [];
            aColumnsName.forEach(function (col,index) {
                if(aColumnsABAPFieldName[index] !== ''){
                        switch(index){
                            case 0:
                                var oExcelCol = {"name":"Tcode", field:"Tcode"};
                                break;
                            case 1:
                                var oExcelCol = {"name":"Variant", field:"Variant"};
                                break;
                            case 2:
                                var oExcelCol = {"name":"SourceSys", field:"SourceSys"};
                                break;
                            default:
                                var oExcelCol = {"name":aColumnsABAPFieldDescription[index], field:col};
                                break;
                        }
                        aexcelCol.push(oExcelCol);
                }
            });

            aexcelCol = aexcelCol.slice(0, (aexcelCol.length - 1));
            // Build columns array dynamically
            var aExportColumns = aexcelCol.map(function(col) {
                return {
                    name: col.name,
                    template: {
                        content: "{" + col.field + "}"
                    }
                };
            });

			var oExport = new Export({

				// Type that will be used to generate the content. Own ExportType's can be created to support other formats
				exportType : new ExportTypeCSV({
					separatorChar : ";"
				}),

				// Pass in the model created above
				models : this.getView().getModel("excelModel"),

				// binding information for the rows aggregation
				rows : {
					path : "/results"
				},

				// column definitions with column name and binding info for the content

				columns : aExportColumns
			});

			// download exported file
			oExport.saveFile().catch(function(oError) {
				MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
			}).then(function() {
				oExport.destroy();
			});
		},

        onDataExport: async function(oEvent) {
            var aReportData = [];
            var aFinalRecord = [];
            var oView = this.getView();
            oView.setBusy(true);
            var i = true;
            var filterCollection = [];
            var skip = 0;
            var top = 1000;
            
            // Get input values
            var Tcode = this.getView().byId("Tcode").getValue();
            var Variant = this.getView().byId("Variant").getValue();
            
            // Build filters
            filterCollection.push(new Filter("Tcode", FilterOperator.EQ, Tcode));
            filterCollection.push(new Filter("Variant", FilterOperator.EQ, Variant)); 
            var oFilter = [new Filter({
                filters: filterCollection,
                and: true
            })];
            
            //get Coloums
            var aReportColumn = await this._fetchReportColumn(
                oFilter
            ).catch(function (oError) {
                oView.setBusy(false);
                MessageBox.error(`OData Service failed while fetching Varinat from S4HANA!`)
            });
            // Sleep function
            
            while (i) {
                try {
                    aReportData = await this._fetchReportDataNew(oFilter, skip, top);
                    skip += top;
                    if (aReportData["results"].length === 0) {
                        const oModel = new sap.ui.model.json.JSONModel({"results":aFinalRecord});
                        oView.setModel(oModel, "excelModel");
                        this.onDeskTopDownload(aReportColumn);
                        break;
                    }
            
                    aFinalRecord = aFinalRecord.concat(aReportData["results"]);
                    aReportData["results"] = [];
            
                    // Wait 3 seconds before next call
                    //await sleep(1000);
                } catch (oError) {
                    oView.setBusy(false);
                    console.log(oError);
                    MessageBox.error(`OData Service failed while fetching Variant from S4HANA!`);
                     break;
                }
            }
            
            oView.setBusy(false);
        },
        _fetchReportDataNew: function (aFilters,aSkip,aTop) { 
            let oReportModel = this.getOwnerComponent().getModel("mainReport");
            var that = this;
            return new Promise(function (resolve, reject) {
                oReportModel.read("/ReportDataDS4", {
                    filters: aFilters,
                    urlParameters: {
                        "$skip": aSkip,
                        "$top": aTop
                    },
                    success: function (response) {
                        resolve(response);
                    },
                    error: function (oError) {
                        reject(oError);
                        that.getView().setBusy(false);
                    },
                });
            });
         },  
    });
});