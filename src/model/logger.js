import {$Field} from "./utils";

export const $LogMsg = {
    //Info
    CHAIN_SLICE                 : "Sliced housing chain to match the number of lyphs in the housing range",
    CHAIN_NUM_LEVELS            : "Corrected number of levels in the chain",

    GROUP_REF_TO_LYPH           : "Number of replaced references to lyph templates",
    GROUP_REF_TO_MAT            : "Number of replaced references to materials",
    GROUP_TEMPLATE_OTHER        : "Found template defined in another group",

    GRAPH_GEN_AXIS_INTERNAL     : "Generated links for internal lyphs",
    GRAPH_GEN_AXIS_ALL          : "Generated links for lyphs without axes",

    NODE_CLONE_INTERNAL         : "Cloned node to join housed chain ends",

    RESOURCE_NUM                : "Number of resources in the generated model",
    RESOURCE_TO_LAYER           : "Placed resource into layer",
    RESOURCE_JSON_PATH          : "Created relationship via dynamic assignment (JSONPath expression)",

    //Warnings
    AUTO_GEN                    : "Auto-created missing resources",
    AUTO_GEN_EXTERNAL           : "Auto-created missing external resources",

    CHAIN_UNDEFINED             : "Cannot expand undefined chain template",
    CHAIN_SKIPPED               : `Skipped faulty chain template. A correct chain template must have one of the following conditions met:
                                    (1) "${$Field.numLevels}" set to a positive number and non-empty "${$Field.lyphTemplate}",\n
                                    (2) non-empty list of "${$Field.lyphs}" to join to a chain,\n
                                    (3) non-empty list of "${$Field.levels}" which are (partially defined) links to join to a chain,\n 
                                    (4) non-empty list of "${$Field.housingLyphs}",\n 
                                    (5) non-empty "${$Field.housingChain}" reference with optional ${$Field.housingRange} parameter`,
    CHAIN_MAT_DIFF              : "Incorrectly defined chain pattern - innermost layers do not convey the same material",
    CHAIN_CONFLICT              : `Conflicting chain specification: both "${$Field.housingLyphs}" and "${$Field.housingChain}" are given. Proceeding with "${$Field.housingLyphs}"`,
    CHAIN_CONFLICT2             : `Conflicting chain specification: both "${$Field.lyphs}" and "${$Field.levels}" arrays are given. Proceeding with "${$Field.lyphs}"`,
    CHAIN_CONFLICT3             : `Conflicting specification of housing layer: layer's ${$Field.bundlesChains} property disagrees with the chain's ${$Field.housingLayers} property`,
    CHAIN_NO_HOUSING            : `Incorrect chain specification: "${$Field.housingChain}" not found!`,
    CHAIN_NO_HOUSING_LYPH       : "Failed to find chain level housing lyph",
    CHAIN_NO_HOUSING_LAYERS     : "Failed to find all layers of the housing lyph",
    CHAIN_HOUSING_TEMPLATE      : "Housing lyph or its layer is a template",
    CHAIN_NO_COALESCENCE        : "Skipped a coalescence between a housing lyph and a conveying lyph of the chain level it bundles: the conveying lyph is not defined",
    CHANNEL_WRONG_LAYER         : "Second layer of the housing lyph is not a (subtype of) membrane (GO:0016020)",
    CHANNEL_VALIDATION_SKIPPED  : "Skipped validation of channel housing lyph: failed to find membrane lyph or material (GO:0016020)",

    COALESCENCE_NO_AXIS         : "A coalescing lyph is missing an axis",
    COALESCENCE_SELF            : "A lyph coalesces with itself or its layers",
    COALESCENCE_NO_INSTANCE     : "No lyph instances found for abstract coalescence",

    CHANNEL_NO_GROUP            : "Cannot create channel instances: canonical group not found",
    CHANNEL_UNDEFINED           : "Cannot expand undefined channel template",
    CHANNEL_NO_ID               : "Skipped channel template - it must have (non-empty) identifier",
    CHANNEL_NO_HOUSING_LYPH     : "Failed to find channel housing lyph",
    CHANNEL_WRONG_NUM_LAYERS    : "The number of layers in the housing lyph does not match the number of links in its membrane channel",
    CHANNEL_NO_NODE             : "Failed to find channel group node",
    CHANNEL_NO_HOUSING_LAYER    : "Failed to find channel housing lyph layer",

    COMPONENT_SELF              : "The model contains self-references or cyclic component dependencies",

    EXCEL_NO_CLASS_NAME         : "Excel to JSON: class name not found",

    GRAPH_LYPH_NO_AXIS          : "Failed to compute axis length for an internal lyph: axis undefined",
    GROUP_SELF                  : "The model contains self-references or cyclic group dependencies",

    LYPH_INTERNAL_NO_LAYER      : "Failed to locate layer lyph to reposition internal lyphs",
    LYPH_INTERNAL_OUT_RANGE     : "Failed to relocate internal lyph to layer: layer index out of range",

    PROCESS_NOT_ADVECTIVE       : "Incorrect advective process: not all innermost layer materials of the conveying lyph are conveyed by the link",
    PROCESS_NOT_DIFFUSIVE       : "Incorrect diffusive process: materials are not conveyed by the innermost layer of the conveying lyph:",

    REGION_FACETS_REMOVED       : "Removed facets from region definition in group",
    REGION_ANCHORS_REMOVED      : "Removed internal anchors from region definition in group",

    RESOURCE_NUM_ID_TO_STR      : "Converted numeric ID to string",
    RESOURCE_NUM_VAL_TO_STR     : "Converted numeric value of the given resource field to string",
    RESOURCE_NOT_UNIQUE         : "Resource IDs are not unique",
    RESOURCE_NO_CLASS           : "Cannot extract the object class: property specification does not imply a reference",
    RESOURCE_DUPLICATE          : "Duplicate resource definition",
    RESOURCE_CLASS_UNKNOWN      : "Cannot create a relationship: unknown resource class",
    RESOURCE_COLOR_UNKNOWN      : "Unrecognized color scheme",
    RESOURCE_COLOR_NO_OBJECT    : "Cannot assign color to a non-object value",

//Errors
    CHAIN_LYPH_TEMPLATE_MISSING : "Failed to find the lyph template definition in the parent group",
    CHAIN_LEVEL_ERROR           : `A mismatch between link ends found at level`,

    COALESCENCE_NO_LYPH         : "Unable to access lyph for coalescence definition",

    EXCEL_NO_COLUMN_NAME        : "Excel to JSON: no column name",
    EXCEL_INVALID_COLUMN_NAME   : "Excel to JSON: invalid column name",
    EXCEL_PROPERTY_UNKNOWN      : "Excel to JSON: unrecognized property",
    EXCEL_DATA_TYPE_UNKNOWN     : "Excel to JSON: failed to determine data type",
    EXCEL_WRONG_ASSIGN_VALUE    : "Excel to JSON: wrong assign value",

    GROUP_TEMPLATE_NO_CLASS     : "Could not find class definition for the field",

    REF_UNDEFINED               : "Remaining references to undefined resources",

};

