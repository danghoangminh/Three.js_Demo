// global variables
var camera, scene, renderer;
var floor, geometry, material, mesh, floorMesh, light, axes;
var gui;
var stats;

// controls
var obControl, afControl;

// rotation values
var rot_x = 0.01;
var rot_y = 0.02;
var alpha = 0;

// gui settings
var settings = {
  common: {
    scale: 1,
    autorotate: false,
    showaxes: true,
  },
  geometry: {
    shape: "cube",
    material: "basic",
  },
  light: {
    lightType: "pointLight",
    enable: true,
    autorotate: false,
    shadow: true,
    automove: false,
    intensity: 4,
  },
  affine: {
    mode: "none",
  },
};

init();
initGUI();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 2;
  scene = new THREE.Scene();

  // main object
  geometry = new THREE.BoxBufferGeometry(0.4, 0.4, 0.4);
  material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.name = "object";

  // floor
  floor = new THREE.PlaneBufferGeometry(5, 5, 32, 32);
  var floorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  floorMesh = new THREE.Mesh(floor, floorMat);
  floorMesh.receiveShadow = true;
  floorMesh.rotation.x = -Math.PI / 2.0;
  floorMesh.name = "floor";
  floorMesh.position.set(0, -0.6, 0);

  // light
  light = new THREE.PointLight(0xffffff, 2, 100);
  light.position.set(0, 1, 0);
  light.castShadow = true; // default false

  // axesHelper
  axes = new THREE.GridHelper(100, 2);

  // add object and floor to scene
  scene.add(floorMesh);
  scene.add(mesh);
  scene.add(light);
  scene.add(axes);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // stats
  stats = new Stats();
  document.body.appendChild(stats.dom);

  // controls
  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 1;
  controls.minDistance = 1;
  controls.maxDistance = 10;

  afControl = new THREE.TransformControls(camera, renderer.domElement);
  afControl.addEventListener("change", function () {
    renderer.render(scene, camera);
  });
  afControl.addEventListener("dragging-changed", function (event) {
    controls.enabled = !event.value;
  });

  //afControl.attach(mesh);
  scene.add(afControl);
  window.addEventListener("resize", onWindowResize, false);
}

function animate() {
  requestAnimationFrame(animate);

  if (settings["common"].autorotate == true) {
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;
  }

  if (settings["light"].autorotate == true) {
    alpha = Math.PI * 0.01 + alpha;
    var new_x = Math.sin(alpha);
    var new_z = Math.cos(alpha);

    light.position.set(new_x, 1, new_z);
    if (alpha == 2 * Math.PI) alpha = 0;
  }

  renderer.render(scene, camera);
  stats.update();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function initGUI() {
  gui = new dat.GUI();
  h = gui.addFolder("Common");
  h.add(settings["common"], "scale", 0.1, 2, 0.1).name("Scale").onChange(function () {
    mesh.scale.set(
      settings["common"].scale,
      settings["common"].scale,
      settings["common"].scale
    );
  });
  h.add(settings["common"], "showaxes").name("Show Axes").onChange(function () {
    if (settings["common"].showaxes == true) {
      axes.visible = true;
    } else {
      axes.visible = false;
    }
  });
  h.add(settings["common"], "autorotate").name("Auto Rotate");

  h = gui.addFolder("Geometry");
  h.add(settings["geometry"], "material", [
    "basic",
    "normal",
    "line",
    "texture 1",
    "texture 2",
    "phong shading",
    "lambert shading",
    "wire lambert",
  ]).name("Material").onChange(matChanged);
  h.add(settings["geometry"], "shape", [
    "cube",
    "cone",
    "sphere",
    "torus",
    "cylinder",
    "teapot",
  ]).name("Shape").onChange(geometryChanged);
  h = gui.addFolder("Light");

  h.add(settings["light"], "lightType", [
    "pointLight",
    "spotLight",
    "directionalLight",
    "ambientLight",
  ]).name("Light Type").onChange(lightChanged);

  h.add(settings["light"], "enable").name("Enable").onChange(function () {
    if (settings["light"].enable == true) {
      light.visible = true;
    } else light.visible = false;
  });

  h.add(settings["light"], "autorotate").name("Auto Rotate").onChange(function () {
    if (settings["light"].autorotate == true) {
      console.log("rotating light");
    }
  });

  h.add(settings["light"], "shadow").name("Shadows").onChange(function () {
    if (settings["light"].shadow == false) {
      console.log("no shadows");
      floorMesh.receiveShadow = false;
      light.castShadow = false;
    } else {
      floorMesh.receiveShadow = true;
      light.castShadow = true;
      mesh.castShadow = true;
    }
  });

  h.add(settings["light"], "intensity", 0, 50, 2).name("Intensity").onChange(function () {
    light.intensity = settings["light"].intensity;
  });

  h = gui.addFolder("Affine");
  h.add(settings["affine"], "mode", [
    "none",
    "translate",
    "rotate",
    "scale",
  ]).name("Mode").onChange(affineChanged);
}

function lightChanged() {
  switch (settings["light"].lightType) {
    case "spotLight":
      if (settings["light"].enable === false) light.visible = false;
      else {
        light.visible = false;
        light.castShadow = false;
        light = new THREE.SpotLight(0xffffff, 2, 100);
        light.add(new THREE.SpotLightHelper(light));
        light.visible = true;
        light.position.set(0, 1, 0);
        light.castShadow = true;
        scene.add(light);
      }

      break;
    case "pointLight":
      if (settings["light"].enable === false) light.visible = false;
      else {
        light.visible = false;
        light.castShadow = false;
        light = new THREE.PointLight(0xffffff, 2, 100);
        light.add(new THREE.PointLightHelper(light));
        light.visible = true;
        light.position.set(0, 1, 0);
        light.castShadow = true;
        scene.add(light);
      }

      break;
    case "directionalLight":
      if (settings["light"].enable === false) light.visible = false;
      else {
        //reset all effect of light
        light.visible = false;
        light.castShadow = false;
        light = new THREE.DirectionalLight(0xffffff, 2, 100);
        light.add(new THREE.DirectionalLightHelper(light));
        light.visible = true;
        light.position.set(0, 1, 0);
        light.castShadow = true;
        scene.add(light);
      }
      break;
    case "ambientLight":
      if (settings["light"].enable === false) light.visible = false;
      else {
        light.visible = false;
        light.castShadow = false;
        light = new THREE.AmbientLight(0xffffff, 2, 100);

        light.visible = true;
        light.position.set(0, 1, 0);
        scene.add(light);
      }
      break;
  }
}

function geometryChanged() {
  switch (settings["geometry"].shape) {
    case "cone":
      geometry = new THREE.ConeBufferGeometry(0.4, 0.4, 32, 32);
      break;
    case "cube":
      geometry = new THREE.BoxBufferGeometry(0.4, 0.4, 0.4);
      break;
    case "sphere":
      geometry = new THREE.SphereBufferGeometry(0.4, 50, 50);
      break;
    case "torus":
      geometry = new THREE.TorusBufferGeometry(0.4, 0.2, 40, 40);
      break;
    case "cylinder":
      geometry = new THREE.CylinderBufferGeometry(0.4, 0.4, 0.8, 32, 32);
      break;
    case "teapot":
      geometry = new THREE.TeapotBufferGeometry(
        0.4,
        true,
        true,
        true,
        true,
        true
      );
      break;
    case "custom":
      var curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-10, 0, 0),
        new THREE.Vector3(20, 15, 0),
        new THREE.Vector3(10, 0, 0)
      );

      var points = curve.getPoints(50);
      geometry = new THREE.BufferGeometry().setFromPoints(points);
      material = new THREE.LineBasicMaterial({ color: 0xff0000 });
      console.log("created geometry from curve");
      break;
  }
  updateMesh(geometry, material);
}

