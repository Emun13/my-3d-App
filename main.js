import { Scene3D, Project } from 'enable3d';
import { PhysicsLoader } from '@enable3d/ammo-physics';
// import { THREE } from 'enable3d';
import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'



export class PhysicsTest extends Scene3D {

  async preload() {
    await this.load.preload('platform', 'platform.jpg')
    // await this.load.preload('robot', '/assets/glb/robot.glb')
  }

  async init() {
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(window.innerWidth, window.innerHeight); 
    // document.body.appendChild(this.renderer.domElement);
  }

  async create() {
    const resize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight

      this.renderer.setSize(newWidth, newHeight)
      this.camera.aspect = newWidth / newHeight
      this.camera.updateProjectionMatrix()
    }

    window.onresize = resize
    resize()

    // delete selected default 
    await this.warpSpeed('-sky', '-ground', '-orbitControls');

    // loading secret texture to map across moon surface
    const platform = await this.load.texture('platform');
    this.physics.add.ground({ 
        width: 20, 
        height: 20, 
        y: -1}, 
      { 
        phong: { 
          map: platform 
        } 
      }
    );


    this.camera.position.set(0,10,18);

    // UNCOMMENT This line to see secret surface
    // this.physics.debug?.enable();

    // adding Moon Surface 
    const moonLoader = new THREE.TextureLoader();
    const moonTexture = moonLoader.load('moonTexture.jpg');
    const moonHeight = moonLoader.load('moonTexture.jpg');
    const alpha = moonLoader.load('alpha.jpg');

    const moonPlain = new THREE.PlaneBufferGeometry(22, 22, 64, 64);
    const moonMaterial = new THREE.MeshPhongMaterial({
      color: 0x909090,
      map: moonTexture,
      displacementMap: moonHeight,
      displacementScale: .7,
      // alphaMap: alpha,
      // transparent: true
    });
    const moonMesh = new THREE.Mesh(moonPlain, moonMaterial);
    moonMesh.castShadow = true;
    moonMesh.receiveShadow = true;
    this.scene.add(moonMesh);

    moonMesh.rotation.x = -1.57;
    moonMesh.position.z = 0;
    moonMesh.position.y = 0;

    // objects to drag
    // used with dragControls
    var dragObjList = [];
    // all objects
    // key = name, value = mesh
    var allObjs = {};
    // add orbit controls
    const orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

    // secret geometry and mesh
    const planeGeometry = new THREE.
      PlaneGeometry(22, 22, 45, 40);

    const planeMaterial = new THREE.
      MeshPhongMaterial({
        color: 0xFF0000, 
        opacity: 0,
        transparent: true,
        side: THREE.DoubleSide,
        flatShading: THREE.FlatShading // turning on flat shading 
      });

    const planeMesh = new THREE.
      Mesh(planeGeometry, planeMaterial);
    // destructure object to add randomized hills (points)
    const {array} = planeMesh.geometry.attributes.position; // object destructuring 
    for (let i = 0; i < array.length; i += 3) { // += 3 to loop through every three values --> x y z
      const x = array[i];
      const y = array[i+1];
      const z = array[i+2];

      // array[i] = x + 3;
      array[i+2] = z + Math.random();
    }

    // fit secret mesh over platform and moon texture
    planeMesh.rotation.x = -1.57;
    planeMesh.position.z = 0;
    planeMesh.position.y = 0;
    this.physics.add.existing(planeMesh, {shape: 'convex'});
    this.scene.add(planeMesh);

