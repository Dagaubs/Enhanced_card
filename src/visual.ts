/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

 /*
 "displayName": "Tooltip fields",
      "name": "tooltipMeasures",
      */

import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
let version = "1.0.0";
let helpUrl = "http://bhaveshjadav.in/powerbi/advancecard/";
let helpMail = "alan181096@gmail.com"
module powerbi.extensibility.visual {
    "use strict";
    export class Visual implements IVisual {
        private target: HTMLElement; // to store root html element
        private settings: VisualSettings; // to store settings i.e. properties of the visual
        private prefixSettings: FixLabelSettings;
        private dataLabelSettings: DataLabelSettings;
        private postfixSettings: FixLabelSettings;
        private categoryLabelSettings: CategoryLabelSettings;
        private progressionLabelSettings: ProgressionLabelSettings;
        private fillSettings: FillSettings;
        private strokeSettings: StrokeSettings;
        private conditionSettings: ConditionSettings;
        private progressionSettings : ProgressionSettings;
        private generalSettings: GeneralSettings;

        private root: d3.Selection<SVGElement>;
        private cardGrp: d3.Selection<SVGElement>;
        private contentGrp: d3.Selection<SVGElement>;
        private progressionCardGrp: d3.Selection<SVGElement>;
        private progressionContentGrp: d3.Selection<SVGElement>;
        private dataLabel: d3.Selection<SVGElement>;
        private prefixLabel: d3.Selection<SVGElement>;
        private postfixLabel: d3.Selection<SVGElement>;
        private progressionLabel: d3.Selection<SVGElement>;
        private progressionLabelGrp: d3.Selection<SVGElement>;
        private categoryLabel: d3.Selection<SVGElement>;
        private categoryLabelGrp: d3.Selection<SVGElement>;
        private cardBackground: d3.Selection<SVGElement>;
        private host: IVisualHost;
        private tableData: DataViewTable;

        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.target = options.element;
        }

