import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/GLTFLoader.js';

// global variables
var camera, scene, renderer, reflectionCamera, cubeRenderTarget;
var floor, geometry, material, mesh, floorMesh, light, axes;
var gui;
var stats;
var helper;

var change_material = false;

const loader = new GLTFLoader();

// controls
var controls, afControl;

//animate
var mixer;

// rotation values
var alpha = 0;

// clock
var clock = new THREE.Clock();

// gui settings
var settings = {
  common: {
    scale: 1,
    autorotate: false,
    showaxes: true,
  },
  geometry: {
    shape: "Cube",
    color: "#9b9b9b",
    material: "Basic",
  },
  light: {
    lightType: "Point light",
    enable: true,
    lightHelper: false,
    autorotate: false,
    shadow: true,
    automove: false,
    positionX: 0,
    positionY: 1,
    positionZ: 0,
    intensity: 4,
  },
  affine: {
    mode: "None",
  },
  animation: {
    animation1: false,
    animation2: false,
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
  material = new THREE.MeshBasicMaterial({ color: settings["geometry"].color });
  mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.name = "object";

  // load the cube map
  var cubemap_path = '/images/cubemap/skyboxsun25deg/';
  var cubemap_format = '.jpg';
  var urls = [
    cubemap_path + 'px' + cubemap_format, cubemap_path + 'nx' + cubemap_format,
    cubemap_path + 'py' + cubemap_format, cubemap_path + 'ny' + cubemap_format,
    cubemap_path + 'pz' + cubemap_format, cubemap_path + 'nz' + cubemap_format,
  ];
  var refection_cube = new THREE.CubeTextureLoader().load(urls);
  refection_cube.format = THREE.RGBFormat;

  // floor
  floor = new THREE.PlaneBufferGeometry(5, 5, 32, 32);

  var floorMat = new THREE.MeshStandardMaterial({ color: 0x222222, side: THREE.DoubleSide });
  var texture_loader = new THREE.TextureLoader();
  floorMat.map = texture_loader.load('/images/textures/floor.jpg');
  floorMat.envMap = refection_cube;

  floorMesh = new THREE.Mesh(floor, floorMat);
  floorMesh.receiveShadow = true;
  floorMesh.rotation.x = -Math.PI / 2.0;
  floorMesh.name = "floor";
  floorMesh.position.set(0, -0.6, 0);

  // light
  light = new THREE.PointLight(0xffffff, 2, 100);
  light.position.set(0, 1, 0);
  light.castShadow = true; // default false
  helper = new THREE.PointLightHelper(light);
  light.add(helper);
  helper.visible = false;

  // axesHelper
  axes = new THREE.GridHelper(100, 2);

  // add camera for reflection
  cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
  });
  reflectionCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
  mesh.add(reflectionCamera);

  // add object and floor to scene
  scene.add(floorMesh);
  scene.add(mesh);
  scene.add(light);
  scene.add(axes);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // add background to scene
  scene.background = refection_cube;

  // stats
  stats = new Stats();
  document.body.appendChild(stats.dom);

  // controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
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

  // animation
  mixer = animation2(mesh);

  scene.add(afControl);
  window.addEventListener("resize", onWindowResize, false);
}

function render(mixer) {
  const delta = clock.getDelta();

  if (mixer) {
    mixer.update(delta);
  }
  renderer.render(scene, camera);
}

function animation2(mesh) {
  const positionKF = new THREE.VectorKeyframeTrack(
    ".position",
    [0, 1, 2],
    [0, 0, 0, 0, 0, -30, 0, 0, 0]
  );
  //4 back
  // SCALE
  const scaleKF = new THREE.VectorKeyframeTrack(
    ".scale",
    [0, 1, 2],
    [1, 1, 1, 2, 2, 2, 1, 1, 1]
  );

  // ROTATION
  // Rotation should be performed using quaternions, using a THREE.QuaternionKeyframeTrack
  // Interpolating Euler angles (.rotation property) can be problematic and is currently not supported

  // set up rotation about x axis
  const xAxis = new THREE.Vector3(1, 0, 0);

  const qInitial = new THREE.Quaternion().setFromAxisAngle(xAxis, 0);
  const qFinal = new THREE.Quaternion().setFromAxisAngle(xAxis, Math.PI);
  const quaternionKF = new THREE.QuaternionKeyframeTrack(
    ".quaternion",
    [0, 1, 2],
    [
      qInitial.x,
      qInitial.y,
      qInitial.z,
      qInitial.w,
      qFinal.x,
      qFinal.y,
      qFinal.z,
      qFinal.w,
      qInitial.x,
      qInitial.y,
      qInitial.z,
      qInitial.w,
    ]
  );

  // COLOR
  const colorKF = new THREE.ColorKeyframeTrack(
    ".material.color",
    [0, 1, 2],
    [1, 0, 0, 0, 1, 0, 0, 0, 1],
    THREE.InterpolateDiscrete
  );

  // OPACITY
  const opacityKF = new THREE.NumberKeyframeTrack(
    ".material.opacity",
    [0, 1, 2],
    [1, 0, 1]
  );

  // create an animation sequence with the tracks
  // If a negative time value is passed, the duration will be calculated from the times of the passed tracks array
  const clip = new THREE.AnimationClip("Action", 3, [
    scaleKF,
    positionKF,
    quaternionKF,
    colorKF,
    opacityKF,
  ]);

  // setup the THREE.AnimationMixer
  mixer = new THREE.AnimationMixer(mesh);

  // create a ClipAction and set it to play
  const clipAction = mixer.clipAction(clip);
  clipAction.play();

  //
  clock = new THREE.Clock();
  return mixer;
}