    // add listener to create shape submit button
    var selectedShapeElem = document.getElementById("selectShape");
    var submitted = document.getElementById("submit");
    submitted.addEventListener("click", () => {
      var selectedShapeText = selectedShapeElem.options[selectShape.selectedIndex].text;
      // the shape slected by user
      console.log(selectedShapeText);

      // CAPSULE
      if (selectedShapeText == "Capsule") {
        // get form values
        let capsuleForm = processCapsuleForm();
        // check for empty values
        for (var key in capsuleForm) {
          if ((typeof(capsuleForm[key]) == "string" && capsuleForm[key] === "") 
            || (typeof(capsuleForm[key]) != "string" && isNaN(capsuleForm[key]))) {
            console.log("QUITTING")
            return;
          }
        }
        // check for unique name
        if (isUniqueKey(capsuleForm)){
          return;
        }
        // custom geometry 
        let capsuleGeometry = new THREE.CapsuleGeometry(
          capsuleForm.radius, 
          capsuleForm.objLength, 
          capsuleForm.capSegments, 
          capsuleForm.sideFaces
        );
        // custom material
        const capsuleMaterial = new THREE.
          MeshPhongMaterial({
            color: capsuleForm.color, 
            opacity: 1,
            flatShading: THREE.FlatShading, // turning on flat shading 
            side: THREE.DoubleSide
          });
        let capsuleObj = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
        // add shadows
        capsuleObj.castShadow = true;
        capsuleObj.receiveShadow = true;
        capsuleObj.position.set(0,5,0);

        // add new object to dropdown list for actions
        actionsObjs(capsuleForm.name);
        allObjs[capsuleForm.name] = capsuleObj;
        this.scene.add(capsuleObj);
        // add as a draggable object
        dragObjList.push(capsuleObj);
      } 
      // CONE
      else if (selectedShapeText == "Cone") {
        // get form values
        let coneForm = processConeForm();
        // check for empty values
        for (var key in coneForm) {
          if ((typeof(coneForm[key]) == "string" && coneForm[key] === "") 
            || (typeof(coneForm[key]) != "string" && isNaN(coneForm[key]))) {
            console.log("QUITTING")
            return;
          }
        }
        // check for unique name
        if (isUniqueKey(coneForm)){
          return;
        }
        // fully fill shape if user's input = 6
        let newFill;
        if (coneForm.fill == 6) {
          newFill = 2 * Math.PI;
        } else {
          newFill = coneForm.fill;
        }
        // custom geometry
        let coneGeometry = new THREE.ConeGeometry(
          coneForm.radius, 
          coneForm.height, 
          coneForm.circumferenceFaces, 
          1,
          coneForm.hollow,
          0,
          newFill
        );
        // custome material
        const coneMaterial = new THREE. 
          MeshPhongMaterial({
            color: coneForm.color, 
            opacity: 1,
            flatShading: THREE.FlatShading, // turning on flat shading 
            side: THREE.DoubleSide
          });
        let coneObj = new THREE.Mesh(coneGeometry, coneMaterial);
        // add shadows
        coneObj.castShadow = true;
        coneObj.receiveShadow = true;
        coneObj.position.set(0,5,0);

        // add new object to dropdown list for actions
        actionsObjs(coneForm.name);
        // add key and value to all objects
        allObjs[coneForm.name] = coneObj;
        this.scene.add(coneObj);
        // add as a draggable object
        dragObjList.push(coneObj);
      }
      // CUBE
      else if (selectedShapeText == "Cube") {
        // get form values
        let cubeForm = processCubeForm();
        // check for empty values
        for (var key in cubeForm) {
          if ((typeof(cubeForm[key]) == "string" && cubeForm[key] === "") 
            || (typeof(cubeForm[key]) != "string" && isNaN(cubeForm[key]))) {
            console.log("QUITTING")
            return;
          }
        }
        // check for unique name
        if (isUniqueKey(cubeForm)){
          return;
        }
        // custom geometry
        let cubeGeometry = new THREE.BoxGeometry(
          cubeForm.width, 
          cubeForm.height, 
          cubeForm.depth
        );
        // custom material
        const cubeMaterial = new THREE. 
          MeshPhongMaterial({
            color: cubeForm.color, 
            opacity: 1,
            flatShading: THREE.FlatShading, // turning on flat shading 
            side: THREE.DoubleSide
          });
        let cubeObj = new THREE.Mesh(cubeGeometry, cubeMaterial);
        // add shadows
        cubeObj.castShadow = true;
        cubeObj.receiveShadow = true;
        cubeObj.position.set(0,5,0);

        // add new object to dropdown list for actions
        actionsObjs(cubeForm.name);
        // add key and value to all objects
        allObjs[cubeForm.name] = cubeObj;
        this.scene.add(cubeObj);
        // make draggable object
        dragObjList.push(cubeObj);
      }
      // CYLINDER
      else if (selectedShapeText == "Cylinder") {
        // get form values
        let cylinderForm = processCylinderForm();
        // check for empty values
        for (var key in cylinderForm) {
          if ((typeof(cylinderForm[key]) == "string" && cylinderForm[key] === "") 
            || (typeof(cylinderForm[key]) != "string" && isNaN(cylinderForm[key]))) {
            console.log("QUITTING")
            return;
          }
        }
        // check for unique name
        if (isUniqueKey(cylinderForm)){
          return;
        }
        // fully fill shape if user's input = 6
        let newFill;
        if (cylinderForm.fill == 6) {
          newFill = 2 * Math.PI;
        } else {
          newFill = cylinderForm.fill;
        }
        // custom geometry
        let cylinderGeometry = new THREE.CylinderGeometry(
          cylinderForm.radiusTop,
          cylinderForm.radiusBottom,
          cylinderForm.height,
          cylinderForm.circumferenceFaces,
          1,
          cylinderForm.hollow,
          0,
          newFill
        );
        // custom material
        const cylinderMaterial = new THREE. 
          MeshPhongMaterial({
            color: cylinderForm.color, 
            opacity: 1,
            flatShading: THREE.FlatShading, // turning on flat shading 
            side: THREE.DoubleSide
          });
        let cylinderObj = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        // add shadows 
        cylinderObj.castShadow = true;
        cylinderObj.receiveShadow = true;
        cylinderObj.position.set(0,5,0);

        // add new object to dropdown list for actions
        actionsObjs(cylinderForm.name);
        // add key and value to all objects
        allObjs[cylinderForm.name] = cylinderObj;
        this.scene.add(cylinderObj);
        // make draggable object
        dragObjList.push(cylinderObj);
      }
      // PLANE
      else if (selectedShapeText == "Plane") {
        // get form values
        let planeForm = processPlaneForm();
        // check for empty values
        for (var key in planeForm) {
          if ((typeof(planeForm[key]) == "string" && planeForm[key] === "") 
            || (typeof(planeForm[key]) != "string" && isNaN(planeForm[key]))) {
            console.log("QUITTING")
            return;
          }
        }
        // check for unique name
        if (isUniqueKey(planeForm)){
          return;
        }
        // custom geometry
        let planeGeometry = new THREE.PlaneGeometry(
          planeForm.width,
          planeForm.height,
          1,
          1
        );
        // custom material 
        const planeMaterial = new THREE. 
          MeshPhongMaterial({
            color: planeForm.color, 
            opacity: 1,
            flatShading: THREE.FlatShading, // turning on flat shading 
            side: THREE.DoubleSide
          });
        let planeObj = new THREE.Mesh(planeGeometry, planeMaterial);
        // add shadows
        planeObj.castShadow = true;
        planeObj.receiveShadow = true;
        planeObj.position.set(0,5,0);

        // add new object to dropdown list for actions
        actionsObjs(planeForm.name);
        // add key and value to all objects
        allObjs[planeForm.name] = planeObj;
        this.scene.add(planeObj);
        // make draggable object
        dragObjList.push(planeObj);
      }
      // RING
      else if (selectedShapeText == "Ring") {
        // get form values
        let ringForm = processRingForm();
        // check for empty values
        for (var key in ringForm) {
          if ((typeof(ringForm[key]) == "string" && ringForm[key] === "") 
            || (typeof(ringForm[key]) != "string" && isNaN(ringForm[key]))) {
            console.log("QUITTING")
            return;
          }
        }
        // check for unique name
        if (isUniqueKey(ringForm)){
          return;
        }
        // fully fill shape if user's input = 6
        let newFill;
        if (ringForm.fill == 6) {
          newFill = 2 * Math.PI;
        } else {
          newFill = ringForm.fill;
        }
        // custom geometry
        let ringGeometry = new THREE.RingGeometry(
          ringForm.innerRadius,
          ringForm.outerRadius,
          ringForm.circumferenceFaces,
          1,
          0,
          newFill
        );
        // custom material
        const ringMaterial = new THREE. 
          MeshPhongMaterial({
            color: ringForm.color, 
            opacity: 1,
            flatShading: THREE.FlatShading, // turning on flat shading 
            side: THREE.DoubleSide
          });
        let ringObj = new THREE.Mesh(ringGeometry, ringMaterial);
        // add shadows
        ringObj.castShadow = true;
        ringObj.receiveShadow = true;
        ringObj.position.set(0,5,0);

        // add new object to dropdown list for actions
        actionsObjs(ringForm.name);
        // add key and value to all objects
        allObjs[ringForm.name] = ringObj;
        this.scene.add(ringObj);
        // make draggable object
        dragObjList.push(ringObj);
      }
      // SPHERE
      else if (selectedShapeText == "Sphere") {
        // get form values
        let sphereForm = processSphereForm();
        // check for empty values
        for (var key in sphereForm) {
          if ((typeof(sphereForm[key]) == "string" && sphereForm[key] === "") 
            || (typeof(sphereForm[key]) != "string" && isNaN(sphereForm[key]))) {
            console.log("QUITTING")
            return;
          }
        }
        // check for unique name
        if (isUniqueKey(sphereForm)){
          return;
        }
        // fully fill shape if user's input = 6
        let newFill;
        if (sphereForm.fill == 6) {
          newFill = 2 * Math.PI;
        } else {
          newFill = sphereForm.fill;
        }
        // see enable3D for constructor
        let newVerticalStartingAngle;
        if (sphereForm.verticalStartingAngle == 6) {
          newVerticalStartingAngle = 2 * Math.PI;
        } else {
          newVerticalStartingAngle = sphereForm.verticalStartingAngle;
          console.log("NEW START " + newVerticalStartingAngle)
        }
        // see enable3D for contructor
        let newVerticalSweepAngle;
        if (sphereForm.verticalSweepAngle == 6) {
          newVerticalSweepAngle = 2 * Math.PI;
        } else {
          newVerticalSweepAngle = sphereForm.verticalSweepAngle;
          console.log("NEW START " + newVerticalSweepAngle)
        }
        // custom geometry
        let sphereGeometry = new THREE.SphereGeometry(
          sphereForm.radius,
          sphereForm.horizontalFaces,
          sphereForm.verticalFaces,
          0,
          newFill,
          newVerticalStartingAngle,
          newVerticalSweepAngle
        );
        // custom material
        const sphereMaterial = new THREE. 
          MeshPhongMaterial({
            color: sphereForm.color, 
            opacity: 1,
            flatShading: THREE.FlatShading, // turning on flat shading 
            side: THREE.DoubleSide
          });
        let sphereObj = new THREE.Mesh(sphereGeometry, sphereMaterial);
        // add shadows
        sphereObj.castShadow = true;
        sphereObj.receiveShadow = true;
        sphereObj.position.set(0,5,0);

        // add new object to dropdown list for actions
        actionsObjs(sphereForm.name);
        // add key and value to all objects
        allObjs[sphereForm.name] = sphereObj;
        this.scene.add(sphereObj);
        // make draggable object
        dragObjList.push(sphereObj);
      }
      // TORUS
      else if (selectedShapeText == "Torus") {
        // get form values
        let torusForm = processTorusForm();
        // check for empty values
        for (var key in torusForm) {
          if ((typeof(torusForm[key]) == "string" && torusForm[key] === "") 
            || (typeof(torusForm[key]) != "string" && isNaN(torusForm[key]))) {
            console.log("QUITTING")
            return;
          }
        }
        // check for unique name
        if (isUniqueKey(torusForm)){
          return;
        }
        // fully fill shape if user's input = 6
        let newFill;
        if (torusForm.fill == 6) {
          newFill = 2 * Math.PI;
        } else {
          newFill = torusForm.fill;
        }
        // custom geometry
        let torusGeometry = new THREE.TorusGeometry(
          torusForm.radius,
          torusForm.thickness,
          torusForm.verticalFaces,
          torusForm.circumferenceFaces,
          newFill
        );
        // custom material
        const torusMaterial = new THREE. 
          MeshPhongMaterial({
            color: torusForm.color, 
            opacity: 1,
            flatShading: THREE.FlatShading, // turning on flat shading 
            side: THREE.DoubleSide
          });
        let torusObj = new THREE.Mesh(torusGeometry, torusMaterial);
        // add shadows
        torusObj.castShadow = true;
        torusObj.receiveShadow = true;
        torusObj.position.set(0,5,0);

        // add new object to dropdown list for actions
        actionsObjs(torusForm.name);
        // add key and value to all objects
        allObjs[torusForm.name] = torusObj;
        this.scene.add(torusObj);
        // make draggable object
        dragObjList.push(torusObj);
      }
      // TORUS KNOT
      else if (selectedShapeText == "Torus Knot") {
        // get form values
        let torusKnotForm = processTorusKnotForm();
        // check for empty values
        for (var key in torusKnotForm) {
          if ((typeof(torusKnotForm[key]) == "string" && torusKnotForm[key] === "") 
            || (typeof(torusKnotForm[key]) != "string" && isNaN(torusKnotForm[key]))) {
            console.log("QUITTING")
            return;
          }
        }
        // check for unique name
        if (isUniqueKey(torusKnotForm)){
          return;
        }
        // custom geometry
        let torusKnotGeometry = new THREE.TorusKnotGeometry(
          torusKnotForm.size,
          torusKnotForm.thickness,
          torusKnotForm.tubeFaces,
          torusKnotForm.circumferenceFaces,
          torusKnotForm.p,
          torusKnotForm.q
        );
        // custom material
        const torusKnotMaterial = new THREE. 
          MeshPhongMaterial({
            color: torusKnotForm.color, 
            opacity: 1,
            flatShading: THREE.FlatShading, // turning on flat shading 
            side: THREE.DoubleSide
          });
        let torusKnotObj = new THREE.Mesh(torusKnotGeometry, torusKnotMaterial);
        // add shadows
        torusKnotObj.castShadow = true;
        torusKnotObj.receiveShadow = true;
        torusKnotObj.position.set(0,5,0);

        // add new object to dropdown list for actions
        actionsObjs(torusKnotForm.name);
        // add key and value to all objects
        allObjs[torusKnotForm.name] = torusKnotObj;
        this.scene.add(torusKnotObj);
        // add draggable object
        dragObjList.push(torusKnotObj);
      }
      // TUBE
      else if (selectedShapeText == "Tube") {
        // get form values
        let tubeForm = processTubeForm();
        // check for empty values
        for (var key in tubeForm) {
          if ((typeof(tubeForm[key]) == "string" && tubeForm[key] === "") 
            || (typeof(tubeForm[key]) != "string" && isNaN(tubeForm[key]))) {
            console.log("QUITTING")
            return;
          }
        }
        // check for unique name
        if (isUniqueKey(tubeForm)){
          return;
        }

        // Sin Curve from 3js Docs
        class CustomSinCurve extends THREE.Curve {
          constructor( scale = 1 ) {
            super();
            this.scale = scale;
          }
          getPoint( t, optionalTarget = new THREE.Vector3() ) {
            const tx = t * 3 - 1.5;
            const ty = Math.sin( 2 * Math.PI * t );
            const tz = 0;
            return optionalTarget.set( tx, ty, tz ).multiplyScalar( this.scale );
          }
        }
        // sin curve path for tube
        let path = new CustomSinCurve(tubeForm.size);
        // custom geometry
        let tubeGeometry = new THREE.TubeGeometry(
          path,
          tubeForm.tubeSegments,
          tubeForm.thickness,
          tubeForm.radiusSegments,
          false
        );
        // custom material
        const tubeMaterial = new THREE. 
          MeshPhongMaterial({
            color: tubeForm.color, 
            opacity: 1,
            flatShading: THREE.FlatShading, // turning on flat shading 
            side: THREE.DoubleSide
          });
        let tubeObj = new THREE.Mesh(tubeGeometry, tubeMaterial);
        // add shadows
        tubeObj.castShadow = true;
        tubeObj.receiveShadow = true;
        tubeObj.position.set(0,5,0);

        // add new object to dropdown list for actions
        actionsObjs(tubeForm.name);
        // add key and value to all objects
        allObjs[tubeForm.name] = tubeObj;
        this.scene.add(tubeObj);
        // make draggable object
        dragObjList.push(tubeObj);
      }
      // view all objects present in world
      console.log(allObjs);

    });