        public update(options: VisualUpdateOptions) {

            this.settings = this._parseSettings(options.dataViews[0]);
            this.tableData = options.dataViews[0].table;
            this.prefixSettings = this.settings.prefixSettings;
            this.dataLabelSettings = this.settings.dataLabelSettings;
            this.postfixSettings = this.settings.postfixSettings;
            this.categoryLabelSettings = this.settings.categoryLabelSettings;
            this.progressionLabelSettings = this.settings.progressionLabelSettings;
            this.fillSettings = this.settings.backgroundSettings;
            this.strokeSettings = this.settings.strokeSettings;
            this.conditionSettings = this.settings.conditionSettings;
            this.progressionSettings = this.settings.progressionSettings;
            this.generalSettings = this.settings.general;

            const viewPortHeight: number = options.viewport.height;
            const viewPortWidth: number = options.viewport.width;
            const spaceBetweenForInlineBlock: number = this.settings.progressionLabelSettings.marginSpace;
            const fontMultiplier: number = 1.33333333333333;

            let conditionValuePresent: boolean = false;
            let conditionValue: number;
            let progressionValuePresent: boolean;
            let progressionValue: any;
            let progressionDisplayName: string;
            let progressionType: any;
            let progressionFormat: string;
            let dataLabelPresent: boolean;
            let dataLabelValue: any;
            let dataDisplayName: string;
            let dataLabelType: any;
            let dataLabelFormat: string;

            this.tableData.columns.forEach((column, index) => {
                if (
                    column.roles.conditionMeasure == true &&
                    ( column.type.numeric == true || column.type.integer == true )
                ) {
                    conditionValue = this.tableData.rows[0][index] as number;
                    conditionValuePresent = true;
                } else if (conditionValuePresent != true) {
                    conditionValue = dataLabelValue as number;
                }

                if (column.roles.mainMeasure != undefined) {
                    dataLabelPresent = true;
                    dataLabelValue = this.tableData.rows[0][index];
                    dataDisplayName = this.tableData.columns[index].displayName;
                    dataLabelType = this.tableData.columns[index].type;
                    dataLabelFormat = this.tableData.columns[index].format;
                } else if (dataLabelPresent != true) {
                    dataLabelPresent = false;
                }

                if (column.roles.progressionMeasure != undefined) {
                    /*
                    column.roles.ProgressionMeasure == true &&
                    ( column.type.numeric == true || column.type.integer == true )
                    */
                    progressionValue = this.tableData.rows[0][index] as number;
                    progressionDisplayName = this.tableData.columns[index].displayName;
                    progressionType = this.tableData.columns[index].type;
                    progressionFormat = this.tableData.columns[index].format;
                    progressionValuePresent = true;
                } else if (progressionValuePresent != true) {
                    progressionValue = dataLabelValue as number;
                }
            });

            if (typeof document !== "undefined") {

                // adding parent element ---------------------------------------------------------------------------------------------
                this.root = d3.select(".root").remove();

                this.root = d3.select(this.target)
                    .append("svg")
                    .classed("root", true)
                    .attr({
                        "width": viewPortWidth,
                        "height": viewPortHeight
                    });

                // adding background and stroke ----------------------------------------------------------------------------------------
                if (this.fillSettings.show == true || this.strokeSettings.show == true) {
                    const pathData = this.rounded_rect(
                        0, 0, viewPortWidth - 10, viewPortHeight - 10,
                        this.strokeSettings
                    );

                    this.cardBackground = this.root.append("path")
                        .attr("d", pathData)
                        .attr("transform", "translate(5, 5)");

                    if (this.fillSettings.show == true) {
                        this.cardBackground = this.cardBackground.attr({
                            "fill": this._getCardgrpColors(conditionValue, "B", this.conditionSettings) ||
                                    (this.fillSettings.backgroundColor as string || "none"),
                        });
                    } else {
                        this.cardBackground = this.cardBackground.attr({
                            "fill": "none",
                        });
                    }

                    if (this.strokeSettings.show == true) {
                        const strokeType = this.settings.strokeSettings.strokeType;
                        this.cardBackground = this.cardBackground.attr({
                            "stroke": this.strokeSettings.strokeColor as string || "none",
                            "stroke-width" : this.strokeSettings.strokeTickness
                        })
                        .style("stroke-dasharray", (d) => {
                            if (this.strokeSettings.strokeArray) {
                                return this.strokeSettings.strokeArray as string;
                            } else {
                                if (strokeType == "1") {
                                    return "8 , 4";
                                } else if (strokeType == "2") {
                                    return "2 , 4";
                                }
                            }
                        });
                    }
                }
                // end adding background and stroke ------------------------------------------------------------------------------------

                // adding parent element -----------------------------------------------------------------------------------------------
                this.cardGrp = this.root.append("g")
                    .classed("cardGrp", true);

                this.contentGrp = this.cardGrp
                    .append("g")
                    .classed("contentGrp", true);
                // end adding parent element -----------------------------------------------------------------------------------------

                this.contentGrp = this.contentGrp.append("text")
                .style({
                    "text-anchor": "middle"
                });
                
                
                if(progressionValuePresent == true){
                    this.progressionCardGrp = this.root.append("g")
                        .classed("progressionCardGrp", true);

                    this.progressionContentGrp = this.progressionCardGrp
                        .append("g")
                        .classed("progressionContentGrp", true);

                    this.progressionContentGrp = this.progressionContentGrp.append("text")
                    .style({
                        "text-anchor": "middle"
                    });
                }
                // adding prefix ------------------------------------------------------------------------------------------------------
                if (this.prefixSettings.show == true) {
                    this.prefixLabel = this.contentGrp
                        .append("tspan")
                        .classed("prefixLabel", true)
                        .style({
                            "text-anchor": "start",
                            "font-size": this.prefixSettings.fontSize * fontMultiplier + "px",
                            "fill": this.conditionSettings.applyToPrefix == true ?
                                    this._getCardgrpColors(conditionValue, "F", this.conditionSettings) || this.prefixSettings.color :
                                    this.prefixSettings.color,
                            "font-family": this.prefixSettings.fontFamily,
                            "font-weight": this.prefixSettings.isBold == true ? "bold" : "normal",
                            "font-style": this.prefixSettings.isItalic == true ? "italic" : "normal"
                        })
                        .text(this.prefixSettings.text);
                } else {
                    d3.select(".prefixLabel").remove();
                }
                // end adding prefix ----------------------------------------------------------------------------------------------------

                // adding data label -------------------------------------------------------------------------------------------------------
                let dataLabelValueFormatted;
                if (dataLabelPresent == true) {
                    if (!dataLabelType.text) {
                        dataLabelValueFormatted = this._formatMeasure(
                            dataLabelValue as number,
                            dataLabelFormat,
                            this.dataLabelSettings.displayUnit,
                            this.dataLabelSettings.decimalPlaces
                        );
                    }

                    const prefixSpacing = this.prefixSettings.spacing;
                    this.dataLabel = this.contentGrp
                        .append("tspan")
                        .classed("dataLabel", true)
                        .attr("dx", () => {
                            if (this.prefixSettings.show == true && this.prefixSettings.text != null) {
                                return this.prefixSettings.spacing;
                            } else {
                                return 0;
                            }
                        })
                        .style({
                            "text-anchor": "start",
                            "font-size": this.dataLabelSettings.fontSize * fontMultiplier + "px",
                            "fill": this.conditionSettings.applyToDataLabel == true ?
                                    this._getCardgrpColors(conditionValue, "F", this.conditionSettings) || this.dataLabelSettings.color :
                                    this.dataLabelSettings.color,
                            "font-family": this.dataLabelSettings.fontFamily,
                            "font-weight": this.dataLabelSettings.isBold == true ? "bold" : "normal",
                            "font-style": this.dataLabelSettings.isItalic == true ? "italic" : "normal"
                        })
                        .text(dataLabelType.text == true ? dataLabelValue as string  : dataLabelValueFormatted as string);
                        
                }
                // end adding data label --------------------------------------------------------------------------------------------------

                // adding postfix ------------------------------------------------------------------------------------------------------
                if (this.postfixSettings.show == true) {
                    this.postfixLabel = this.contentGrp
                        .append("tspan")
                        .classed("postfixLabel", true)
                        .attr("dx", () => {
                            if (this.postfixSettings.show == true && this.postfixSettings.text != null) {
                                return this.postfixSettings.spacing;
                            } else {
                                return 0;
                            }
                        })
                        .style({
                            "text-anchor": "start",
                            "font-size": this.postfixSettings.fontSize * fontMultiplier + "px",
                            "fill": this.conditionSettings.applyToPostfix == true ?
                                    this._getCardgrpColors(conditionValue, "F", this.conditionSettings) || this.postfixSettings.color :
                                    this.postfixSettings.color,
                            "font-family": this.postfixSettings.fontFamily,
                            "font-weight": this.postfixSettings.isBold == true ? "bold" : "normal",
                            "font-style": this.postfixSettings.isItalic == true ? "italic" : "normal"
                        })
                        .text(this.postfixSettings.text);
                } else {
                    d3.select(".postfixLabel").remove();
                }
                // end adding postfix -----------------------------------------------------------------------------------------------------
                
                // adding progression value
                let progressionValueFormatted;
                if(progressionValuePresent == true){
                    if (!progressionType.text) {
                        progressionValueFormatted = this._formatMeasure(
                            this.progressionSettings.displayAbsoluteValue ? this._abs(progressionValue as number) :  progressionValue as number,
                            progressionFormat,
                            this.progressionSettings.displayUnit,
                            this.progressionSettings.decimalPlaces
                        );
                    }
                    const stringConditionPrefixLabel = this._getCardgrpColorsForProgression(progressionValue, "P", this.progressionSettings);
                    const customPrefix = this.progressionSettings.usePrefix ? ((stringConditionPrefixLabel == null || stringConditionPrefixLabel.length == 0) ? this.progressionSettings.prefixText : stringConditionPrefixLabel) : "";
                    
                    this.progressionLabel = this.progressionContentGrp
                        .append("tspan")
                        .classed("progressionValue", true)
                        .attr("dx", 0)
                        .style({
                            "text-anchor": "start",
                            "font-size": this.progressionSettings.fontSize * fontMultiplier + "px",
                            "fill": this.progressionSettings.useCondition == true ?
                                    this._getCardgrpColorsForProgression(progressionValue, "F", this.progressionSettings) || this.progressionSettings.color :
                                    this.progressionSettings.color,
                            "font-family": this.progressionSettings.fontFamily,
                            "font-weight": this.progressionSettings.isBold == true ? "bold" : "normal",
                            "font-style": this.progressionSettings.isItalic == true ? "italic" : "normal"
                        })
                        .text(customPrefix + (progressionType.text == true ? progressionValue as string  : progressionValueFormatted as string));
                    this.progressionContentGrp.append("title")
                        .text(customPrefix + (progressionValueFormatted as string));
                }
                // end adding progression value

                // adding title to content ------------------------------------------------------------------------------------------------
                let title = "";
                title += this.prefixSettings.show == true ? this.prefixSettings.text + " " : "";
                title += dataLabelValueFormatted as string;
                title += this.postfixSettings.show == true ? " " + this.postfixSettings.text : "";
                this.contentGrp.append("title")
                    .text(title);
                // end adding title to content --------------------------------------------------------------------------------------------

                let contentGrpWidth;
                let contentGrpHeight;
                let progressionContentGrpWidth;
                let progressionContentGrpHeight;
                // adding data category label --------------------------------------------------------------------------------------------------
                if (this.categoryLabelSettings.show == true && dataLabelPresent == true) {
                    if(this.categoryLabelSettings.customLabel == null/* || this.categoryLabelSettings.customLabel.length == 0*/){
                        this.categoryLabelSettings.customLabel = dataDisplayName;
                    }
                    const customlabel =  this.categoryLabelSettings.customLabel;
                    
                    this.categoryLabelGrp = this.cardGrp.append("g")
                        .classed("categoryLabelGrp", true);

                    this.categoryLabel = this.categoryLabelGrp.append("g")
                        .classed("categoryLabel", true)
                        .append("text")
                        .style({
                            "text-anchor": "start",
                            "font-size": this.categoryLabelSettings.fontSize * fontMultiplier + "px",
                            "fill": this.conditionSettings.applyToCategoryLabel == true ?
                                    this._getCardgrpColors(conditionValue, "F", this.conditionSettings) || this.categoryLabelSettings.color :
                                    this.categoryLabelSettings.color,
                            "font-family": this.categoryLabelSettings.fontFamily,
                            "font-weight": this.categoryLabelSettings.isBold == true ? "bold" : "normal",
                            "font-style": this.categoryLabelSettings.isItalic == true ? "italic" : "normal"
                        })
                        .append("tspan")
                        .text(customlabel);

                    contentGrpWidth = this._getBoundingClientRect("contentGrp", 0).width;
                    contentGrpHeight = this._getBoundingClientRect("contentGrp", 0).height;
                    const categoryLabelWidth = this._getBoundingClientRect("categoryLabel", 0).width;
                    const categoryLabelHeight = this._getBoundingClientRect("categoryLabel", 0).height;

                    let categoryLabelX: number;
                    const categoryLabelY: number = contentGrpHeight / 2 + categoryLabelHeight * 0.25;

                    switch (this.generalSettings.alignment){
                        case "left":
                            categoryLabelX = 0;
                        break;
                        
                        case "center":
                            categoryLabelX = contentGrpWidth / 2 - categoryLabelWidth / 2;
                        break;
                        
                        case "right":
                            categoryLabelX = contentGrpWidth - categoryLabelWidth;
                        break;

                        default:
                            console.error("alignment unknown : " + this.generalSettings.alignment);
                            categoryLabelX = 0;
                        break;
                    }
                    this.categoryLabelGrp = this.categoryLabelGrp.attr("transform", "translate(" + categoryLabelX + "," + categoryLabelY + ")");

                    this.categoryLabel = this.categoryLabel.append("title")
                        .text(customlabel ? customlabel : "");

                } else {
                    this.categoryLabelGrp = d3.select(".categoryLabelGrp").remove();
                }
                // end adding data category label -----------------------------------------------------------------------------------------------

                // adding progression category label --------------------------------------------------------------------------------------------------
                if (this.progressionLabelSettings.show == true && progressionValuePresent == true) {
                    if(this.progressionLabelSettings.customLabel == null){
                        this.progressionLabelSettings.customLabel = progressionDisplayName;
                    }
                    const stringConditionLabel = this._getCardgrpColorsForProgression(progressionValue, "L", this.progressionSettings);
                    const customlabel =  (stringConditionLabel == null || stringConditionLabel.length == 0) ? this.progressionLabelSettings.customLabel : stringConditionLabel;
                    this.progressionLabelGrp = this.progressionCardGrp.append("g")
                        .classed("progressionLabelGrp", true);

                    this.progressionLabel = this.progressionLabelGrp.append("g")
                        .classed("progressionLabel", true)
                        .append("text")
                        .style({
                            "text-anchor": "start",
                            "font-size": this.progressionLabelSettings.fontSize * fontMultiplier + "px",
                            "fill": this.progressionSettings.applyTolabel == true ?
                                    this._getCardgrpColorsForProgression(progressionValue, "F", this.progressionSettings) || this.progressionLabelSettings.color :
                                    this.progressionLabelSettings.color,
                            "font-family": this.progressionLabelSettings.fontFamily,
                            "font-weight": this.progressionLabelSettings.isBold == true ? "bold" : "normal",
                            "font-style": this.progressionLabelSettings.isItalic == true ? "italic" : "normal"
                        })
                        .append("tspan")
                        .text(customlabel);

                    progressionContentGrpWidth = this._getBoundingClientRect("progressionContentGrp", 0).width;
                    progressionContentGrpHeight = this._getBoundingClientRect("progressionContentGrp", 0).height;
                    
                    const progressionLabelWidth = this._getBoundingClientRect("progressionLabel", 0).width;
                    const progressionLabelHeight = this._getBoundingClientRect("progressionLabel", 0).height;
                    
                    let progressionLabelX: number;
                    let progressionLabelY: number;

                    if(this.progressionLabelSettings.inlineBlock){
                        switch(this.generalSettings.alignment){
                            case "left":
                                progressionLabelX = progressionContentGrpWidth + spaceBetweenForInlineBlock;
                            break;

                            case "center":
                                progressionLabelX = progressionContentGrpWidth + spaceBetweenForInlineBlock;
                            break;
                            
                            case "right":
                                progressionLabelX = progressionContentGrpWidth + spaceBetweenForInlineBlock //- progressionContentGrpWidth - progressionLabelWidth / 2 - spaceBetweenForInlineBlock;
                            break;

                            default:
                                console.error("alignment unknown : " + this.generalSettings.alignment);
                                progressionLabelX = 0;
                            break;
                        }
                        progressionLabelY = 0; //progressionContentGrpHeight / 2 + progressionLabelHeight * 0.25;
                    }else{
                        switch(this.generalSettings.alignment){
                            case "left":
                                progressionLabelX = 0;
                            break;

                            case "center":
                                progressionLabelX = progressionContentGrpWidth / 2 - progressionLabelWidth / 2;
                            break;
                            
                            case "right":
                                progressionLabelX = progressionContentGrpWidth - progressionLabelWidth;
                            break;

                            default:
                            console.error("alignment unknown : " + this.generalSettings.alignment);
                                progressionLabelX = 0;
                            break;
                        }
                        progressionLabelY = progressionContentGrpHeight / 2 + progressionLabelHeight * 0.25;
                    }
                    this.progressionLabelGrp = this.progressionLabelGrp.attr("transform", "translate(" + progressionLabelX + "," + progressionLabelY + ")");

                    this.progressionLabel = this.progressionLabel.append("title")
                        .text(customlabel ? customlabel : "");

                } else {
                    this.progressionLabelGrp = d3.select(".progressionLabelGrp").remove();
                }
                // end adding progression category label -----------------------------------------------------------------------------------------------

                // cardGrp alignment -------------------------------------------------------------------------------------------------------
                contentGrpWidth = this._getBoundingClientRect("contentGrp", 0) == null ? 0 : this._getBoundingClientRect("contentGrp", 0).width;
                contentGrpHeight = this._getBoundingClientRect("contentGrp", 0) == null ? 0 : this._getBoundingClientRect("cardGrp", 0).height;
                progressionContentGrpWidth = this._getBoundingClientRect("progressionContentGrp", 0) == null ? 0 : this._getBoundingClientRect("progressionContentGrp", 0).width;
                progressionContentGrpHeight = this._getBoundingClientRect("progressionContentGrp", 0) == null ? 0 : this._getBoundingClientRect("progressionCardGrp", 0).height;
                let progressionCardGrpWidth = this._getBoundingClientRect("progressionCardGrp", 0) == null ? 0 : this._getBoundingClientRect("progressionCardGrp", 0).width;
                let progressionCardGrpHeight = this._getBoundingClientRect("progressionCardGrp", 0) == null ? 0 : this._getBoundingClientRect("progressionCardGrp", 0).height;
                let progressionLabelGrpWidth = this._getBoundingClientRect("progressionLabelGrp", 0) == null ? 0 : this._getBoundingClientRect("progressionLabelGrp", 0).width;
                
                const categoryLabelGrpHeight = this._getBoundingClientRect("categoryLabelGrp", 0) == null
                                            ? 0 : this._getBoundingClientRect("categoryLabelGrp", 0).height;


                let DataCardGrpX: number;
                let DataCardGrpY: number;
                let ProgressionCardGrpX: number;
                let ProgressionCardGrpY: number;
                //progressionContentGrpWidth = progressionCardGrpWidth;
                const alignmentSpacing = this.generalSettings.alignmentSpacing;
                const cornerRadius = this.strokeSettings.cornerRadius;
                
                // handle X position
                if (this.generalSettings.alignment == "left") {
                    if (this.strokeSettings.show == true || this.fillSettings.show == true) {
                        if (this.strokeSettings.topLeft == true || this.strokeSettings.bottomLeft == true) {
                            DataCardGrpX = alignmentSpacing + cornerRadius * 0.6;
                            ProgressionCardGrpX = alignmentSpacing + cornerRadius * 0.6;
                        } else {
                            DataCardGrpX = alignmentSpacing;
                            ProgressionCardGrpX = alignmentSpacing;
                        }
                    } else {
                        DataCardGrpX = alignmentSpacing;
                        ProgressionCardGrpX = alignmentSpacing;
                    }
                } else if (this.generalSettings.alignment == "center") {
                    DataCardGrpX = viewPortWidth / 2 - contentGrpWidth / 2;
                    if(this.progressionLabelSettings.inlineBlock){
                        ProgressionCardGrpX = viewPortWidth / 2 - (progressionContentGrpWidth + spaceBetweenForInlineBlock + progressionLabelGrpWidth)/ 2
                    }else{
                        ProgressionCardGrpX = viewPortWidth / 2 - progressionContentGrpWidth / 2;
                    }
                } else if (this.generalSettings.alignment == "right") {
                    if (this.strokeSettings.show == true || this.fillSettings.show == true) {
                        if (this.strokeSettings.topRight == true || this.strokeSettings.bottomRight == true) {
                            DataCardGrpX = viewPortWidth - contentGrpWidth - alignmentSpacing - (cornerRadius * 0.6);
                            if(this.progressionLabelSettings.inlineBlock){
                                ProgressionCardGrpX = viewPortWidth - (progressionContentGrpWidth + spaceBetweenForInlineBlock + progressionLabelGrpWidth) - alignmentSpacing - (cornerRadius * 0.6);
                            }else{
                                ProgressionCardGrpX = viewPortWidth - progressionContentGrpWidth - alignmentSpacing - (cornerRadius * 0.6);
                            }
                        } else {
                            DataCardGrpX = viewPortWidth - contentGrpWidth - alignmentSpacing;
                            if(this.progressionLabelSettings.inlineBlock){
                                ProgressionCardGrpX = viewPortWidth - (progressionContentGrpWidth + spaceBetweenForInlineBlock + progressionLabelGrpWidth) - alignmentSpacing;
                            }else{
                                ProgressionCardGrpX = viewPortWidth - progressionContentGrpWidth - alignmentSpacing;
                            }
                        }
                    } else {
                        DataCardGrpX = viewPortWidth - contentGrpWidth - alignmentSpacing;
                        if(this.progressionLabelSettings.inlineBlock){
                            ProgressionCardGrpX = viewPortWidth - (progressionContentGrpWidth + spaceBetweenForInlineBlock + progressionLabelGrpWidth) - alignmentSpacing;
                        }else{
                            ProgressionCardGrpX = viewPortWidth - progressionContentGrpWidth - alignmentSpacing;
                        }
                    }
                }
                
                //handle Y position
                if(this.dataLabelSettings.centerVertical == true){
                    DataCardGrpY = (viewPortHeight / 2 + (this.settings.categoryLabelSettings.show == true ? 0 : contentGrpHeight * 0.3));
                    ProgressionCardGrpY = (viewPortHeight / 2 + (this.settings.progressionLabelSettings.show == true ? 0 : progressionContentGrpHeight * 0.3) + (dataLabelPresent ? contentGrpHeight : 0) + this.progressionSettings.marginTop);
                }else{
                    DataCardGrpY = (viewPortHeight / 2 + (this.settings.categoryLabelSettings.show == true ? 0 : contentGrpHeight * 0.3) - (progressionValuePresent == true ? progressionContentGrpHeight / 2 : 0));
                    ProgressionCardGrpY = (viewPortHeight / 2 + (this.settings.progressionLabelSettings.show == true ? 0 : progressionContentGrpHeight * 0.3) + contentGrpHeight * 0.6 + this.progressionSettings.marginTop);
                }
                
                this.cardGrp = this.cardGrp.attr("transform", "translate(" + DataCardGrpX + ", " + DataCardGrpY + ")");
                
                if(progressionValuePresent == true){
                    this.progressionCardGrp = this.progressionCardGrp.attr("transform", "translate(" + ProgressionCardGrpX + ", " + ProgressionCardGrpY + ")");
                }
            }
        }