function animate() {
  requestAnimationFrame(animate);

  if (settings["animation"].animation2 == true) {
    render(mixer);
    stats.update();
  }

  if (settings["animation"].animation1 == true) {
    alpha = Math.PI * 0.01 + alpha;
    var new_x = Math.sin(alpha);
    var new_z = Math.cos(alpha);
    mesh.position.set(new_x, 1, new_z);
  }

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
  reflectionCamera.update(renderer, scene);
  stats.update();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function initGUI() {
  gui = new dat.GUI();

  var h = gui.addFolder("Common");

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

  h.addColor(settings["geometry"], 'color').name("Color").onChange(matChanged);

  h.add(settings["geometry"], "material", [
    "Basic",
    "Normal",
    "Line",
    "Phong shading",
    "Lambert shading",
    "Wire lambert",
    "Wood texture 1",
    "Wood texture 2",
    "Concrete texture 1",
    "Concrete texture 2",
    "Choose image",
  ]).name("Material").onChange(matChanged);

  h.add(settings["geometry"], "shape", [
    "Cube",
    "Cone",
    "Sphere",
    "Torus",
    "Cylinder",
    "Teapot",
    "Tire",
    "Pencil",
    "Pencil holder",
    "Paper plane",
  ]).name("Shape").onChange(geometryChanged);

  h = gui.addFolder("Light");

  h.add(settings["light"], "lightType", [
    "Point light",
    "Spot light",
    "Directional light",
    "Ambient light",
  ]).name("Light Type").onChange(lightChanged);

  h.add(settings["light"], "enable").name("Enable").onChange(function () {
    if (settings["light"].enable == true) {
      light.visible = true;
    } else light.visible = false;
  });

  h.add(settings["light"], "lightHelper").onChange(function () {
    if (settings["light"].LightHelper == true) {
      helper.visible = true;
    } else helper.visible = false;
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

  h.add(settings["light"], "positionX", -10, 10).onChange(function () {
    light.position.x = settings["light"].positionX;
  });

  h.add(settings["light"], "positionY", -10, 10).onChange(function () {
    light.position.y = settings["light"].positionY;
  });

  h.add(settings["light"], "positionZ", -10, 10).onChange(function () {
    light.position.z = settings["light"].positionZ;
  });

  h.add(settings["light"], "intensity", 0, 50, 2).name("Intensity").onChange(function () {
    light.intensity = settings["light"].intensity;
  });

  h = gui.addFolder("Affine");

  h.add(settings["affine"], "mode", [
    "None",
    "Translate",
    "Rotate",
    "Scale",
  ]).name("Mode").onChange(affineChanged);

  h = gui.addFolder("Animation");

  h.add(settings["animation"], "animation1").name("Animation 1");
  h.add(settings["animation"], "animation2").name("Animation 2");
}

function lightChanged() {
  switch (settings["light"].lightType) {
    case "Spot light":
      if (settings["light"].enable === false) light.visible = false;
      else {
        light.visible = false;
        light.castShadow = false;
        light = new THREE.SpotLight(0xffffff, 2, 100);
        helper = new THREE.SpotLightHelper(light);
        light.add(helper);
        if (settings["light"].LightHelper == false) {
          helper.visible = false;
        } else {
          helper.visible = true;
        }
        light.visible = true;
        light.position.set(0, 1, 0);
        light.castShadow = true;
        scene.add(light);
      }
      break;
    case "Point light":
      if (settings["light"].enable === false) light.visible = false;
      else {
        light.visible = false;
        light.castShadow = false;
        light = new THREE.PointLight(0xffffff, 2, 100);
        helper = new THREE.PointLightHelper(light);
        light.add(helper);
        if (settings["light"].LightHelper == false) {
          helper.visible = false;
        } else {
          helper.visible = true;
        }
        light.visible = true;
        light.position.set(0, 1, 0);
        light.castShadow = true;
        scene.add(light);
      }
      break;
    case "Directional light":
      if (settings["light"].enable === false) light.visible = false;
      else {
        //reset all effect of light
        light.visible = false;
        light.castShadow = false;
        light = new THREE.DirectionalLight(0xffffff, 2, 100);
        helper = new THREE.DirectionalLightHelper(light);
        light.add(helper);
        if (settings["light"].LightHelper == false) {
          helper.visible = false;
        } else {
          helper.visible = true;
        }
        light.visible = true;
        light.position.set(0, 1, 0);
        light.castShadow = true;
        scene.add(light);
      }
      break;
    case "Ambient light":
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
  if (settings["geometry"].shape != "")
    switch (settings["geometry"].shape) {
      case "Cone":
        geometry = new THREE.ConeBufferGeometry(0.4, 0.4, 32, 32);
        break;
      case "Cube":
        geometry = new THREE.BoxBufferGeometry(0.4, 0.4, 0.4);
        break;
      case "Sphere":
        geometry = new THREE.SphereBufferGeometry(0.4, 50, 50);
        break;
      case "Torus":
        geometry = new THREE.TorusBufferGeometry(0.4, 0.2, 40, 40);
        break;
      case "Cylinder":
        geometry = new THREE.CylinderBufferGeometry(0.4, 0.4, 0.8, 32, 32);
        break;
      case "Teapot":
        var path = 'models/kettle_lowpoly/scene.gltf';
        GetGeometryFrom3DModel(path, 0.2, 0.2, 0.2);
        return;
      case "Tire":
        var path = 'models/3d_vehicle_tire_base_mesh/scene.gltf';
        GetGeometryFrom3DModel(path, 0.4, 0.4, 0.4);
        return;
      case "Pencil":
        var path = 'models/hexagon_pencil/scene.gltf';
        GetGeometryFrom3DModel(path, 0.2, 0.2, 0.2);
        return;
      case "Pencil holder":
        var path = 'models/pencil_holder/scene.gltf';
        GetGeometryFrom3DModel(path, 0.4, 0.4, 0.4);
        return;
      case "Paper plane":
        var path = 'models/paper_plane/scene.gltf';
        GetGeometryFrom3DModel(path, 0.5, 0.5, 0.5);
        return;
    }
  updateMesh(geometry, material);
}

function GetGeometryFrom3DModel(path, scale_x, scale_y, scale_z) {
  loader.load(path, function (gltf) {
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {

        child.scale.set(child.scale.x * scale_x,
          child.scale.y * scale_y,
          child.scale.z * scale_z);

        geometry = child.geometry.scale(
          child.scale.x * scale_x,
          child.scale.y * scale_y,
          child.scale.z * scale_z
        ).clone();

        updateMesh(geometry, material);
        return 0;
      }
    })
  }, undefined, function (error) {
    console.error(error);
  });
}

function affineChanged() {
  switch (settings["affine"].mode) {
    case "None":
      console.log("detached");
      afControl.detach();
      break;
    case "Translate":
      console.log("translating");
      afControl.setMode("translate");
      afControl.attach(mesh);
      break;
    case "Rotate":
      afControl.setMode("rotate");
      afControl.attach(mesh);
      break;
    case "Scale":
      afControl.setMode("scale");
      afControl.attach(mesh);
      break;
  }
}

function matChanged() {
  change_material = true;
  switch (settings["geometry"].material) {
    case "Basic":
      material = new THREE.MeshBasicMaterial({ color: settings["geometry"].color });
      break;
    case "Line":
      material = new THREE.MeshNormalMaterial();
      material.wireframe = true;
      break;
    case "Normal":
      material = new THREE.MeshNormalMaterial();
      break;
    case "Phong shading":
      material = new THREE.MeshPhongMaterial({
        color: settings["geometry"].color,
        specular: 0x009900,
        shininess: 10,
        flatShading: true,
      });
      break;
    case "Lambert shading":
      material = new THREE.MeshLambertMaterial({
        wireframe: false,
        envMap: cubeRenderTarget.texture,
        combine: THREE.MixOperation,
        reflectivity: .7
      });
      break;
    case "Wire lambert":
      material = new THREE.MeshLambertMaterial({
        color: settings["geometry"].color,
        wireframe: true,
      });
      break;
    case "Wood texture 1":
      var texture = new THREE.TextureLoader().load(
        "/images/textures/Wood_1.jpg",
        function (texture) {
          // do something with the texture
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(5, 5);

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
    case "Wood texture 2":
      var texture = new THREE.TextureLoader().load(
        "/images/textures/Wood_2.jpg",
        function (texture) {
          // do something with the texture
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(5, 5);

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
    case "Concrete texture 1":
      var texture = new THREE.TextureLoader().load(
        "/images/textures/Concrete_1.jpg",
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
    case "Concrete texture 2":
      var texture = new THREE.TextureLoader().load(
        "/images/textures/Concrete_2.jpg",
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
    case "Choose image":
      uploadImage();
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
  settings["affine"].mode = "None";
}

function updateMesh(g, m) {
  if (change_material == false) {
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
    console.log(mesh.position);
    console.log(mesh.visible);
    scene.add(mesh);
  }
  else {
    change_material = false;
    mesh.material = m;
  }
  gui.updateDisplay();
}

function uploadImage() {
  console.log("clicked");
}