    // apply gravity change to specific objects 
    // add listener for gravity action
    var applyGravity = document.getElementById("applyGravity");
    applyGravity.addEventListener("click", () => {
      // get specific object
      let selectedObj = document.getElementById("objsList");
      let key = selectedObj.value;
      // get gravity details
      let form = document.getElementById("gravityDetails");
      let x = form.elements["x"].valueAsNumber;
      let y = form.elements["y"].valueAsNumber;
      let z = form.elements["z"].valueAsNumber;

      try {
        // must add physics to object before gravity
        this.physics.add.existing(allObjs[key], {shape: 'convex'});
        allObjs[key].body.setGravity(x, y, z);        
      } catch (error) {
        console.log(error)
      }
    });
    
    // apply physics to selected object
    // add listener to physics action
    var applyPhysicsSpecific = document.getElementById("applyPhysicsSpecific");
    applyPhysicsSpecific.addEventListener("click", () => {
      // user selected object
      let selectedObj = document.getElementById("objsList");
      let key = selectedObj.value;
      // apply physics to specified object
      this.physics.add.existing(allObjs[key], {shape: 'convex'});
    });

    // stop physics & Move selected object
    // add listener to move action
    var moveObjSpecific = document.getElementById("moveObjSpecific");
    moveObjSpecific.addEventListener("click", () => {
      // user selected object
      let selectedObj = document.getElementById("objsList");
      let key = selectedObj.value;
      try {
        // to move object, physics must be removed
        // if physics don't exist, catch error
        this.physics.destroy(allObjs[key].body)
      }
      catch (error) {
        console.log("Never Had Physics");
      }
    });

