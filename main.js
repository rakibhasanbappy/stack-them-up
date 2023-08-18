import * as CANNON from 'cannon-es';
import * as THREE from 'three';

const infoDiv = document.getElementById('info');
const scoreDiv = document.getElementById('score');
const resultsElement = document.getElementById("results");
const finalScore = document.getElementById("finalScore");

let scene, camera, renderer, world;
let blocks = [];
let overhangs = [];
let isStarted = false;
let score = 0;

const initBlockWidth = 8;
const initBlockDepth = 8;
const initBlockHeight = 2;

var movementSpeed = 0.2;
var totalObjects = 50;
var objectSize = window.innerWidth / 500;
var dirs = [];
var parts = [];

class ExplodeAnimation {
    constructor(x, y, z, color) {
        var geometry = new THREE.BufferGeometry();
        var vertices = [];

        for (let i = 0; i < totalObjects; i++) {
            var vertex = new THREE.Vector3();
            vertex.x = x;
            vertex.y = y;
            vertex.z = z;
            vertices.push(vertex.x, vertex.y, vertex.z);
            dirs.push({
                x: (Math.random() * movementSpeed) - (movementSpeed / 2),
                y: (Math.random() * movementSpeed) - (movementSpeed / 2),
                z: (Math.random() * movementSpeed) - (movementSpeed / 2)
            });
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        var material = new THREE.PointsMaterial({ size: objectSize, color: color });
        var particles = new THREE.Points(geometry, material);
        this.object = particles;
        this.status = true;
        this.xDir = (Math.random() * movementSpeed) - (movementSpeed / 2);
        this.yDir = (Math.random() * movementSpeed) - (movementSpeed / 2);
        this.zDir = (Math.random() * movementSpeed) - (movementSpeed / 2);
        scene.add(this.object);

        this.update = function () {
            if (this.status == true) {
                var pCount = totalObjects;
                var positions = this.object.geometry.attributes.position.array;
                while (pCount--) {
                    positions[pCount * 3] += dirs[pCount].x;
                    positions[pCount * 3 + 1] += dirs[pCount].y;
                    positions[pCount * 3 + 2] += dirs[pCount].z;
                }
                this.object.geometry.attributes.position.needsUpdate = true;
            }
        };
    }
}

function init() {
    

    //Initializing CannonJS
    world = new CANNON.World();
    world.gravity.set(0, -10, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 40;
    

    scene = new THREE.Scene();


    addBlock(0, 0, initBlockWidth, initBlockDepth);
    addBlock(-45, 0, initBlockWidth, initBlockDepth, "x");

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 0);
    scene.add(directionalLight);

    const width = 50;
    const height = width * (window.innerHeight / window.innerWidth);
    camera = new THREE.OrthographicCamera(
        width / -2,
        width / 2,
        height / 2,
        height / -2,
        1,
        1000 
    );

    camera.position.set(20, 20, 20);
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);

    render();

    document.body.appendChild(renderer.domElement);
}

function render() {
    requestAnimationFrame(render);
    var pCount = parts.length;
    while (pCount--) {
        parts[pCount].update();
    }
    renderer.render(scene, camera);
}

function addBlock(x, z, width, depth, direction) {
    const y = initBlockHeight * blocks.length;

    const block = generateBlock(x, y, z, width, depth, false);
    block.direction = direction;

    blocks.push(block);
}


function addOverhang(x, z, width, depth) {
    const y = initBlockHeight * (blocks.length - 1); // Add the new box one the same layer
    const overhang = generateBlock(x, y, z, width, depth, true);
    overhangs.push(overhang);
}


function generateBlock(x, y, z, width, depth, falls) {
  
    // const topColor = 0x003366; // Top color of the gradient
    // const bottomColor = 0x66ccff; // Bottom color of the gradient
    // const gradientTexture = THREE.SceneUtils.createGradientTexture(topColor, bottomColor);

    // const gradientMaterial = new THREE.MeshBasicMaterial({ map: gradientTexture });
    // const gradientGeometry = new THREE.PlaneGeometry(2, 2); // Full-screen quad

    // const gradientMesh = new THREE.Mesh(gradientGeometry, gradientMaterial);
    // scene.add(gradientMesh);
    // var backgroundTexture = loader.load( 'https://i.imgur.com/upWSJlY.jpg' );
    // scene.background = backgroundTexture;
    
    scene.background = new THREE.Color(`hsl(${180 + blocks.length * 10}, 100%, 85%)`);


    //ThreeJS
    const geometry = new THREE.BoxGeometry(width, initBlockHeight, depth);
    //const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const color = new THREE.Color(`hsl(${180 + blocks.length * 10}, 100%, 65%)`);
    const material = new THREE.MeshPhongMaterial({ color });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, y, z);
    scene.add(block);

    //CannonJS
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, initBlockHeight / 2, depth / 2));

    let mass = falls ? 5: 0;
    const body = new CANNON.Body({ mass, shape });
    body.position.set(x, y, z);
    world.addBody(body);

    return {
        threejs: block,
        cannonjs: body,
        width,
        depth,
    };
}


