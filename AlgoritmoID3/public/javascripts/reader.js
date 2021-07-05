"use strict";

function MyFileReader() {

    this.readData = function readData(event,attrLen,callback) {
        let file = event.target.files[0];
        let reader = new FileReader();
        reader.onload = function(event) {
            let data = event.target.result;
            let arrayOfLines = data.split('\r\n');
            let info = [];
            info = dataParser(attrLen,arrayOfLines);
            if(info.length <= 0){
                callback(undefined);
            }
            else{
                callback(null,info,arrayOfLines.length);
            }
        };
        reader.readAsText(file);
    };

    function dataParser(attrLen,arrayOfLines){
        let info = [];
        for(let line of arrayOfLines){
            let arrayOfAttr = line.split(',');
            //If attr file have the same nr of attributes, we read
            if(arrayOfAttr.length === attrLen){
                info.push(arrayOfAttr);
            }  
        }
        return info;
    };

    this.readAttributes = function readAttributes(event, callback) {
        let file = event.target.files[0];
        let reader = new FileReader();
        reader.onload = function(event) {
            let data = event.target.result;
            let attributes = data.split(',');
            if(attributes.length <= 0){
                callback(undefined);
            }
            else{
                callback(null,attributes);
            }
        };
        reader.readAsText(file);
    };
};