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


function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x82eefd);

    addBlock(0, 0, initBlockWidth, initBlockDepth);
    addBlock(-40, 0, initBlockWidth, initBlockDepth, "x");

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

    document.body.appendChild(renderer.domElement);
}

function addBlock(x, z, width, depth, direction) {
    const y = initBlockHeight * blocks.length;

    const block = generateBlock(x, y, z, width, depth);
    block.direction = direction;

    blocks.push(block);
}

function generateBlock(x, y, z, width, depth) {
    const geometry = new THREE.BoxGeometry(width, initBlockHeight, depth);

    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
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

        if (topBlockDirection == 'x') {
            newX = 0;
            newZ = -40;
            newDirection = 'z';
        }
        else {
            newX = -40;
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
    const blockSpeed = 0.2;

    const topBlock = blocks[blocks.length - 1];
    topBlock.threejs.position[topBlock.direction] += blockSpeed;

    if (camera.position.y < initBlockHeight * (blocks.length - 2) + 20) {
        camera.position.y += blockSpeed;
    }
    renderer.render(scene, camera);
}

init();
