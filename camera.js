export class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.position = { x: 0, y: 60, z: 0 };
        this.rotation = { x: 0, y: 0 };
        
        this.velocity = { x: 0, y: 0, z: 0 };
        this.gravity = -0.08;
        this.speed = 0.25;
        this.friction = 0.8;
        
        this.mouseSensitivity = 0.002;
        this.lookLocked = false;
        
        this.keys = {};
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
        
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onMouseDown(e) {
        if (e.button === 0) {
            this.lookLocked = true;
            this.canvas.requestPointerLock();
        }
    }

    onMouseMove(e) {
        if (this.lookLocked && document.pointerLockElement === this.canvas) {
            this.rotation.y += e.movementX * this.mouseSensitivity;
            this.rotation.x -= e.movementY * this.mouseSensitivity;
            
            this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
        }
    }

    onMouseUp() {
        this.lookLocked = false;
        document.exitPointerLock();
    }

    onKeyDown(e) {
        this.keys[e.code] = true;
        
        if (e.code === 'Space' && this.onGround) {
            this.velocity.y = 0.5;
        }
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
    }

    update(deltaTime) {
        const moveSpeed = this.speed * deltaTime * 60;
        
        let dx = 0;
        let dz = 0;
        
        if (this.keys['KeyW']) dz -= moveSpeed;
        if (this.keys['KeyS']) dz += moveSpeed;
        if (this.keys['KeyA']) dx -= moveSpeed;
        if (this.keys['KeyD']) dx += moveSpeed;
        
        const cosY = Math.cos(this.rotation.y);
        const sinY = Math.sin(this.rotation.y);
        
        this.velocity.x += dx * cosY - dz * sinY;
        this.velocity.z += dx * sinY + dz * cosY;
        
        this.velocity.x *= this.friction;
        this.velocity.z *= this.friction;
        this.velocity.y += this.gravity;
        
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;
        
        if (this.position.y < 2) {
            this.position.y = 2;
            this.velocity.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
    }

    getViewMatrix() {
        const cosX = Math.cos(this.rotation.x);
        const sinX = Math.sin(this.rotation.x);
        const cosY = Math.cos(this.rotation.y);
        const sinY = Math.sin(this.rotation.y);
        
        const frontX = sinY * cosX;
        const frontY = -sinX;
        const frontZ = cosY * cosX;
        
        const rightX = cosY;
        const rightZ = -sinY;
        
        const upX = -sinY * sinX;
        const upY = cosX;
        const upZ = -cosY * sinX;
        
        const tx = -(rightX * this.position.x + rightZ * this.position.z);
        const ty = -(upX * this.position.x + upY * this.position.y + upZ * this.position.z);
        const tz = -(frontX * this.position.x + frontY * this.position.y + frontZ * this.position.z);
        
        return [
            rightX, 0, rightZ, tx,
            upX, upY, upZ, ty,
            frontX, frontY, frontZ, tz,
            0, 0, 0, 1
        ];
    }

    getProjectionMatrix(aspect) {
        const fov = Math.PI / 3;
        const near = 0.1;
        const far = 1000;
        
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        
        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0
        ];
    }
}