        /**
         * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
         * objects and properties you want to expose to the users in the property pane.
         *
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
            const settings: VisualObjectInstance[] = [];
            const conditionKey = "condition";
            const valueKey = "value";
            const foregroundColorKey = "foregroundColor";
            const backgroundColorKey = "backgroundColor";
            const customLabelKey = "customLabel";
            const customPrefixKey = "customPrefix";
            let conditionNumbers = this.conditionSettings.conditionNumbers;
            let progressionConditionNumbers = this.progressionSettings.conditionNumbers;
            switch (options.objectName) {

                case "general":
                    settings.push({
                        "objectName": options.objectName,
                        "properties": {
                            "alignment": this.generalSettings.alignment,
                            "alignmentSpacing": this.generalSettings.alignmentSpacing
                        },
                        "selector": null
                    });
                    break;

                case "conditionSettings":
                    settings.push({
                        "objectName": options.objectName,
                        "properties": {
                            "show": this.conditionSettings.show,
                            "conditionNumbers": conditionNumbers > 10 ? 10 : conditionNumbers == 0 ? conditionNumbers = 1 : conditionNumbers,
                            "applyToDataLabel": this.conditionSettings.applyToDataLabel,
                            "applyToCategoryLabel": this.conditionSettings.applyToCategoryLabel,
                            "applyToPrefix": this.conditionSettings.applyToPrefix,
                            "applyToPostfix": this.conditionSettings.applyToPostfix
                        },
                        "selector": null
                    });
                    for (let index = 1; index <= conditionNumbers; index++) {
                        settings.push({
                            "objectName": options.objectName,
                            "properties": {
                                [conditionKey + index]: this.conditionSettings["condition" + index],
                                [valueKey + index]: this.conditionSettings["value" + index],
                                [foregroundColorKey + index]: this.conditionSettings["foregroundColor" + index],
                                [backgroundColorKey + index]: this.conditionSettings["backgroundColor" + index]
                            },
                            "selector": null
                        });
                    }
                    break;

                    case "progressionSettings":
                    settings.push({
                        "objectName": options.objectName,
                        "properties": {
                            "useCondition": this.progressionSettings.useCondition,
                            "marginTop": this.progressionSettings.marginTop,
                            "applyTolabel": this.progressionSettings.applyTolabel,
                            "displayAbsoluteValue": this.progressionSettings.displayAbsoluteValue,
                            "usePrefix": this.progressionSettings.usePrefix
                        },
                        "selector": null
                    });
                    if(this.progressionSettings.usePrefix)
                    settings.push({
                        "objectName": options.objectName,
                        "properties": {
                            "prefixText": this.progressionSettings.prefixText
                        },
                        "selector":null
                    });
                    settings.push({
                        "objectName": options.objectName,
                        "properties": {
                            "displayUnit": this.progressionSettings.displayUnit,
                            "decimalPlaces": this.progressionSettings.decimalPlaces,
                            "fontSize": this.progressionSettings.fontSize,
                            "fontFamily": this.progressionSettings.fontFamily,
                            "isBold": this.progressionSettings.isBold,
                            "isItalic": this.progressionSettings.isItalic,
                            "conditionNumbers": (progressionConditionNumbers > 10 ? 10 : (progressionConditionNumbers == 0 ? progressionConditionNumbers = 1 : progressionConditionNumbers))
                        },
                        "selector": null
                    });
                    if(this.progressionSettings.useCondition){
                        for (let index = 1; index <= progressionConditionNumbers; index++) {
                            settings.push({
                                "objectName": options.objectName,
                                "properties": {
                                    [conditionKey + index]: this.progressionSettings["condition" + index],
                                    [valueKey + index]: this.progressionSettings["value" + index],
                                    [foregroundColorKey + index]: this.progressionSettings["foregroundColor" + index],
                                    [backgroundColorKey + index]: this.progressionSettings["backgroundColor" + index],
                                    [customLabelKey + index]: this.progressionSettings["customLabel" + index],
                                    [customPrefixKey + index]: this.progressionSettings["customPrefix" + index]
                                },
                                "selector": null
                            });
                        }
                    }
                    
                    break;

                case "aboutSettings":
                    settings.push({
                        "objectName": options.objectName,
                        "displayName": "About",
                        "properties": {
                            "version": version,
                            "helpUrl": helpUrl,
                            "helpMail": helpMail
                        },
                        "selector": null
                    });
                    break;

                default:
                    break;
            }
            if (settings.length > 0) {
                return settings;
            } else {
                return (VisualSettings.enumerateObjectInstances(this.settings, options) as VisualObjectInstanceEnumerationObject);
            }
        }

        public getPropertyValue<T>(objects: DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T {
            if (objects) {
                const object = objects[objectName];
                if (object) {
                    const property: T = <T> object[propertyName];
                    if (property !== undefined) {
                        return property;
                    }
                }
            }
            return defaultValue;
        }

        // base of following function is taken from https://stackoverflow.com/questions/12115691/svg-d3-js-rounded-corner-on-one-corner-of-a-rectangle
        // original function credit to @stackmate on stackoverflow
        private rounded_rect(
            x: number, y: number,  w: number,
            h: number, strokeSettings: StrokeSettings) {

            const r = this.strokeSettings.cornerRadius;

            const tl = this.strokeSettings.topLeft;
            const tr = this.strokeSettings.topRight;
            const bl = this.strokeSettings.bottomLeft;
            const br = this.strokeSettings.bottomRight;

            const tli = this.strokeSettings.topLeftInward == true ? 0 : 1;
            const tri = this.strokeSettings.topRightInward  == true ? 0 : 1;
            const bli = this.strokeSettings.bottomLeftInward == true ? 0 : 1;
            const bri = this.strokeSettings.bottomRightInward  == true ? 0 : 1;

            let retval;
            retval  = "M" + (x + r) + "," + y;
            retval += "h" + (w - 2 * r);
            if (tr) {
                retval += "a" + r + "," + r + " 0 0 " + tri + " " + r + "," + r;
            } else {
                retval += "h" + r; retval += "v" + r;
            }
            retval += "v" + (h - 2 * r);
            if (br) {
                retval += "a" + r + "," + r + " 0 0 " + bri + " " + -r + "," + r;
            } else {
                retval += "v" + r; retval += "h" + -r;
            }
            retval += "h" + (2 * r - w);
            if (bl) {
                retval += "a" + r + "," + r + " 0 0 " + bli + " " + -r + "," + -r;
            } else {
                retval += "h" + -r; retval += "v" + -r;
            }
            retval += "v" + (2 * r - h);
            if (tl) {
                retval += "a" + r + "," + r + " 0 0 " + tli + " " + r + "," + -r;
            } else {
                retval += "v" + -r; retval += "h" + r;
            }
            retval += "z";
            return retval;
        }

        private _getBoundingClientRect(className: string, index: number) {
            const elements = document.getElementsByClassName(className);
            if (elements.length != 0) {
                if(elements.length >= (index - 1)){
                    return elements[index].getBoundingClientRect();
                }
                else if(elements.length == (index - 1)){
                    return elements[index-1].getBoundingClientRect();
                }
            } else {
                return null;
            }
        }

        private _abs(field: any): any{
            //console.log("abs : " + field + " -> " + field.type);
            let ret;
            if(field < 0){
                ret = field * -1;
            }else
                ret = field;
            //console.log("end of abs : " + ret);
            return ret;
        }

        private _parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        private _formatMeasure(dataLabelValue: number, format: string, value: number, precision: number) {
            let formatValue = 1001;
            switch (value) {
                    case 0:
                        if (dataLabelValue < 1000) {
                            formatValue = 0;
                        } else if (dataLabelValue < 1000000) {
                            formatValue = 1001;
                        } else if (dataLabelValue < 1000000000) {
                            formatValue = 1e6;
                        } else if (dataLabelValue < 1000000000000) {
                            formatValue = 1e9;
                        } else {
                            formatValue = 1e12;
                        }
                        break;
                    case 1:
                        formatValue = 0;
                        break;
                    case 1000:
                        formatValue = 1001;
                        break;
                    case 1000000:
                        formatValue = 1e6;
                        break;
                    case 1000000000:
                        formatValue = 1e9;
                        break;
                    case 1000000000000:
                        formatValue = 1e12;
                        break;
                }
            const formatter = valueFormatter.create({
                "format": format,
                "value": formatValue,
                "precision": precision,
                "allowFormatBeautification": true
            });

            return formatter.format(dataLabelValue);
        }

        private _getCardgrpColors(originalValue: number, colorType: string, conditonSettings: ConditionSettings): string | null {
            if (conditonSettings.show == true) {
                for (let conditionNumber = 1; conditionNumber <= conditonSettings.conditionNumbers; conditionNumber++) {
                    const compareValue =  conditonSettings["value" + conditionNumber];
                    if (compareValue != null) {
                        const condition = conditonSettings["condition" + conditionNumber];
                        let conditonResult;
                        switch (condition) {
                            case ">":
                                conditonResult = originalValue > compareValue;
                                break;
                            case ">=":
                                conditonResult = originalValue >= compareValue;
                                break;
                            case "=":
                                conditonResult = originalValue == compareValue;
                                break;
                            case "<":
                                conditonResult = originalValue < compareValue;
                                break;
                            case "<=":
                                conditonResult = originalValue <= compareValue;
                                break;
                            default:
                                break;
                        }
                        if (conditonResult == true) {
                            if (colorType == "F") {
                                return conditonSettings["foregroundColor" + conditionNumber];
                            } else if (colorType == "B") {
                                return conditonSettings["backgroundColor" + conditionNumber];
                            }
                            break;
                        }
                    }
                }
            }
            return null;
        }

        private _getCardgrpColorsForProgression(originalValue: number, colorType: string, progressionSettings: ProgressionSettings): string | null {
            if (progressionSettings.useCondition == true) {
                for (let conditionNumber = 1; conditionNumber <= progressionSettings.conditionNumbers; conditionNumber++) {
                    const compareValue =  progressionSettings["value" + conditionNumber];
                    if (compareValue != null) {
                        const condition = progressionSettings["condition" + conditionNumber];
                        let conditonResult;
                        switch (condition) {
                            case ">":
                                conditonResult = originalValue > compareValue;
                                break;
                            case ">=":
                                conditonResult = originalValue >= compareValue;
                                break;
                            case "=":
                                conditonResult = originalValue == compareValue;
                                break;
                            case "<":
                                conditonResult = originalValue < compareValue;
                                break;
                            case "<=":
                                conditonResult = originalValue <= compareValue;
                                break;
                            default:
                                break;
                        }
                        if (conditonResult == true) {
                            if (colorType == "F") {
                                return progressionSettings["foregroundColor" + conditionNumber];
                            } else if (colorType == "B") {
                                return progressionSettings["backgroundColor" + conditionNumber];
                            } else if (colorType == "L") {
                                return progressionSettings["customLabel" + conditionNumber];
                            } else if (colorType == "P") {
                                return progressionSettings["customPrefix" + conditionNumber];
                            }
                            break;
                        }
                    }
                }
            }
            return null;
        }
    }
}
