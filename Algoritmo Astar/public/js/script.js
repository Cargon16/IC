const MAX_START_CELL = 1;
const MAX_GOAL_CELL = 1;

let start_cell_count = 0;
let goal_cell_count = 0;


let rows = 5;
let columns = 5;
let matrix = undefined;

let startNode = undefined
let goalNode = undefined

let caminoEncontrado = false;
let botonDerecho = false;

$(() => {

    //Default Board
    drawBoard(5, 5)

    //Create new Board
    $('#crear').on("click", () => {
        createBoard()
    });
    $(document).on("contextmenu", "td", function (e) {
        if ($(event.target).hasClass('goal_cell')) {
            goal_cell_count -= 1;
            $(event.target).removeClass()
        }
        else if ($(event.target).hasClass('start_cell')) {
            start_cell_count -= 1;
            $(event.target).removeClass()
        }
        else if ($(event.target).hasClass('barrier_cell')) {
            $(event.target).removeClass()
        }
        else if ($(event.target).hasClass('path')) {
            $(event.target).removeClass()
        }
        else if ($(event.target).hasClass('dangerous_cell')) {
            $(event.target).removeClass()
        }
        return false;
    });

    /* SELECT ONE BUTTON TO DRAW IN BOARD*/
    $(document).on("click", "td", () => {
        //logica para pintar celda
        if ($('#source').is(':checked') && start_cell_count < MAX_START_CELL) {
            //If the cell was goal update count
            if ($(event.target).hasClass('goal_cell')) {
                goal_cell_count -= 1;
                $(event.target).removeClass();
            }
            else if ($(event.target).hasClass('path')) {
                $(event.target).removeClass()
            }
            else if ($(event.target).hasClass('dangerous_cell')) {
                $(event.target).removeClass()
            }
            else if ($(event.target).hasClass('barrier_cell')) {
                $(event.target).removeClass()
            }
            $(event.target).addClass("start_cell");
            start_cell_count += 1;
        }
        else if ($('#target').is(':checked') && goal_cell_count < MAX_GOAL_CELL) {
            //If the cell was start update count
            if ($(event.target).hasClass('start_cell')) {
                start_cell_count -= 1;
                $(event.target).removeClass('start_cell')
            }
            else if ($(event.target).hasClass('path')) {
                $(event.target).removeClass()
            }
            else if ($(event.target).hasClass('barrier_cell')) {
                $(event.target).removeClass()
            }
            else if ($(event.target).hasClass('dangerous_cell')) {
                $(event.target).removeClass()
            }
            $(event.target).addClass("goal_cell");
            goal_cell_count += 1;
        }
        else if ($('#inaccesible').is(':checked')) {
            //if the cell was start or goal update count
            if ($(event.target).hasClass('goal_cell')) {
                goal_cell_count -= 1;
                $(event.target).removeClass()
            }
            else if ($(event.target).hasClass('start_cell')) {
                start_cell_count -= 1;
                $(event.target).removeClass()
            }
            else if ($(event.target).hasClass('path')) {
                $(event.target).removeClass()
            }
            else if ($(event.target).hasClass('dangerous_cell')) {
                $(event.target).removeClass()
            }
            $(event.target).addClass("barrier_cell");
        }
        else if ($('#peligrosa').is(':checked')) {
            //if the cell was start or goal update count
            if ($(event.target).hasClass('goal_cell')) {
                goal_cell_count -= 1;
                $(event.target).removeClass()
            }
            else if ($(event.target).hasClass('start_cell')) {
                start_cell_count -= 1;
                $(event.target).removeClass()
            }
            else if ($(event.target).hasClass('path')) {
                $(event.target).removeClass()
            }
            else if ($(event.target).hasClass('barrier_cell')) {
                $(event.target).removeClass()
            }
            $(event.target).addClass("dangerous_cell");
        }

        event.preventDefault();
    })

    /* START BUTTON*/
    $("#empezar").on("click", () => {
        if (!start_cell_count || !goal_cell_count) {
            alert("Debes tener una celda de inicio y final");
        }
        else {
            clearPath();
            boardtoMatrix();
            let path = findTrip();
            if (path.length == 0) alert("No hay solución posible");
            else drawPath(path);
            console.log(path);
        }
    })

})