const LEVEL = {
    INFO  : "Info",
    WARN  : "Warn",
    ERROR : "Error"
};

const STATUS = {
    OK      : "OK",
    WARNING : "Warning",
    ERROR   : "Error"
};

export class Logger {
    static LEVEL = LEVEL;
    static STATUS = STATUS;

    entries = [];
    levelOptions  = LEVEL;
    statusOptions = STATUS;

    constructor(){}

    info(msg, ...params){
        this.entries.push({"level": this.levelOptions.INFO, msg, params});
    }
    warn(msg, ...params){
        this.entries.push({"level": this.levelOptions.WARN, msg, params});
    }
    error(msg, ...params){
        this.entries.push({"level": this.levelOptions.ERROR, msg, params});
    }

    clear(){
        this.entries = [];
    }

    toConsole(){
        this.entries.forEach(e => {
            console[e.level](e.msg, ...e.params);
        })
    }

    get status(){
        let count = this.entries.filter(msg => msg.level === this.levelOptions.ERROR).length;
        if (count) { return this.statusOptions.ERROR; }
        count = this.entries.filter(msg => msg.level === this.levelOptions.WARN).length;
        if (count) { return this.statusOptions.WARNING; }
        return this.statusOptions.OK;
    }

    print(){
        return this.entries.map(e => ({
            "level"  : e.level,
            "msg"    : e.msg,
            "params" : (e.params||[]).map(param => param && param.toJSON? param.toJSON(): param)
        }));
    }

}

export const logger = new Logger();