function cutBox(topBlock, overlap, size, delta) {
    const topBlockDirection = topBlock.direction;
    const newWidth = topBlockDirection == "x" ? overlap : topBlock.width;
    const newDepth = topBlockDirection == "z" ? overlap : topBlock.depth;
  
    // Update metadata
    topBlock.width = newWidth;
    topBlock.depth = newDepth;
  
    // Update ThreeJS model
    topBlock.threejs.scale[topBlockDirection] = overlap / size;
    topBlock.threejs.position[topBlockDirection] -= delta / 2;
  
    // Update CannonJS model
    topBlock.cannonjs.position[topBlockDirection] -= delta / 2;
  
    // Replace shape to a smaller one (in CannonJS you can't simply just scale a shape)
    const shape = new CANNON.Box(
      new CANNON.Vec3(newWidth / 2, initBlockHeight / 2, newDepth / 2)
    );
    topBlock.cannonjs.shapes = [];
    topBlock.cannonjs.addShape(shape);
}




window.addEventListener('click', (event) => {
    if (isStarted) {
        var newX, newZ, newDirection;


        const topBlock = blocks[blocks.length - 1];
        const topBlockDirection = topBlock.direction;

        parts.push(new ExplodeAnimation(topBlock.threejs.position.x, topBlock.threejs.position.y - 2, topBlock.threejs.position.z, new THREE.Color(`hsl(${180 + blocks.length * 4}, 100%, 65%)`)));
        

        const previousBlock = blocks[blocks.length - 2];
      
        const size = topBlockDirection == "x" ? topBlock.width : topBlock.depth;
        const delta = topBlock.threejs.position[topBlockDirection] - previousBlock.threejs.position[topBlockDirection];
        const overhangSize = Math.abs(delta);
        const overlap = size - overhangSize;

      
        if (overlap > 0) {

            cutBox(topBlock, overlap, size, delta);

            score = blocks.length - 1;
            scoreDiv.innerHTML = 'Score: ' + score;
            scoreDiv.style.display = 'block';
        
            //Overhang
            const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
            const overhangX = topBlockDirection == "x" ? topBlock.threejs.position.x + overhangShift : topBlock.threejs.position.x;
            const overhangZ =topBlockDirection == "z" ? topBlock.threejs.position.z + overhangShift : topBlock.threejs.position.z;
            const overhangWidth = topBlockDirection == "x" ? overhangSize : topBlock.width;
            const overhangDepth = topBlockDirection == "z" ? overhangSize : topBlock.depth;
      
            addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);


            if (topBlockDirection == 'x') {
                newX = topBlock.threejs.position.x;
                newZ = -45;
                newDirection = 'z';
            }
            else {
                newX = -45;
                newZ = topBlock.threejs.position.z;
                newDirection = 'x';
            }

            const newWidth = topBlock.width;
            const newDepth = topBlock.depth;

            addBlock(newX, newZ, newWidth, newDepth, newDirection);
        }
        else{
            missedTheSpot();
        }
    }
    else {
        isStarted = true;
        infoDiv.style.display = 'none';
        renderer.setAnimationLoop(animation);

    }
});



function missedTheSpot() {
    const topBlock = blocks[blocks.length - 1];


    // Turn to top layer into an overhang and let it fall down
    addOverhang(
      topBlock.threejs.position.x,
      topBlock.threejs.position.z,
      topBlock.width,
      topBlock.depth
    );
    
    scene.remove(topBlock.threejs);
    
    finalScore.innerHTML = 'Your Final Score: ' + score;
    resultsElement.style.display = 'block';
    
}


function animation() {
    const blockSpeed = 0.2*Math.log(score+2);

    const topBlock = blocks[blocks.length - 1];
    topBlock.threejs.position[topBlock.direction] += blockSpeed;
    topBlock.cannonjs.position[topBlock.direction] += blockSpeed;

    if (camera.position.y < initBlockHeight * (blocks.length - 2) + 20) {
        camera.position.y += blockSpeed;
    }
    updatePhysics();
    renderer.render(scene, camera);
}

function updatePhysics() {
    world.step(1 / 60);

    overhangs.forEach((element) => {
        element.threejs.position.copy(element.cannonjs.position);
        element.threejs.quaternion.copy(element.cannonjs.quaternion);
    });
}    

window.addEventListener('resize', () => {
    const width = 50;
    const height = width * (window.innerHeight / window.innerWidth);
    camera.left = width / -2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = height / -2;
    camera.updateProjectionMatrix();

    //update objectSize
    objectSize = window.innerWidth / 500;

    renderer.setSize(window.innerWidth, window.innerHeight);
});


init();
