// ---------------------------------------------------------------------------------------------------------------------
// Project CONSTANTS
// ---------------------------------------------------------------------------------------------------------------------

// DEMO ----------------------------------------------------------------------------------------------------------------
let demo = {
    PROJECT: 'lapsocarte',

    /* server/LapsocarteServerController/DatabaseController.js */
    COLUMN_GID: 'gid',
    TABLE_GEOM: 'barrios_catastrales_wgs84',
    COLUMN_GEOM: 'geom',
    TABLE_DATA: 'population',
    COLUMN_NAME: 'nomb_barr',
    COLUMN_DATA: 'population',
    COLUMN_TIME: 't',
    TIME_RANGE: [1,2,3,4,5,6,7,8,9,10],

    /* app/LapsocarteAppController/GUIController/LeafletController.js */
    MAP_CENTER: [4.66198, -74.09866],
    MAP_ZOOM: 11,
    MAP_ZOOM_RANGE: [10, 16],
    LAYER_PROVIDER: 'Esri.WorldGrayCanvas',

    /* app/LapsocarteAppController/GUIController/LeafletController.js */
    DEFAULT_STYLE: {color: 'blue', weight: 1.2},
    FOCUSED_COLOR: '#0000FF',
    /* app/LapsocarteAppController/GUIController/GUIController.js */
    FUNC_DATA2COLOR: function (d) {
        // To get the color of each COLUMN_GEOM in function of COLUMN_WHAT
        return  d > 8000 ? '#800026' :
                d > 7000 ? '#BD0026' :
                d > 6000 ? '#E31A1C' :
                d > 5000 ? '#FC4E2A' :
                d > 4000 ? '#FD8D3C' :
                d > 3000 ? '#FEB24C' :
                d > 2000 ? '#FED976' : '#FFEDA0';
    }
};
demo.DB_USER = demo.PROJECT;
demo.DB_PASS = demo.PROJECT;
demo.DB_NAME = demo.PROJECT;

// Project TOMSA -------------------------------------------------------------------------------------------------------
let tomsa = {
    PROJECT: 'tomsa',

    COLUMN_GID: 'gid',
    TABLE_GEOM: 'manzanas',
    COLUMN_GEOM: 'geom',
    TABLE_DATA: 'schelling',
    COLUMN_NAME: 'gid',
    COLUMN_DATA: 'currentpop',
    COLUMN_TIME: 't',
    TIME_RANGE: range(0,30),
    //TIME_RANGE: [0],

    MAP_CENTER: [4.66198, -74.09866],
    MAP_ZOOM: 11,
    MAP_ZOOM_RANGE: [10, 16],
    LAYER_PROVIDER: 'Esri.WorldGrayCanvas',

    DEFAULT_STYLE: {color: 'blue', weight: 1.2},
    FOCUSED_COLOR: 'green',
    FUNC_DATA2COLOR: function (d) {
        return  d == 0 ? 'gray'  :
                d == 1 ? 'red'   :
                d == 2 ? 'blue'  :
                d == 3 ? 'yellow': 'black';
    }
};
tomsa.DB_USER = tomsa.PROJECT;
tomsa.DB_PASS = tomsa.PROJECT;
tomsa.DB_NAME = tomsa.PROJECT;

// Project MARS --------------------------------------------------------------------------------------------------------
let mars = {
    PROJECT: 'mars',

    TABLE_DATA: 'mars',

    COLUMN_HOW: 'type',
    COLUMN_WHAT: 'name',
    COLUMN_WHEN: 't',
    COLUMN_WHERE: 'gid',
    COLUMN_DATA: 'data',

    TABLE_GEOM: 'shape',
    COLUMN_GEOM: 'geom',

    TIME_RANGE: range(0,30,2),

    MAP_CENTER: [4.66198, -74.09866],
    MAP_ZOOM: 11,
    MAP_ZOOM_RANGE: [10, 16],
    LAYER_PROVIDER: 'Esri.WorldGrayCanvas',

    DEFAULT_STYLE: {color: 'blue', weight: 1.2},
    FOCUSED_COLOR: 'green',
    FUNC_DATA2COLOR: choropleth
};
mars.DB_USER = mars.PROJECT;
mars.DB_PASS = mars.PROJECT;
mars.DB_NAME = mars.PROJECT;

export const PROJECT = mars;