    // delete selected object 
    // add listener to delete action
    var deleteObj = document.getElementById("deleteObj");
    deleteObj.addEventListener("click", () => {
      // user specified object
      let selectedObj = document.getElementById("objsList");
      let key = selectedObj.value;

      try {
        // remove physics is still present
        this.physics.destroy(allObjs[key].body)
      } catch (error) {
        console.log("No Object to Delete or No Physics");
      }
      try {
        // move object far down the camera
        allObjs[key].position.set(0,-5000,0);
        allObjs[key].geometry.dispose();
        allObjs[key].material.dispose();
        // hide object from user 
        allObjs[key].active = false;
      } catch (error){
        console.log(error)
      }
      // remove element from UI dropdown
      try {
        selectedObj.remove(selectedObj.selectedIndex);
      } catch (error) {
        console.log("Nothing in UI Dropdown");
      } 

      // remove object from key & values 
      try {
        delete allObjs[key]; 
      } catch (error) {
        console.log("Already deleted from object");
      }
    });

    // delete all objects
    // add listener to delete world action
    var deleteObjAll = document.getElementById("deleteObjAll");
    deleteObjAll.addEventListener("click", () => {
      // user specified object
      let selectedObj = document.getElementById("objsList");
      // find all meshes in object 
      for (var key in allObjs) {
        try {
          // delete physics is still present
          this.physics.destroy(allObjs[key].body)
        } catch (error) {
          console.log("No Object to Delete or No Physics");
        }
        try {
          // move object far below camera
          allObjs[key].position.set(0,-5000,0);
          allObjs[key].geometry.dispose();
          allObjs[key].material.dispose();
          // hide object from user
          allObjs[key].active = false;
        } catch (error){
          console.log(error)
        }
        // remove element from UI dropdown
        try {
          selectedObj.remove(selectedObj.selectedIndex);
        } catch (error) {
          console.log("Nothing in UI Dropdown");
        } 

        // remove object from key & values 
        try {
          delete allObjs[key]; 
        } catch (error) {
          console.log("Already deleted from object");
        }
      }
    });

