"use strict";

let data;
let event;
let positiveDecision = 'si';
let nFinalDecision = 2;
let N = 0;

let attributeMap = new Object(); // or var map = {};
let domain = [];
let finalTree;

let domainMap;

$(()=> {
    data = new MyFileReader();
});

function dataReader(ev){
    event = ev;
    var filename = $('#dataFile').val().replace(/C:\\fakepath\\/i, '');
    $('#dataFileLbl').text(filename);
};

/*
    Read data and attributes when both files are ready.
*/
function attributesReader(ev){
    var filename = $('#attrFile').val().replace(/C:\\fakepath\\/i, '');
    $('#attrFileLbl').text(filename);
    data.readAttributes(ev,(err,attributes)=>{
        if(attributes && event){
            data.readData(event,attributes.length,(err,data,dataLen)=>{
                if(data){
                    N = dataLen;
                    for(let i = 0; i < attributes.length; i++){
                        attributeMap[attributes[i]] = i;
                    }
                    finalTree = id3(attributes,data);
                    createTree(finalTree);
                    showDecisionInput();
                }
                else{
                    alert("Choose a data file and then attributes file!");
                }
            });
        }
        else{
            alert("Choose a data file and then attributes file!");
        }
    });
};

/**
 * 
 * @param {*} attributes 
 * @param {*} data 
 * 
 * This is the main algorithm. Show the info and calculate the next attributes and data for the next call to id3
 */
function id3(attributes, data){

    let nodeStructure = {
        text: {},
        children : []
    };
    let attributesDomain = [];//array de arrays donde cada subarray tiene el dominio de cada attributo
    let attrInfo = []; //cuenta los ejemplos positivos del fichero y los guarda en orden de attributo leido
    let totalExamples = data.length;  

    for(let i = 0; i<attributes.length; i++){
        attributesDomain.push(countAttrDomain(data,i)); 
    }
    
    for(let i = 0; i<attributesDomain.length-1; i++){
        attrInfo.push(countPositiveExamples(i,attributesDomain[i],attributes,data));
    }

    if(!domainMap)
        mapDomainFunc(attrInfo);
    
    showDataInfo(attributes,data);
    showTables(attrInfo);
    let betterGainInfo = calculateGains(attrInfo);
    let decisionInfo = getID3Attributes(betterGainInfo,attrInfo[betterGainInfo.i]);

    nodeStructure.text.name = betterGainInfo.type;//root
    nodeStructure.text.title = "mérito  " + betterGainInfo.gain;
    nodeStructure.text.desc = "samples " + data.length;
    let j = 0;

    for(let i of decisionInfo){
        if(i.info === 'next'){
            let newData = prepareNextData(i.attrName,i.mainType,data);
            N = newData.length;
            let newNode = {
                text : {},
                children: []
            };
            newNode.text.name = i.attrName;
            newNode.text.desc = "samples " + attrInfo[betterGainInfo.i][j].nExamples;
            newNode.text.title = 'positive ' + attrInfo[betterGainInfo.i][j].nPositiveExamples;
            newNode.children.push(id3(attributes,newData));
            nodeStructure.children.push(newNode);
        } 
        else{
            nodeStructure.children.push({text: {name : i.attrName,
                desc : "samples " + attrInfo[betterGainInfo.i][j].nExamples, title: 'positive ' + attrInfo[betterGainInfo.i][j].nPositiveExamples},
                children: [{text: {name: i.info}}]});
        }
        j++;
    }
    return nodeStructure;
};


function mapDomainFunc(attrInfo){
    domainMap = new Object();
    let obj = [];
    for(let attr of attrInfo){
        for(let info of attr){
           obj.push(info.attrName);
        }
        domainMap[attr[0].attrType] = obj;
        obj = new Object();
        obj = [];
    }
};

/**
 * 
 * @param {*} attrName 
 * @param {*} mainType 
 * @param {*} data 
 * 
 * Change the global data according to mainType and attrName
 */
function prepareNextData(attrName, mainType, data){
    let newData = [];
    
    for(let i = 0; i < data.length; i++){
        for(let j = 0; j < data[i].length; j++){
            if(data[i][j] === attrName && mainType === j){
                newData.push(data[i]);
            }
        }
    }
    return newData;
};

