import {
    cloneDeep,
    entries,
    fromPairs,
    isObject,
    isString,
    merge,
    keys,
    isPlainObject,
    flatten, isArray, unionBy, mergeWith
} from "lodash-bound";
import * as colorSchemes from 'd3-scale-chromatic';
import {definitions} from "./graphScheme";

const colors = [...colorSchemes.schemePaired, ...colorSchemes.schemeDark2];

export const $SchemaType = {
    ARRAY  : "array",
    OBJECT : "object",
    STRING : "string",
    NUMBER : "number",
    BOOLEAN: "boolean"
};
export const $SchemaClass = definitions::keys().map(schemaClsName => [schemaClsName, schemaClsName])::fromPairs();
export const $Field = $SchemaClass::keys().map(className => definitions[className].properties::keys().map(property => [property, property]))::flatten()::fromPairs();

export const WIRE_GEOMETRY = definitions[$SchemaClass.Wire].properties[$Field.geometry].enum.map(r => [r.toUpperCase(), r])::fromPairs();
export const LINK_GEOMETRY = definitions[$SchemaClass.Link].properties[$Field.geometry].enum.map(r => [r.toUpperCase(), r])::fromPairs();
export const LINK_STROKE   = definitions[$SchemaClass.Link].properties[$Field.stroke].enum.map(r => [r.toUpperCase(), r])::fromPairs();
export const PROCESS_TYPE  = definitions[$SchemaClass.ProcessTypeScheme].enum.map(r => [r.toUpperCase(), r])::fromPairs();

export const LYPH_TOPOLOGY  = definitions[$SchemaClass.Lyph].properties[$Field.topology].enum.map(r => [r.toUpperCase(), r])::fromPairs();
export const COALESCENCE_TOPOLOGY = definitions[$SchemaClass.Coalescence].properties[$Field.topology].enum.map(r => [r.toUpperCase(), r])::fromPairs();

export const $Color = {
    Wire   : "#000",
    Link   : "#000",
    Node   : "#000",
    Anchor : "#fff",
    Region : "#c0c0c0",
    InternalNode : "#ccc",
    InternalLink : "#ccc"
};

export const $Prefix = {
    node    : "node",   //generated node
    source  : "s",      //source node
    target  : "t",      //target node
    link    : "lnk",    //generated link (edge)
    lyph    : "lyph",   //generated lyph
    group   : "group",  //generated group
    instance: "inst",   //instance
    chain   : "chain",  //chain
    tree    : "tree",   //tree
    channel : "ch",     //channel
    coalescence: "cls", //coalescence instance
    border  : "b",      //lyph border
    villus  : "vls",    //villus template
    layer   : "layer",  //generated lyph layer
    template: "ref",    //from lyph template
    material: "mat",    //from material reference
    clone   : "clone",  //node clone
    join    : "join",   //joint node
    anchor  : "p",      //anchor point
    wire    : "wire"    //wire
};

export const getNewID = entitiesByID => "new-" +
    (entitiesByID? entitiesByID::keys().length : Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5));

export const getGenID = (...args) => args.join("_");

export const getGenName = (...args) => args.join(" ");

/**
 * Get resource ID
 * @param e - resource or its identifier
 * @returns {*} resource identifier
 */
export const getID  = (e) => e::isObject()? e.id : e;

/**
 * Compares resources
 * @param e1 - identifier or a reference of the first resource
 * @param e2 - identifier or a reference of the second resource
 * @returns {boolean} true if resource identifier match, false otherwise
 */
export const compareResources  = (e1, e2) => getID(e1) === getID(e2);

/**
 * Merge resource definitions
 * @param a - first resource or resource list
 * @param b - second resource or resource list
 * @returns {Resource} merged resource or a union of resource lists where resources with the same id have been merged
 */
export function mergeResources(a, b) {
    if (a::isArray()){
        if (b::isArray()) {
            let ab = a.map(x => x::merge(b.find(y => y[$Field.id] === x[$Field.id])));
            return ab::unionBy(b, $Field.id);
        } else {
            return a.push(b);
        }
    } else {
        if (a::isObject()){
            return b::isObject()? a::mergeWith(b, mergeResources): a;
        } else {
            return a;
        }
    }
}

/**
 * Add color to the visual resources in the list that do not have color assigned yet
 * @param resources - list of resources
 * @param defaultColor - optional default color
 */