    // apply physics to all objects
    // add listener to physics world action
    var physicsOnAll = document.getElementById("physicsOnAll");
    physicsOnAll.addEventListener("click", () => {
      try {
        // find all meshes present in world
        for (var key in allObjs) {
          // add physics
          this.physics.add.existing(allObjs[key], {shape: 'convex'});
        }
      } catch (error) {
        console.log("Physics exists for some or all objects in world");
      }
    });

    // turn off physics to all objects
    // add listener to physics off world action
    var physicsOffAll = document.getElementById("physicsOffAll");
    physicsOffAll.addEventListener("click", () => {
      try {
        // find all meshes present in the world
        for (var key in allObjs) {
          // remove physics is possbile
          this.physics.destroy(allObjs[key].body)
        }
      } catch (error) {
        console.log("Physics exists for some or all objects in world");
      }
    });

    // apply gravity change to all objects 
    // add listener to gravity world action
    var applyAllGravity = document.getElementById("applyAllGravity");
    applyAllGravity.addEventListener("click", () => {
      let form = document.getElementById("gravityAllDetails");
      let x = form.elements["x"].valueAsNumber;
      let y = form.elements["y"].valueAsNumber;
      let z = form.elements["z"].valueAsNumber;

      try {
        // find all objects present in world
        for (var key in allObjs) {
          // add physics before gravity
          this.physics.add.existing(allObjs[key], {shape: 'convex'});
          // add customized gravity
          allObjs[key].body.setGravity(x, y, z);        
        }
      } catch (error) {
        console.log(error)
      }
    });