/**
 * 
 * @param {*} data 
 * @param {*} attr index of attr
 * @param {*} id3Info 
 * This function return an array with the domain of the attr. For example: ['soleado','nublado','lluvioso'] for attr 0
 */
function countAttrDomain(data,attr){
    let types = [];
    for(let t of data){
        if(types.indexOf(t[attr]) === -1){
            types.push(t[attr]);   
        }
    }
    return types;
};

/**
 * 
 * @param {*} attrName 
 * @param {*} attrDomain 
 * @param {*} attributes 
 * @param {*} data 
 * 
 * Count the number of possitive examples for each attrDomain in data.
 */
function countPositiveExamples(attrName,attrDomain,attributes,data){
    //attrName = temperaturaExterior
    //attrDomain ["soleado","nublado","llueve"]
    //data ["soleado","caluroso","alta",...]
    let attrInfo = [];
    let dataOfAttr = {};
    dataOfAttr.attrType = attributes[attrName]; //temperaturaExterior
    dataOfAttr.nExamples = 0;
    dataOfAttr.nPositiveExamples = 0;
    for(let i = 0; i<attrDomain.length; i++){ 
        dataOfAttr.attrName = attrDomain[i];
        for(let line of data){
            if(line[attrName] === attrDomain[i]){
                dataOfAttr.nExamples++;
                if(line[line.length-1] === positiveDecision){
                    dataOfAttr.nPositiveExamples++;
                }
            }
        }
        attrInfo.push(dataOfAttr);
        dataOfAttr = new Object();
        dataOfAttr.attrType = attributes[attrName];
        dataOfAttr.nExamples = 0;
        dataOfAttr.nPositiveExamples = 0;
    }
    return attrInfo;
};

/**
 * @param {*} attrInfo 
 * Calculate the gains for each attrInfo, show the result, and return the better gain info
 */
function calculateGains(attrInfo){

    let gainsInfo = [];
    let auxObj = {};
    let gainValue = 0;
    let r = 0;
    let inforV = 0;

    for(let i = 0; i < attrInfo.length; i++){
        for(let j = 0; j < attrInfo[i].length; j++){
            r = attrInfo[i][j].nExamples/N;
            let p = attrInfo[i][j].nPositiveExamples/attrInfo[i][j].nExamples;
            let n = (attrInfo[i][j].nExamples - attrInfo[i][j].nPositiveExamples) /  attrInfo[i][j].nExamples;
            inforV = infor(p,n);
            if(isNaN(inforV))
                inforV = 0;
            gainValue += (r*inforV);
        }
        gainValue = gainValue.toFixed(3);
        auxObj.i = i;
        auxObj.type = attrInfo[i][0].attrType;
        auxObj.gain = gainValue;
        gainsInfo.push(auxObj); 
        auxObj = new Object();
        gainValue = 0;
    }
    gainsInfo = sortByGain(gainsInfo);
    showGains(attrInfo,gainsInfo);
    return gainsInfo[0];
};

/**
 * @param {*} betterGainInfo 
 * @param {*} attrInfo 
 * For each attrInfo return 'si' or 'no' like final decision of this branch, or next if the id3 algorithm need more steps
 */
function getID3Attributes(betterGainInfo,attrInfo){
    let info = [];
    
    let auxObj = {};
    for(let d of attrInfo){
        let p = d.nPositiveExamples/d.nExamples;
        let n = (d.nExamples - d.nPositiveExamples) / d.nExamples;
        auxObj.mainType = attributeMap[betterGainInfo.type];
        if(p === 1){ // yes
            auxObj.attrName = d.attrName;
            auxObj.info = 'si';
            info.push(auxObj);
        }
        else if (n === 1){
            auxObj.attrName = d.attrName;
            auxObj.info = 'no';
            info.push(auxObj);
        }
        else{
            auxObj.attrName = d.attrName;
            auxObj.info = 'next';
            info.push(auxObj);
        }
        auxObj = new Object();
    }
    return info;
};

