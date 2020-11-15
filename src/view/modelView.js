import {values} from 'lodash-bound';
import {modelClasses} from "../model/index.js";
import {ForceEdgeBundling} from "../algorithms/forceEdgeBundling";
import {copyCoords, extractCoords, getPoint, THREE} from "./utils";
import './visualResourceView';
import './shapeView';

const {Group, Link, Coalescence, Component} = modelClasses;

function getWiredChain(chain){
    let start, end;
    if (chain.wiredTo) {
        start = extractCoords(chain.wiredTo.source);
        end   = extractCoords(chain.wiredTo.target);
    } else {
        start = extractCoords(chain.root.anchoredTo? chain.root.anchoredTo: chain.root.layout);
        end   = extractCoords(chain.leaf.anchoredTo? chain.leaf.anchoredTo: chain.leaf.layout);
    }
    if (chain.reversed){
        let tmp = start;
        let start = end;
        let end = tmp;
    }
    return {start, end};
}

function updateChain(chain, curve, start, end){
    if (!chain || !start || !end){ return; }
    chain.length = (curve && curve.getLength)? curve.getLength(): end.distanceTo(start);
    copyCoords(chain.root.layout, start);
    chain.root.fixed = true;
    for (let i = 0; i < chain.levels.length; i++) {
        //Interpolate chain node positions for quicker layout
        chain.levels[i].length = chain.length / chain.levels.length;
        let node = chain.levels[i].target;
        if (node && !node.anchoredTo) {
            let p = getPoint(curve, start, end, (i + 1) / chain.levels.length);
            copyCoords(node.layout, p);
            node.fixed = true;
        }
    }
    copyCoords(chain.leaf.layout, end);
}

/**
 * Create visual objects for group resources
 * @param state
 */
Group.prototype.createViewObjects = function(state){
    (this.scaffolds||[]).forEach(scaffold => {
        scaffold.createViewObjects(state);
        scaffold.viewObjects::values().filter(obj => !!obj).forEach(obj => state.graphScene.add(obj));
    });

    this.visibleNodes.forEach(node => {
        node.createViewObjects(state);
        node.viewObjects::values().filter(obj => !!obj).forEach(obj => state.graphScene.add(obj));
    });

    (this.chains||[]).forEach(chain => {
        if (!chain.root || !chain.leaf){ return; }
        let {start, end} = getWiredChain(chain);
        let curve = chain.wiredTo? chain.wiredTo.getCurve(start, end): null;
        updateChain(chain, curve, start, end);
    });

    this.visibleLinks.forEach(link => {
        link.createViewObjects(state);
        link.viewObjects::values().filter(obj => !!obj).forEach(obj => state.graphScene.add(obj));
        if (link.geometry === Link.LINK_GEOMETRY.INVISIBLE){
            link.viewObjects["main"].material.visible = false;
        }
    });

    this.visibleRegions.forEach(region => {
        region.createViewObjects(state);
        region.viewObjects::values().filter(obj => !!obj).forEach(obj => state.graphScene.add(obj));
    });
};

/**
 * Update visual objects for group resources
 * @param state
 */