    // add drag controls
    // if dragging object, stop orbit controls 
    const dragControls = new DragControls(dragObjList, this.camera, this.renderer.domElement);
    dragControls.addEventListener('dragstart', function (event) {
      orbitControls.enabled = false;
    })
    dragControls.addEventListener('dragend', function (event) {
      orbitControls.enabled = true;
    })

    // Processing Forms Function
    function processCapsuleForm() {
      let form = document.getElementById("CapsuleForm");
      let formValues = {
        name: form.elements["name"].value,
        radius: form.elements["radius"].valueAsNumber,
        objLength: form.elements["objLength"].valueAsNumber,
        capSegments: form.elements["capSegments"].valueAsNumber,
        sideFaces: form.elements["sideFaces"].valueAsNumber,
        color: Number("0x"+form.elements["color"].value)
      }
      return formValues;
    }

    function processConeForm() {
      let form = document.getElementById("ConeForm");
      let formValues = {
        name: form.elements["name"].value,
        radius: form.elements["radius"].valueAsNumber,
        height: form.elements["height"].valueAsNumber,
        circumferenceFaces: form.elements["circumferenceFaces"].valueAsNumber,
        hollow: form.elements["hollow"].checked,
        fill: form.elements["fill"].valueAsNumber,
        color: Number("0x"+form.elements["color"].value)
      };
      return formValues
    }