// ---------------------------------------------------------------------------------------------------------------------
// Generic FUNC_DATA2COLOR functions
// ---------------------------------------------------------------------------------------------------------------------
// ToDo review this choropleth implementation
function choropleth(d) {
    const CHOROPLETH_RANGE = 'CHOROPLETH_RANGE';
    let colors = ['#FFEDA0','#FED976','#FEB24C','#FD8D3C','#FC4E2A','#E31A1C','#BD0026','#800026'];

    let DC = DATA_CONSTANTS,
        instance = this[DC.LPC_INSTANCE_KEY],
        range = instance[CHOROPLETH_RANGE];

    if (range == undefined) {
        range = [];

        let how = instance[DC.LPC_INSTANCE_STATE.CURRENT_HOW],
            what = instance[DC.LPC_INSTANCE_STATE.CURRENT_WHAT],
            stats = this[DC.DESCRIPTIVE_STATS].get(how).get(what);

        console.log(how+' '+what)
        console.dir(stats)

        let max = stats.get(DC.DS_MAX);
        let min = stats.get(DC.DS_MIN);

        let step = (max - min) / colors.length;
        for (let i = min + step; i <= max; i += step)
            range.push(i);

        instance[CHOROPLETH_RANGE] = range;
        console.dir(range);
    }

    for (let i = 0; i < colors.length; i++)
        if (d <= range[i]) return colors[i];

    // I should never reach this!!
    return 'black';
}

// ---------------------------------------------------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------------------------------------------------
function range(begin, end, step = 1) {
    let result = [];
    for (let i = begin; i <= end; i+= step)
        result.push(i)

    return result;
}

// ---------------------------------------------------------------------------------------------------------------------
// Server-Client socket CONSTANTS (sck)
// ---------------------------------------------------------------------------------------------------------------------
export const INIT = 'init';
export const GIVE_DATA = 'give_data';
export const GIVE_GEOM = 'give_geom';
export const GIVE_STATS = 'give_stats';

// ---------------------------------------------------------------------------------------------------------------------
// Objects Name Constants
// ---------------------------------------------------------------------------------------------------------------------
export const DATA_CONSTANTS = {
    /*
     Geometries map:
     |-> key: COLUMN_WHERE
     |-> Element: geoJSON
     */
    WHEREs_MAP:   'lpc_WHEREs_MAP',

    /*
     4 dimensions map:
     |-> First  key -> HOW
     |-> Second key -> WHAT  -> data set
     |-> Third  key -> WHEN  -> t
     |-> Fourth key -> WHERE -> gid.
     |-> Element    -> The actual data...
     */
    DATA_MAP: 'lpc_DATA_MAP',

    /*
     Multidimensional map with cumulative data descriptive statistics:
     EXAMPLE:
     To get the DATA_VECTOR at WHAT level:
        descStats.get(givenHow).get(givenWhat).get(DS_DATA_VECTOR)
     To get the DATA_VECTOR but at WHEN level:
        descStats.get(givenHow).get(givenWhat).get(givenWhen).get(DS_DATA_VECTOR)

     Note that given the hierarchically DATA_MAP implementation:
        - There are not descriptive stats at WHERE level.
        - Descriptive statistics at HOW level are available but in general doesn't make
        statistical sense (they are comparing apples and oranges).
     */
    DESCRIPTIVE_STATS: 'lpc_DESCRIPTIVE_STATS',
    DS_MIN: 'lpc_MIN',
    DS_MAX: 'lpc_MAX',
    DS_MEAN: 'lpc_AVERAGE',
    DS_KEYS_VECTOR: 'lpc_KEYS_VECTOR',
    DS_DATA_VECTOR: 'lpc_DATA_VECTOR',

    /*
     Key to locate the INSTANCE in the PROJECT object
     */
    LPC_INSTANCE_KEY: 'lpc_INSTANCE_KEY',
    /*
     Keys to locate the objects inside the INSTANCE object
     */
    LPC_INSTANCE_STATE: {
        INSTANCE: 'lpc_INSTANCE',

        CURRENT_HOW: 'lpc_CURRENT_HOW',
        CURRENT_WHAT: 'lpc_CURRENT_WHAT',
        CURRENT_WHEN: 'lpc_CURRENT_WHEN',

        DATA_MAP: 'lpc_DATA_MAP',
        WHAT_STATS: 'lpc_WHAT_STATS',
        WHEN_STATS: 'lpc_WHEN_STATS',

        LEAFLET_MAP: 'lpc_LEAFLET_MAP'             // Leaflet MAP object
    }
};