/**
 * Draw new board given rows and columns
 * @param {*} rows 
 * @param {*} columns 
 */
function drawBoard(rows, columns) {
    $("table").empty();
    //create cells
    for (let i = 0; i < rows; i++) {
        let newRow = $("<tr></tr>")
        for (let j = 0; j < columns; j++) {
            let newCol = $("<td></td>");
            newCol.attr("id", "i" + i + "_" + "j" + j);
            newRow.append(newCol);
        }
        $("table").append(newRow)
    }

    //style in cells
    $('td').css({ "padding": "25px" });
}

/**
 * Creates new board when user press the button
 */
function createBoard() {
    if ($("#filas").val() > 8 || $("#filas").val() < 2 || $("#columnas").val() < 2 || $("#columnas").val() > 8) {
        alert("Las filas columnas deben estar comprendidas entre 2 y 8");
    }
    else {
        drawBoard($("#filas").val(), $("#columnas").val());
        start_cell_count = 0;
        goal_cell_count = 0;
        rows = $("#filas").val();
        columns = $("#columnas").val()
    }
}

/**
 * Save the current board into the matrix
 */
function boardtoMatrix() {
    caminoEncontrado = false;
    matrix = [];
    for (let i = 0; i < rows; i++) {
        matrix[i] = [];
        for (let j = 0; j < columns; j++) {
            //Start
            if ($(`#i${i}_j${j}`).attr('class') == "start_cell") {
                startNode = { i, j, f: 0, g: 0, h: undefined, parent: undefined, dangerous: 0, height: 5, representation: "*" };
                matrix[i][j] = startNode;
            }
            //Goal
            else if ($(`#i${i}_j${j}`).attr('class') == "goal_cell") {
                goalNode = { i, j, f: undefined, g: undefined, h: undefined, parent: undefined, dangerous: 0, height: 5, representation: "#" };
                matrix[i][j] = goalNode;
            }
            //Barrier
            else if ($(`#i${i}_j${j}`).attr('class') == "barrier_cell") matrix[i][j] = { i, j, f: undefined, g: undefined, h: undefined, parent: undefined, dangerous: 0, height: " ", representation: "X" };

            //Dangerous
            else if ($(`#i${i}_j${j}`).attr('class') == "dangerous_cell") matrix[i][j] = { i, j, f: undefined, g: undefined, h: undefined, parent: undefined, dangerous: 1, height: Math.floor(Math.random() * 10) + 1, representation: "^" };

            //Empty
            else
                matrix[i][j] = { i, j, f: undefined, g: undefined, h: undefined, parent: undefined, dangerous: 0, height: Math.floor(Math.random() * 10) + 1, representation: " " };
        }
    }

    startNode.h = h(startNode);
    startNode.f = startNode.h;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            $(`#i${i}_j${j}`).html(`${matrix[i][j].height}`);
        }
    }
}


/********************************************************* */
/****************ALGORITHIM A STAR *********************** */
/********************************************************* */