    function processCubeForm() {
      let form = document.getElementById("CubeForm");
      let formValues = {
        name: form.elements["name"].value,
        width: form.elements["width"].valueAsNumber,
        height: form.elements["height"].valueAsNumber,
        depth: form.elements["depth"].valueAsNumber,
        color: Number("0x"+form.elements["color"].value)
      }
      return formValues;
    }

    function processCylinderForm() {
      let form = document.getElementById("CylinderForm");
      let formValues = {
        name: form.elements["name"].value,
        radiusTop: form.elements["radiusTop"].valueAsNumber,
        radiusBottom: form.elements["radiusBottom"].valueAsNumber,
        height: form.elements["height"].valueAsNumber,
        circumferenceFaces: form.elements["circumferenceFaces"].valueAsNumber,
        hollow: form.elements["hollow"].checked,
        fill: form.elements["fill"].valueAsNumber,
        color: Number("0x"+form.elements["color"].value)
      }
      return formValues;
    }

    function processPlaneForm() {
      let form = document.getElementById("PlaneForm");
      let formValues = {
        name: form.elements["name"].value,
        width: form.elements["width"].valueAsNumber,
        height: form.elements["height"].valueAsNumber,
        color: Number("0x"+form.elements["color"].value)
      }
      return formValues;
    }