export const addColor = (resources, defaultColor) => (resources||[]).filter(e => e::isObject() && !e.color)
    .forEach((e, i) => { e.color = e.supertype && e.supertype.color
        ? e.supertype.color
        : (e.cloneOf && e.cloneOf.color)
            ? e.cloneOf.color
            :(defaultColor || colors[i % colors.length]) });

/**
 * Extracts class name from the schema definition
 * @param spec - schema definition
 */
export const getClassName = (spec) => {
    let ref = null;
    if (spec::isString()) {
        ref = spec;
    } else {
        let refs = getClassRefs(spec);
        ref = refs && refs[0];
    }
    if (ref){
        let clsName = ref.substr(ref.lastIndexOf("/") + 1).trim();
        if (!definitions[clsName]) { return null; }
        return clsName;
    }
};

export const getSchemaClass = (spec) => definitions[getClassName(spec)];

/**
 * Places a given node on a given border
 * @param border
 * @param node
 */
export const addBorderNode = (border, node) => {
    border.hostedNodes = border.hostedNodes || [];
    border.hostedNodes.push(node);
};

/**
 * Find or create node with given identifier
 * @param nodes - node array
 * @param nodeID - node identifier
 */
export function getOrCreateNode(nodes, nodeID){
    let node  = (nodes||[]).find(e => e.id === nodeID);
    if (!node){
        node = {
            [$Field.id]: nodeID,
            [$Field.skipLabel]: true,
            [$Field.generated]: true
        };
        if (!nodes){ nodes = []; }
        nodes.push(node);
    }
    return node;
}

/**
 * Finds a resource object in the parent group given an object or an ID
 * @param eArray
 * @param e
 * @returns {*|void}
 */
export const findResourceByID = (eArray, e) => e::isPlainObject()? e: (eArray||[]).find(x => !!e && x.id === e);

/**
 * Returns a list of references in the schema type specification
 * @param spec - schema definition
 * @returns {*} - list of references
 */
const getClassRefs = (spec) => {
    if (!spec){ return null; }
    if (spec.$ref) { return [spec.$ref]; }
    if (spec.items) { return getClassRefs(spec.items); }
    let expr = spec.oneOf || spec.anyOf || spec.allOf;
    if (expr){
        return expr.filter(e => e.$ref && !e.$ref.endsWith("Scheme")).map(e => e.$ref);
    }
};

/**
 * Indicates whether schema class definition is abstract
 * @type {boolean} Returns true if the class is abstract
 */
export const isClassAbstract = (clsName) => definitions[clsName].abstract;

/**
 * Add a given resource to a given group and a parent group if it does not exist
 * @param group - a group to add resources to
 * @param parentGroup - parent group
 * @param resource - resource
 * @param prop - property in the group
 */
export const mergeGenResource = (group, parentGroup, resource, prop) => {
    if (!resource) { return; }
    if (group){
        group[prop] = group[prop] || [];
        if (resource::isObject()){
            if (resource.id){
                if (!group[prop].find(x => x === resource.id || x.id === resource.id)){
                    group[prop].push(resource.id);
                }
            }
        } else {
            if (!group[prop].includes(resource)){ group[prop].push(resource); }
        }
    }
    if (parentGroup && resource.id){
        parentGroup[prop] = parentGroup[prop] || [];
        if (!parentGroup[prop].find(x => x === resource.id || x.id === resource.id)){ parentGroup[prop].push(resource); }
    }
};

/**
 * @param group - a group to add resources to
 * @param parentGroup - parent group
 * @param level - an array with a link, target node, and conveyed lyph
 */
export const mergeGenResources = (group, parentGroup, level) => {
    let [lnk, trg, lyph] = level;
    mergeGenResource(group, parentGroup, lnk, $Field.links);
    mergeGenResource(group, parentGroup, trg, $Field.nodes);
    mergeGenResource(group, parentGroup, lyph, $Field.lyphs);
};

/**
 * Determines if at least one of the given schema references extend a certain class
 * @param {Array<string>} refs  - schema references
 * @param {string} value        - class name
 * @returns {boolean}           - returns true if at least one reference extends the given class
 */