function findTrip() {
    let openList = [];
    let closeList = [];

    openList.push(startNode);

    //while the open list isn't empty and we don't find the end
    while (openList.length > 0) {
        let nodeSelected = lowestF(openList);
  
        

        if (nodeSelected == goalNode) {
            let ret = [];
            while (nodeSelected.parent) {
                ret.push(nodeSelected);
                nodeSelected = nodeSelected.parent;
            }
            return ret.reverse();
        }
        //put it in the close list
        closeList.push(nodeSelected);
        //remove it from the open list
        openList.splice(openList.indexOf(nodeSelected), 1);
        //expand node

        //search Neighbours
        neighboursList = getNeighbours(nodeSelected);
        neighboursList.forEach(neighbour => {
            //if the neighbour doesn't appear in close, open list and the node is not a barrier or the start
            if (closeList.indexOf(neighbour) == -1 && neighbour.representation != "X") {
                let gScore = ((nodeSelected.i != neighbour.i && nodeSelected.j != neighbour.j) ? Math.sqrt(2) : 1) + nodeSelected.dangerous;
                let gScoreIsBest = false;

                if (openList.indexOf(neighbour) == -1) {
                    gScoreIsBest = true;
                    neighbour.h = h(neighbour);
                    openList.push(neighbour);
                }
                else {
                    let nodeAux = { i: neighbour.i, j: neighbour.j, f: undefined, g: undefined, h: undefined, parent: neighbour.parent, dangerous: neighbour.dangerous, height: neighbour.height, representation: neighbour.representation };
                    nodeAux.g = ((nodeSelected.i != neighbour.i && nodeSelected.j != neighbour.j) ? Math.sqrt(2) : 1) + nodeSelected.dangerous;
                    nodeAux.h = h(neighbour);
                    nodeAux.f = nodeAux.g + nodeAux.h;
                    if (nodeAux.f < neighbour.f) {
                        neighbour = nodeAux;
                        neighbour.parent = nodeSelected;
                    }
                }

                if (gScore < neighbour.g) {
                    gScoreIsBest = true;
                }

                if (gScoreIsBest) {
                    neighbour.parent = nodeSelected;
                    neighbour.g = gScore;
                    neighbour.f = neighbour.g + neighbour.f + neighbour.dangerous;
                }
            }
        })

    }
    return [];
}

function lowestF(list) {
    let lowestIndex = 0;
    for (let i = 0; i < list.length; i++) {
        if (list[i].f < list[lowestIndex].f) lowestIndex = i;
    }
    return list[lowestIndex];
}

/**
 * Returns the heuristic distance between node gicen and the goalNode
 * @param {*} actualNode 
 */
function h(actualNode) {
    let d1 = Math.abs(goalNode.x - actualNode.x);
    let d2 = Math.abs(goalNode.y - actualNode.y);

    return d1 + d2;
}

/**
 * Two nodes are equal if their corrdinates are the same
 * @param {*} a 
 * @param {*} b 
 */
function compareNodes(a, b) {
    return (a.i == b.i && a.j == b.j);
}

/**
 * Get Neighbours given a node
 * @param {*} node 
 */
function getNeighbours(node) {
    let ret = [];
        let x = node.i;
        let y = node.j;

        if (matrix[x - 1] && matrix[x - 1][y]) {
            ret.push(matrix[x - 1][y]);
            if (matrix[x - 1][y + 1]) ret.push(matrix[x - 1][y + 1]);
            if (matrix[x - 1][y - 1]) ret.push(matrix[x - 1][y - 1]);
        }
        if (matrix[x + 1] && matrix[x + 1][y]) {
            ret.push(matrix[x + 1][y]);
            if (matrix[x + 1][y + 1]) ret.push(matrix[x + 1][y + 1]);
            if (matrix[x + 1][y - 1]) ret.push(matrix[x + 1][y - 1]);
        }
        if (matrix[x][y - 1] && matrix[x][y - 1]) {
            ret.push(matrix[x][y - 1]);
        }
        if (matrix[x][y + 1] && matrix[x][y + 1]) {
            ret.push(matrix[x][y + 1]);
        }

        return ret;

}

function drawPath(path) {
    path.forEach(elem => {
        if (!$(`#i${elem.i}_j${elem.j}`).hasClass("start_cell") && !$(`#i${elem.i}_j${elem.j}`).hasClass("goal_cell")) $(`#i${elem.i}_j${elem.j}`).addClass("path");

    })
}

function clearPath() {
    if (matrix != undefined) {
        for (let i = 0; i < rows; i++) {
            matrix[i] = [];
            for (let j = 0; j < columns; j++) {
                if ($(`#i${i}_j${j}`).hasClass('path')) $(`#i${i}_j${j}`).removeClass();
            }
        }
    }
}