    function processRingForm() {
      let form = document.getElementById("RingForm");
      let formValues = {
        name: form.elements["name"].value,
        innerRadius: form.elements["innerRadius"].valueAsNumber,
        outerRadius: form.elements["outerRadius"].valueAsNumber,
        circumferenceFaces: form.elements["circumferenceFaces"].valueAsNumber,
        fill: form.elements["fill"].valueAsNumber,
        color: Number("0x"+form.elements["color"].value)
      }
      return formValues;
    }

    function processSphereForm() {
      let form = document.getElementById("SphereForm");
      let formValues = {
        name: form.elements["name"].value,
        radius: form.elements["radius"].valueAsNumber,
        horizontalFaces: form.elements["horizontalFaces"].valueAsNumber,
        verticalFaces: form.elements["verticalFaces"].valueAsNumber,
        fill: form.elements["fill"].valueAsNumber,
        verticalStartingAngle: form.elements["verticalStartingAngle"].valueAsNumber,
        verticalSweepAngle: form.elements["verticalSweepAngle"].valueAsNumber,
        color: Number("0x"+form.elements["color"].value)
      }
      return formValues;
    }

    function processTorusForm() {
      let form = document.getElementById("TorusForm");
      let formValues = {
        name: form.elements["name"].value,
        radius: form.elements["radius"].valueAsNumber,
        thickness: form.elements["thickness"].valueAsNumber,
        verticalFaces: form.elements["verticalFaces"].valueAsNumber,
        circumferenceFaces: form.elements["circumferenceFaces"].valueAsNumber,
        fill: form.elements["fill"].valueAsNumber,
        color: Number("0x"+form.elements["color"].value)
      }
      return formValues;
    }

    function processTorusKnotForm() {
      let form = document.getElementById("TorusKnotForm");
      let formValues = {
        name: form.elements["name"].value,
        size: form.elements["size"].valueAsNumber,
        thickness: form.elements["thickness"].valueAsNumber,
        tubeFaces: form.elements["tubeFaces"].valueAsNumber,
        circumferenceFaces: form.elements["circumferenceFaces"].valueAsNumber,
        p: form.elements["q"].valueAsNumber,
        q: form.elements["p"].valueAsNumber,
        color: Number("0x"+form.elements["color"].value)
      }
      return formValues;
    }

    function processTubeForm() {
      let form = document.getElementById("TubeForm");
      let formValues = {
        name: form.elements["name"].value,
        size: form.elements["size"].valueAsNumber,
        tubeSegments: form.elements["tubeSegments"].valueAsNumber,
        thickness: form.elements["thickness"].valueAsNumber,
        radiusSegments: form.elements["radiusSegments"].valueAsNumber,
        color: Number("0x"+form.elements["color"].value)
      }
      return formValues;
    }

    // populate objects for actions
    function actionsObjs(objName) {
      let objList = document.getElementById("objsList");
      let option = document.createElement("option");
      option.text = objName;
      objList.add(option);
    }

    // check if name is unique 
    function isUniqueKey (obj) {
      if (obj.name in allObjs) {
        alert("Name Already Exists");
        return 1;
      } else {
        return 0;
      }
    }

  }
}

// moon's gravity is -1.62
var config = { gravity: { x: 0, y: -1.62, z: 0 }, scenes: [PhysicsTest], antialias:true};
PhysicsLoader('/ammo', () => new Project(config));