Group.prototype.updateViewObjects = function(state){
    //Update scaffolds
    (this.scaffolds||[]).forEach(scaffold => {scaffold.updateViewObjects(state); });

    //Update nodes positions
    this.visibleNodes.forEach(node => node.updateViewObjects(state));

    (this.chains||[]).forEach(chain => {
        if (!chain.root || !chain.leaf){ return; }
        let {start, end} = getWiredChain(chain);
        let curve = chain.wiredTo? chain.wiredTo.getCurve(start, end): null;
        //update if chain ends are dynamic
        if (start && start.hostedBy || end && end.hostedBy) {
            updateChain(chain, curve, start, end);
        }
    });

    //Edge bundling
    const fBundling = ForceEdgeBundling()
        .nodes(this.visibleNodes)
        .edges(this.visibleLinks.filter(e => e.geometry === Link.LINK_GEOMETRY.PATH).map(edge => {
            return {
                source: this.nodes.indexOf(edge.source),
                target: this.nodes.indexOf(edge.target)
            };
        }));
    let res = fBundling();
    (res || []).forEach(path => {
        let lnk = this.links.find(e => e.source.id === path[0].id && e.target.id === path[path.length -1 ].id);
        if (lnk){
            let dz = (path[path.length - 1].z - path[0].z) / path.length;
            for (let i = 1; i < path.length - 1; i++){
                path[i].z = path[0].z + dz * i;
            }
            lnk.path = path.slice(1, path.length - 2).map(p => extractCoords(p));
        }
    });

    this.visibleLinks.forEach(link => { link.updateViewObjects(state); });

    (this.coalescences||[]).forEach(coalescence => {
        if (coalescence.abstract || !coalescence.lyphs) { return }
        let lyph = coalescence.lyphs[0];
        if (!lyph || lyph.isTemplate ) { return; }
        for (let i = 1; i < coalescence.lyphs.length; i++) {
            let lyph2 = coalescence.lyphs[i];
            if (lyph2.isTemplate) { return; }

            let layers2 = lyph2.layers || [lyph2];
            if (coalescence.topology === Coalescence.COALESCENCE_TOPOLOGY.EMBEDDING) {
                //Non-symmetric - first lyph is a "housing lyph"
                //let same = commonTemplate(lyph, layers2[layers2.length - 1]);
                if (layers2.length > 0){
                    layers2[layers2.length - 1].setMaterialVisibility( !state.showCoalescences);// || !same);
                }
            } else {//CONNECTING
                //Non-symmetric - second lyph moves towards the first
                //coalescing lyphs are independent / at the same scale level
                if (state.showCoalescences && lyph.viewObjects["2d"]) {
                    let layers = lyph.layers || [lyph];
                    let overlap = Math.min(layers[layers.length - 1].width, layers2[layers2.length - 1].width);
                    let scale = (lyph.width + lyph2.width - overlap) / (lyph.width || 1);
                    if (lyph.axis && lyph2.axis) {
                        let v1 = lyph.points[3].clone().sub(lyph.points[0]).multiplyScalar(scale);
                        let v2 = lyph.points[2].clone().sub(lyph.points[1]).multiplyScalar(scale);
                        let c1 = extractCoords(lyph.axis.source).clone().add(v1);
                        let c2 = extractCoords(lyph.axis.target).clone().add(v2);
                        copyCoords(lyph2.axis.source, c1);
                        copyCoords(lyph2.axis.target, c2);
                    }
                }
            }
        }
    });

    this.visibleRegions.forEach(region => { region.updateViewObjects(state); });
};


/**
 * Create visual objects for Scaffold resources
 * @param state
 */
Component.prototype.createViewObjects = function(state){
    this.visibleAnchors.forEach(resource => {
        resource.createViewObjects(state);
        resource.viewObjects::values().filter(obj => !!obj).forEach(obj => state.graphScene.add(obj));
    });

    this.visibleWires.forEach(resource => {
        resource.createViewObjects(state);
        resource.viewObjects::values().filter(obj => !!obj).forEach(obj => state.graphScene.add(obj));
    });

    this.visibleRegions.forEach(resource => {
        resource.createViewObjects(state);
        resource.viewObjects::values().filter(obj => !!obj).forEach(obj => state.graphScene.add(obj));
    });
};

/**
 * Update visual objects for group resources
 * @param state
 */
Component.prototype.updateViewObjects = function(state){
    this.visibleAnchors.forEach(resource => { resource.updateViewObjects(state); });
    this.visibleWires.forEach(resource => { resource.updateViewObjects(state); });
    this.visibleRegions.forEach(resource => { resource.updateViewObjects(state); });
};