/**
 * @param {*} gainsInfo 
 * Sort attributes by gain in ascending order.
 */
function sortByGain(gainsInfo){
    for(let j = 0; j < gainsInfo.length; j++){
        for(let i = 0; i < gainsInfo.length - 1; i++){
            if(gainsInfo[i+1].gain < gainsInfo[i].gain){
                let aux = gainsInfo[i+1];
                gainsInfo[i+1] = gainsInfo[i];
                gainsInfo[i] = aux;
            }
        }
    }
    return gainsInfo;
}

/**
 * 
 * @param {*} p % of possitive examples
 * @param {*} n % of negative examples
 * This function return  -p log2(p)- n log2(n)
 */
function infor(p,n){
    //infor(p,n) = -p log2(p)- n log2(n)
    let log2p = log(2,p);
    let log2n = log(2,n);
    return -p*log2p-n*log2n;
};

/**
 * @param {*} base 
 * @param {*} val 
 * This function calculate the log in base @base and value @val
 */
function log (base,val){
    return Math.log(val) / Math.log(base);
};


//Vista

function createTree(nodeStructure){
    $('#tree-simple').remove();
    let div = $('<div>').attr('id','tree-simple').appendTo('body');  

    var simple_chart_config = {
        chart: {
            container: '#tree-simple',
            connectors: {
                type: 'bCurve',
                style: {
                    'stroke-width' : 2,
                    'stroke': 'green',
                    'arrow-end': 'classic-wide-long'
                }
            },
        },
        nodeStructure: {
            text: nodeStructure.text,
            HTMLclass: nodeStructure.HTMLclass,
            children: nodeStructure.children
        }
    };
    var my_chart = new Treant(simple_chart_config);
}; 

function showGains(attrInfo,gainsInfo){
    //infor(p,n) = p log2(p) n log2(n)
    //am: mérito (am) = E(ri*x infor (pi, ni))
    //ri = ai/N;
    let div = $('<div>').attr('id','gains');
    div.append($('<h3>').text('Méritos '));
    
    let gainInfo = [];

    for(let i = 0; i < attrInfo.length; i++){
        let gain = 'Mérito(' + attrInfo[i][0].attrType + ') ' + ' = ';
        for(let j = 0; j < attrInfo[i].length; j++){
            gain += (attrInfo[i][j].nExamples + '/' + N + ' * infor(' + (attrInfo[i][j].nPositiveExamples + '/' + attrInfo[i][j].nExamples) +',' + (attrInfo[i][j].nExamples - attrInfo[i][j].nPositiveExamples) + '/' + attrInfo[i][j].nExamples) + ')' + ' + ';
        }
        let aux = gain.slice(0,gain.length-2);
        aux += ' = ';
        gainInfo.push(aux);
    }   
 
    let k = 0;
    for(let k = 0; k < gainsInfo.length; k++){
        div.append($('<h4>').text((k+1 )+ 'º ' + gainInfo[gainsInfo[k].i] + gainsInfo[k].gain));
    }

    div.append($('<hr>').addClass('hrStyle'));
    $('.container').append(div);
};

function showTables(attrInfo){
    let div = $('<div>').attr('id','tables');
    for(let i = 0; i < attrInfo.length; i++){
        createTable(attrInfo[i][0].attrType,nFinalDecision,attrInfo[i].length,attrInfo[i],div);
    }
};

function showDataInfo(attributes,data){
    let div = $('<div>');
    div.css('text-align','center');
   
    let table = $('<table>');
    //Header
    let head = $('<thead>');
    let headRow = $('<tr>');
    headRow.appendTo(head);
    head.appendTo(table);
    for(let i = 0; i < attributes.length; i++){
        headRow.append($('<th>').text(attributes[i]));
        headRow.appendTo(table);
    }
    headRow = $('<tr>');
    headRow.prependTo(head);
    headRow.prependTo(table);
    //Tables rows
    for (let i = 0; i < data.length; i++) {
        let row = $('<tr>').appendTo(table);
        for (let j = 0; j < data[i].length; j++) {
            let col = $('<td>');
            col.text(data[i][j]).appendTo(row);
        }
    }
    div.append(table);
    $('.container').append(div);
};