const extendsClass = (refs, value) => {
    if (!refs) { return false; }
    let res = false;
    (refs||[]).forEach(ref => {
        let clsName = getClassName(ref);
        if (clsName) {
            if (clsName === value) {
                res = true;
            } else {
                let def = definitions[clsName];
                res = res || def && extendsClass(getClassRefs(def), value);
            }
        }
    });
    return res;
};

/**
 * Returns recognized class properties from the specification with default values
 * @param {string} className
 */
const getFieldDefaultValues = (className) => {
    const getDefault = (specObj) => specObj.type ?
        specObj.type === $SchemaType.STRING ? "" : specObj.type === $SchemaType.BOOLEAN ? false : specObj.type === $SchemaType.NUMBER ? 0 : null
        : null;
    const initValue = (specObj) => {
        return specObj.default?
            (specObj.default::isObject()
                ? specObj.default::cloneDeep()
                : specObj.default )
            : getDefault(specObj);
    };

    return definitions[className].properties::entries().map(([key, value]) => ({[key]: initValue(value)}));
};

/**
 * Recursively applies a given operation to the classes in schema definitions
 * @param {string} className - initial class
 * @param {function} handler - function to apply to the current class
 */
const recurseSchema = (className, handler) => {
    let stack = [className];
    let i = 0;
    while (stack[i]){
        let clsName = stack[i];
        if (definitions[clsName]){
            let refs = getClassRefs(definitions[clsName]);
            (refs||[]).forEach(ref => {
                stack.push(ref.substr(ref.lastIndexOf("/") + 1).trim());
            })
        }
        i++;
    }
    while (stack.length > 0){
        let clsName = stack.pop();
        handler(clsName);
    }
};

/**
 * A class that provides helper properties for schema-based resource classes
 */
export class SchemaClass {
    schemaClsName;
    defaultValues = {};
    fields = [];
    relClassNames = {};

    constructor(schemaClsName) {
        this.schemaClsName = schemaClsName;
        if (!definitions[schemaClsName]) {
            throw new Error("Failed to find schema definition for class: " + schemaClsName);
        } else {
            this.schema = definitions[this.schemaClsName];

            let res = {};
            recurseSchema(this.schemaClsName, (currName) => res::merge(...getFieldDefaultValues(currName)));
            this.defaultValues = res;

            let res2 = {};
            recurseSchema(this.schemaClsName, (currName) => res2::merge(definitions[currName].properties));
            this.fields = res2::entries();

            this.relationships = this.fields.filter(([key, spec]) => extendsClass(getClassRefs(spec), $SchemaClass.Resource));
            this.properties = this.fields.filter(([key,]) => !this.relationships.find(([key2,]) => key2 === key));
            this.fieldMap = this.fields::fromPairs();
            this.propertyMap = this.properties::fromPairs();
            this.relationshipMap = this.relationships::fromPairs();
            this.fieldNames = this.fields.map(([key,]) => key);
            this.propertyNames = this.properties.map(([key,]) => key);
            this.relationshipNames = this.relationships.map(([key,]) => key);
            this.relClassNames = this.relationships.map(([key, spec]) => [key, getClassName(spec)])::fromPairs();

            this.cudFields = this.fields.filter(([key, spec]) => !spec.readOnly);
            this.cudProperties = this.properties.filter(([key, spec]) => !spec.readOnly);
            this.cudRelationships = this.relationships.filter(([key, spec]) => !spec.readOnly);
        }
    }

    /**
     * Check whether the resource extends a given class
     * @param clsName - class name
     * @returns {boolean}
     */
    extendsClass(clsName) {
        return (clsName === this.schemaClsName) || extendsClass(getClassRefs(this.schema), clsName);
    }

    /**
     * Get relationships that point to resources with given class names
     * @param clsNames - resource class names
     * @returns {any[]}
     */
    filteredRelNames(clsNames){
        return (this.relationships||[]).filter(([key, spec]) => !clsNames.includes(getClassName(spec))).map(([key, ]) => key);
    }

    /**
     * Get relationship names that point to resources of a given class
     * @param clsName - resource class name
     * @returns {any[]}
     */
    selectedRelNames(clsName){
        return (this.relClassNames::entries()||[]).filter(([key, cls]) => cls === clsName).map(([key, ]) => key);
    }
}

/**
 * Definition of all schema-based resource classes
 */
export const schemaClassModels = definitions::keys().map(schemaClsName => [schemaClsName, new SchemaClass(schemaClsName)])::fromPairs();

