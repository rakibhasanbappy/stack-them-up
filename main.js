import * as THREE from 'three';

const infoDiv = document.getElementById('info');
const scoreDiv = document.getElementById('score');

let scene, camera, renderer;
let blocks = [];
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

    const block = generateBlock(x, y, z, width, depth);
    block.direction = direction;

    blocks.push(block);
}

function generateBlock(x, y, z, width, depth) {
  
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

    const geometry = new THREE.BoxGeometry(width, initBlockHeight, depth);
    //const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const color = new THREE.Color(`hsl(${180 + blocks.length * 10}, 100%, 65%)`);
    const material = new THREE.MeshPhongMaterial({ color });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, y, z);
    scene.add(block);

    return {
        threejs: block,
        width,
        depth,
    };
}

window.addEventListener('click', (event) => {
    if (isStarted) {
        var newX, newZ, newDirection;

        score = blocks.length - 1;
        scoreDiv.innerHTML = 'Score: ' + score;
        scoreDiv.style.display = 'block';

        const topBlock = blocks[blocks.length - 1];
        const topBlockDirection = topBlock.direction;

        parts.push(new ExplodeAnimation(topBlock.threejs.position.x, topBlock.threejs.position.y - 2, topBlock.threejs.position.z, new THREE.Color(`hsl(${180 + blocks.length * 4}, 100%, 65%)`)));

        if (topBlockDirection == 'x') {
            newX = 0;
            newZ = -45;
            newDirection = 'z';
        }
        else {
            newX = -45;
            newZ = 0;
            newDirection = 'x';
        }

        const newWidth = initBlockWidth
        const newDepth = initBlockDepth

        addBlock(newX, newZ, newWidth, newDepth, newDirection);
    }
    else {
        isStarted = true;
        infoDiv.style.display = 'none';
        renderer.setAnimationLoop(animation);

    }
});

function animation() {
    const blockSpeed = 0.2*Math.log(score+2);

    const topBlock = blocks[blocks.length - 1];
    topBlock.threejs.position[topBlock.direction] += blockSpeed;

    if (camera.position.y < initBlockHeight * (blocks.length - 2) + 20) {
        camera.position.y += blockSpeed;
    }
    renderer.render(scene, camera);
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