function createTable(title,rows,cols,attrInfo,div){
    let table = $('<table>');
    //Header
    let head = $('<thead>');
    let headRow = $('<tr>');
    headRow.appendTo(head);
    head.appendTo(table);
    for(let i = 0; i < cols; i++){
        headRow.append($('<th>').text(attrInfo[i].attrName + ' = ' + attrInfo[i].nExamples));
        headRow.appendTo(table);
    }
    headRow = $('<tr>');
    headRow.prependTo(head);
    let aux = $('<th>').text(title);
    aux.attr('colspan',cols);
    headRow.append(aux);
    headRow.prependTo(table);
    //Tables rows
    for (let i = 0; i < 1; i++) {
        let row = $('<tr>').appendTo(table);
        for (let j = 0; j < cols; j++) {
            let col = $('<td>');
            col.text('p'+(j+1) + ' = ' + attrInfo[j].nPositiveExamples + '/' + attrInfo[j].nExamples).appendTo(row);
        }
    }
    for (let i = 0; i < 1; i++) {
        let row = $('<tr>').appendTo(table);
        for (let j = 0; j < cols; j++) {
            let col = $('<td>');
            col.text('n' +(j+1)+' = ' + (attrInfo[j].nExamples - attrInfo[j].nPositiveExamples) + '/' + attrInfo[j].nExamples).appendTo(row);
        }
    }
    div.append(table);
    $('.container').append(div);
};

function showDecisionInput(){
    let div = $('<div>').attr('id','decisionInput');

    let div2 =  $('<div>').addClass('form-group row');
    $('<label>').attr('for','attrInput').addClass('col-4 col-form-label').attr('id','meg').text('¿Desea conocer la decisión para unos valores concretos?').appendTo(div2);

    let input = $('<input>').attr('id','attrInput').addClass('col-4 form-control');
    input.attr('placeholder','Inserta valores seguidos por ",": soleado,caluroso,true...');
    input.attr('onkeypress','enter(event)');
    div2.append(input);

    let button = $('<button>').attr('type','submit').addClass('btn btn-primary').text('Calcula');
    button.attr('onClick','callCalculate()');

    let solution = $('<label>').attr('id','searchSolution').addClass('col-3 col-form-label').attr('for','attrInput');
    
    div2.append(button);
    div2.append(solution);
    div.append(div2);
   

    $('.container').append(div);
   
};

function enter(e) {
    if (e.keyCode == 13)
        callCalculate();
}

function callCalculate(){
    let data = $('#attrInput').prop('value').split(',');
    let tree = JSON.parse(JSON.stringify(finalTree));
    calculateDecision(data,tree,0);
    createTree(tree);
};

function calculateDecision(data,tree,i){
    if(tree.children && i <= data.length){
        if(domainMap[tree.text.name].indexOf(data[i]) >= 0){
            tree.HTMLclass = 'solution';
            let index = searchIndexOf(data[i],tree.children);
            tree.children[index].HTMLclass = 'solution';
            let chil = getChilOfTree(data[i],tree);
            //chil.HTMLclass = 'solution';
            calculateDecision(data,chil,i+=1);
        }
        else
            calculateDecision(data,tree,i+=1);
    }
    else{
        tree.HTMLclass = 'solution';
        let sol = tree.text.name;
        if(sol === 'si' || sol === 'no')
            $('#searchSolution').text(sol).css('color','darkgreen');
        else
            $('#searchSolution').text('Wrong input!').css('color','red');
    }
};

function searchIndexOf(attrName,arrayOfChildren){
    let sol = -1;
    let found = false;
    let i = 0;
    while(i < arrayOfChildren.length && !found){
        if(arrayOfChildren[i].text.name === attrName){
            sol = i;
            found = true;
        }
        i++;
    }
    return sol;
};

function getChilOfTree(attr,tree){
    let i = 0;
    let sol = [];
    let found = false;
    while(i < tree.children.length && !found){
        if(tree.children[i].text.name === attr){
            sol = tree.children[i].children[0];
            found = true;
        }
        i++;
    }
    return sol;
};