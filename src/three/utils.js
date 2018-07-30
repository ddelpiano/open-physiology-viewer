import * as three from 'three';
const THREE = window.THREE || three;

const ThreeBSP = require('three-js-csg')(THREE);
/**
 * Draw THREE.js cubic Bezier curve resembling the semicircle
 * @param startV - start point
 * @param endV   - end point
 * @returns {CubicBezierCurve3|*}
 */
export function bezierSemicircle(startV, endV){
    let edgeV   = endV.clone().sub(startV);
    let pEdgeV  = edgeV.clone().applyAxisAngle( new THREE.Vector3( 0, 0, 1 ), Math.PI / 2);
    pEdgeV.z = 0;
    let insetV  = edgeV.multiplyScalar(0.05);
    let offsetV = pEdgeV.multiplyScalar(2/3);

    return new THREE.CubicBezierCurve3(
        startV.clone(),
        startV.clone().add(insetV).add(offsetV),
        endV.clone().sub(insetV).add(offsetV),
        endV.clone());
}

/**
 * Copy coordinates from source object to target
 * @param target
 * @param source
 */
export function copyCoords(target, source){
    if (!target) { return; }
    if (!source) { return; }
    target.x = source.x || 0;
    target.y = source.y || 0;

    // target.z = source.z || 0;
    target.z = 0;
    source.z = 0;

}

/**
 * Create a vector from an object that contains coordinate fields (x,y,z)
 * @param source
 * @returns {THREE.Vector3}
 */
export function extractCoords(source){
    if (!source) { return; }
    return new THREE.Vector3(source.x || 0, source.y || 0, source.z || 0);
}

/**
 * Computes difference between two geometries
 * @param smallGeom - inner geometry
 * @param largeGeom - outer geometry
 * @param material  - geometry material
 */
export function geometryDifference(smallGeom, largeGeom, material){
    let smallBSP = new ThreeBSP(smallGeom);
    let largeBSP = new ThreeBSP(largeGeom);
    let intersectionBSP = largeBSP.subtract(smallBSP);
    return intersectionBSP.toMesh( material );
}

/**
 * Helper function to produce a merged layer geometry given a tube shape and two cups representing open or closed borders
 * @param tube       - core layer tube
 * @param cupTop     - top border
 * @param cupBottom  - bottom border
 * @param offset     - distance to shift cups wrt the tube center
 * @returns {Geometry|SEA3D.Geometry|*|THREE.Geometry}
 */
export function mergedGeometry(tube, cupTop, cupBottom, offset){
    let singleGeometry = new THREE.Geometry();
    let tubeMesh       = new THREE.Mesh(tube);
    let cupTopMesh     = new THREE.Mesh(cupTop);
    let cupBottomMesh  = new THREE.Mesh(cupBottom);
    cupTopMesh.translateY(offset);
    cupBottomMesh.translateY(-offset);
    cupTopMesh.updateMatrix();
    cupBottomMesh.updateMatrix();
    singleGeometry.merge(tubeMesh.geometry, tubeMesh.matrix);
    singleGeometry.merge(cupTopMesh.geometry, cupTopMesh.matrix);
    singleGeometry.merge(cupBottomMesh.geometry, cupBottomMesh.matrix);
    return singleGeometry;
}

export function align(axis, obj){
    if (!obj || !axis) { return; }
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.direction);
}

export function direction({source, target}){
    if (!source || !target) {
        return null;
    }
    return (new THREE.Vector3(
        target.x - source.x,
        target.y - source.y,
        target.z - source.z
    )).normalize();
}

export function getCenterPoint(mesh) {
    if (!mesh.geometry){ return null; }
    if (!mesh.geometry.boundingBox) {
        mesh.geometry.computeBoundingBox();
    }
    let center = new THREE.Vector3();
    mesh.geometry.boundingBox.getCenter(center);
    mesh.localToWorld(center);
    return center;
}