function affineChanged() {
  switch (settings["affine"].mode) {
    case "none":
      console.log("detached");
      afControl.detach();
      break;
    case "translate":
      console.log("translating");
      afControl.setMode("translate");
      afControl.attach(mesh);
      break;
    case "rotate":
      afControl.setMode("rotate");
      afControl.attach(mesh);
      break;
    case "scale":
      afControl.setMode("scale");
      afControl.attach(mesh);
      break;
  }
}

function matChanged() {
  switch (settings["geometry"].material) {
    case "basic":
      material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      break;
    case "line":
      material = new THREE.MeshNormalMaterial();
      material.wireframe = true;
      break;
    case "normal":
      material = new THREE.MeshNormalMaterial();
      break;
    case "phong shading":
      material = new THREE.MeshPhongMaterial({
        color: 0xdddddd,
        specular: 0x009900,
        shininess: 10,
        flatShading: true,
      });
      break;
    case "lambert shading":
      material = new THREE.MeshLambertMaterial({
        color: 0xb00000,
        wireframe: false,
      });
      break;
    case "wire lambert":
      material = new THREE.MeshLambertMaterial({
        color: 0xb00000,
        wireframe: true,
      });
      break;
    case "texture 1":
      var texture = new THREE.TextureLoader().load(
        "https://i.imgur.com/e69Z1hI.jpg",
        function (texture) {
          // do something with the texture
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(10, 10);

          material = new THREE.MeshBasicMaterial({
            map: texture,
          });
        },
        undefined,
        function (err) {
          console.log(err);
        }
      );
      material = new THREE.MeshBasicMaterial({ map: texture });
      break;
    case "texture 2":
      var texture = new THREE.TextureLoader().load(
        "https://i.imgur.com/OIasWMD.jpg",
        function (texture) {
          // do something with the texture
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(1, 1);

          material = new THREE.MeshBasicMaterial({
            map: texture,
          });
        },
        undefined,
        function (err) {
          console.log(err);
        }
      );
      material = new THREE.MeshBasicMaterial({ map: texture });
      break;
  }
  updateMesh(geometry, material);
}

/* utilities */
function clearGeometry() {
  for (var i = 0; i < scene.children.length; i++) {
    if (scene.children[i].name == "object") scene.remove(scene.children[i]);
  }
}

function clearAffine() {
  afControl.detach();
  settings["affine"].mode = "none";
}

function updateMesh(g, m) {
  clearAffine();
  clearGeometry();
  mesh = new THREE.Mesh(g, m);
  if (settings["light"].shadow == true) {
    mesh.castShadow = true;
    mesh.receiveShadow = false;
  }
  mesh.name = "object";
  mesh.scale.set(
    settings["common"].scale,
    settings["common"].scale,
    settings["common"].scale
  );
  scene.add(mesh);
}

function genDotMaterial() {
  var canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  var ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(16, 16, 12, 0, 2 * Math.PI);
  ctx.stroke();

  var texture = THREE.CanvasTexture(canvas);
  var mat = new THREE.MeshBasicMaterial({
    map: texture,
  });
  return mat;
}

function initDragAndDrop() {
  document.addEventListener(
    "dragover",
    function (event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    false
  );

  document.addEventListener(
    "drop",
    function (event) {
      event.preventDefault();

      // load file
      var reader = new FileReader();
      reader.addEventListener(
        "load",
        function (ev) {
          handleJPG(ev);
        },
        false
      );
      reader.readAsDataURL(event.dataTransfer.files[0]);
    },
    false
  );
}