'use strict';

const version = 'v2.0.0.1';

if (DEBUG) console.log("init " + version);

//this will need to be modified by performance conditions

//Vessel rendering done
//const rendered = new Event('rendered');
//const datachangedenvironment = new Event('datachangedenvironment');
//const datachangedvessel = new Event('datachangedvessel');

//Manage processing completion & messaging client (who pauses until done)
//const processingComplete = {
//	count: 0,
//	Register: function() {
//		if (DEBUG) console.log("Register..");	
//		this.count++;
//		//Stop();
//	},
//	Update: function () {
//		if (DEBUG) console.log("Update..");	
//		if (--this.count == 0) {
//			//
//			//Handle end of Model Update
//			//
//			//We are hamdling through events
//			//Pattern: model is changed, event fires, and then animation() started again when all changes in.
//			processing = false;
//			if (DEBUG) console.log("Processing complete");
//			//Start();
//			window.MessageClient("PROCESSED");
//		}
//	}
//}

//ProcessingComplete.prototype.Register = function(n) { this.count++ };
//ProcessingComplete.prototype.Update = function() {
//	if (--this.count == 0) {
//		if (DEBUG) console.log("Processing complete");
//		//document.Start();
//		window.MessageClient("PROCESSED");
//	}
//}
//const processingComplete = new ProcessingComplete();
//


const BARGE = 0;
const HULL = 1;
const LOADOUT = 2;

const MAXMSPF = Math.ceil(1000 / 1000);			//ms per frame
const STATSON = false;
const FLY = false;

if (LOG) if (DEBUG) console.log("Init Version " + version);

const getStackTrace = function () {
	if (DEBUG) console.log("Trying get stack strace...");
	try {
		var a = {};
		a.debug();
	} catch (ex) {
		return (ex.stack);
	}
};

window.onbeforeunload = function () {
	document.dispose();
	console.log("Disposed");
    //return "Do you really want to close?";
};

//Done initial script
//const isPageLoaded = new Event('isPageLoaded');
//Scene drawn
//const isloaded = new Event('isloaded');
//Operation complete
//const isprocessed = new Event('isProcessed');


//
// App state
//
let pageLoaded = false;		//page all read
let assetsLoaded = false;	//assets ready
let firstpass = true;		//controls whether to setup whole scene again, or just update
let isLoading = false;		//whether currently loading new scene
let sceneLoaded = false;	//scene sceneLoaded
let running = false;		//start/stop control this
//let processing = false;	//model changes. UNUSED

//
// Events. attach to container
//
const eVesselmoved = new Event("vesselmoved");
const eVesseldatachanged = new Event("vesseldatachanged");
const eObjectattributechanged = new Event("objectattributechanged");
//const eBitfieldchanged = new Event("bitfieldchanged");
//eBitfieldchanged.mask = 0;	//use this to decide who changed


//=Page Events
//page read
//Load assets
//take user init (or DATAIN if auto) and setup scene (with assets)
//SCENELOADED final event
/*
window.onbeforeunload = function (event) {
	if (DEBUG) console.log("Dispose on window unload");
	//if (AUTOSTART) {
	document.dispose();
	//}
};
*/

//This deesn't need be in window DOM
window.MessageClient = function (str) {

	if (AUTOSTART) return;

	//#TODO remove these. Switched to safer return pattern
	//Note: ASSETSLOADED still used!

	switch (str) {
		case "PAGELOADED":
			window.chrome.webview.postMessage("isPageLoaded");
			break;
		case "ASSETSLOADED":
			window.chrome.webview.postMessage("isAssetsLoaded");
			break;
		case "SCENELOADED":
			window.chrome.webview.postMessage("isloaded");
			break;
		case "PROCESSED":			//Partial model updates complete			
			window.chrome.webview.postMessage("isprocessed");
			break;
		default:
			break;
	}
}

//val = 0 to 100
function updateProgress(val) {
	let al = document.getElementById("assetloader");
	if (al != undefined) al.value = val;

}

//GET ASSETS ASAP. NO stalls script. Do delayed by client
//document.LoadAssets();

//document.getElementById('demobanner').innerHTML = "Optimoor 3D Demo <span style='font-size:10pt'>" + version + "</span>";

//ms -> fps (inv power)
//10 -> 9.5
//15 -> 12
//30 -> 20
//60 -> 30

//const SCENEADD = 23;
const GROUND = 1;
const BERTH = 2;
const SHIP = 4;
const DECK = 8;
const LINES = 16;
const ORTHO = 32;
const SCENEADD = GROUND | BERTH | SHIP | DECK | LINES | ORTHO;

//Embed in App: comment out init() @ 400. App calls this itself

//NOTE: in THREE z is up!!!

//NOTES:
//World View Dims
//x: left to right = +ve to -ve
//z: behind to front = -ve to +ve
//rotation: +ve anticlock
//New object faces to z +ve (so we see its behind). 0 degs is ahead.
//Right-Handed System (index = x, second = y, thumb = z) x->y is anti-clockwise

//Ship-World coords: bow +ve, stern -ve (reverse of world)

/*
//Ship-World coords: bow +ve, stern -ve (reverse of world)

look at stbd (starboard on shore side)
x: +aft      -bow
y: up
z: -stbd to +port


Optimoor
look at port (starboard on shore side)
x: -bow +aft				(agree)
y: -port + stbd
z: = y	(up)

Apply Transforms before exporting. Manipulation of geometries assumes that they are absolute not relative to parent.

*/

//OVERLAY to see changes

const container = document.getElementById('container');

document.body.style.cursor = "crosshair";
//document.body.style.cursor="none";

//
// Util functions
//


//Keep copy of added event listeners so can remove, and so don't add twice
window.EVENTLISTENERS = {};

function addEventListenerSafe(type, listener, useCapture, listenername) {

	if (useCapture === undefined) useCapture = false;

	const name = (listenername) ? listenername : String(this) + type + this.name + this.id;

	const exEl = window.EVENTLISTENERS[name];

	if (exEl) {
		this.removeEventListener(exEl[1], exEl[2], exEl[3]);
	}

	window.EVENTLISTENERS[name] = [this, type, listener, useCapture];

	this.addEventListener(type, listener, useCapture);

}

function removeEventListeners() {
	for (const [name, el] of Object.entries(window.EVENTLISTENERS)) {
		el[0].removeEventListener(el[1], el[2], el[3]);
		delete window.EVENTLISTENERS[name];
	}
}

//Addsafe event listeners (avoids duplicates, and cleanly removes object captures on dispose)
HTMLDocument.prototype.addEventListener2 = addEventListenerSafe;
HTMLInputElement.prototype.addEventListener2 = addEventListenerSafe;
THREE.EventDispatcher.prototype.addEventListener2 = addEventListenerSafe;//controls
container.addEventListener2 = addEventListenerSafe;

//iterate properties shorthand
Object.forEach = function (dictionary, action) {
	for (var key in dictionary) {
		// check if the property/key is defined in the object itself, not in parent
		if (dictionary.hasOwnProperty(key)) {
			action(key, dictionary[key]);
		}
	}
}

/*
	apply const instead or let/var
	delete unused objects!
*/


function toggleHidden() {
	if (DEBUG) console.log("toggle hidden");
	//camera.layers.enable( LAYER_HIDEABLE );
	camera.layers.toggle(LAYER_HIDEABLE);
	/*
	scene.traverse(function(child) {
		if (child.layer == LAYER_HIDEABLE) {
			obj.visible = !obj.visible; 
		}
	})
	*/

}

function setToggleHidden(vis) {
	camera.layers.disable(LAYER_HIDEABLE);
	/*
	//TODO: why are pushed meshes being added to a parent mesh?
	if (DEBUG) console.log(hideableObjects);
	if (DEBUG) console.log(hideableObjects[0].length);
	if (DEBUG) console.log(hideableObjects[0]);
	if (DEBUG) console.log(hideableObjects[1]);
	if (DEBUG) console.log(hideableObjects[2]);
	hideableObjects.forEach(function(obj, idx) {
		obj.visible = vis;
	});
	*/
}


function SetParameter(name, json) {
	//todo1: validate that not code. It will be evaluated!!!!

	switch (name) {
		case "SETCAMERA":
			//[posx,py,pz,rotx,ry,rz,targetx,ty,tz]
			const c = eval(json);
			camera.position.set(c[0], c[1], c[2]);
			camera.rotation.set(c[3], c[4], c[5]);
			camera.lookAt(new THREE.Vector3(c[6], c[7], c[8]));
			break;
		case "TOGGLEHIDDEN":
			toggleHidden();
			break;
	}
}; document.SetParameter = SetParameter;

//
// End Utils
//

//MODEL NOTE:
//x = right 2 left!, y = down to up, z = behind to front
//Ship Zero: centreLine, midship on deck

//todo1
//need unload references properly

//import { DATA } from './data/Himeji.js';
import './js/globals.js';
import * as THREE from './js/three.module.js';
import { GLTFLoader } from './js/GLTFLoader.js';
import { Sky } from './js/Sky.js';
import Stats from './js/stats.module.js';
//import { OutlinePass } from './js/OutlinePass.js';
//import { OBJLoader } from './js/OBJLoader.js';
import { OrbitControls } from './js/OrbitControls.js';
import { TransformControls } from './js/TransformControls4.js';
import { EditorControls } from './js/EditorControls.js';
//import { TrackballControls } from './js/TrackballControls.js';
//import { OOrbitControls } from './js/OOrbitControls.js';
//import { FlyControls } from './js/FlyControls2.js';
//import { EffectComposer } from './js//EffectComposer.js';
//import { RenderPass } from './js/RenderPass.js';
//import { PMREMGEN } from './js/PMREMGenerator.js';
//Common
import {
	OBJPARAMS,
	MAPS,
	WINCHDATA2WINCH,
	LAYER_DEFAULT,
	LAYER_HIDEABLE,
	LAYER_PERSENV,
	LAYER_ORTHENV,
	LAYER_TEXT,
	LAYER_COLLISION,
	LAYER_LABEL_DECK,
	LAYER_LABEL_QUAY,
	LAYER_LABEL_FENDER,
	LAYER_LABEL_FAIRLEAD,
	LAYER_LABEL_LINE,

} from './js/const.js';
import { Algotec } from './js/Algotec.js';
import { Common } from './js/common.js';
//Components
import { Berth } from './js/drawBerth.js';
import { Ship } from './js/drawship.js';
import { DeckObj } from './js/drawDeckObjects.js';
import { Lines } from './js/drawLines.js';
//Other
import { Metavar } from './js/metavar.js';
import { Replay } from './js/replay.js';
import { Ruler } from './js/ruler.js';
//import { Gerstner } from './js/Gerstner.js';
import { CSS2DRenderer } from './js/CSS2DRenderer.js';
//import { CSS3DRenderer } from './js/CSS3DRenderer.js';
import { Banner } from './js/Banner.js';
import { OBB } from './js/OBB.js';



//
//Main setup
//

//
//Globals
//

let requestId;

//let water, waterspeed = 1; //keep ref for efficiency as used in animate
let waterspeed = 1; //keep ref for efficiency as used in animate
let camera, stats, gimbal;
let cubeCamera;
let transformcontrol;

let controls = { changed: false }; //needed. Enable late assignment


let LineTools = {
	lineA: null,
	lineB: null,
	matA: null,
	matB: null,
	title: "Line Tools",
	reset: function() {
		this.lineA.material = CACHE.getMaterial(this.matA);
		if (this.lineB) this.lineB.material = CACHE.getMaterial(this.matB);
		this.lineA = null;
		this.lineB = null;
		scene.removeObjectByName("linetoolsflag");
		scene.removeObjectByName("nearestbeam");
	},
	
	html: function(dist) {

		const parseA = this.ParseLine(this.lineA.parent.name);
		let html = `<div>A: ${parseA[1]} / section ${parseA[2]}</div>`;
		if (this.lineB) {
			const parseB = this.ParseLine(this.lineB.parent.name);		
			html += `<div>B: ${parseB[1]} / section ${parseB[2]}</div>`;
		}
		if (dist) html += `<div>Distance: ${Math.roundp(dist,1000)}m</div>`;
		return html;
	},

	Show: function() {
		const dist = this.process();
		Common.MessageBox("linetools", "Line Tools", this.html( dist ), () => LineTools.reset(), true);
	},

	ParseLine: (name) => {
		//line-21~2/g
		const p1 = name.split('~');
		let p2;
		if(p1.length > 1) {
			const p2 = p1[1].split('/');
			return [true, p1[0], p2[0]];
		}
		//is guest, line name, section
		return [false, p1[0], p1[1]];
	},
	
	process: function () {
		this.lineA.updateWorldMatrix(true);
		this.lineB.updateWorldMatrix(true);
		const a = new THREE.Vector3(this.lineA.len * this.lineA.scale.x,0,0);
		a.applyQuaternion( this.lineA.getWorldQuaternion() )
		//a.applyMatrix4( this.lineA.matrixWorld );
		const b = new THREE.Vector3(this.lineB.len * this.lineB.scale.x,0,0);
		b.applyQuaternion( this.lineB.getWorldQuaternion() )
		const startA = this.lineA.getWorldPosition2().sub( a.clone().multiplyScalar(0.5) );
		const startB = this.lineB.getWorldPosition2().sub( b.clone().multiplyScalar(0.5) );
		const p = startB.clone().sub( startA );
		
		const res = a.minDistConstrained(p, b);

		const posA = startA.clone().add(res[0])
		const posB = startB.clone().sub( p ).add(res[1])

		const line = Common.lineMesh( [ posA, posB ] , 0xFFFFFF );
        line.name = "nearestbeam";
		scene.safeAdd(line);

		const flagmat = (res[2] < 0.15) ? CACHE.getMaterial('red0.5') :  CACHE.getMaterial('amber0.5');
		document.addFlag("linetoolsflag", scene, posA, posB, flagmat);

		/*
		const geometry = new THREE.SphereGeometry(0.5, 32, 16 ); 
		const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
		const sphere = new THREE.Mesh( geometry, material );
		sphere.position.copy( posA )
		scene.add( sphere );

		const sphere1 = new THREE.Mesh( geometry, material );
		sphere1.position.copy( posB )
		scene.add( sphere1 );
		*/
		return res[2];
	}
}


//let orientation;
//const gimbal = new THREE.Group();
//let composer, effectFXAA, outlinePass;

//
//
//

//helper arrays
//Used with raycaster to limit what user interacts with
var detectableObjects = [];
var collisionObjects = {};
//var objInfo = {};
//var boatCollection = new Array();
//var linesCollection = new Array(new Array());			//used for removing + hiding
//let envCollection = new Array();
//let orthEnvCollection = new Array();
//let hideableObjects = new Array();

//todo1: add both then can swap between them (for demo) then make it static again
let solidBerthObjects = [];
let pillarBerthObjects = [];

window.addEventListener('resize', onWindowResize, true);

container.renderer = null;
container.labelrenderer = null;

function SetUpRenderer(renderer) {
	if (DEBUG) console.log("Setup Renderer");

	//if (DEBUG) console.log(":" + container.renderer);

	RemoveRenderers()
	
	container.textContent = '';
	container.style.display = 'none';
	container.style.display = 'block';

	if (DEBUG) console.log("create renderer");

	//These don't have any effect after rendered created 
	container.renderer = new THREE.WebGLRenderer({
		antialias: true,						//needed for lines
		preserveDrawingBuffer: false,
		alpha: true,								//needed by CSSRenderer
		debug: false
	});

	container.renderer.gammaFactor = 1.8;		//was 1.8 should be 2.2
	//container.renderer.gammaOutput = false;	//true crahses fps
	container.renderer.debug.checkShaderErrors = false;
	container.renderer.shadowMap.enabled = false;
	//container.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
	container.renderer.shadowMap.autoUpdate = false;
	container.renderer.sortObjects = false;
	//taking over this
	//container.renderer.autoClear = false;

	//#TODO test GPU performance and reduce density if needed

	container.renderer.setPixelRatio(window.devicePixelRatio * GetPixelDensity());
	container.renderer.setSize(window.innerWidth, window.innerHeight);
	container.renderer.domElement.style.position = 'absolute';
	container.renderer.domElement.style.top = 0;
	container.renderer.domElement.style.zIndex = '-2';
	//container.renderer.domElement.style.zIndex = '1';	//Set on top!
	container.appendChild(container.renderer.domElement);

	document.addEventListener2("webglcontextlost", function (e) {
		alert("Context lost. Please restart.");
		e.preventDefault();
	}, false);

	if (DEBUG) console.log("Number of Geo @ setup Renderer:", container.renderer.info.memory.geometries);

	//#TODO do we need to keep these refs or use document.getElementById( 'container' )?

	//Renderer for object labels
	container.labelrenderer = new CSS2DRenderer();
	container.labelrenderer.setSize(window.innerWidth, window.innerHeight);
	container.labelrenderer.domElement.style.position = 'absolute';
	container.labelrenderer.domElement.style.top = '0px';
	container.labelrenderer.domElement.style.zIndex = '2';
	container.appendChild(container.labelrenderer.domElement);
}

function RemoveRenderers() {
	if (container.labelrenderer) {
		if (DEBUG) console.log("cleanup labelrenderer");
		const labelrenderer = container.labelrenderer;
		container.removeChild(labelrenderer.domElement);		
		delete container.labelrenderer;
		//labelrenderer.forceContextLoss();//fails
		//labelrenderer.dispose();//XSS rejects this
		if (DEBUG) console.log("#Labelrenderer removed (not disposed)!");
	}

	if (container.renderer) {
		if (DEBUG) console.log("cleanup renderer");
		const renderer = container.renderer;
		container.removeChild(renderer.domElement);
		delete container.renderer;		//pointless by why not
		renderer.forceContextLoss();
		renderer.dispose();
		if (DEBUG) console.log("#Renderer Disposed!");
	}

}

//UHD 2160p
//Full HD 1080p
//HD 720p
//SD 480
function GetPixelDensity(level, hiload) {
	if (level === undefined) level = 2;
	if (hiload === undefined) hiload = 0;
	level -= hiload;
	if (level < 0) level = 0;

	let p_ht;

	switch (level) {
		case 0:
			p_ht = 480;
			break;
		case 1:
			p_ht = 720;
			break;
		case 2:
			p_ht = 1080;
			break;
		case 3:
			p_ht = 2160;
			break;
	}

	return Math.min(1, p_ht / screen.height);
}

//Performance
/*
if (DEBUG) console.log( "PERFORMANCE" );
if (DEBUG) console.log( renderer );
if (DEBUG) console.log( renderer.domElement );
var gl = renderer.domElement.getContext("webgl");
if (DEBUG) console.log( gl );
*/

//Create Scene
let scene = new THREE.Scene();
scene.name = "Optimoor3D";

//end Main setup



//
// ASSETS
//

document.LoadAssets = function () {
	
	assetsLoaded = false;

	//Load ManagerAssets
	let manager = new THREE.LoadingManager();
	manager.onStart = function (url, itemsLoaded, itemsTotal) {
		if (DEBUG) console.log('Loading started...');
	};

	// 2 pass loading. First OnLoad signals loading of Object assets (needed to create scene). CreateScene can now be called. 2nd pass indicated textures and CreateScene has run. 
	manager.calledCreate = false;
	manager.onLoad = function () {
		//Note: this gets called before last onProgress

		//Assets sceneLoaded
		if (DEBUG) console.log("ASSETS SCENELOADED");

		//The way this works any errors still get captured  by manager
		manager.onError = function () { }


		//preprocess raw geometries
		//Note putting this in load callback caused Chrome sometimes to report error loading.
		Ship.InitHull();

		
		//
		//ASSETSLOADED
		//

		assetsLoaded = true;
		updateProgress(66);


		////Auto init if jsoncache exists
		//if (jsonCache) {
		//	document.init(jsonCache);
		//	jsonCache = null;
		//	return;
		//} else if (AUTOSTART) {
		//	document.init(DATAIN);
		//}

		//Only calls if init cache not called

		window.MessageClient("ASSETSLOADED");
		//Client to pop own msg stack now, or have event to make request

		//Simulate User making page init request
		if (AUTOSTART) {
				document.init(DATAIN, false);
		}

	};

	manager.onProgress = function (url, itemsLoaded, itemsTotal) {
		//Note: oNload gets called before last onProgress. So -1.
		//let al = document.getElementById("assetloader");
		//if (al != undefined) al.value = (itemsLoaded - 1) / itemsTotal * 100;
		//if (DEBUG) console.log( 'Progress.....' + url + "(" + itemsLoaded +"/" + itemsTotal + ")");
	};

	manager.onError = function (url, e) {
		alert("Sorry there was a problem loading the page. Please try to reload.");

		if (e && DEBUG) {
			alert(e);
			alert('There was an error loading ' + url);
		}

	};



	//Load Assets
	const textureLoader = new THREE.TextureLoader(manager);

	const fontloader = new THREE.FontLoader(manager);

	//#TODO this needs to created dynamically according to res folder
	const glbloader = new GLTFLoader(manager).setPath('./res_low/');		//res
	//const objloader = new OBJLoader(manager);

	//Note: all objects record the lines they are connected to
	//Note: load small assets at end as risk of manager ending before all sceneLoaded

	//DeckObj.SetupGLBAssets(glbloader);
	//DeckObj.SetupOBJAssets(objloader);

	[OBJPARAMS.CABINSRC, OBJPARAMS.TANKSRC, OBJPARAMS.TANKSRC5, OBJPARAMS.COVEREDSRC, OBJPARAMS.PRISMSRC, OBJPARAMS.CO2SRC].forEach(function (asset) {
		if (!CACHE.ASSETS[asset]) glbloader.load(asset, function (gltf) {
			gltf.scene.TurnOffUpdate();
			CACHE.ASSETS[asset] = gltf.scene;
		});
	});

	//HULLS
	[OBJPARAMS.HULLSRC, OBJPARAMS.TUGSRC].forEach(function (asset) {
		if (!CACHE.ASSETS[asset]) glbloader.load(asset, function (gltf) {
			//set rotation X = 0
			gltf.scene.TurnOffUpdate();
			gltf.scene.updateMatrix();
			CACHE.ASSETS[asset] = gltf.scene;
		});
	});

	//if (!CACHE.ASSETS[OBJPARAMS.HULLSRC]) objloader.load("./res/OBJ/" + OBJPARAMS.HULLSRC, function (model) {
	//	model.TurnOffUpdate();
	//	model.updateMatrix();
	//	CACHE.ASSETS[OBJPARAMS.HULLSRC] = model;
	//});

	//if (!CACHE.ASSETS[ASSETSRC.TUBHULLSRC]) objloader.load("./res/OBJ/" + ASSETSRC.TUBHULLSRC, function (model) {
	//	model.TurnOffUpdate();
	//	model.updateMatrix();
	//	CACHE.ASSETS[ASSETSRC.TUBHULLSRC] = model;
	//});

	//Berth.SetupAssets(DATA, textureLoader);

	//Bollards
	if (!CACHE.ASSETS[OBJPARAMS.BOLLARDSRC]) glbloader.load(OBJPARAMS.BOLLARDSRC, function (gltf) {
		//gltf.scene.TurnOffUpdate();
		//gltf.scene.scale.set(0.3,0.3,0.3);		
		//gltf.scene.ApplyTransforms();
		//gltf.scene.updateMatrix();
		gltf.scene.objType = "bollard";
		gltf.scene.scale.set(0.8,1,0.8);
		CACHE.ASSETS[OBJPARAMS.BOLLARDSRC] = gltf.scene;
	});

	//Winch	
	//[OBJPARAMS.WINCHSRC.i1, OBJPARAMS.WINCHSRC.i202, OBJPARAMS.WINCHSRC.i321, OBJPARAMS.WINCHSRC.i312, OBJPARAMS.WINCHSRC.i303].forEach(function (winchsrc) {
		[OBJPARAMS.WINCHSRC.i1].forEach(function (winchsrc) {
		if (!CACHE.ASSETS[winchsrc]) glbloader.load(winchsrc, function (gltf) {
			//Common.colourChildren(gltf.scene, '#222222');

			//Need to map Model Attachment points to Optimoor terminations
			//Get attachment point poistion (world)
			//Get line termination position (world)
			//record the delta

			//This delta move the Winch so that its attach point match the optimoor termination points.
			//After that we need add/sub this delta to winchs to match the lines!

			//but actually can't we put the winch in a object and move the object!!!
			//WAY TO GO
			//Likewise actually

			//So just as we have a MapShipToWorld

			//if you incorp here you change rotation centre. Just incorp into winch position!

			/*
			//#TODO examine this
			const trans = OBJPARAMS.WINCHPOS[winchsrc];//.multiplyScalar( wch[ WINCHPOSITION.SCALE ] )

			gltf.scene.position.copy(trans);

			let container = new THREE.Object3D();
			container.add(gltf.scene);

			container.TurnOffUpdate();

			container.objType = "winch";

			CACHE.ASSETS[winchsrc] = container;
			*/

			gltf.scene.traverse(child => {
				if (child.material) child.material = CACHE.getMaterial('materialBlack')
			});

			gltf.scene.objType = "winch"
			CACHE.ASSETS[winchsrc] = gltf.scene;

		});
	});
	
	//Fairleads
	if (!CACHE.ASSETS[OBJPARAMS.FAIRLEADSRC]) glbloader.load(OBJPARAMS.FAIRLEADSRC, function (gltf) {
		Common.colourChildren(gltf.scene, '#ff0000');
		gltf.scene.objType = "fairlead"
		CACHE.ASSETS[OBJPARAMS.FAIRLEADSRC] = gltf.scene;
	});

	//Rollersrc
	if (!CACHE.ASSETS[OBJPARAMS.ROLLERSRC]) glbloader.load(OBJPARAMS.ROLLERSRC, function (gltf) {
		Common.colourChildren(gltf.scene, '#ff0000');
		gltf.scene.objType = "fairlead"
		CACHE.ASSETS[OBJPARAMS.ROLLERSRC] = gltf.scene;
	});

	//Ruler
	if (!CACHE.ASSETS[OBJPARAMS.RULERSRC]) glbloader.load(OBJPARAMS.RULERSRC, function (gltf) {
		CACHE.ASSETS[OBJPARAMS.RULERSRC] = gltf.scene;
	});

	// Fonts
	if (!CACHE.FONT) fontloader.load('./res/helvetiker_regular.typeface.json', function (font) {
		CACHE.FONT = font;
	});

	Berth.SetupAssets(CACHE, textureLoader);

	['waternormals.jpg'].forEach(function (src) {
		textureLoader.load("./res/textures/" + src, function (texture) {
			CACHE.TEXTURES[src] = texture;

			if (src == "waternormals.jpg") {
				CACHE.TEXTURES[src].wrapS = CACHE.TEXTURES[src].wrapT = THREE.RepeatWrapping;
			}
		})
	});

	//Preload images
	document.PRELOADIMG = {};
	["./res/icon_move25.png", "./res/icon_rotate25.png", "./res/icon_scale25.png", "./res/icon_save25.png", "./res/icon_cancel25.png"].forEach(
		(src) => {
			document.PRELOADIMG[src] = new Image();
			document.PRELOADIMG[src].src = src;
		}
	); 
}

//Why not just get assets immediately? slightly sync to avoid poss of coming in before page
//document.LoadAssets();



//
// End Assets
//





var ruler;
//var clock = new THREE.Clock();

//General purpose raycaster
const raycaster = new THREE.Raycaster();

if (STATSON) {
	if (stats) stats.dispose();
	stats = new Stats();
	//stats.showPanel(2); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild(stats.dom);
}

//const black = new THREE.MeshBasicMaterial( { color: 0x000000 } );
CACHE.addMaterial('red0.5', new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 }));
//const highlightamber = new THREE.MeshBasicMaterial({color: 0xffdd00});
//const highlightred50 = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.5 });
CACHE.addMaterial('amber0.5', new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.5 }));
CACHE.addMaterial('materialBlack', new THREE.MeshStandardMaterial({color: 0x555555}));

//table Objects
//Required for raycasts, popup info
//Required for interacting object: raycasts, popup info
//@info: display info. Note: also used as adhoc ID with bmAbsRel
//@param: bmAbsRel: 2xbit mask Absolute/Relative. Determines whether to display absolute or relative pos in Info.
function addDetectableObject(obj, title, info, bmAbsRel) {

	//remove duplicate copies of object (use name)
	if (obj.name == "" && DEBUG) {
		if (DEBUG) console.log("DOs needs an object name...");
		if (DEBUG) console.log(title);
		if (DEBUG) console.log(info);
		//if (DEBUG) console.log(getStackTrace());
	}

	//check existing entries by name
	let index = -1;
	for (let idx = 0; idx < detectableObjects.length; idx++) {
		if (detectableObjects[idx].name == obj.name) {
			index = idx;
			break;
		}
	}

	if (index > -1) {
		//if (DEBUG) console.log("Removing: " + detectableObjects[index].name)
		detectableObjects.splice(index, 1); // 1 = remove 1 item
	}

	//if (DEBUG) console.log("Pushing: " + obj.name)
	detectableObjects.push(obj);
	//Important to pair as info is used to bubble up to object level
	obj.info = { title: title, detail: info };
	obj.bmAbsRel = bmAbsRel;
	//obj.info = {title: title, detail: info};	
	//AsyncCommon.addTextObject( obj );
}

DATA.removeDetectableObject = function (obj) {

	//remove duplicate copies of object (use name)
	if (obj.name == "" && DEBUG) alert("DOs needs an object name");

	//check existing entries by name
	let index = -1;
	for (let idx = 0; idx < detectableObjects.length; idx++) {
		if (detectableObjects[idx].name == obj.name) {
			index = idx;
			break;
		}
	}

	if (index > -1) {
		//if (DEBUG) console.log("Removing: " + detectableObjects[index].name)
		detectableObjects.splice(index, 1); // 1 = remove 1 item
	}
}

//let jsonCache = null;

//Inject a case to start 3D
//Inject async, if assets not sceneLoaded will cache until ready.

function DisplayError(msg) {
	if (!msg) msg = "Incomplete data.Render cancelled.";
	document.getElementById('curtain').className = "Loaded";
	document.body.innerHTML = `<div style='width:90%;text-align:left;margin:auto;color:#70EE70;font-style:courier;font-size:10pt;'>${msg}</div>`;
}


container.addEventListener2("objectattributechanged", (e) => SaveState(), false);

function SaveState() {

	if (!chrome.webview) return;
	
	const vsl3d = DeckObj.GetVSL3D(scene);

	chrome.webview.hostObjects.state3D.SetState( vsl3d );

	return true;

}

//container.addEventListener2("bitfieldchanged", (e) => BitFieldChanged(e.mask), false);
//function BitFieldChanged(mask) {
//	if (DEBUG) console.log(`On Bitfield change: mask: ${mask}`)
//}

/////////////////////////////////////////////////////////////////
//
// API
//

//returns "0" success. "1" fail (API for document.foo() cos WebView2 doesn't pass errors)
//otherwise throws
//Handles isLoading state
document.init = function (json, update) {

	if (DEBUG) console.log("Start init");

	if (update !== true) update = false;//bool to indicate whether just change to model or new model

	if (!update) firstpass = true;

	Stop();//ensure stopped


	//saved 3D data.
	//Note: with an update this will call too and erase DATAVSL3D.
	//Note. Unlike with json we are not merging with DATA. But actually why?
	//#TODO can just override DATA like this!

	/*
	if (vsl3d) {
		var data;
		if (typeof vsl3d === 'object') {//init called by AUTOSTART
			DATAVSL3D = vsl3d;
		} else if (typeof vsl3d === 'string' || json instanceof String) {//init called from Optiomoor
			eval("DATAVSL3D = " + vsl3d);
		}
	}
	*/

	if (firstpass) {

		//This destroys the scene
		SetUpRenderer();

		//Used in drawship
		DATA.AddConst = function (name, value) {
			Object.defineProperty(this, name, {
				value: value,
				writable: false,
				enumerable: true,
				configurable: true
			});
		}

		DATA.VesselFacingTarget = (strHostGst, idx) => (DATA[strHostGst].VesselFacing == Common.BerthSidePort) ? DATA[strHostGst].portTarget[idx] : DATA[strHostGst].stbdTarget[idx];

		//Unused
		//Distance between Berth and Vessel Targets at Berth
		DATA.VesselOffsetBeyondBerthTarget = function (strHostGst) {

			//If BerthType % < LoadOut Then

			const loadout = false;

			let val;

			if (!loadout) {
				if (!strHostGst || strHostGst == "HOST") {
					//val = OffsetX(HOST) + ShipTarget(HOST, side % (HOST), Fwd) - BerthTarget * SidetoBerth % (HOST) //20 Jul 17 ShipTarget 0/1 is P/S, we need target on SideToBerth
					//val = DATA.HOST.offset.x + DATA.VesselFacingTarget("HOST", 0) - DATA.BerthTargetRO * DATA.HOST.VesselFacing; //20 Jul 17 ShipTarget 0/1 is P/S, we need target on SideToBerth
					val = DATA.HOST.offset.x + DATA.VesselFacingTarget("HOST", 0) - DATA.BerthTargetRO * DATA.HOST.VesselFacing; //20 Jul 17 ShipTarget 0/1 is P/S, we need target on SideToBerth
					//val is dist of berth target measured fwd from host ship target OffsetX is dist fwd of midship from berth datum.
				} else {
					//for the Guest ship, val is dist fwd on Guest from Guest targetGuest to Host targetGuest
					//OffsetX is dist fwd of midship from berth datum
					//val = ShipTarget(GUEST, side % (GUEST), Fwd) * SidetoBerth % (GUEST) //20 Jul 17 distance of guest targetGuest to right of guest midship
					val = DATA.VesselFacingTarget("GUEST", 0) * DATA.GUEST.VesselFacing; //20 Jul 17 distance of guest targetGuest to right of guest midship
					//val = val + OffsetX(GUEST) * SidetoBerth % (GUEST) // add distance of Guest midship to right of berth datum
					val = val + DATA.GUEST.offset.x * DATA.GUEST.VesselFacing; // add distance of Guest midship to right of berth datum
					//val = val - OffsetX(HOST) * SidetoBerth % (HOST) //subtract distance of host midship to right of berth datum
					val = val - DATA.HOST.offset.x * DATA.HOST.VesselFacing; //subtract distance of host midship to right of berth datum
					//val = val - ShipTarget(HOST, 1 - side % (HOST), Fwd) * SidetoBerth % (HOST) //20 Jul 17 subtract distance of offshore host targetGuest to right of Host midship
					val = val - DATA.VesselFacingTarget("HOST", 0) * DATA.HOST.VesselFacing; //20 Jul 17 subtract distance of offshore host targetGuest to right of Host midship
					//val = val * SidetoBerth % (GUEST)
					val = val * DATA.GUEST.VesselFacing

					//Note: DATA.GUEST.VesselFacing * DATA.GUEST.VesselFacing = 1

				}
			} else {
				//Else 'loadout
				//'.text = Trim$(Format$(VesselAngleToBerth%, "0°")) 'VesselAngleToBerth % only used loadout normally 0
				//End If
			}

			return val;
		}

		document.replay = new Replay();

		DATA.metavar = new Metavar();
		//Ship.SetupMetaVar(metavar, DATA.HOST) {

		//addObjectPos("spflataft", new THREE.Vector3(0, -deltapos.y, -deltapos.z ) )

		document.SetState(ORTHOGRAPHIC, false);//isPerspective set = true;


	}
	else {
		//container.removeChild(container.renderer.domElement);
		container.renderer.clear();
		//container.renderer.forceContextRestore();
	}


	//
	//If dynamic model updates are occurring then do not update whole model
	//
	
	if (json && pageLoaded && assetsLoaded && !isLoading) {
		
		isLoading = true;

		try {

			initMain(json);

			//if we got anything then apply to state
			applyVsl3D().then( res => {
				//resave state (ensure there is a current state cos many never be interacted with again!)
				//Note: no longer using page unload
				SaveState();
			});

			//
			// PAGE LOADED
			//

			//If failed then reset flags
			updateProgress(100);

			//if (res === true) {
			//use return value
			//	window.MessageClient("SCENELOADED");
			//	return 1;
			//} else {
			return 0;
			//}
		}
		catch (err) {
			let msg = "Error in scene load.";
			msg += (DEBUG) ? err.message + " | " + err.stack : "";
			if (DEBUG) {
				DisplayError(`<pre>${msg}</pre>`);
			}
			//console.log(msg);
			return msg;
		}
		finally {
			isLoading = false;
			//#TODO controversial should an exception stop the page?
			firstpass = false;
			sceneLoaded = true;
			if (DEBUG) console.log("sceneLoaded");
			Start();
			//Open curtain (if DOM still available)
			if (document.getElementById('curtain')) document.getElementById('curtain').className = "loaded";
		}
	}
}

async function applyVsl3D() {

	if (!chrome.webview) return;
	
	const vsl3d = await chrome.webview.hostObjects.state3D.GetState();

	if (!vsl3d) return;

	DeckObj.ApplyVSL3D(scene, vsl3d);

	return true;
}

function Start() {
	//See SCENELOADED event which ends this block and calls Start()
	if (running || !sceneLoaded || isLoading) return;

	running = true;
	animate();
	if (DEBUG) console.log("Running...");
}; document.Start = Start;


function Stop() {
	running = false;
	if (requestId) window.cancelAnimationFrame(requestId);
	if (DEBUG) console.log("Stopped...");
}; document.Stop = Stop;

//Just vessel updates
/*
document.UpdateShip = function (Xlongit, Ztrans, Yrot, Xlongit2, Ztrans2, Yrot2) {

	if (!scene) return;		//be sure

	if (!DATA.HOST) return;


	if (DATA.HOST.excursion.x != Xlongit || DATA.HOST.excursion.y != Yrot || DATA.HOST.excursion.z != Ztrans) {
		DATA.HOST.excursion = { x: Xlongit, y: Yrot, z: Ztrans };
		DATA.HOST.needsUpdate = true;
	}

	if (DATA.GUEST) {
		if (DATA.GUEST.excursion.x != Xlongit2 || DATA.GUEST.excursion.y != Yrot2 || DATA.GUEST.excursion.z != Ztrans2) {
			DATA.GUEST.excursion = { x: Xlongit2, y: Yrot2, z: Ztrans2 };
			DATA.GUEST.needsUpdate = true;
		}
	}

	processingComplete.Register();
	document.dispatchEvent(datachangedvessel);

}
*/
//Everything updates
//Return "none". Yes state. No event/throws.
document.UpdateModel = function (json) {

	if (!scene) return "no scene";		//be sure

	if (!DATA.HOST) return "no host";

	//processing = true;

	//Test
	//json = { "vecWind": [90.0, 20.0], "vecCurrent": [130.0, 1.0], "vecWaves": [80.0, 1.0, 6.0], "vecSwell": [50.0, 0.5, 12.0], "vecSurge": [0.0, 0.0, 60.0], "excursionH": { "x": 59.02, "y": -0.171914026, "z": 125.5 }, "excursionG": { "x": 67.34213, "y": -0.171914026, "z": 126.178833 }, "vecForceH": [-1.0911402444104084, 18.040205, 85.77723, -14.89332, "18 t"], "vecForceG": [0, 0, 0, 0, ""] };
	//if (json == "test")
	//json = { "vecWind": [90.0, 22.0], "vecCurrent": [130.0, 2.0], "vecWaves": [100.0, 3.0, 7.0], "vecSwell": [50.0, 4.5, 15.0], "vecSurge": [0.0, 0.0, 70.0], "excursionH": { "x": 59.02, "y": -0.171914026, "z": 125.5 }, "excursionG": { "x": 67.34213, "y": -0.171914026, "z": 126.178833 }, "vecForceH": [-1.0911402444104084, 18.040205, 85.77723, -14.89332, "18 t"], "vecForceG": [0, 0, 0, 0, ""] };
	//json = { "vecWind": [130.0, 22.0], "vecCurrent": [130.0, 1.0], "vecWaves": [80.0, 1.0, 6.0], "vecSwell": [50.0, 0.5, 12.0], "vecSurge": [0.0, 0.0, 60.0], "heightWater": 0.0, "excursionH": { "x": 59.02, "y": -0.171914026, "z": 125.5 }, "excursionG": { "x": 67.34213, "y": -0.171914026, "z": 126.178833 }, "vecForceH": [-1.0911402444104084, 25, 85.77723, -14.89332, "25 t"], "vecForceG": [0, 0, 0, 0, ""], "shipDraftH": 11.5, "shipDraftG": 9.74, "heaveH": 0.0, "heaveG": 1E-05, "clearanceH": 14.5, "clearanceG": 16.25999, "trimH": 0.0, "trimG": 0.0 };
	//document.MoveShip(Xlongit, Ztrans, Yrot, Xlongit2, Ztrans2, Yrot2);
	//if (json.excursionH.x && json.excursionH.y && json.excursionH.z && json.excursionG.x && json.excursionG.y && json.excursionG.z) {

	if (DEBUG) console.log("Update Model...");

	//Update DATA
	let env = false;
	let boatH = false;
	let boatG = false;
	let boatP = false;
	env |= UpdateModelItem(DATA, "vecWind", json.vecWind);
	env |= UpdateModelItem(DATA, "vecCurrent", json.vecCurrent);
	env |= UpdateModelItem(DATA, "vecWaves", json.vecWaves);
	env |= UpdateModelItem(DATA, "vecSwell", json.vecSwell);
	env |= UpdateModelItem(DATA, "vecSurge", json.vecSurge);
	env |= UpdateModelItem(DATA, "heightWater", json.heightWater);

	boatH |= UpdateModelItem(DATA, "catdata", json.catdata);
	boatH |= UpdateModelItem(DATA.HOST, "excursion", json.excursionH);
	boatH |= UpdateModelItem(DATA.HOST, "vecForce", json.vecForceH);
	boatH |= UpdateModelItem(DATA.HOST, "shipDraft", json.shipDraftH);
	boatH |= UpdateModelItem(DATA.HOST, "heave", json.heaveH);
	boatH |= UpdateModelItem(DATA.HOST, "clearance", json.clearanceH);
	boatH |= UpdateModelItem(DATA.HOST, "trim", json.trimH);

	boatG |= UpdateModelItem(DATA.GUEST, "excursion", json.excursionG);
	boatG |= UpdateModelItem(DATA.GUEST, "vecForce", json.vecForceG);
	boatG |= UpdateModelItem(DATA.GUEST, "shipDraft", json.shipDraftG);
	boatG |= UpdateModelItem(DATA.GUEST, "heave", json.heaveG);
	boatG |= UpdateModelItem(DATA.GUEST, "clearance", json.clearanceG);
	boatG |= UpdateModelItem(DATA.GUEST, "trim", json.trimG);

	boatP |= UpdateModelItem(DATA, "PASSINGpos", json.PASSINGpos);

	if (DEBUG) console.log("Update model done : " + env + "/" + (boatH || boatG));


	//#TODO this won't work as expected.
	//By time event has been dispatched Register++ will be -- and completion will fire.
	//So you actually just get 2 completions.

	if (env) {
		if (DEBUG) console.log("Env change...");

		//processingComplete.Register();

		//#TODO well great but you actually need to redraw the environment!
		//document.dispatchEvent(datachangedenvironment);
	}

	//Watch for when all complete
	if (boatH || boatG || boatP) {
		if (DEBUG) console.log("Vessel change...");
		DATA.HOST.needsUpdate = boatH;
		if (DATA.GUEST) DATA.GUEST.needsUpdate = boatG;
		if (DATA.PASSINGpos.Item1) DATA.PASSINGneedsUpdate = boatP;

		//processingComplete.Register();
		//if (boatH || boatG) document.dispatchEvent(datachangedvessel);

		//OnDataChangedVessel();
		container.dispatchEvent(eVesseldatachanged);
		
	}

	// Update Dynamic Display
	if (json.dyndisp) {
		const dyndisp = document.getElementById('dyndisp');
		dyndisp.innerHTML = `${json.dyndisp}`;
	}

	//processingComplete should complete when all events processed

	//if (json.excursionH)
	//	MoveShip(json);

	//if (json.vecWind && json.vecCurrent && json.vecWaves && json.vecSwell && json.vecSurge)
	//	UpdateEnvironment(json);

	//}

	//alert(json.vecWind);

	//Update arrows
	//let windArrow = scene.getObjectByName("arrow_current");
	//Common.updateArrowWTextCSS(windArrow, Common.AngD(json.vecCurrent[0], DATA.SceneToTrueNorth), json.vecCurrent[1]);
	//windArrow = scene.getObjectByName("arrow_waves");
	//Common.updateArrowWTextCSS(windArrow, Common.AngD(json.vecWaves[0], DATA.SceneToTrueNorth), json.vecWaves[1]);
	//windArrow = scene.getObjectByName("arrow_swell");
	//Common.updateArrowWTextCSS(windArrow, Common.AngD(json.vecSwell[0], DATA.SceneToTrueNorth), json.vecSwell[1]);
	//windArrow = scene.getObjectByName("arrow_surge");
	//Common.updateArrowWTextCSS(windArrow, Common.AngD(json.vecSurge[0], DATA.SceneToTrueNorth), json.vecSurge[1]);
	//windArrow = scene.getObjectByName("arrow_wind");
	//Common.updateArrowWTextCSS(windArrow, Common.AngD(json.vecWind[0], DATA.SceneToTrueNorth), json.vecWind[1]);

	//Make sure started

	//#TODO

	//document.Start();

	//window.MessageClient("PROCESSED");

	//meaning let me handle the consequences.
	return 0;

};

//Update model if new data and notify client with bool
function UpdateModelItem(model, key, value) {

	if (!model) return;//Most likely GUEST = null

	let a, b;

	if (Array.isArray(model[key])) {
		//Arrays will string
		a = model[key].toString();
		b = value.toString();
	} else if (typeof (model[key]) == "object") {
		//no further fine grain. Force difference
		//#TODO can we compare objects
		a = "a";
		b = "b";
	} else {
		//compare actual values
		a = model[key];
		b = value;
	}

	if (value) {
		if (a != b) {
			//if (model[key] != value) {
			model[key] = value;
			return true;
		}
	}
	return false;
}



//Unused
//function DeltaShip(objName, Xtrans, Ytrans, Ztrans, Xrot, Yrot, Zrot) {
//	if (!scene) return;		//be sure
//	let vessel = scene.getObjectByName(objName);
//	vessel.position.add(new THREE.Vector3(Xtrans, Ytrans, Ztrans));
//	vessel.rotation.x += Xrot;
//	vessel.rotation.y += Yrot;
//	vessel.rotation.z += Zrot;
//	scene.getObjectByName(objName).updateMatrix();
//	createLines("HOST", true);
//}; document.DeltaShip = DeltaShip;


/* End API */

function SetCameraPosition(x, y, z, lax, lay, laz) {

	//#TODO is there a short cut to a complete reset?
	controls.dispose();
	camera.dispose();

	setCamera((BITFIELD3D & ORTHOGRAPHIC) == 0);
	setEnvironment((BITFIELD3D & ORTHOGRAPHIC) == 0);
	//camera.position.set( 0, 200, -200 );	
	camera.position.set(x, y, z);
	camera.lookAt(new THREE.Vector3(lax, lay, laz));

} document.SetCameraPosition = SetCameraPosition;

function SetBoatPosition() {
	ship.position.y += 5;
} document.SetBoatPosition = SetBoatPosition;



//@description: Scans all line combos for a *mid-line* cross
//@return: [linenoA, linenoB, gap, [pos Vector3A, pos Vector3B, dist] ]
//@todo: optimise with box scan first! i.e. check that dims1 in range of dims2
//segments [Length, Diam, Strength, Colour, Thickness]
document.DoLineProximity = function (limit) {
	let res = Lines.LineProximity(DATA.HOST.cableObjects, limit, true);

	let hostflags = [];
		
	//add flags
	let name;
	res.amber.forEach((cross, index) => {
		let mindist = cross[3]
		name = "amberHX" + index;
		hostflags.push( name );
		document.addFlag(name, scene, mindist[0], mindist[1], CACHE.getMaterial('amber0.5'));
	})
	
	res.red.forEach((cross, index) => {
		let mindist = cross[3]
		name = "redHX" + index;
		hostflags.push( name );
		document.addFlag(name, scene, mindist[0], mindist[1], CACHE.getMaterial('red0.5'));
	})
	
	lineAnalysis("HOST", res, () => hostflags.forEach(flag => scene.removeObjectByName(flag)));

	
	if (DATA.GUEST) {
		let guestflags = [];
	
		res = Lines.LineProximity(DATA.GUEST.cableObjects, limit, true);

		res.amber.forEach((cross, index) => {
			let mindist = cross[3]
			name = "amberGX" + index;
			guestflags.push( name );
			document.addFlag(name, scene, mindist[0], mindist[1], CACHE.getMaterial('amber0.5'));
		})
		
		res.red.forEach((cross, index) => {
			let mindist = cross[3]
			name = "redGX" + index;
			guestflags.push( name );
			document.addFlag(name, scene, mindist[0], mindist[1], CACHE.getMaterial('red0.5'));
		})

		lineAnalysis("GUEST", res, () => guestflags.forEach(flag => scene.removeObjectByName(flag)) );
	}

}



//
// Collision detection
//
const NAMECOLLIDER = 'collider';
function addCollisionMeshes(key, mesh) {

	if (!mesh) return;

	//Depending on whether collider is added to a mesh or a group and the way scene works the collider may be removed between init
	const collider = mesh.getObjectByName( NAMECOLLIDER );

	if (DATA.newcase || !collider) {//coupled but not important
		//Note: only cleared in initMain(json) when DATA.newcase flag set
		if (!collisionObjects[key]) collisionObjects[key] = [];
		
		collisionObjects[key].push(mesh);
	
		//remove any existing collider as it affects the size
		if (DATA.newcase) mesh.removeObjectByName(NAMECOLLIDER);

		const box3 = new THREE.Box3();
		box3.setFromObject(mesh);
		const dimensions = new THREE.Vector3().subVectors(box3.max, box3.min);
		const boxGeo = new THREE.BoxBufferGeometry(dimensions.x, dimensions.y, dimensions.z);
		const matrix = new THREE.Matrix4().setPosition(dimensions.addVectors(box3.min, box3.max).multiplyScalar(0.5));
		boxGeo.applyMatrix(matrix);
		const wiremesh = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true }));
		wiremesh.layers.set( LAYER_COLLISION )
		//layers appear to apply to entire hierarcy so cannot hide children.
		//mesh.safeAdd(wiremesh, NAMECOLLIDER);
		wiremesh.name = NAMECOLLIDER
		mesh.add(wiremesh);
	}

}


//Interested in vessel movements
container.addEventListener2("vesselmoved", (e) => detectCollision(), false);

function detectCollision() {

	if (! (BITFIELD3D & COLLISION) ) return;

	//Initialise and Setup bounding boxes
	let needstest = false;

	for (const [key, meshes] of Object.entries(collisionObjects)) {
		meshes.forEach((o, index) => {
		//Create OBB if needed
		if (!o.initialOBB) {
			const dims = Algotec.ComputeObjectDims(o);
			//o.geometry.computeBoundingBox();
			o.initialOBB = new OBB().fromBox3(dims.boundingBox());
			o.obb = new OBB();
		}

		//If moved (set in DoMoveShip) then update OBB to current object orientation
		//indicate someone moved so test 
		if (!o.OBBProcessed) {
			o.obb.copy(o.initialOBB);
				o.updateWorldMatrix(true, false);//parent probably needs update actually!
			o.obb.applyMatrix4( o.matrixWorld );
			o.OBBProcessed = true;
			needstest = true;
		}
		})
	}

	let collisionState = "";

	if (needstest) {
				
		//test each group against each group
				
		
		let groups = Object.keys(collisionObjects);

		//instead of foreach do indexed to make a trianvle and not compare keys both ways

		
		//cross groups  
		groups.forEach(grp1 => {
			groups.forEach(grp2 => {
				if (grp1 != grp2) {
					//compare meshes in group 1 with meshes in group2 
					if (meshLists(collisionObjects[grp1], collisionObjects[grp2], grp1, grp2)) {
						collisionState += `${grp1} x ${grp2}\r\n`;
				}
			}
			})
		})

		//cross meshes
		function meshLists(list1, list2) {
			//Check obj lists for collision.
			for (let i = 0; i < list1.length; i++) {
				for (let j = 0; j < list2.length; j++) {
										
					if (list1[i].obb.intersectsOBB(list2[j].obb)) {
						return true;
		}
	}
			}
			return false;
		}

	}

	if (collisionState != "") Common.MessageBox("collisionbox", "Collision", collisionState);

	return collisionState;
}


document.addFlag = (name, scene, point1, point2, material1) => {

	//var arrowHelper = new THREE.ArrowHelper( new THREE.Vector3().subVectors(mindist[1], mindist[0]).normalize() , mindist[0], 100, 0xff0000 );
	//scene.safeAdd( arrowHelper);
	var geometry = new THREE.CylinderBufferGeometry(1, 0, 20, 32);
	var cylinder = new THREE.Mesh(geometry, material1);
	cylinder.position.copy(point1);
	cylinder.position.y += 10;
	cylinder.name = name;
	scene.safeAdd(cylinder);
	/*
	var geometry = new THREE.SphereBufferGeometry( 2, 32, 32 );
	var sphere = new THREE.Mesh( geometry, material2 );
	sphere.position.copy( point1 );
	scene.safeAdd( sphere );
	*/
}

// End API
///////////////////////////////////////////////////////////////////////////////








//Record when case changes
let DATA_OLD;


//No state change/events. Uses state. Returns bool. throws.
function initMain(json) {

	//if (isLoading) return;
	//isLoading = true;
	//
	//If dynamic model updates are occurring then do not update whole model
	//

	//if (!json) return;
	//if (!pageLoaded) return;
	//if (!assetsLoaded) return;

	//if (!assetsLoaded) {
	//	jsonCache = json;
	//	//Asset load will auto apply this when ready
	//	return;
	//   }

	if (DEBUG) console.log("init");

	//running = false;

	//document.removeCase()

	if (DEBUG) console.log("#######################################");
	if (DEBUG) console.log(json);
	if (DEBUG) console.log("#######################################");

	if (json) {
		var data;
		if (typeof json === 'object') {
			data = json;
		} else if (typeof json === 'string' || json instanceof String) {
			eval("data = " + json);
		}
	}

	//Validate JSON
	if (!data.HOST || !data.bollards || data.Version != CURRENTVERSION || data.HOST.Version != VESSELVERSION) {
		//No vessel to render!
		//#NOTE: DATA.HOST = null causes an AccessViolation! How is this prossible?
		throw new Error("Invalid Json", { code: 1 });
		//DisplayError();
	}

	//Merge with model
	//Only main keys, not recursive
	for (const [key, value] of Object.entries(data)) {
		if (DATA[key] != value) {
			if (DEBUG) console.log(`DATA changed: ${key}`);
			DATA[key] = value;
		}
	}

	/*
	function mergeRecurse(data, parent) {
		for (const [key, value] of Object.entries(data)) {
			if (typeof value === 'object') {
				mergeRecurse(data[key], parent[key]);
			} else {
				//do actual merge
				//if (parent[key] != value) don't bother as not done very often
				parent[key] = value;
			}
		}		
	}
	*/

	//
	//End load model
	//


	//Track case changes

	//changes to ships, but same case
	DATA.newships = false;

	if (DATA_OLD && false) {
		DATA.newcase = (DATA.srcPath != DATA_OLD.srcPath)

		DATA.newships |= (DATA.HOST.LBP != DATA_OLD.HOST.LBP)
		DATA.newships |= (DATA.HOST.LOA != DATA_OLD.HOST.LOA)
		DATA.newships |= (DATA.HOST.shipBreadth != DATA_OLD.HOST.shipBreadth)
		DATA.newships |= (DATA.HOST.shipDepth != DATA_OLD.HOST.shipDepth)
		if (DATA.HOST.aftdeck != null) {
			DATA.newships |= (DATA.HOST.aftdeck.x != DATA_OLD.HOST.aftdeck.x)
			DATA.newships |= (DATA.HOST.aftdeck.y != DATA_OLD.HOST.aftdeck.y)
		}
		if (DATA.HOST.foredeck != null) {
			DATA.newships |= (DATA.HOST.foredeck.x != DATA_OLD.HOST.foredeck.x)
			DATA.newships |= (DATA.HOST.foredeck.y != DATA_OLD.HOST.foredeck.y)
		}
		DATA.newships |= (DATA.HOST.deckHeight != DATA_OLD.HOST.deckHeight)

		if (DATA.GUEST && DATA_OLD.GUEST) {
			DATA.newships |= (DATA.GUEST.LBP != DATA_OLD.GUEST.LBP)
			DATA.newships |= (DATA.GUEST.shipBreadth != DATA_OLD.GUEST.shipBreadth)
			DATA.newships |= (DATA.GUEST.shipDepth != DATA_OLD.GUEST.shipDepth)
			if (DATA.HOST.aftdeck != null) {
				DATA.newships |= (DATA.GUEST.aftdeck.x != DATA_OLD.GUEST.aftdeck.x)
				DATA.newships |= (DATA.GUEST.aftdeck.y != DATA_OLD.GUEST.aftdeck.y)
			}
			if (DATA.HOST.foredeck != null) {
				DATA.newships |= (DATA.GUEST.foredeck.x != DATA_OLD.GUEST.foredeck.x)
				DATA.newships |= (DATA.GUEST.foredeck.y != DATA_OLD.GUEST.foredeck.y)
			}
			DATA.newships |= (DATA.GUEST.deckHeight != DATA_OLD.GUEST.deckHeight)
		}

		DATA.newships |= (DATA.HOST.vesselLines.length != DATA.GUEST.vesselLines.length);

		if (!DATA.newships) {
			//check fairlead changes
			for (i = 0; i < DATA.HOST.vesselLines.length; i++) {
				for (j = 0; j < 5; j++) {
					DATA.newships |= (DATA.HOST.vesselLines[i][j] != DATA_OLD.HOST.vesselLines[i][j])
					DATA.newships |= (DATA.GUEST.vesselLines[i][j] != DATA_OLD.GUEST.vesselLines[i][j])
				}
				if (DATA.newships) break;
			}
		}

	} else {
		DATA.newcase = true;
		DATA.newships = true;
	}

	DATA_OLD = {...DATA};


	//previously all custom adds to DATA were removed by the merge. So okay to readd.
	//Anything now movfed to other caches need be cleared here
	//OR limited with newcase flag

	//clear everything that global and case linked
	//#TODO ensure everything added
	if (DATA.newcase) {
		collisionObjects = {};
		detectableObjects = [];
	}




	//SetUpRenderer();

	//Taken from global into init

	//Modify Mode
	DATA.modModeFixed = null;

	//Move object
	DATA.moveObj = null;//, DATA.oldPos = null, moveX, moveY, _listener;

	//End. Taken from global into init

	//array of line info (used for crossing lines)
	DATA["HOST"].cableObjects = [];
	if (DATA["GUEST"]) DATA["GUEST"].cableObjects = [];

	//overwrite value in DATA
	//#TODO change to import DATA!
	//for (var propertyName in data) {
	//	DATA[propertyName] = data[propertyName];
	//}
	//Compute Maps
	//maps bollard name to position in bollard array

	MAPS.bollardsDict = Object();
	DATA.bollards.forEach(function (bollard, index) {
		const name = bollard[0];
		MAPS.bollardsDict[name] = index;
	});

	MAPS.linesDict = { "HOST": {}, "GUEST": {} };

	["HOST", "GUEST"].forEach(function (strHostGst) {
		if (DATA[strHostGst]) DATA[strHostGst].vesselLines.forEach(function (line, idx) {
			const lineNo = line[0];
			MAPS.linesDict[strHostGst][lineNo] = line;
		});
	});

	////maps lineNo gives position in vesselLines array
	//MAPS.fairleadsDict = Object();
	////0,1,2,3,10
	////vesselLinesIndex === fairleadsDict
	//DATA.HOST.vesselLines.forEach(function (line, index) {
	//	MAPS.fairleadsDict[line[0]] = index;
	//});
	//MAPS.dollyPoints = {};
	//DATA.dollyData.forEach(function (dly) {
	//	const lineNo = dly[0];
	//	MAPS.dollyPoints[lineNo] = { "x": dly[1], "z": dly[2], "th": dly[3] };
	//});

	////lineNo -> winchData index
	//MAPS.vesselLineRMap = {};
	//DATA.HOST.vesselLines.forEach(function (vl) {
	//	const lineNo = vl[0];
	//	MAPS.vesselLineRMap[lineNo] = vl;
	//});

	//MAPS.pierLineRMap = {};
	//DATA.pierLines.forEach(function (pl) {
	//	const lineNo = pl[0];
	//	MAPS.pierLineRMap[lineNo] = pl;
	//});

	//MAPS.bollardRMap = {};
	//DATA.bollards.forEach(function (b) {
	//	const name = b[0];
	//	MAPS.pierLineRMap[name] = b;
	//});

	//MAPS.winchPositionR = {};
	//DATA.winchPosition.forEach(function (wch) {
	//	const name = wch[0];
	//	MAPS.winchPositionR[name] = wch;
	//});

	//MAPS.lineNo2wchSrc = (lineNo) => {
	//	var wch = MAPS.winchDataRMap[lineNo];
	//	let name = wch[WINCHDATA2WINCH.NAME];
	//	var wch = MAPS.winchPositionR[name];
	//	var drumcode = wch[WINCHPOSITION.NDRUM];
	//	return MAPS.NDRUM2WINCHSRC[drumcode];
	//}

	//Compute variables
	//Ship.Init(DATA.HOST, OBJPARAMS);		//HOST/GUEST API

	//no room for bollard so lower pier height.
	DATA.pierHeight = DATA.pierHeight - OBJPARAMS.bollardRopeY;


	//Berth target (Optimoor to 3D)
	DATA.shoretarget = Common.vvOptTo3DW(DATA.shoretarget);

	//DATA.channelZp = DATA.channelWidth + DATA.channelStart;
	//DATA.deckZeroY = DATA.shipDepth - DATA.shipDraft + DATA.heightWater;			//ship y0 on deck in world coords (centre point of Optimoor ship data)
	//const scalebowwedge = (x) => (x > DATA.bowwedgeX) ? ((x - DATA.bowwedgeX) / (DATA.sp.bow.x - DATA.bowwedgeX)) : 0;
	//const heightonbowwedge = (x) => (DATA.HOST.vesselLines[0][3] - OBJPARAMS.FAIRLEADDIM.Y) * scalebowwedge(x);
	//DATA.deckZeroYfx = (x) => DATA.deckZeroY + heightonbowwedge(x);

	//DATA.midship = 0;				                			//By definition. x0 on deck in world coords (everything shipwise refernced to this)

	//Get ship target on berth side


	//calc hooks (assume in order of line#). Do for both Host and Guest
	const CNGROUND = 0, CNSTS = 1, vlSTSIdx = 9;
	let sum = {};										//Dictionary of growing connections on each bollard
	DATA.hooks = {};
	["HOST", "GUEST"].forEach(function (strHostGst) {
		if (DATA[strHostGst] == null) return 1;
		var pierLinesFacing = (DATA[strHostGst].VesselFacing == -1) ? DATA[strHostGst].pierLines : DATA[strHostGst].pierLines.slice().reverse();

		pierLinesFacing.forEach(function (line) {
			if (line[vlSTSIdx] == CNGROUND) {
				const bollard = line[1];
				if (sum[bollard] == null)
					sum[bollard] = 1;
				else
					sum[bollard]++;
				DATA.hooks[line[0]] = sum[bollard];		//Each line gets the next hook on its bollard
			}
		});
	});
	//sum = null;

	if (DEBUG) console.log("initialised");

	//already done
	//Stop();

	if (firstpass) CreateSceneOnce();


	//#HACK Common should have no state!
	Common.dispose();

	CreateScene();
	//Start();

	/*
		let help = document.createElement("img");
		help.src = "./res/help-64.png";
		help.setAttribute("id", "helpicon");
		help.width = "40";
		help.style.padding = "10px";
		help.style.position = "absolute";
		help.style.right = "0px";
		help.style.top = "0px";
		help.onclick = function() {
			let str = "<DL>";
			str += "<DT><u>Ruler Tool</u></TD>";
			str += "<DD>CTRL-Left-Click: start/end ruler</DD>";
			str += "<DT><u>Menu > Tools > Line Test</u></TD>";
			str += "<DD>Analyses lines for touches + passes < 15cm</DD>";
			str += "<DT><u>Menu > Tools > Edit Mode</u></TD>";
			str += "<DD>Orthographic plan with GA overlay for setting vessel size & deck alignment</DD>";
			str += "<DT><u>Right-Click on object</u></TD>";
			str += "<DD>Information pop-up. Includes icons for object transforms (move, rotate, scale)</DD>";
			str += "<DT><u>Click on SP markers (yellow)</u></TD>";
			str += "<DD>Information pop-up. Includes icons for transforms to adjust vessel parameters</DD>";
			str += "<DT><u>Redraw (Ship)</u></TD>";
			str += "<DD>Button (available in Edit Mode + Menu > Ship) redraws the vessel</DD>";
			str += "<DT><u>Redraw Note</u></TD>";
			str += "<DD>Features affected by object transform are redrawn automatically on Save</DD>";
			str += "<DT><u>0-Key (Hide/Display)</u></TD>";
			str += "<DD>Text & other information can be displayed or hidden</DD>";
			str += "<DT><u>About</u></TD>";
			str += "<DD>Standalone demonstration of the Optimoor 3D display.<br>This feature is embedded within 2021 versions of Optimoor and is operated from application menus.<br>Screen menus and banner here are included just for demonstration.</DD>";
			str += "</DL></span]>";
			Common.MessageBox( "helpbox", "Help", str);
		}
		document.body.appendChild( help );
	*/

	//running = true;

};	// init (accessable from document)


//no state/events/throws/return.
function CreateSceneOnce() {
	//#TODO all this needs to be disposed in the unload

	{
		let env = new THREE.Group();
		let berth = new THREE.Group();
		let fenders = new THREE.Group();		//not involved in collision
		let vessel = new THREE.Group();			//Master object for vessel and deck
		//#TODO if guest
		let vesselguest = new THREE.Group();			//Master object for vessel and deck
		let lines = new THREE.Group();			//Master object for vessel and deck
		let spmarker = new THREE.Group();

		//env.name = "env";
		//berth.name = "berth";
		//vessel.name = "vessel";
		//vesselguest.name = "vesselguest";
		//lines.name = "lines";
		//spmarker.name = "spmarker";

		//berth?
		vessel.safeAdd(spmarker, "spmarker", true);
		scene.safeAdd(env, "env", true);
		scene.safeAdd(berth, "berth", true);
		scene.safeAdd(fenders, "fenders", true);
		scene.safeAdd(vessel, "vessel", true);
		scene.safeAdd(vesselguest, "vesselguest", true);
		scene.safeAdd(lines, "lines", true);
	}

	if (DEBUG) console.log("Added scene components");

	Berth.Init(CACHE.FONT);   //todo: Switch unneeded assets

	if (DEBUG) console.log("Setup Camera");

	//Create cameras
	setCamera((BITFIELD3D & ORTHOGRAPHIC) == 0);

	camera.position.set(0, 250, 50);
	//camera.position.set(0, 70, 0);//closeup of 
	//camera.position.set( 2000, 50, 0 );
	//camera.position.set( 0, 500, 300 );

	camera.lookAt(new THREE.Vector3(0, 0, 0));
	//scene.safeAdd( camera );

	// postprocessing
	//Outline objects
	//enable post processing
	//composer = new EffectComposer( renderer );
	//var renderPass = new RenderPass( scene, camera );
	//composer.addPass( renderPass );
	//outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
	//outlinePass.edgeStrength = 5;
	//outlinePass.edgeThickness = 10;
	//composer.addPass( outlinePass );

	//effectFXAA = new ShaderPass( FXAAShader );
	//effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
	//composer.addPass( effectFXAA );


	//light

	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(-100, 2000, -1000);
	light.angle = -Math.PI / 2;
	light.layers.enable(LAYER_DEFAULT);
	light.layers.enable(LAYER_HIDEABLE);
	light.layers.enable(LAYER_ORTHENV);
	light.layers.enable(LAYER_PERSENV);
	//light.castShadow = true; // default false
	//Set up shadow properties for the light
	//light.shadow.mapSize.width = 512; // default
	//light.shadow.mapSize.height = 512; // default
	//light.shadow.camera.near = 0.5; // default
	//light.shadow.camera.far = 500; // default
	scene.safeAdd(light, "light", true);

	//var alight = new THREE.AmbientLight( 0xf0feff, 0.5);
	var alight = new THREE.AmbientLight(0xffffff, 0.5);
	alight.position.copy(light.position);
	alight.layers.enable(LAYER_DEFAULT);
	alight.layers.enable(LAYER_HIDEABLE);
	alight.layers.enable(LAYER_ORTHENV);
	alight.layers.enable(LAYER_PERSENV);

	//alight.castShadow = true; // default false
	scene.safeAdd(alight, "alight", true);

	//Add fog
	//scene.fog = new THREE.Fog(0x007777, 10, 100);
	//scene.fog = new THREE.FogExp2(0xddddee, 0.0002);
	//scene.fog = new THREE.FogExp2( 0x000000, 0.00000025 );

	/////////////////////////////////////////////////////////////////////////////////////
	// Scene Object


	// Skybox

	if (DEBUG) console.log("Skybox");

	const sky = new Sky();
	sky.name = "sky";
	sky.scale.setScalar(10000);
	const skyUniforms = sky.material.uniforms;
	skyUniforms['turbidity'].value = 10;
	skyUniforms['rayleigh'].value = 1.8;
	//skyUniforms[ 'luminance' ].value = 1;
	skyUniforms['mieCoefficient'].value = 0.0005;
	skyUniforms['mieDirectionalG'].value = 0.08;

	//Slow!
	//const pmremGenerator = new THREE.PMREMGenerator( renderer );
	sky.material.uniforms['sunPosition'].value.copy(light.position);

	//scene.environment = pmremGenerator.fromScene( sky ).texture;

	/*
		//OLD Sky code
		var sky = new Sky();
		sky.scale.setScalar( 450000 );
		//I've added this recently what is rest of sky stuff? 
		scene.safeAdd( sky );
		
		var uniforms = sky.material.uniforms;
		uniforms[ 'turbidity' ].value = 10;
		uniforms[ 'rayleigh' ].value = 2;
		uniforms[ 'luminance' ].value = 1;
		uniforms[ 'mieCoefficient' ].value = 0.005;
		uniforms[ 'mieDirectionalG' ].value = 0.8;
		sky.material.uniforms[ 'sunPosition' ].value.copy( light.position );
	*/

	if (DEBUG) console.log("Cube renderer");

	//Camera providing environment map
	const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
		format: THREE.RGBFormat,
		generateMipmaps: true,
		minFilter: THREE.LinearMipmapLinearFilter,
		//encoding: THREE.sRGBEncoding
		//encoding: THREE.LinearEncoding, 
	});

	cubeCamera = new THREE.CubeCamera(0.1, 100000, cubeRenderTarget);
	cubeCamera.name = "cubecamera";
	cubeCamera.visible = false;


	/*
	cubeCamera = new THREE.CubeCamera( 0.1, 1, 512 );
	cubeCamera.renderTarget.texture.generateMipmaps = true;
	cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
	*/

	//Note: add to animate if changes
	//#TODO this adds a geometry to the scene!!
	cubeCamera.update(container.renderer, sky);

	scene.background = cubeCamera.renderTarget;

}


//no state/events/return. Throws.
function CreateScene() {

	//This depends upon assets
	if (!assetsLoaded) throw new Error("No assets");

	//Associated arrays (helper objects)

	//document.removeScene();

	if (DEBUG) console.log("## CREATE SCENE !!");

	//var sceneText = [];
	//orientation = new THREE.Vector3();

	//collisionObjects = {};

	/////////////////////////////////////////////////////////////////////////////////////
	// Materials


	let texture, material;
	/*
	const mGlass = new THREE.MeshPhongMaterial({
		color: 0xffffff,
		refractionRatio: 0.8,
		opacity: 0.3,
		transparent: true
	});
	*/

	CACHE.addMaterial('materialPost', new THREE.MeshStandardMaterial({
		color: 0x444444,
		metalness: 1,
		roughness: 0.5,
		envMap: scene.background.texture,
	}));

	var mesh, geometry;

	//Compass
	//var cgeometry = new THREE.PlaneBufferGeometry(100, 100);
	//var cgeometry = new THREE.CircleGeometry( 50, 32 );
	//CACHE.getMaterial('compassmaterial') = new THREE.MeshLambertMaterial({
	//	map: CACHE.TEXTURES['compass.png'],
	//	alphaTest: 0.5
	//});
	//var plane1 = new THREE.Mesh(cgeometry, CACHE.getMaterial('compassmaterial'));
	//plane1.position.set(0, DATA.pierHeight, -150);
	//plane1.rotation.x = -Math.PI / 2;
	//plane1.rotation.z = (180 - DATA.SceneToTrueNorth) * Math.PI / 180;
	//scene.safeAdd(plane1);
	//plane1.visible = false;
	//plane1.setLayer(LAYER_HIDEABLE);
	//hideableObjects.push( plane1 );

	//add the ruler
	if (SCENEADD & BERTH) {
		const ruler = CACHE.ASSETS[OBJPARAMS.RULERSRC];
		const pos = (DATA.bollards.length > 0) ? { x: DATA.bollards[0][1] + 30, y: -DATA.bollards[0][2] + DATA.maxFenderZ } : { x: 30, y: -30 };
		ruler.position.set(pos.x, -DATA.depthWater, pos.y);
		ruler.rotation.y = -Math.PI / 2;
		ruler.name = "depthmeter";
		scene.safeAdd(ruler);
	}

	//Wave Model
	//
	//#TODO increase grid of geometry for finer grain.
	const GRIDUNIT = 100;	//TODO: look this up from geometry grid density
	const MAXWAVEHEIGHT = 10;

	function smoothStep(minimum, maximum, x) {
		const x1 = (x - minimum) / (maximum - minimum);
		const x2 = (x1 > 1) ? 1 : (x1 < 0) ? 0 : x1;
		//return x2 * x2 * (3.0 - 2.0 * x2);
		return Math.sqrt(x2 / 2 - x2 * x2 / 4);
	}

	const WAVEPARAMS = {
		A: { direction: DATA.vecWaves[0], steepness: smoothStep(0.0, MAXWAVEHEIGHT, DATA.vecWaves[1]), wavelength: (DATA.vecWaves[2]) ? GRIDUNIT / DATA.vecWaves[2] : 1 },
		B: { direction: DATA.vecSwell[0], steepness: smoothStep(0.0, MAXWAVEHEIGHT, DATA.vecSwell[1]), wavelength: (DATA.vecSwell[2]) ? GRIDUNIT / DATA.vecSwell[2] : 1 },
		C: { direction: DATA.vecSurge[0], steepness: smoothStep(0.0, MAXWAVEHEIGHT, DATA.vecSurge[1]), wavelength: (DATA.vecSurge[2]) ? GRIDUNIT / DATA.vecSurge[2] : 1 },
	};

	let berthObj = scene.getObjectByName("env");
	if (SCENEADD & GROUND) {

		const light = scene.getObjectByName("light");

		Berth.drawWater(berthObj, light, WAVEPARAMS, LAYER_PERSENV);
		//water = berthObj.getObjectByName("water");
		//berthObj.getObjectByName("water");

		//const waterGeometry = new THREE.PlaneBufferGeometry(1000, 1000, 1000, 1000);
		//const material = new THREE.MeshBasicMaterial({ color: 0x004444 });
		//const water = new THREE.Mesh(waterGeometry, material);
		//water.rotation.x = -Math.PI / 2;
		//water.name = "water";
		//scene.safeAdd(water);

		//Berth.drawSeabed(berthObj, cubeCamera.renderTarget.texture, LAYER_PERSENV);
	}

	if (DEBUG) console.log("Ground");

	//ignore land if no bollards
	const NOBOLLARDS = (DATA.bollards.length == 0)
	
	if (SCENEADD & GROUND && DATA.berthType >= 0 && !NOBOLLARDS) {
		Berth.drawGround(berthObj, cubeCamera.renderTarget.texture, LAYER_PERSENV);

		//Loadout
		if (DATA.vesselAngleToBerth) berthObj.rotation.y = DATA.vesselAngleToBerth * Math.PI / 180;
		berthObj.updateMatrix();
	}

	if (SCENEADD & BERTH) {
	
		Berth.drawBerth(scene.getObjectByName("berth"), DATA.maxFenderZ, cubeCamera.renderTarget.texture, MAPS, OBJPARAMS, addDetectableObject);

		//let berth = scene.getObjectByName("berth");
		//if (berth) {
		//	collisionObjects.push(berth);
		//}

		Berth.drawFenders(scene.getObjectByName("fenders"), cubeCamera.renderTarget.texture, addDetectableObject);
	}
	/*
	if (SCENEADD & BERTH) {
		//#TODO there are 2 switches for Berths. Consolidate. 
		
		switch (DATA.berthType) {
			case -2:
			case -1:
				Berth.drawCBM(scene.getObjectByName("env"), OBJPARAMS, MAPS, addDetectableObject);
				break;
			case 0:
			case 1:
			case 2:
				Berth.drawBollards(scene.getObjectByName("env"), OBJPARAMS, MAPS, addDetectableObject);
		}
	}
	*/

	/*
		//Mooring face is determined by the fender depths. Assuming it is linear get the vector between centre face of 1st and last fender 
		function calcBerthYaw(fenders) {
			//depth of first fender - z of last fender -> yaw of the ship
			//fenders grow +ve from z0. So depth is the relevant z
			const fender0 = fenders[0], fenderN = fenders[fenders.length - 1];
			return new THREE.Vector3(	fenderN[1] - fender0[1],								//dx
										fenderN[2] - fender0[2],								//dy
										fenderN[5] - fenderN[7] - (fender0[5] - fender0[7]),	//dz
									)
							.normalize();
		};
	*/


	if (DEBUG) console.log("Setup Ship");

	//sp completed
	//if (SCENEADD & SHIP) {
	//	//Do Init
	//	//var shipvars;
	//	//CACHE.FONT,
	//	//Compute variables
	//	if (DATA.HOST) {
	//		Ship.Init("HOST", MAPS);		//HOST/GUEST API
	//		//Ship.drawSPMarkers("HOST", scene.getObjectByName("spmarker"), addDetectableObject);
	//	}

	//	if (DATA.GUEST) {
	//		Ship.Init("GUEST", MAPS);		//HOST/GUEST API
	//	}

	//	document.CreateShip(cubeCamera.renderTarget.texture);

	//	document.addEventListener2("datachangedvessel", DoUpdateVessels);

	//}

	//document.CreateShip();




	////lineNo -> winchData index
	MAPS.HOST = { winchDataRMap: {} };
	DATA.HOST.winchData.forEach(function (wch) {
		const lineNo = wch[0];
		MAPS.HOST.winchDataRMap[lineNo] = wch;
	});

	if (DATA.GUEST) {
		////lineNo -> winchData index
		MAPS.GUEST = { winchDataRMap: {} };
		DATA.GUEST.winchData.forEach(function (wch) {
			const lineNo = wch[0];
			MAPS.GUEST.winchDataRMap[lineNo] = wch;
		});
	}

















	if (SCENEADD & SHIP) {

		//Do Init
		//var shipvars;
		//CACHE.FONT,
		//Compute variables

		console.log("SCENE: SHIP");

		//cos these are stored in DATA they are erased each init. Consider storing elsewhere to run on new case.
		Ship.Init2("HOST");
		if (DATA.GUEST) Ship.Init2("GUEST");

		//Init creates hull profile and actually adds the base model to scene
		//This model then has its geometry changed.
		//Barges do not need a base model.
		//#TODO better perhaps to work off assets and not use scene as store.


		//Make a final decision of whether its a Barge.
		//if flatside does not fit then default o barge.
		DATA.HOST.isBarge = DATA.HOST.VesselType == BARGE || !DATA.HOST.flatsideFitsHull
		if (DATA.GUEST) DATA.GUEST.IsBarge = DATA.GUEST.VesselType == BARGE || !DATA.GUEST.flatsideFitsHull

		//Important not to miss this!
		const REINIT = DATA.newcase || DATA.newships; 

		const use_splining = 2;
		
		if (REINIT) {
			//#TODO remove existing vessels.
			scene.disposeObjectByName("otherforceHOST");
			scene.disposeObjectByName("otherforceGUEST");
			scene.disposeObjectByName("vesselpassing");
		}

		
		if (REINIT && DATA.HOST) {

			console.log("Starting ... Ship Init");
			Ship.Init("HOST", scene, MAPS, cubeCamera.renderTarget.texture, use_splining);		//HOST/GUEST API
			//Ship.drawSPMarkers("HOST", scene.getObjectByName("spmarker"), addDetectableObject);
			
		}

		if (REINIT && DATA.GUEST) {
			
			Ship.Init("GUEST", scene, MAPS, cubeCamera.renderTarget.texture, use_splining);		//HOST/GUEST API
			
		}

			Ship.AddPassingShip(scene);

		container.CreateShips(cubeCamera.renderTarget.texture);

		//Setup detectors
		let vessel = scene.getObjectByName("vessel");
		addCollisionMeshes("Host", vessel.getObjectByName("hull"));
		addCollisionMeshes("Host", vessel.getObjectByName("belowdeck"));
		addCollisionMeshes("Host", vessel.getObjectByName("deck"));

		if (DATA.GUEST) {
			let vesselguest = scene.getObjectByName("vesselguest");
			addCollisionMeshes("Guest", vesselguest.getObjectByName("hull"));
			addCollisionMeshes("Guest", vesselguest.getObjectByName("belowdeck"));
			addCollisionMeshes("Guest", vesselguest.getObjectByName("deck"));
		}

		//Need positioned now for rest scene build
		DoMoveShip("HOST");
		if (DATA.GUEST) DoMoveShip("GUEST");
		/*
		const pos = Common.vShipPos("HOST");
		scene.getObjectByName("vessel").position.copy(pos);
		scene.getObjectByName("vesselguest").position.copy(Common.vShipPos("GUEST"));
		scene.getObjectByName("vessel").updateMatrix();
		scene.getObjectByName("vesselguest").updateMatrix();
		*/

		//document.addEventListener2("datachangedvessel", OnDataChangedVessel);

	}

	if (SCENEADD & BERTH) {
		//copy target height from ship.
		const shipTarget = scene.getObjectByName("vesseltargetpoint");
		const shoreTarget = scene.getObjectByName("shoretarget");
		if (shipTarget && shoreTarget) {
			const targetY = shipTarget.getWorldPosition2();
			shoreTarget.position.y = targetY.y;
			shoreTarget.updateMatrix();
		}
	}


	/*
		//resolution poor
		var planeGeometry = new THREE.PlaneGeometry(400, 100, 1, 1);
		var planeMaterial = new THREE.MeshLambertMaterial( { 
			map: textureLoader.load( './GA1.png' ),
			side: THREE.DoubleSide  
		} );
		//var planeMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
		var plane = new THREE.Mesh(planeGeometry, planeMaterial);
		// rotate and position the plane
		plane.rotation.x = Math.PI/2;
		//plane.rotation.x = -0.5 * Math.PI;
		
		plane.position.set(0,100,0);
		// add the plane to the scene
		scene.safeAdd(plane);
	*/

	//processing happens here that is used in createlines
	//e.g. fairleadangle, hullgradient
	//ideally move to common if no time penalty, or explicity return
	//better would be the ship setup() to do calcs (with explicit return) and the draw to do the slow graphics


	//this depends upon aftdeck calcs - move into ship init now to decople from ship draw
	//Draw sp points


	//scene.getObjectByName("deck").receiveShadow = true;
	/*
	scene.getObjectByName("deck").traverse( function( child ) { 
		if ( child.isMesh ) {
			child.receiveShadow = true;
		}			
	} );
	*/


	if (SCENEADD & DECK) {
		DeckObj.drawDeckObjects(
			scene.getObjectByName("vessel"),
			"HOST",
			cubeCamera.renderTarget.texture,
			addDetectableObject
			//,scene.getObjectByName("vessel")
		);

		let cabinH
		if (cabinH = scene.getObjectByName("vessel").getObjectByName("HOSTmodelcabin")) {
			addCollisionMeshes("Host", cabinH.children[0]);
		}
			
		//scene.getObjectByName("vessel").updateMatrixWorld();

		//Needs deck objects to attach force arrow
		Ship.addOtherForce(scene, scene.getObjectByName("vessel"), "HOST");


		if (DATA.GUEST != null) {

			DeckObj.drawDeckObjects(
				scene.getObjectByName("vesselguest"),
				"GUEST",
				scene.background.texture,
				addDetectableObject
				//,scene.getObjectByName("vessel")
			);

			let cabinG
			if (cabinG = scene.getObjectByName("vesselguest").getObjectByName("GUESTmodelcabin")) {
				addCollisionMeshes("Guest", cabinG.children[0]);
			}

			Ship.addOtherForce(scene, scene.getObjectByName("vesselguest"), "GUEST");

		}
		
	}


	//removeObject(scene1, scene.name);
	//if (DATA.HOST.VesselFacing == 1) scene.getObjectByName("vessel").rotateY(Math.PI);
	//if (DATA.GUEST && DATA.GUEST.VesselFacing == 1) scene.getObjectByName("vesselguest").rotateY(Math.PI);

	//scene.getObjectByName("vessel").rotateY(Math.PI * 3/4);

	if (SCENEADD & LINES) {
		createLines("HOST", true);

		if (DATA.GUEST) createLines("GUEST", true);
	}

	//let winchangles = createLines(true);
	//SetWinchAngles( winchangles );

	//NOTE: WINCHES can we done after this


	if (SCENEADD & GROUND) {
		//#Note: side effect of drawing lines
		const carPntsBelowSeabed = [];
		let DATA1;
		["HOST","GUEST"].forEach((strHostGst) => {
			DATA1 = DATA[strHostGst];
			if (!DATA1) return;
			if (DATA1.initialCatData) DATA1.initialCatData.forEach((catline) => {
				catline.forEach(catpnt => {
					if (catpnt.y < -DATA.depthWater ) {
						carPntsBelowSeabed.push( catpnt );
					}
				})
			})
		});
		
		Berth.drawSeabed(berthObj, carPntsBelowSeabed, cubeCamera.renderTarget.texture, LAYER_PERSENV);
	
	}



	//Annotated Vector Vane
	//
	/*
		var group = new THREE.Group();
		group.name = "vectorvane";
		
		geometry = new THREE.CylinderGeometry(1.5,1.5,200,8);
		mesh = new THREE.Mesh( geometry, CACHE.getMaterial('materialPost') ) ;				
		mesh.position.set(0,0,0);
		group.safeAdd( mesh );
		//hideableObjects.push( mesh );
	
		geometry = new THREE.BoxBufferGeometry(5,5,5);
		mesh = new THREE.Mesh( geometry, CACHE.getMaterial('materialPost') ) ;				
		mesh.position.set(0,100,0);
		group.safeAdd( mesh );
		//hideableObjects.push( mesh );	
	
		let lightTextColor = 0x000001;
		let darkTextColor = 0x111111;
		
		//current
		let vStart = new THREE.Vector3(0,25,0);
		mesh = Common.createArrowWText("Current: # knots", vStart, DATA.vecCurrent[1], DATA.vecCurrent[0], 0x1111ff, 75, lightTextColor );
		//mesh.visible = false;
		mesh.name = "arrow_current";
		group.safeAdd( mesh );
		//hideableObjects.push( mesh );
	
		//waves
		vStart = new THREE.Vector3(0,40,0);
		mesh = Common.createArrowWText("Waves: # m", vStart, DATA.vecWaves[1], DATA.vecWaves[0], 0x11aaaa, 500, darkTextColor );
		mesh.name = "arrow_waves";
		//mesh.visible = false;
		group.safeAdd( mesh );
		//hideableObjects.push( mesh );
	
		//swell
		vStart = new THREE.Vector3(0,55,0);
		mesh = Common.createArrowWText("Swell: # m", vStart, DATA.vecSwell[1], DATA.vecSwell[0], 0xff33ff, 500, lightTextColor );
		mesh.name = "arrow_swell";
		//mesh.visible = false;
		group.safeAdd( mesh );
		//hideableObjects.push( mesh );
	
		//surge
		vStart = new THREE.Vector3(0,70,0);
		mesh = Common.createArrowWText("Surge: # m", vStart, DATA.vecSurge[1], DATA.vecSurge[0], 0x11cc22, 500, darkTextColor );
		mesh.name = "arrow_surge";
		//mesh.visible = false;
		group.safeAdd( mesh );
		//hideableObjects.push( mesh );
	
		//wind
		vStart = new THREE.Vector3(0,85,0);
		mesh = Common.createArrowWText("Wind: # knots", vStart, DATA.vecWind[1], DATA.vecWind[0], 0xcccc22, 75, lightTextColor);
		mesh.name = "arrow_wind";
		//mesh.visible = false;
		group.safeAdd( mesh );
		//hideableObjects.push( mesh );
	
		group.position.set(100,0,-200)
		group.rotation.y = Math.PI;
		
		scene.safeAdd(group);
	*/

	if (SCENEADD & ORTHO) {

		//Create Hidden Orthographic Environment
		var grid = new THREE.Group();
		grid.name = "grid1";
		grid.add(new THREE.GridHelper(1000, 100));
		let whiteplane = new THREE.Mesh(new THREE.PlaneBufferGeometry(1000, 1000, 1, 1), Common.white);
		whiteplane.rotation.x = 3 * Math.PI / 2;
		whiteplane.position.y = -1;
		grid.add(whiteplane);
		grid.position.y = 0;
		grid.layers.set(LAYER_ORTHENV);
		scene.safeAdd(grid);
		//orthEnvCollection.push( gridHelper );
	}

	setEnvironment((BITFIELD3D & ORTHOGRAPHIC) == 0);

	//pre compile shaders
	container.renderer.compile(scene, camera);
	//turn off hidden objects
	//setToggleHidden(false);


	//Reset matrixAutoUpdate
	//

	//scene.getObjectByName("vessel").updateWorldMatrix(true, true);

	let MAUcount = 0;
	scene.traverse(function (child) {
		if (child.matrixAutoUpdate) {
			MAUcount++;
			child.matrixAutoUpdate = false;
			child.matrixWorldAutoUpdate = false;
			child.updateMatrix();
			//child.matrixWorldNeedsUpdate = true;		//not necessary?
		}
		//scene.getObjectByName("vessel").matrixAutoUpdate = true;
	})
	if (DEBUG) console.log("MatrixAutoupdate switch off count:" + MAUcount);

	//scene.getObjectByName("vessel").updateWorldMatrix(true, true);
	//scene.updateWorldMatrix(true, true);


	//We need the camera updating!
	camera.matrixAutoUpdate = true;

	//Test
	//inc FPS == GPU bound
	//scene.overrideMaterial = new THREE.MeshBasicMaterial({color: 0xff0000 });

	//Open curtain
	//document.getElementById('curtain').className = "scene";

	if (DEBUG) console.log("Scene complete.");

	//#TODO you need a callback if you are not to call this before the scene is sceneLoaded

	//Don't need ASSETS anymore
	//document.cleanupDATA();
	//document.ClearCache();

	if (DEBUG) console.log("Scene created.");
	if (DEBUG) console.log("Number of Triangles :", container.renderer.info.render.triangles);
	if (DEBUG) console.log("Number of Geometries :", container.renderer.info.memory.geometries);

	//Test move Anchor
	//document.MoveShip(59.02, 125.5, -0.171914, 67.34213, 126.1788, -0.171914);

	//Test update Anchor
	//const json = {"vecWind":[45.0,100.0],"vecCurrent":[0.0,10.0],"vecWaves":[90.0,2.0,6.0],"vecSwell":[50.0,0.5,12.0],"vecSurge":[0.0,0.0,60.0],"excursionH":{"x":59.5789,"y":-0.180590674,"z":126.140022},"excursionG":{"x":68.1837845,"y":-0.179775625,"z":126.479156},"vecForceH":[1.802071574811464,22.1306934,-131.8361,-114.160652,"22 t"],"vecForceG":[0,0,0,0,""]};
	//document.UpdateModel(json);

	//container.appendChild(container.renderer.domElement);

	//container.renderer.forceContextRestore();
	//container.appendChild(container.renderer.domElement);


	if (DEBUG) console.log("Number of Geo @ end Scene:", container.renderer.info.memory.geometries);

	//done in initMain
	//window.MessageClient("SCENELOADED");

	//if (AUTOSTART) {
	//	document.Start();
	//}

	if (DEBUG) {
		//The X axis is red. The Y axis is green. The Z axis is blue.
		const axesHelper = new THREE.AxesHelper(40);
		axesHelper.position.set(0, 100, 0)
		scene.add(axesHelper);
	}


};//End CreateScene

/////////////////////////////////////////////////////////////////////////////////////////////////
//
// DYNAMIC
//
// These functions are available to the running environment
//
/////////////////////////////////////////////////////////////////////////////////////////////////

//@return: dictionary of [name] ={ lineno1;...v,th,n } 
function CombinewinchLineAngles(winchangles, strHostGst) {
	let winch = {};

	Object.keys(MAPS1.winchDataRMap).forEach(function (lineNo) {
		const wch = MAPS[strHostGst].winchDataRMap[lineNo];
		const name = wch[WINCHDATA2WINCH.NAME];
		const rotation = winchangles[lineNo];

		if (winch[name] == undefined) {
			//new winch
			winch[name] = { th: rotation, n: 1 };
		} else {
			//update exiting winch
			winch[name].th = winch[name].th + rotation;
			winch[name].n = winch[name].n + 1;
		}
	})
	return winch;
}

function SetWinchAngles(winchangles) {
	//these are static!
	//TODO; if you must then use this code to fill in any nulls
	return;

	//Orient Winches
	let winch = CombinewinchLineAngles(winchangles);

	Object.keys(winch).forEach(function (name) {
		let objname = Common.createObjName('winch', name);
		let wchobj = scene.getObjectByName(objname);
		if (wchobj != undefined) {
			let th = winch[name].th / winch[name].n;
			wchobj.rotation.y = Math.PI / 2 - th;
		}
	});
}

function setEnvironment(isPerspective) {
	//hide environment for orthogonal camera
	const water = scene.getObjectByName("water")
	const grid = scene.getObjectByName("grid1");
	const seabed = scene.getObjectByName("seabed");//#TODO why layers not working?

	if (isPerspective) {
		scene.background = cubeCamera.renderTarget;
		camera.layers.enable(LAYER_DEFAULT);
		camera.layers.enable(LAYER_PERSENV);
		camera.layers.disable(LAYER_ORTHENV);
		camera.layers.disable(LAYER_COLLISION)
		document.SetLabels(2 | 16);

		if (water) water.visible = true;
		if (grid) grid.visible = false;
		if (seabed) seabed.visible = true;
	}
	else {
		scene.background = new THREE.Color(0x8888cc);
		//camera.layers.disable( LAYER_DEFAULT );
		camera.layers.disable(LAYER_PERSENV);
		camera.layers.enable(LAYER_ORTHENV);
		if (water) water.visible = false;
		if (grid) {
			grid.position.y = seabed.position.y;
			grid.updateMatrix();
			grid.visible = true;
		}
		if (seabed) seabed.visible = false;
	}

	/*
	envCollection.forEach( function(obj) {
		obj.visible = isPerspective;
	});

	LAYER_ORTHENVCollection.forEach( function(obj) {
		obj.visible = !isPerspective;
	});
	*/


	//#TODO Ship.setDeckMaterial scene.background.texture has no envMap
	//Ship.setDeckMaterial("HOST", scene, scene.background.texture, isPerspective);
	//Ship.setDeckMaterial("GUEST", scene, scene.background.texture, isPerspective);

	//scene.getObjectByName("sky").visible = isPerspective;
	//scene.background = (isPerspective) ? scene.background : new THREE.Color( 0xffffff );	

};

/*
var tempvector = new THREE.Vector3();
function getScreenXYFromModelV(object) {
	//tempvector.copy( object.getWorldPosition() );
	tempvector.copy( object.position );
	// map to normalized device coordinate (NDC) space
	tempvector.project( camera );
	// map to 2D screen space

	return [
		Math.round( ( 1 + tempvector.x ) * window.innerWidth / 2 ),
		Math.round( ( 1 - tempvector.y ) * window.innerHeight / 2 - 20),
		tempvector.z
	];
}; document.getScreenXYFromModelV = getScreenXYFromModelV;
*/

/////////////////////////////////////////////////////////////////////////////////////
//
// Lines
//

//function removeLines() {
//	linesCollection[0].forEach( function(line) {
//		var obj = scene.getObjectById( line.uuid );
//		scene.remove( obj );
//		//these are only the main lines (not coats)
//		removeDetectableObject( line );
//	});
//	linesCollection[0] = [];

//}

//@description: Create line data
//@description: Calc Winch Theta
//@TODO: you need to do all these calculations in ShipWorld and then map to World when drawn!
//@TODO: that means converting bollards to shipworld! When boat moves these are the only components that will change!


function createLines(strHostGst, recalc) {

	let linesobj = scene.getObjectByName("lines");

	// stuff to so with managing scene lines
	if (DATA[strHostGst] && (!DATA[strHostGst].cableObjects || recalc)) {
		//Update bollards first as hooks and line start depends upon this!
		//Single Principle - this is tightly bound to lines, yet is a different event. Separate or keep bound... or push up a level...
		//Search for S*P in notes also...

		//TODO work this out
		//DATA.bollardAngles = calcBollardAngles(DATA.centreLine);
		DATA.bollardAngles = calcBollardAngles();

		//TODO updating Bollard should be an event linked to changing metavar positions!
		DATA.bollards.forEach(function (bollard) {
			let name = Common.createObjName("bollard", bollard[0]);
			let bld = scene.getObjectByName(name);
			if (bld != undefined) {
				//bld.rotation.y = DATA.bollardAngles[ bollard[0] ] ?? 0;
				if (DATA.bollardAngles[bollard[0]]) {
					bld.rotation.y = DATA.bollardAngles[bollard[0]];
				} else {
					bld.rotation.y = 0;
				}

				bld.updateMatrix();
				//bld.updateMatrixWorld (true);
			}
		});

		Lines.createLines(strHostGst, scene);

		//#TODO we should be able to specify the lineNo. Only need minimise lines camera near to.
		Lines.MinimiseCables(strHostGst);

		DrawLines(strHostGst);

	}
}

function DrawLines(strHostGst) {

	//Add lines to scene
	let linesobj = scene.getObjectByName("lines");

	const lines = Lines.drawLines(
		strHostGst,
		//0,//zoomThreshold,
		scene.background.texture,
		//camera.position
	);

	if (!lines) {
		console.warn("DrawLines failed");
		return 2;
	}

	//DATA.cableObjects, lines are bijective 
	lines.forEach((cable, index1) => cable.forEach(function (line, index2) {
		//scene.safeAdd( line );
		let added = linesobj.addOrMod(line);

		if (added) {
			addDetectableObject(line, "Line", `Line #TODO init:2378`);
			//linesCollection[0].push(line);
		}

		//Why not do it immediately?
		//line.updateMatrix();
	}));


	Lines.scaleLines(scene, camera.position, (BITFIELD3D & ORTHOGRAPHIC) == 0);

	linesobj.traverse(function (line) { line.updateMatrix(); });

	Lines.addLabels(scene);
	
	//linesobj.matrixAutoUpdate = true;


	//output the angles that lines meet winches
	//[lineNo] : theta
	//return winchLineAngle;

	return 0;
}


function calcBollardAngles() {
	//Note: this ignores the hook separation and the flthru (+/- 200mm).
	//Assumes that the centre point of hooks is point forces act from! 
	//TODO: Do we need this accuracy? Examine. But note more complex to calc a-d from th with an arm.
	const bollardVecSum = {};

	var Vessels = {
		"HOST": scene.getObjectByName("vessel"),
		"GUEST": scene.getObjectByName("vesselguest")
	};
	//scene.getObjectByName("lines");
	["HOST", "GUEST"].forEach(function (strHostGst) {
		if (DATA[strHostGst] == null) return;
		DATA[strHostGst].pierLines.forEach(function (line) {
			if (line[9] == 1) return;		//Its STS
			if (line[1] == -1 || line[1] == -2) {
				//Its a collar -1
				//Its CALM -2
				return;
			}

			var lineNo = line[0];
			//let bldIdx = MAPS.bollardsDict[line[1]];
			//var bld = DATA.bollards[ bldIdx ];
			//let lineidx = MAPS.fairleadsDict[ lineNo ];
			//var fl = DATA.HOST.vesselLines[lineidx];
			let flname = Common.createObjName("fairlead", lineNo, strHostGst);
			//centreLine needed here
			//var fairleadPoint = Common.vMapShip2World(fl[1], 0, fl[2]);

			var fl = Vessels[strHostGst].getObjectByName(flname);
			var fairleadPoint = fl.getWorldPosition2();
			//NOTE: -ve z

			//TODO: explain why z is negative?
			//var bollardPoint = new THREE.Vector3(bld[1], 0, -bld[2]);
			let bldname = line[1];
			var bollardPoint = scene.getObjectByName(bldname);
			//cos bollards are entered into scene from bollards possible they do not exist.
			if (bollardPoint) {
				bollardPoint = bollardPoint.position
				if (bollardVecSum[bldname] == null) bollardVecSum[bldname] = new THREE.Vector3(0, 0, 0);
				bollardVecSum[bldname].add(fairleadPoint).sub(bollardPoint);
			} else {
				console.log(`Bollard ${bldname} missing from scene.`);
			}
		});
	});

	//TODO: store N so can adjust for hooks!
	const bollardAngles = {};
	let mag, res;
	for (var bld in bollardVecSum) {
		//mag = Math.sqrt(bollardAngles[bld].x * bollardAngles[bld].x + bollardAngles[bld].z * bollardAngles[bld].z);
		//res = Math.acos(-bollardAngles[bld].z / mag);
		res = -Math.atan2(-bollardVecSum[bld].x, bollardVecSum[bld].z);
		bollardAngles[bld] = res;
	}

	return bollardAngles;
}



// Ray Detection
/*
function collision() {
	var direction = new THREE.Vector3();
	camera.getWorldDirection( direction );
	var startPoint = camera.position.clone();
	raycaster.set(startPoint, direction.normalize());
	scene.updateMatrixWorld(); // required, since you haven't rendered yet
	var rayIntersects = raycaster.intersectObjects(boatCollection, true);

	//no distance to skybox or no object
	if (rayIntersects[0] === undefined) return false;
	//can enter water 
	if (rayIntersects[0].object.name == "water") return false;
	//collision if less 3m
	return rayIntersects[0].distance < 4;
}

//Intersect for OutlinePAss highlighting
//Note: no objects added in drawship
function checkIntersection() {

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObject( scene, true );

	if ( intersects.length > 0 ) {

		var selectedObject = intersects[ 0 ].object;
		addSelectedObject( selectedObject );
		outlinePass.selectedObjects = selectedObjects;

	} else {

		// outlinePass.selectedObjects = [];

	}

}
*/
//////////////////////////////////////////////////////////////////////
// DOM Layer


//toggle visibility for item with id. Make UI stateful for next call. 
document.infostate = {
	getState: (id) => (document.infostate[id]) ? document.infostate[id] : '',
	setState: (id, state) => document.infostate[id] = state,
	toggleState: (state) => (state == '') ? 'block' : '',
	toggleDisplay: (target) => {
		const style = document.getElementById(target).style;
		const newstate = document.infostate.toggleState(style.display);
		document.infostate.setState(target, newstate);
		style.display = newstate;
	}
};

/*
document.toggleDisplay = (target) => {
	const style = document.getElementById( target ).style;
	this.state[target.uuid] = ((style.display == '') ? 'block' : '');
	style.display = this.state[target.uuid];
};
*/


//updates codependences between rel & abs values
//could be basis of onchange events
//update DATA through interface
/*
document.bindObjControl = (objid, sender) => {
	const newval = parseFloat( sender.value );
	const obj = scene.getObjectById( objid );
	let newval2;
	switch(sender.name) {
		case "xa":
			//todo: need to update the object! that you got info on!!!! how to do?
			//hide the id number?
			obj.position.x = newval;
			newval2 = Common.vMapWorld2Ship(newval,0,0);
			document.getElementsByName( 'xr' )[0].value = newval2.x;
			break;
		case "ya":
			obj.position.y = newval;
			newval2 = Common.vMapWorld2Ship(0,newval,0);
			document.getElementsByName( 'yr' )[0].value = newval2.y;
			break;
		case "za":
			obj.position.z = newval;
			newval2 = Common.vMapWorld2Ship(0,0,newval);
			document.getElementsByName( 'zr' )[0].value = newval2.z;
			break;
		case "xr":
			newval2 = Common.vMapShip2World(newval,0,0);
			obj.position.x = newval2.x;
			document.getElementsByName( 'xa' )[0].value = newval2.x;
			break;	
		case "yr":
			newval2 = Common.vMapShip2World(0,newval,0);
			obj.position.y = newval2.y;
			document.getElementsByName( 'ya' )[0].value = newval2.y;
			break;	
		case "zr":
			newval2 = Common.vMapShip2World(0,0,newval);
			obj.position.z = newval2.z;
			document.getElementsByName( 'za' )[0].value = newval2.z;
			break;
			case "loa":
				eval( objid + "=" + newval);	
				break;	
			case "lbp":
				eval( objid + "=" + newval);	
				break;	
			case "breadth":
				eval( objid + "=" + newval);	
				break;	
			case "depth":
				eval( objid + "=" + newval);	
				break;		
											
	}
	//obj.updateMatrixWorld();

};
*/


container.CreateShips = function (environmentMap) {

	if (DEBUG) console.log("Creating Ship..");

	//return;
	//scene.getObjectByName("water").visible = false;
	//environmentMap = scene.background;

	// checks for ship
	//HOST/GUEST API

	document.getElementById("forceArrowG").style.visibility = (DATA.GUEST) ? "visible" : "hidden";

	//DATA.HOST/GUEST.needsUpdate = true;//Can't use this pattern as need positions for drawing scene'

	//if (DATA.HOST && DATA.newships ) {
	if (DATA.HOST ) {
		const scene1 = scene.getObjectByName("vessel");
		
		if (!DATA.HOST.isBarge) {
			//we need a hull
			const vesselname = "HOSThullmodel";
			const model = scene1.getObjectByName(vesselname);
			if (!model) scene1.safeAdd( Ship.GetHull(vesselname) );
		}

		if (DATA.HOST.isBarge)
			Ship.drawBarge("HOST", environmentMap, scene1);
		else
			Ship.drawShip("HOST", environmentMap, scene1);

		Ship.addForceArrow(DATA.HOST.vecForce, scene1, "arrowhost", document.getElementById("forceArrowH"));

		//Bow!
		//Common.updateArrowWText(arr, DATA.HOST.vecForce, 0, DATA.HOST.shipBreadth);

		//Ship.drawSPMarkers("HOST", scene.getObjectByName("spmarker"), addDetectableObject);
		if (DATA.GUEST) Berth.addSTSFenders(scene1, environmentMap, addDetectableObject);

		//const pos = Common.vShipPos("HOST");
		//scene.getObjectByName("vessel").position.copy(pos);

		//if (DATA.HOST.HasCabin) 
		//DeckObj.AddCabinTanks(scene, "HOST", ASSETSRC);
	}

	if (DATA.GUEST) {

		const scene1 = scene.getObjectByName("vesselguest");

		if (!DATA.GUEST.isBarge) {
			//we need a hull
			const vesselname = "GUESThullmodel";
			const model = scene1.getObjectByName(vesselname);
			if (!model) scene1.safeAdd(Ship.GetHull(vesselname));
		}

		if ( DATA.GUEST.isBarge )
			Ship.drawBarge("GUEST", environmentMap, scene1);
		else
			Ship.drawShip("GUEST", environmentMap, scene1);

		//let arr = Ship.addForceArrow(DATA.GUEST.vecForce, scene.getObjectByName("vesselguest"), document.getElementById("forceArrowG"));
		let arr = Ship.addForceArrow(DATA.HOST.vecForce, scene1, "arrowguest", document.getElementById("forceArrowG"));

		Common.updateArrowWText(arr, DATA.GUEST.vecForce, 0, DATA.GUEST.shipBreadth);

		//scene.getObjectByName("vesselguest").position.copy(Common.vShipPos("GUEST"));

		//if (DATA.GUEST.HasCabin) 
		//DeckObj.AddCabinTanks(scene, "GUEST", ASSETSRC);
	}

	//#DEMO shrink guest
	//scene.getObjectByName("vesselguest").traverse(function (child) {
	//	if (child.mesh !== undefined) {
	//		child.mesh.scale.set(0.5,0.5,0.5);
	//		child.mesh.updateMatrix();
	//	}
	//})
	//scene.getObjectByName("vesselguest").updateMatrixWorld();


	//if DATA["GUEST"] != undefined then do again
	//scene.getObjectByName("hull").onAfterRender = document.renderDone;

}

function vecForce2World(vesselRotationY, worldAngle) {
	const angle = worldAngle - vesselRotationY * 180 / Math.PI;
	return angle;
}

function renderDone(renderer, scene, camera, geometry, material, group) {
	//Hull rendered;
	//if (DEBUG) console.log("# Rendered")
	//	document.dispatchEvent(rendered);
	//tickMove();
}; document.renderDone = renderDone;

document.closePopup = function (name) {
	document.getElementById(name).style.display = 'none';
	document.replay.event("closePopup", [name]);
}

document.OpenInfo = function (obj) {

	const SHOWEDIT = BITFIELD3D & EDITABLE;
	
	document.getElementById('info').style.display = "inline";

	document.replay.event("OpenInfo", [obj]);

	if (obj && obj.info) {
		//store object for async processing
		DATA.moveObj = obj;

		document.getElementById('infoheader').innerHTML = `${obj.info.title}<input style='position: absolute;right:0px;top:0px;' type='button' class='xbutton' onclick="document.closePopup('info');document.removeTransformControl('${obj.uuid}')" value='✕'>`;
		//str += (obj && obj.info) ? obj.info.title: "";

		let str = "";
		if (obj && obj.info && obj.info.detail != "")
			str += `<div style='padding: 10px'>${obj.info.detail}</div><hr>`;

		if (obj.bmAbsRel > 0) str += `<a class='clickableanchor' onclick="infostate.toggleDisplay('menu_position')">Position</a>
			<div id='menu_position' class='menupanel' style='display: ${document.infostate.getState('menu_position')};'>`;

		if (obj.bmAbsRel & INFO_ABS) str += `Absolute:<br>
		x <input type="number" id="xa" style="width: 70px" step=0.5 >m<br>
		y <input type="number" id="ya" style="width: 70px" step=0.5 >m<br>
		z <input type="number" id="za" style="width: 70px" step=0.5 >m<br>`;

		if (obj.bmAbsRel == 3) str += `<br>`;

		if (obj.bmAbsRel & INFO_REL) str += `Rel Vessel:<br>
		x <input type="number" id="xr" style="width: 70px" step=0.5 >m<br>
		y <input type="number" id="yr" style="width: 70px" step=0.5 >m<br>
		z <input type="number" id="zr" style="width: 70px" step=0.5 >m<br>
		</div>`;

		if (obj.name != "" && SHOWEDIT) {
			//ignore lines
			//str += `<br/><br/><center><div> <input type="image" src="${document.PRELOADIMG['./res/icon_move25.png'].src}" onclick="document.setTransformState('translate','${obj.uuid}');" /> `;
			str += `<br/><br/><center><div> <input type="image" src="${document.PRELOADIMG['./res/icon_move25.png'].src}" onclick="document.MessageBox('Translation not yet available.<br>There is a current restriction on 3D changing Optimoor data.');" /> `;
			//Note this is not bound. Save returns out of state.
			str += `<input type="image" src="./res/icon_rotate25.png" onclick="document.setTransformState('rotate','${obj.uuid}');" /> `;
			str += `<input type="image" src="./res/icon_scale25.png" onclick="document.setTransformState('scale','${obj.uuid}');" /> `;
			str += ` &nbsp; <input type="image" src="./res/icon_save25.png" onclick="document.setTransformState('save','${obj.uuid}');" /> `;
			str += `<input type="image" src="./res/icon_cancel25.png" onclick="document.setTransformState('cancel','${obj.uuid}');document.closePopup('info');" /> `;
			str += `</div></center><br/>`;
		}

		document.getElementById('infobody').innerHTML = str;

		//Metavar
		//Ad hoc metavar for duration of openinfo

		if (obj.bmAbsRel & INFO_ABS) {
			DATA.metavar.addVar("abspos", obj.position.clone());
			//set up actions
			DATA.metavar.onChange("abspos", (abspos) => {
				document.getElementById("xa").value = abspos.x.toFixed(1);
				document.getElementById("ya").value = abspos.y.toFixed(1);
				document.getElementById("za").value = abspos.z.toFixed(1);

				if (obj.bmAbsRel & INFO_REL) {
					//if abs changes then update rel
					let relpos = Common.vMapWorld2Ship(abspos.x, abspos.y, abspos.z);
					document.getElementById("xr").value = relpos.x.toFixed(1);
					document.getElementById("yr").value = relpos.y.toFixed(1);
					document.getElementById("zr").value = relpos.z.toFixed(1);

					obj.position.set(abspos.x, abspos.y, abspos.z);
					obj.updateMatrix();
				}
			});

			//set up listeners for DOM changes
			document.getElementById("xa").addEventListener2('change', (e) => {
				let abspos = DATA.metavar.modVar("abspos", (curr) => curr.x = Metavar.N(e.target.value));
				DATA.metavar.setVar("relpos", Common.vvMapWorld2Ship(abspos));
				return false;
			});
			document.getElementById("ya").addEventListener2('change', (e) => {
				let abspos = DATA.metavar.modVar("abspos", (curr) => curr.y = Metavar.N(e.target.value));
				DATA.metavar.setVar("relpos", Common.vvMapWorld2Ship(abspos));
				return false;
			});
			document.getElementById("za").addEventListener2('change', (e) => {
				let abspos = DATA.metavar.modVar("abspos", (curr) => curr.z = Metavar.N(e.target.value));
				DATA.metavar.setVar("relpos", Common.vvMapWorld2Ship(abspos));
				return false;
			});

			DATA.metavar.refresh("abspos");
		}

		if (obj.bmAbsRel & INFO_REL) {
			//DATA.metavar.addVar("relpos",  Common.vvMapWorld2Ship( obj.position ) );
			DATA.metavar.addVar("relpos", Common.vv3DToOpt(obj.position));
			//ignore for now
			DATA.metavar.onChange("relpos", (relpos) => {
				document.getElementById("xr").value = relpos.x.toFixed(1);
				document.getElementById("yr").value = relpos.y.toFixed(1);
				document.getElementById("zr").value = relpos.z.toFixed(1);

				//Note swapped z/y for Optimoor display
				if (obj.bmAbsRel & INFO_ABS) {
					//if rel change then update abs
					let abspos = Common.vMapShip2World(relpos.x, relpos.y, relpos.z);
					document.getElementById("xa").value = abspos.x.toFixed(1);
					document.getElementById("ya").value = abspos.y.toFixed(1);
					document.getElementById("za").value = abspos.z.toFixed(1);

					obj.position.set(abspos.x, abspos.y, abspos.z);
					obj.updateMatrix();
				}
			});

			document.getElementById("xr").addEventListener2('change', (e) => {
				let relpos = DATA.metavar.modVar("relpos", (curr) => curr.x = Metavar.N(e.target.value));
				DATA.metavar.setVar("abspos", Common.vvMapShip2World(relpos));
				return false;
			});
			document.getElementById("yr").addEventListener2('change', (e) => {
				let relpos = DATA.metavar.modVar("relpos", (curr) => curr.y = Metavar.N(e.target.value));
				DATA.metavar.setVar("abspos", Common.vvMapShip2World(relpos));
				return false;
			});
			document.getElementById("zr").addEventListener2('change', (e) => {
				let relpos = DATA.metavar.modVar("relpos", (curr) => curr.z = Metavar.N(e.target.value));
				DATA.metavar.setVar("abspos", Common.vvMapShip2World(relpos));
				return false;
			});

			DATA.metavar.refresh("relpos");
		}


	}
}

document.MessageBox = function(text) {
	Common.MessageBox("alert", "3D", text, null, true);
}


//modes: translate, rotate, scale, save, cancel
document.setTransformState = function (mode, id, strHostGst) {

	if (!strHostGst) strHostGst = "HOST";

	//TODO: you are creating it everytime you need it!
	//This is due to system stalls linked to it you think

	//const obj = scene.getObjectById(id);	
	const obj = scene.getObjectByProperty('uuid', id);
	if (!obj) return;

	//ignore modding unnamed things
	if (obj.name == "") return;

	//document.replay.event("setTransformState", [mode, id]);
	//document.replay.addTrack( obj );

	DATA.metavar.setVar("abspos", obj.position.clone());

	if (!transformcontrol) setupTransformControl();

	//store initial position at first avail opportunity!
	if (!obj.origObjPos) obj.origObjPos = {
		position: obj.position.clone(),
		rotation: obj.rotation.clone(),
		scale: obj.scale.clone(),
		matrix: obj.matrix.clone()
	};

	if (!obj.origObjPos) console.warn("==== REALLY IMPORTANT ==== no original obj")

	if (mode == "save") {

		document.removeTransformControl(obj.uuid);

		//position remove
		document.removeEventListener('mousemove', DATA.mouseMoveClosure, false);

		if (!obj.origObjPos) {
			console.warn("Original obj undef!");
			return;
		}

		const deltapos = obj.origObjPos.position.clone().sub(obj.position);
		//const deltaship = Common.vvMapWorld2Ship1(deltapos);

		delete (obj.origObjPos);
		//TODO: hook to event? Is there an event for save other than this? What if we decide the "context" at start rather than switch here? Invert control? 

		switch (obj.name) {
			case "spbow":
				DATA.metavar.setVar("spbow", {
					x: DATA.sp.bow.x + deltapos.x,
					y: DATA.sp.bow.y + deltapos.y,
					z: DATA.sp.bow.z + deltapos.z
				});
				return;
			case "spflatbow":
				DATA.metavar.modVar("spflatbow", (spflatbow) => {
					spflatbow.x += deltapos.x;
					spflatbow.y += deltapos.y;
					spflatbow.z += deltapos.z;
				});
				return;
			case "spflataft":
				DATA.metavar.modVar("spflataft", (spflataft) => {
					spflataft.x += deltapos.x;
					spflataft.y += deltapos.y;
					spflataft.z += deltapos.z;
				});
				return;
			case "spaftdeck":
				DATA.metavar.setVar("aftdeck", {
					x: DATA.sp.aftdeck.x + deltapos.x,
					y: DATA.sp.aftdeck.y + deltapos.y,
					z: DATA.sp.aftdeck.z + deltapos.z
				});
				return;
			case "spstern":
				DATA.metavar.setVar("spstern", {
					x: DATA.sp.stern.x + deltapos.x,
					y: DATA.sp.stern.y + deltapos.y,
					z: DATA.sp.stern.z + deltapos.z
				});
				return;

		}




		//To change the underlying data model
		//document.body.style.cursor="grab";//grabbing
		const parts = obj.name.split('-');
		//const lineNos = parts[1].split(';');

		const lineNos = MAPS.ObjectLineNo[obj.name];

		if (!lineNos) {
			console.warn("lineNos undefined for Obj Name: " + obj.name);
			return;
		}



		//Notify that changes made to deck objects
		container.dispatchEvent( eObjectattributechanged );


		//Experimental
		//
		/*
		if (DEBUG) console.log( obj );
		let mvm = obj.getObjectByName("at1").modelViewMatrix;
		let posat1 = new THREE.Vector4().applyMatrix4( mvm );
		//new absolute
		if (DEBUG) console.log( posat1 );

		if (obj.origObjPos == undefined) throw new Error("Original pos NOt SET!");

		const deltapos = obj.position.clone().sub( obj.origObjPos.position );

		//TODO: check zero determinant!!
		if (DEBUG) console.log( obj.origObjPos.matrix );
		const clone = obj.origObjPos.matrix.clone();

		if (DEBUG) console.log( clone );

		const invOrig = clone.invert();

		if (DEBUG) console.log( invOrig ) ;

		const deltamat = obj.matrix.clone().multiply( invOrig );

		//NOW point.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));
		

		//const deltarot = obj.origObjPos.rotation.clone().sub( obj.rotation );
		//const deltasca = obj.origObjPos.scale.clone().sub( obj.scale );


		scene.getObjectByName("testbat").applyMatrix4( deltamat );
		//scene.getObjectByName("testbat").position.add( deltapos );
		*/
		//if (DEBUG) console.log( Common.vvMapWorld2Ship( moveObj.position ));

		//adjust underlying line data
		//Moving/rotating a winch affects many lines + note rotation changes lines also!
		//TODO: you need adjust the actual object DATA too!

		//Now why do you add this version of delta?
		//Surely wrong way around

		//perform calc for each line associated with moved object
		if (DEBUG) console.log(obj.name);
		if (DEBUG) console.log(lineNos);

		//No longer needs update line store. Now uses direct refs to object
		/*
		lineNos.forEach(function (lineNo, index) {

			if (parts[0] == "winch") {
				const wch = MAPS[strHostGst].winchDataRMap[lineNo];

				const winchsrc = MAPS.lineNo2wchSrc(lineNo);
				//if (DEBUG) console.log( winchsrc );
				//const wch_translate = OBJPARAMS.WINCHPOS[ winchsrc ];

				//if (DEBUG) console.log( wch_translate ); 

				//obj.updateMatrix();

				//let origmtx = wch_translate.clone();
				//if (DEBUG) console.log( origmtx ); 


				//wch_translate.applyMatrix4(obj.matrix);

				let idx = lineNos.length - index - 1;

				if (DEBUG) console.log("Selected Object");
				if (DEBUG) console.log(obj);

				let ap = obj.getAttachmentPointWorld(idx);

				if (DEBUG) console.log("Index");
				if (DEBUG) console.log(idx);

				if (DEBUG) console.log("Attachment Point");
				if (DEBUG) console.log(ap);


				//if (DEBUG) console.log( "----------------------------" );
				//if (DEBUG) console.log( ap );
				//if (DEBUG) console.log( wch_translate );
				//if (DEBUG) console.log( wch_translate.sub( obj.position ) );


				//winch is rotated pi/2. x translate should be z???

				//Hmmm object is rotated Pi/2 but after matrix x !<-> y
				//rotate
				//wch_translate.

				//				let atkey = "at" + (idx + 1);
				//				let attachmentObject = this.getObjectByName( atkey );
				//				if (DEBUG) console.log( attachmentObject );

				//if (attachmentObject) {
				//	attachmentObject.updateMatrix();
				//	let point = attachmentObject.geometry.getFirstPointLocal();
				//	return attachmentObject.localToWorld( point );
				//}

				if (ap) {
					let apship = Common.vvMapWorld2Ship(ap);
					wch[WINCHDATA2WINCH.X] = apship.x;
					wch[WINCHDATA2WINCH.Y] = apship.y;
					wch[WINCHDATA2WINCH.Z] = apship.z;
				} else {
					wch[WINCHDATA2WINCH.X] += deltapos.x;
					//DATA.winchPoints[lineNo].x += delta.x;
					//DATA.winchPoints[lineNo].y = shippos[1];
					wch[WINCHDATA2WINCH.Z] += deltapos.z;
					//DATA.winchPoints[lineNo].z += delta.z;
				}

			} else if (parts[0] == "dolly") {
				//DB.addDollyPos( lineNo, deltapos);
				MAPS.dollyPoints[lineNo].x += deltapos.x;
				//either add to winchPoints or use a map to original data
				//MAPS.winchPoints[ lineNo ].y += delta.y;
				MAPS.dollyPoints[lineNo].z += deltapos.z;

			} else if (parts[0] == "fairlead") {
				//Don't need to update as new line system uses object refs directly.
				//currently doesn't work
				//DB.addFairleadPos( lineNo, deltapos );
				////let lineidx = MAPS.fairleadsDict[lineNo];
				//if (DEBUG) console.log(DATA.HOST.vesselLines[ lineidx ]);
				////DATA.HOST.vesselLines[lineidx][1] += deltapos.x;
				////DATA.HOST.vesselLines[lineidx][2] += deltapos.z;
				//if (DEBUG) console.log(DATA.HOST.vesselLines[ lineidx ]);

				//let lineidx = MAPS.fairleadsDict[ lineNo ];
				//DATA.HOST.vesselLines[ lineidx ][1] += delta.x;
				//DATA.HOST.vesselLines[ lineidx ][2] += delta.z;
			} else if (parts[0] == "bollard") {
				//TODO
				//bollardRMap[ parts[1] ]
				//    //name, x (origin), Dist from fenders (toward viewer onto pier), Ht (above pier), max load


				//oBollard.position.set( bollard[1], DATA.pierHeight + bollard[3] + DATA.OBJPARAMS.bollardY, -bollard[2])
				//let lineidx = MAPS.fairleadsDict[ lineNo ];
				//DATA.pierLines[ lineidx ][1] += delta.x;
				//DATA.HOST.vesselLines[ lineidx ][2] += delta.z;
			}
		});
		*/

		//document.removeEventListener('mousemove', _listener, true);
		//removeLines();

		//if (DEBUG) console.log("draw lines");

		//No need. Rigging hasn't changed.
		//DATA[strHostGst].cableObjects = createLines(strHostGst, true);

		//SetWinchAngles( winchangles );
		return;
	}

	if (mode == "cancel") {

		if (!obj.origObjPos) {
			console.warn("Original obj undef!");
			return;
		}

		//TODO: restore rotation/scale
		obj.position.copy(obj.origObjPos.position);
		obj.rotation.copy(obj.origObjPos.rotation);
		obj.scale.copy(obj.origObjPos.scale);

		DATA.metavar.setVar("abspos", obj.origObjPos.position.clone());

		document.removeTransformControl(obj.uuid);

		//position remove
		document.removeEventListener('mousemove', DATA.mouseMoveClosure, false);

		delete (obj.origObjPos);
		return;
	}

	//set/change mode

	if (DEBUG) console.log(mode);

	transformcontrol.setMode(mode);

	if ((BITFIELD3D & ORTHOGRAPHIC) == 0)
		transformcontrol.setSize(1);
	else
		transformcontrol.setSize(0.75);

	if (!transformcontrol.object) {
		transformcontrol.attach(obj);
		obj.matrixAutoUpdate = true;
		//position listen
		//Note couldn't get the closure signature right for removal so just stored here.
		DATA.mouseMoveClosure = (e) => {
			DATA.metavar.setVar("abspos", obj.position.clone());
			return false;
		}
		transformcontrol.addEventListener2('objectChange', DATA.mouseMoveClosure, false);
	}
}

document.setVideoState = function (state) {
	if (DEBUG) console.log(state);

	switch (state) {
		case Replay.MODE.PLAY:			//toggle STOP/PLAY
			if (document.replay.mode == Replay.MODE.STOP) {
				document.replay.mode = Replay.MODE.PLAY;
			}
			else document.setVideoState(Replay.MODE.STOP)
			break;
		case Replay.MODE.RECORD:
			//document.replay.mode = Replay.MODE.RECORD;
			var LED = document.getElementById('led_record');
			if (LED) LED.className = 'recordon';
			break;
		case Replay.MODE.STOP:
			document.replay.stop();
			var LED = document.getElementById('led_record');
			if (LED) LED.className = 'recordoff';
			break;
	}
}

/*
document.OpenMenu = function () {

	document.replay.event("OpenMenu");

	//document.replay.event(this, [obj, addmarkers, event]);

	//got an object
	document.getElementById('menu').style.display = "inline";
	//document.getElementById('menubutton').style.display = "none";

	
	//var infoX, infoY, pcX, pcY;
	
	
	//if (pcX < 0.5) {	//left
	//	pcX = event.clientX						
	//} else {
	//	pcX = event.clientX - document.getElementById('menu').offsetWidth;
	//}

	//if (pcY < 0.5) {	//top
	//	pcY = event.clientY						
	//} else {
	//	pcY = event.clientY - document.getElementById('menu').offsetHeight;
	//}
	
	const pcX = 0;//window.width - document.getElementById('menu').offsetWidth;
	const pcY = 0;//window.height - document.getElementById('menu').offsetHeight;

	document.getElementById('menu').style.right = pcX + "px";
	document.getElementById('menu').style.bottom = pcY + "px";

	//TODO: probably need to have this is just one place (see manager position change event)
	//let str = `<span style="font-size: 20px;position: absolute;left:5px;top:5px;">Menu</span><input style='display:block;margin-left:auto;' type='button' class='xbutton' onclick="document.closePopup('menu');document.getElementById('menuimg').style.display = 'initial';" value='✕'>`;

	
	//LOA: <input type="number" name="loa" style="width: 70px;right: 0px;" step=5 value="${DATA.LOA() }" onchange="bindObjControl('DATA.LOA()', this)">m<br>
	//LBP: <input type="number" name="lbp" style="width: 70px" step=5 value="${DATA.LBP}" onchange="bindObjControl('DATA.LBP', this)">m<br>
	//Breadth: <input type="number" name="breadth" style="width: 70px" step=1 value="${DATA.shipBreadth}" onchange="bindObjControl('DATA.shipBreadth', this)">m<br>
	//Depth: <input type="number" name="depth" style="width: 70px" step=1 value="${DATA.shipDepth}" onchange="bindObjControl('DATA.shipDepth', this)">m<br>
	

	//	LOA: <span id="menuloa">${ (DATA.sp.bow.x - DATA.sp.stern.x).toFixed(3) }</span> m<br>

	str += `<hr>
	<a class='clickableanchor' onclick="infostate.toggleDisplay('menu_ship')">Ship</a>
	<div id='menu_ship' class='menupanel'>
	LOA: <span id="menuloa"></span> m<br>
	Breadth: <span id="menubreadth"></span> m<br>
	Depth: <span id="menudepth"></span> m<br>
	Colour (above Plimsol): <input id="aboveplimsol" size=6></input><br>
	Colour (below Plimsol): <input id="belowplimsol" size=6></input><br>
	
	<button onclick="container.CreateShip();">Redraw</button>
	</div>`;

	str += `<hr>
	<a class='clickableanchor' onclick="infostate.toggleDisplay('menu_video')">Video</a>
	<div id='menu_video' class='menupanel'>
	<span id="led_record" class='recordoff'>REC</span><br>
	<button class='playcontrols' onclick="document.setVideoState(${Replay.MODE.RECORD});">Record</button>
	<button class='playcontrols' onclick="document.setVideoState(${Replay.MODE.STOP});">Stop</button>
	<button class='playcontrols' onclick="document.setVideoState(${Replay.MODE.PLAY});">Play</button>
	<button class='playcontrols' onclick="document.replay.reset();">Reset</button>
	</div>`;

	str += `<hr>
	<a class='clickableanchor' onclick="infostate.toggleDisplay('menu_tools')">Tools</a>
	<div id='menu_tools' class='menupanel'>
	Line Test <input type="checkbox" width=80 onchange="document.lineAnalysis( document.LineProximity(DATA[strHostGst].cableObjects, 0.3, this.checked) );"><br>
	Edit Mode <input type="checkbox" width=80 onchange="toggleEditMode(DATA.modModeFixed);"><br>	
	</div>`;

	str += `<hr>
	<a class='clickableanchor' onclick="infostate.toggleDisplay('menu_adv')">Developer</a>
	<div id='menu_adv' class='menupanel'>
	<button onclick='document.dispose()'>Stop</button>
	</div>`;


	//str += "{" + intersects[0].object.position.x.toFixed(2) + ", " + intersects[0].object.position.z.toFixed(2) + ", " + intersects[0].object.position.y.toFixed(2) + "}";

	document.getElementById('menu').innerHTML = str;

	//document.reactor.regId("loa", 'menuloa', () => DATA.sp.bow.x - DATA.sp.stern.x).toFixed(3);
	//document.reactor.regId("loa", 'menuloa', () => DATA.sp.bow.x - DATA.sp.stern.x).toFixed(3);

	DATA.metavar.refresh("shiploa");
	DATA.metavar.refresh("shipbreadth");
	DATA.metavar.refresh("shipdepth");
	DATA.metavar.refresh("aboveplimsol");
	DATA.metavar.refresh("belowplimsol");


	document.getElementById('aboveplimsol').addEventListener2('change', (e) => {
		DATA.metavar.setVar("aboveplimsol", e.target.value);
		return false;
	});
	document.getElementById('belowplimsol').addEventListener2('change', (e) => {
		DATA.metavar.setVar("belowplimsol", e.target.value);
		return false;
	});

}
*/

//Used just to display the datapanel of lines crossing
function lineAnalysis(strHostGst, obj, callback) {
	if (!obj) return;
	let html = "<table cellpadding=5 border=1 width='100%'><tr style='background-color:#a11'><td colspan=2>Touching Lines</td></tr>";

	obj["red"].forEach(function (cross) {
		html += `<tr><td colspan=2>${cross[0]}  x  ${cross[1]}</td></tr>`;
	});

	html += "<table cellpadding=5 border=1><tr style='background-color:#ba0'><td colspan=2>Near Approaches (<15cm)</td></tr>";
	html += "<tr><td>Lines</td><td>Distance (cm)</td></tr>";

	obj["amber"].forEach(function (cross) {
		html += `<tr><td>${cross[0]} x ${cross[1]}</td><td>${(cross[2] * 100).toFixed(1)}</td></tr>`;
	});
	html += "</table>";

	Common.MessageBox("lines" + strHostGst, "Line Analysis for " + ((strHostGst == "HOST") ? "Host" : "Guest"), html, callback);

}

document.toggleVis = function (element) {
	if (element.style.display == "none")
		element.style.display = "block";
	else
		element.style.display = "none";
}

document.toggleCollisionDetection = function () {

	//BITFIELD3D ^= COLLISION
	document.ToggleState(COLLISION);

	//collisionDetectionOn = !collisionDetectionOn;

	if (BITFIELD3D & COLLISION)
		camera.layers.enable(LAYER_COLLISION);
	else
		camera.layers.disable(LAYER_COLLISION);

	////Can't do this with layers as seems to apply to parents?
	//let collider;
	//collisionObjects.forEach(group => {
	//	group.forEach(obj => {
	//		collider = obj.getObjectByName('collider');
	//		if (collider) collider.visible = collisionDetectionOn
	//	})
	//});
	
	return BITFIELD3D & COLLISION;
}

document.getCollisionDetection = function () {
	return BITFIELD3D & COLLISION;
}

//document.getElementById('menudiv').innerHTML = `<button id="menubutton" onclick="document.OpenMenu();document.toggleVis(this);">Menu</button>`;
/*
document.getElementById('menuimg').addEventListener('click', 
	function(){ 
		document.OpenMenu();
		document.toggleVis(this);
	}, falsse
);
*/

//.innerHTML = `<input type="image" src="./res/button_menu_75.png" onclick="document.OpenMenu();document.toggleVis(this);">`;


//document.getElementById('menudiv').innerHTML = `<input type="image" width="75px" src="./res/tti-logo.png" onclick="document.OpenMenu();document.toggleVis(this);">`;

//document.getElementById('menuimg').addEventListener('click', function() {document.OpenMenu();document.toggleVis(this);} );
//onclick="document.OpenMenu();document.toggleVis(this);"

/////////////////////////////////////////////////////////////////////////
//
// Event Handlers
//

function onWindowResize() {
	var width = window.innerWidth;
	var height = window.innerHeight;

	if (camera) {
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	}

	if (container.renderer) {
		container.renderer.setSize(width, height);
		let hiload = 0;
		if (container.renderer.info.memory.geometries > 280) hiload++;

		container.renderer.setPixelRatio = GetPixelDensity(2, hiload);
	}

	if (container.labelrenderer) {
		container.labelrenderer.setSize(width, height);
	}

	//composer.setSize( width, height );
	return false;
}

// Mouse events

var mouse = new THREE.Vector2();
var selectedObjects = [];

function addSelectedObject(object) {

	selectedObjects = [];
	selectedObjects.push(object);

}

/*
window.addEventListener( 'mousemove', function(event) {

	var x, y;

	if ( event.changedTouches ) {

		x = event.changedTouches[ 0 ].pageX;
		y = event.changedTouches[ 0 ].pageY;

	} else {

		x = event.clientX;
		y = event.clientY;

	}

	mouse.x = ( x / window.innerWidth ) * 2 - 1;
	mouse.y = - ( y / window.innerHeight ) * 2 + 1;

	//Only for outlinepass!
	//heavy load!
	//checkIntersection();

}, true );
*/


document.addEventListener2('dblclick', DoClick, false, 'dolineclick');

function DoClick(event) {

	const res = Common.getMouseObject(event, scene, camera, raycaster);

	if (res && res.object && res.object.parent.diam0) {

		if (LineTools.lineB) {
			//already active
			LineTools.reset();
		}

		
		if (!LineTools.lineA) {
			LineTools.lineA = res.object;
			LineTools.matA = res.object.material.name;
			Common.MessageBoxHTML("linetools", LineTools.html())
		}
		else
		{
			LineTools.lineB = res.object;
			LineTools.matB = res.object.material.name;
			LineTools.Show();
		}

		res.object.material = CACHE.getMaterial("yellowstd", new THREE.MeshStandardMaterial({ color: 0xffff00 }));;
	}
}


//TODO: you aren't actually changing the y of objects!
document.addEventListener2('contextmenu', DoContextMenu, false, 'contextmenu2');

function DoContextMenu(event) {

	//const res = Common.getMouseObject(event, detectableObjects, camera, objInfo);
	//const res = Common.getMouseObjectSlow(event, detectableObjects, camera, objInfo, raycaster);
	const res = Common.getMouseObject(event, detectableObjects, camera, raycaster);


	if (res != null) {
		res.object = Common.findTopInfo_r(res.object);
		document.OpenInfo(res.object, event);
	}
	/*
	//in move state
	if (moveobj) {

		transformcontrol.detach( moveObj );

		//To change the underlying data model
		//document.body.style.cursor="grab";//grabbing

		const parts = moveObj.name.split('-');
		//const lineNos = parts[1].split(';');
		const lineNos = MAPS.ObjectLineNo[ moveObj.name ];
		const delta = moveObj.origObjPos.clone().sub( moveObj.position );

		//if (DEBUG) console.log( Common.vvMapWorld2Ship( moveObj.position ));
		
		//adjust underlying line data
		//Moving/rotating a winch affects many lines + note rotation changes lines also!
		//TODO: you need adjust the actual object data too!
		lineNos.forEach( function(lineNo) {
			if (parts[0] == "winch") {
				//TODO: need update actual winch position!
				let wch = MAPS.winchDataRMap[lineNo];
				wch[ WINCHDATA2WINCH.X ] += delta.x;
				//DATA.winchPoints[lineNo].x += delta.x;
				//DATA.winchPoints[lineNo].y = shippos[1];
				wch[ WINCHDATA2WINCH.Z ] += delta.z;
				//DATA.winchPoints[lineNo].z += delta.z;
			} else if (parts[0] == "dolly") {
				DB.addDollyPos( lineNo, delta);
			} else if (parts[0] == "fairlead") {
				//currently doesn't work
				DB.addFairleadPos( lineNo, delta );
				//let lineidx = MAPS.fairleadsDict[ lineNo ];
				//DATA.HOST.vesselLines[ lineidx ][1] += delta.x;
				//DATA.HOST.vesselLines[ lineidx ][2] += delta.z;
			} else if (parts[0] == "bollard") {
				//TODO
				//bollardRMap[ parts[1] ]
				//    //name, x (origin), Dist from fenders (toward viewer onto pier), Ht (above pier), max load


				//oBollard.position.set( bollard[1], DATA.pierHeight + bollard[3] + DATA.OBJPARAMS.bollardY, -bollard[2])
				//let lineidx = MAPS.fairleadsDict[ lineNo ];
				//DATA.pierLines[ lineidx ][1] += delta.x;
				//DATA.HOST.vesselLines[ lineidx ][2] += delta.z;
			}
		});

		moveObj = null;
		//document.removeEventListener('mousemove', _listener, true);
		removeLines();
		
		//if (DEBUG) console.log("draw lines");

		let winchangles = createLines(true);
		SetWinchAngles( winchangles );
		
	} else {
		//single click: not in move state
		if (res != null) { //clicked a clickable object 			
			//if (DEBUG) console.log("Attach");
			//if (DEBUG) console.log(res.obj);
			//transformcontrol.attach( res.obj );
		}
	}
	*/
	return false;
}

/*
function GetMouseObject1(event) {
	//TODO: see transform for edit mode get. We could centralise this screen to world map
	const pcX = event.clientX / window.innerWidth;
	const pcY = event.clientY / window.innerHeight;

	var mouse3D = new THREE.Vector3(pcX * 2 - 1,
		-pcY * 2 + 1,
		0.5);

	raycaster.setFromCamera(mouse3D, camera);

	let intersects = raycaster.intersectObjects(detectableObjects, true);
	
	if (intersects.length > 0) {

	function findTopLevel_r(obj) {
		if (!obj) return null;
		if (!obj.info) {
			//nothing in tree is registered in objInfo
			if (!obj.parent) return null;
			//go to next level
			return findTopLevel_r(obj.parent);
		} else {
			return obj;
		}
	}

		const toplevel = findTopLevel_r(intersects[0].object);

		//give a couple of rounds
		return {
			intersectpoint: intersects[0].point,
			//look in objInfo to see if recorded. If not try parent (i.e group)
			obj: toplevel
		}
	}
	return null;
}
*/


//DOUBLE CLICK moved into obj menu 
/*
document.addEventListener2('dblclick', function(event) {

	const res = GetMouseObject(event);

	if (res == null) return;

	//document.OpenInfo(res.obj, false);
*/

/*
if (moveObj == null) {
	moveObj = res.obj;
	moveX = event.clientX;
	moveY = event.clientY;
	moveObj.origObjPos = res.obj.position.clone();

	transformcontrol.attach( moveObj );

	if (DATA.PerspectiveCamera)
		transformcontrol.setSize(1);
	else
		transformcontrol.setSize(0.75);

	//translate, rotate, scale
	transformcontrol.setMode( "translate" );
	
	/*

	_listener = function(event) {
		//percent event X/Y
		const pcX = event.clientX / window.innerWidth;
		const pcY = event.clientY / window.innerHeight;
		//convert % 0 to 1 -> -1 to 1
		var mouse3D = new THREE.Vector3( pcX * 2 - 1,   
			-pcY * 2 + 1,  
			0.5 );     
		raycaster.setFromCamera( mouse3D, camera );

		const lambdaDeck = (moveObj.origObjPos.y - raycaster.ray.origin.y) / raycaster.ray.direction.y;
					
		const xDeck = raycaster.ray.origin.x + lambdaDeck * raycaster.ray.direction.x;
		const zDeck = raycaster.ray.origin.z + lambdaDeck * raycaster.ray.direction.z;

		moveObj.position.x  = xDeck;
		moveObj.position.z  = zDeck;
	}
	document.addEventListener2('mousemove', _listener, true);
	*/

/*
} else if (transformcontrol.mode == "scale") {	//in move state and cycled thru

transformcontrol.detach( moveObj );

//To change the underlying data model
//document.body.style.cursor="grab";//grabbing

const parts = moveObj.name.split('-');
//const lineNos = parts[1].split(';');
const lineNos = MAPS.ObjectLineNo[ moveObj.name ];
const delta = moveObj.origObjPos.clone().sub( moveObj.position );

//if (DEBUG) console.log( Common.vvMapWorld2Ship( moveObj.position ));
	
//adjust underlying line data
//Moving/rotating a winch affects many lines + note rotation changes lines also!
//TODO: you need adjust the actual object data too!
lineNos.forEach( function(lineNo) {
	if (parts[0] == "winch") {
		//TODO: need update actual winch position!
		let wch = MAPS.winchDataRMap[lineNo];
		wch[ WINCHDATA2WINCH.X ] += delta.x;
		//DATA.winchPoints[lineNo].x += delta.x;
		//DATA.winchPoints[lineNo].y = shippos[1];
		wch[ WINCHDATA2WINCH.Z ] += delta.z;
		//DATA.winchPoints[lineNo].z += delta.z;
	} else if (parts[0] == "dolly") {
		DB.addDollyPos( lineNo, delta);
	} else if (parts[0] == "fairlead") {
		//currently doesn't work
		DB.addFairleadPos( lineNo, delta );
		//let lineidx = MAPS.fairleadsDict[ lineNo ];
		//DATA.HOST.vesselLines[ lineidx ][1] += delta.x;
		//DATA.HOST.vesselLines[ lineidx ][2] += delta.z;
	} else if (parts[0] == "bollard") {
		//TODO
		//bollardRMap[ parts[1] ]
		//    //name, x (origin), Dist from fenders (toward viewer onto pier), Ht (above pier), max load


		//oBollard.position.set( bollard[1], DATA.pierHeight + bollard[3] + DATA.OBJPARAMS.bollardY, -bollard[2])
		//let lineidx = MAPS.fairleadsDict[ lineNo ];
		//DATA.pierLines[ lineidx ][1] += delta.x;
		//DATA.HOST.vesselLines[ lineidx ][2] += delta.z;
	}
});

moveObj = null;
//document.removeEventListener('mousemove', _listener, true);
removeLines();
	
//if (DEBUG) console.log("draw lines");

let winchangles = createLines(true);
SetWinchAngles( winchangles );
} else {
//cycle transform control
//translate, rotate, scale
if (transformcontrol.mode == "translate")
	transformcontrol.setMode( "rotate" );
else if (transformcontrol.mode == "rotate")
	transformcontrol.setMode( "scale" );
else 
	transformcontrol.setMode( "translate" );
}
*/
//});


//let animationdelay = 1000;
document.FRAMES = [];
let oldtimestamp = 0;
let do_render;

//0,1,..,4,...
//Use an exponential decay y=a b^x
//by time gets undefined == 0 then out of sight
//const ZOOMLEVELS = [0, 0, 0.03, 0.14, 0.28, 0.5, 0.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
//let zoomThreshold = 0;
//let zoomlevel;
//function setZoomThreshold(newth) {
//	if (zoomThreshold != newth) {
//		//change
//		zoomThreshold = newth;
//		//removeLines();
//		//createLines(false);
//		createLines("HOST", false);
//		if (DATA.GUEST) createLines("GUEST", false);
//	}
//}



var vX, vY, vZ, vX1, vY1, vZ1;
vX = vY = vZ = 0;

//define test points on hull get movement
//const hullpressure = Gerstner.createHullPressure();

//DATA.modModeFixed === null then not edit mode. For edit more need full animation to update boat position
function animate(timestamp) {
	//DO this every animation call

	if (!running) return;

	requestId = requestAnimationFrame(animate);

	if (STATSON) stats.update();

	//if (DEBUG) console.log("> Tickmove");

	//var pos = scene.getObjectByName("vessel").position;
	//vX = Math.random() - 0.5;
	//vY = Math.random() - 0.5;
	//vZ = Math.random() - 0.5;
	//vX1 = (Math.random() - 0.5) / 100;
	//vY1 = (Math.random() - 0.5) / 100;
	//vZ1 = (Math.random() - 0.5) / 100;
	//document.DeltaShip("vessel", vX, vY, vZ, vX1, vY1, vZ1);
	//document.DeltaShip("vesselguest", vZ, vX, vY, vZ1, vX1, vY1);
	//document.DeltaShip(0, 0, 0, 0, 0, 0.1);

	if ((timestamp - oldtimestamp) < 100 && !controls.changed && DATA.modModeFixed === null) return;
	//Do this every frame

	oldtimestamp = timestamp;

	//water.material.uniforms[ 'time' ].value += 0.005;//1.0 / 60 / waterspeed;
	if (scene.getObjectByName("water"))
		scene.getObjectByName("water").material.uniforms['time'].value = timestamp * 0.0002;

	//#TODO adds a geometry

	if (!scene) alert("no scene");
	if (!container.renderer) alert("no render");
	if (!container.labelrenderer) alert("no lab render");
	if (!camera) alert("no cam");


	container.renderer.render(scene, camera);
	container.labelrenderer.render(scene, camera);

	//fake vessel wave motion
	//let vessel = scene.getObjectByName("vessel");
	//Gerstner.updatePosition(vessel, water, timestamp, DATA.HOST.LOA, DATA.HOST.shipBreadth, hullpressure, WAVEPARAMS);
	//vessel = scene.getObjectByName("vesselguest");
	//Gerstner.updatePosition(vessel, water, timestamp, DATA.GUEST.LOA, DATA.GUEST.shipBreadth, hullpressure, WAVEPARAMS);

	if (!controls.changed && DATA.modModeFixed === null) return;

	//Do this every time controls change
	controls.changed = false;

	let ahH = scene.getObjectByName("vessel").getObjectByName("arrowhost")
	Common.repaintArrowWText(ahH, camera);

	let ahG = scene.getObjectByName("vesselguest").getObjectByName("arrowguest")
	Common.repaintArrowWText(ahG, camera);

	//Update Vessel force vectors
	//var width = window.innerWidth, height = window.innerHeight;
	//var widthHalf = width / 2, heightHalf = height / 2;

	////Host
	//let objH = scene.getObjectByName("vessel").getObjectByName("arrow");

	//let posH = objH.position.clone();

	//posH.project(camera);
	//posH.x = ( posH.x * widthHalf );
	//posH.y = - ( posH.y * heightHalf ) + heightHalf;

	//let faH = document.getElementById("forceArrowH");
	//faH.style.top = posH.y + "px";
	//faH.style.left = posH.x + "px";

	////Guest
	//objH = scene.getObjectByName("vesselguest").getObjectByName("arrow");

	//posH = objH.position.clone();

	//posH.project(camera);
	//posH.x = ( posH.x * widthHalf );
	//posH.y = - ( posH.y * heightHalf ) + heightHalf;

	//faH = document.getElementById("forceArrowG");
	//faH.style.top = posH.y + "px";
	//faH.style.left = posH.x + "px";

	//


	//STATS

	//controls.update();
	//controls.smoothZoomUpdate();


	//renderer.clear();
	//renderer.render( scene, camera );

	//if (DEBUG) console.log( renderer.info.render );

	//setTimeout( function() {
	//controls loop calling of itself
	//animationId = 


	//Limit FPS
	//clearTimeout( timeout );
	//timeout = setTimeout( () => requestAnimationFrame( animate ) , 300);
	//requestAnimationFrame( animate );


	//can't window.cancelAnimationFrame(id) cos don't know which frames have executed or not (unless use time) slow, busy, pointless 
	//bin frames registered on same queue (same ts).
	//|| bin if queued within MAX ms per frame limit.
	//if (timestamp == queuets || oldtimestamp + MAXMSPF - timestamp > 0) {

	/*
	if (timestamp == queuets) {
		//to measure identity (frames in same queue have same timestamp)
		queuets = timestamp;
		//don't do anything
		return;
	}
	*/

	//Animation
	//limiting frames makes no FPS difference	


	//DOWN HERE OPTIMISATION NOT SO IMPORTANT



	//to measure the gap
	//oldtimestamp = timestamp;

	//stick render on the back of this
	//if (animationdelay < 1000) animationdelay += ;


	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//render();


	//slow
	//gimbal.rotation.copy( camera.rotation) ;

	//var time = performance.now() * 0.001;

	//get direction facing
	//	camera.getWorldDirection( orientation );
	/*
		let bearing = - Math.atan2(orientation.x,orientation.z) * 180 / Math.PI - DATA.SceneToTrueNorth;
		if (bearing < 0) bearing += 360; 
		document.getElementById('orientation').value = bearing.toFixed(2);
		document.getElementById('altitude').value = camera.position.y.toFixed(2);
	*/
	//OVERLAY
	//TODO: only need to process this when move. When no waves only need render when move too! 
	//DATA.modModeFixed == null if out of mode

	if (DATA.modModeFixed === false) {
		//layer in sync

		//let ops = DATA.OverlayParams.get1(orientation, camera);
		let ops = DATA.OverlayParams.get(controls, camera);

		if (DATA.overlayDelta.on == true) {
			//Slip is on
			DATA.overlayDelta.on = false;
			//Get the slip during free movement

			//set layerRef to new position in world.

			//get centre of GA layer
			let screenX = parseInt(gadiv.style.left, 10) + GAORIGRECT.width / 2;
			let screenY = parseInt(gadiv.style.top, 10) + GAORIGRECT.height / 2;
			//if (DEBUG) console.log( "SCN ",screenX, screenY );
			let worldPos = DATA.Screen2World(screenX, screenY, camera);

			//Move layer zero by delta 
			layerRef.copy(worldPos);

			//camera.updateMatrixWorld();

			DATA.OverlayParams.get(controls, camera)

			let deltacps = DATA.OverlayParams.sub(ops, DATA.overlayDelta.ops0);
			//store this slip
			DATA.overlayDelta.delta = deltacps;
			DATA.overlayDelta.newzero = ops;

			//update rolling slip with delta
			DATA.overlayDelta.ops = DATA.OverlayParams.add(DATA.overlayDelta.ops, deltacps);

		}

		DATA.OverlayParams.applyAffineWDeltaSlip(ops, DATA.overlayDelta.ops);

	} else if (DATA.modModeFixed === true) {
		if (DATA.overlayDelta.on == false) {
			//record current camera status when go fixed
			DATA.overlayDelta.ops0 = DATA.OverlayParams.get(controls, camera);;
			DATA.overlayDelta.on = true;
		}
	}


	//if (DEBUG) console.log( camera.rotation );

	//camera.updateMatrixWorld();
	/*
	let fs = Math.round(1200/zoomlevel);
	fs = (fs > 8) ? '8pt' : fs + 'pt'; 
	AsyncCommon.addTextObject
	detectableObjects.forEach( (obj, idx) => {
		if (obj.name != undefined) {
			let div = GetNameLabel(obj.name, idx);
			let coord = document.getScreenXYFromModelV( obj );
			div.style.top = coord.y + 'px';
			div.style.left = coord.x + 'px';
			div.style.zIndex = coord.z;
			div.style.fontSize =  fs;
		}
	});
	*/


	//Zoom lines
	//const distHost = camera.position.clone().sub(scene.getObjectByName("vessel").position);
	//let distShip = Math.abs(distHost.x);
	//if (DATA.HOST) distShip = - DATA.HOST.LOA / 2;
	//distHost.x = Math.max(distShip, 0);
	//zoomlevel = Math.floor(distHost.length() / 40);
	//if (DEBUG) console.log(ZOOMLEVELS[zoomlevel]);
	//setZoomThreshold(ZOOMLEVELS[zoomlevel]);
	Lines.scaleLines(scene, camera.position, (BITFIELD3D & ORTHOGRAPHIC) == 0);

	/*
	//rotating text
	if (count++ % 2 == 0) {
		detectableObjects.forEach( (obj) => {
			let text = obj.getObjectByName('text');
			if (text != undefined) text.rotation.y += 0.01;
		});
	}
	*/


	//if (document.replay.mode == Replay.MODE.PLAY) document.replay.play(camera, scene);
	//if (document.replay.mode == Replay.MODE.RECORD) document.replay.record(camera, renderer.domElement);

	//composer.render();


	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




	// }, animationdelay );
}

//controls.addEventListener( 'change', () => animationdelay = 0 );

//@description: pool of reusable divs for displaying text
//@Note: updates index!
/*
function GetNameLabel(text, index) {
	if (index >= document.textannotation.children.length) {
		//need a new child
		let child = document.createElement("div");
		child.className = "info";
		child.innerHTML = text;
		document.textannotation.appendChild( child );
		index = document.textannotation.children.length - 1;
		return child;
	} else {
		let child = document.textannotation.children[ index ];
		child.className = "info";
		child.innerHTML = text;
		return child;
	}
	
	//var textCSS3DObject = new THREE.CSS3DObject(namespace.TextDiv);
	
	//scene.safeAdd(textCSS3DObject);
}
*/

//OVERLAY
//This is the position of the layer in world. Transform world and get this pos on screen to find layer pos
//This method avoids having to meta-model the world motion
//TODO
//Could also model rot and scale by having a second unit position thus avoiding need for ops all together!  
let layerRef = new THREE.Vector3(0, 0, 0);	//0,0,0

const GAORIGRECT = document.getElementById('gadiv').getBoundingClientRect();

DATA.OverlayParams = function () { };
//DATA.OverlayParams.zero = {rotate: 0, left: 0, top: 0, scale: 1, crotx: window.innerWidth/2 + GAORIGRECT.width/2, croty: (window.innerHeight - GAORIGRECT.height) * 0.5};
DATA.OverlayParams.zero = { rotate: 0, left: 0, top: 0, scale: 1 };
DATA.OverlayParams.add = function (ops1, ops2) {
	return {
		rotate: ops1.rotate + ops2.rotate,
		left: ops1.left + ops2.left,
		top: ops1.top + ops2.top,
		scale: ops1.scale * ops2.scale,
	}
}
DATA.OverlayParams.sub = function (ops1, ops2) {
	return {
		rotate: ops1.rotate - ops2.rotate,
		left: ops1.left - ops2.left,
		top: ops1.top - ops2.top,
		scale: ops1.scale / ops2.scale,
	}
}
/*
DATA.OverlayParams.get1 = function(orientation, camera) {
	//gives the position of 0,0 as % of the  screen (with center screen 0,0)
	let zeropos = layerRef.clone().project( camera );
	let scale = camera.zoom;
	return {
		rotate: Math.atan2(orientation.x,orientation.z),
		left: Math.round((zeropos.x) * window.innerWidth / 2),
		top: Math.round((0.5 - zeropos.y) * window.innerHeight / 2),
		scale: scale,
	}
}
*/
//left, top : % from centre in screen size
DATA.OverlayParams.get = function (controls, camera) {
	//gives the position of 0,0 as % of the screen (with center screen 0,0)
	let zeropos = layerRef.clone().project(camera);
	let scale = camera.zoom;

	return {
		rotate: controls.getAzimuthalAngle(),
		left: zeropos.x,
		top: zeropos.y,
		scale: scale,
	}
}

DATA.Screen2World = function (x, y, camera) {
	//screenX,Y range [-1,1]
	let screenX = Algotec.lerpAlpha(x, 0, window.innerWidth) * 2 - 1;
	//Optimoor world is bottom to top, while screen is top to bottom 	
	let screenY = Algotec.lerpAlpha(window.innerHeight - y, 0, window.innerHeight) * 2 - 1;
	var vector = new THREE.Vector3(screenX, screenY, 0).unproject(camera);
	return vector;
}

DATA.OverlayParams.applyAffineWDeltaSlip = (ops, delta) => {
	var left = ops.left;
	var top = ops.top;

	//shift calcs to affine
	left = Math.round(((1 + left) * window.innerWidth - GAORIGRECT.width) * 0.5);
	top = Math.round(((1 - top) * window.innerHeight - GAORIGRECT.height) * 0.5);
	gadiv.style.left = left + "px";
	gadiv.style.top = top + "px";

	const rotate = ops.rotate - delta.rotate;

	gadiv.style.transform = "rotate(" + rotate + "rad)";

	const scale = ops.scale / delta.scale;
	gadiv.style.transform += `scale(${scale},${scale})`;
}

DATA.overlayDelta = { on: false, ops: DATA.OverlayParams.zero, ops0: DATA.OverlayParams.zero, delta0: null };

//depend: window, scene, rendered
//effect: camera, controls, transformcontrols
const setCamera = function (isPerspective) {
	//Set up camera
	//Todo: is it easier to just have two cameras and swap between?
	var oldpos = null;
	var oldquat;

	if (camera != undefined) {
		oldpos = camera.position.clone();
		oldquat = camera.quaternion.clone();
	}

	//camera.dispose(); not a function
	if (camera && camera.dispose) camera.dispose();
	if (isPerspective) {
		camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
	} else {
		camera = new THREE.OrthographicCamera(
			window.innerWidth * -1,
			window.innerWidth * 1,
			window.innerHeight * 1,
			window.innerHeight * - 1,
			-10000,
			10000);
	}

	camera.matrixAutoUpdate = true;

	if (oldpos != null) {
		camera.position.copy(oldpos);
		camera.quaternion.copy(oldquat);
	}

	scene.safeAdd(camera, "camera", true);

	//Setup controls
	if (controls && controls.dispose) {
		controls.dispose();		//remove event listeners
	}

	const WHATCTRL = 4;

	if (!FLY) {

		if (isPerspective) {

			switch (WHATCTRL) {

				case 1:
					controls = new TrackballControls(camera, container.renderer.domElement);
					controls.rotateSpeed = 3.0;
					controls.zoomSpeed = 2.0;//1.2;
					controls.panSpeed = 1.0;

					//controls.noRotate = false;
					//controls.noZoom = false;
					//controls.noPan = false;

					controls.staticMoving = true;
					//controls.dynamicDampingFactor = 0.2;

					controls.minDistance = 0;
					controls.maxDistance = 600;
					controls.update();
					break;

				case 2:

					controls = new OOrbitControls(camera, container.renderer.domElement);
					controls.constraint.smoothZoom = true;
					controls.constraint.zoomDampingFactor = 5.0;
					controls.constraint.smoothZoomSpeed = 0.1;
					//if (DEBUG) console.log(controls.constraint);
					break;

				case 3:

					controls = new OrbitControls(camera, container.renderer.domElement);
					controls.panSpeed = 0.2;
					controls.rotateSpeed = 0.05;
					controls.zoomSpeed = 0.6;
					controls.enableDamping = false;
					controls.dampingFactor = 0.05;
					//controls.enableDamping = false;
					controls.enableKeys = false;
					controls.update();
					break;

				case 4:

					//controls = new EditorControls(camera, container.renderer.domElement);
					controls = new EditorControls(camera, container.labelrenderer.domElement);
					controls.panSpeed = 0.0025;
					controls.zoomSpeed = 0.006;
					controls.rotationSpeed = 0.0025;
					break;

			}
		} else {
			
			controls = new OrbitControls(camera, container.labelrenderer.domElement);
			controls.panSpeed = 1.0;
			controls.rotateSpeed = 0.3;
			controls.zoomSpeed = 4.0;
			controls.maxPolarAngle = Math.PI / 2;
			controls.enableDamping = false;
			controls.enableKeys = false;
			controls.update();
		
		}
	}

	if (FLY) {
		controls = new FlyControls(camera, container.renderer.domElement);
		controls.movementSpeed = 20;
		controls.domElement = container.renderer.domElement;
		controls.rollSpeed = Math.PI / 24;
		controls.autoForward = false;
		controls.dragToLook = true;
	}

	//only render if changed view
	controls.changed = true;
	//controls.addEventListener( 'change', () => controls.changed = true );
	controls.addEventListener2('change', () => {
		controls.changed = true;
		return false;
	});
	
	if (isPerspective) {
		//infinite zoom to linear
		const ZOOMSPEED = 10.0;
		controls.zoom = function (delta) {
	
			var vector = delta.applyQuaternion(camera.quaternion);
	
			if (document.SHIFT) {
				vector.multiplyScalar(0.2);
			} else {
				vector.multiplyScalar(ZOOMSPEED);
			}
	
			/*
			var distance = object.position.distanceTo( center );
	
			delta.multiplyScalar( distance * scope.zoomSpeed );
	
			if ( delta.length() > distance ) return;
	
			delta.applyMatrix3( normalMatrix.getNormalMatrix( object.matrix ) );
	
			object.position.add( delta );
			*/
			camera.position.add(vector);
	
			//scope.dispatchEvent( changeEvent );
	
			controls.changed = true;
	
		};
	}
	
	document.addEventListener2("keydown", (e) => {
		document.SHIFT = event.shiftKey;
		//document.SHIFT = e.key == " ";//Gecko
		return false;
	});

	document.addEventListener2("keyup", (e) => {
		//document.SHIFT = event.shiftKey;
		document.SHIFT = false;
		return false;
	});

	//setupTransformControl();

	//Setup Ruler
	//ruler = new Ruler(scene, camera, container.renderer.domElement );
	if (ruler) Ruler.clearRuler(ruler);
	//ruler = new Ruler(scene.getObjectByName("berth"), camera, container.renderer.domElement);
	ruler = new Ruler(scene, camera, container.labelrenderer.domElement);


	//
	//Create Gimbal
	//

	gimbal = document.getElementById("gimbal");
	gimbal.width = 200;
	gimbal.height = 200;

	//CACHE.LISTENERS.push(UpdateGimbal);

	document.addEventListener2("mousemove", UpdateGimbal, false, "gimbal");

	//
	// handle end of rotation
	//

	//ARG expose state so can monitor end. Add to controls.
	//this.getState = function() {
	//	return state;
	//}
	
	document.lastControlState = -1;
	document.addEventListener2("mousemove", (e) => {
		if (controls.getState) document.lastControlState = controls.getState()
	}, false, "labelrotate" );
	document.addEventListener2("mouseup", (e) => {
		if (document.lastControlState == 0) {
			const campos = camera.getWorldPosition2();
			Common.objectsWithLabel.forEach(obj => {				
				obj.lookAt(campos);
				obj.updateMatrix();
			});
			
		}
	});
	
	//pointless gimbal draws every frame anyway
	//document.addEventListener2("datachangedenvironment", () => {
	//	if (DEBUG) console.log("delta env");
	//	UpdateGimbal();
	//	//processingComplete.Update();
	//	return false;
	//});

	//underwater fog
	/*
	CACHE.LISTENERS.push((event) => {
		if (camera.position.y < 0) {
			if (!scene.fog) {
				//scene.fog = new THREE.Fog(0xcce0ff, 100, 500);
			}
		} else {
			if (scene.fog) {
				//scene.fog = null;//no need dispose
			}
		}
	});

	document.addEventListener2('mousemove', CACHE.LISTENERS[CACHE.LISTENERS.length - 1]);
	*/
}


function UpdateGimbal() {

	if (!DATA.vecCurrent) return;	//may trigger after dispose, if mousemove event runs

	let ctx = gimbal.getContext('2d');
	ctx.clearRect(0, 0, gimbal.width, gimbal.height);
	const CANX = gimbal.width * 0.5;
	const CANY = gimbal.height * 0.5;
	let up = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
	const yup = up.y;//height of artificial horizon
	up.y = 0;//project onto ground.
	const zrot = new THREE.Vector3( 0, 0, -1 ).angleTo360( up ) * -1;//angle of shadow to X axis.

	Banner.AddAxes(ctx, CANX, CANY, yup, zrot);

	//math th = 0 = bearing West. Math Anti-Clock, Bearing Clock-Wise  
	const NORTHTH = 270 - DATA.SceneToTrueNorth;
	const SOUTHTH = (NORTHTH + 180) % 360;//directions to not from

	let legendX = 0;
	const legendDX = 30;
	
	//North
	let r = Banner.AddAxis(ctx, THREE.Math.degToRad(NORTHTH), CANX * 0.9, CANX, CANY, '#000', yup, zrot);
	Banner.AddText(ctx, "N", '#000', "13px Verdana", CANX + r.rx, CANY + r.ry);

	let radius;
	if (DATA.vecWind[1] > 0) {
		//Wind
		radius = 0.8;
		r = Banner.AddAxis(ctx, THREE.Math.degToRad(DATA.vecWind[0] + SOUTHTH), CANX * radius, CANX, CANY, '#fff', yup, zrot);
		Banner.AddText(ctx, DATA.vecWind[1].toFixed(1), '#fff', "11px Verdana", CANX + r.rx, CANY + r.ry);
		Banner.AddText(ctx, "Wind", '#fff', "10px Verdana", legendX += legendDX, 10);
	}

	if (DATA.vecCurrent[1] > 0) {
		//Current
		radius = 0.65;
		r = Banner.AddAxis(ctx, THREE.Math.degToRad(DATA.vecCurrent[0] + SOUTHTH), CANX * radius, CANX, CANY, '#ff0', yup, zrot);
		Banner.AddText(ctx, DATA.vecCurrent[1].toFixed(1), '#ff0', "11px Verdana", CANX + r.rx, CANY + r.ry);
		Banner.AddText(ctx, "Curr", '#ff0', "10px Verdana", legendX += legendDX, 10);
	}

	if (DATA.vecWaves[1] > 0) {
		//Wave
		radius = 0.5;
		r = Banner.AddAxis(ctx, THREE.Math.degToRad(DATA.vecWaves[0] + SOUTHTH), CANX * radius, CANX, CANY, '#FFA500', yup, zrot);
		Banner.AddText(ctx, DATA.vecWaves[1].toFixed(1), '#FFA500', "11px Verdana", CANX + r.rx, CANY + r.ry);
		Banner.AddText(ctx, "Wave", '#FFA500', "10px Verdana", legendX += legendDX, 10);
	}

	if (DATA.vecSwell[1] > 0) {
		//Swell
		radius = 0.35;
		r = Banner.AddAxis(ctx, THREE.Math.degToRad(DATA.vecSwell[0] + SOUTHTH), CANX * radius, CANX, CANY, '#0ff', yup, zrot);
		Banner.AddText(ctx, DATA.vecSwell[1].toFixed(1), '#0ff', "11px Verdana", CANX + r.rx, CANY + r.ry);
		Banner.AddText(ctx, "Swell", '#0ff', "10px Verdana", legendX += legendDX, 10);
	}

	if (DATA.vecSurge[1] > 0) {
		//Surge
		radius = 0.2;
		r = Banner.AddAxis(ctx, THREE.Math.degToRad(DATA.vecSurge[0] + SOUTHTH), CANX * radius, CANX, CANY, '#f0f', yup, zrot);
		Banner.AddText(ctx, DATA.vecSurge[1].toFixed(1), '#f0f', "11px Verdana", CANX + r.rx, CANY + r.ry);
		Banner.AddText(ctx, "Surg", '#f0f', "10px Verdana", legendX += legendDX, 10);
	}
	return false;
}


function setupTransformControl() {
	//Setup transform controls
	if (transformcontrol) {
		document.removeTransformControl();
	}
	
	transformcontrol = new TransformControls(camera, container.labelrenderer.domElement);
	transformcontrol.name = "transformcontrol";
	//transformcontrol.setMode("rotate");//"translate", "rotate" and "scale"
	//transformcontrol.addEventListener( 'change', render );
	scene.safeAdd(transformcontrol);

	transformcontrol.addEventListener2('dragging-changed', transformConntrolEventListener, true);
}

document.removeTransformControl = function (objid) {

	//this is called when info popup is closed regardless any action
	if (!transformcontrol) return;

	let obj;
	//if(objid) obj = scene.getObjectById(objid);
	if (objid) obj = scene.getObjectByProperty('uuid', objid)

	//position remove
	if (obj) transformcontrol.detach(obj);
	if (obj) document.replay.removeTrack(obj);
	scene.remove(transformcontrol);
	transformcontrol.removeEventListener('dragging-changed', transformConntrolEventListener, true);
	transformcontrol.removeEventListener('objectChange', DATA.mouseMoveClosure, false);
	transformcontrol.dispose();
	transformcontrol = null;
	obj.matrixAutoUpdate = false;
	return false;
}

function transformConntrolEventListener(event) {
	controls.enabled = !event.value;
}

document.toggleEditMode = function () {
	//null out, false in
	DATA.modModeFixed = (DATA.modModeFixed == null) ? false : null;
	doEditMode();
}

function doEditMode() {
	//TODO: set background

	if (DATA.modModeFixed != null) {
		//enter edit mode
		document.SetState(ORTHOGRAPHIC, true);	//set ORTHOGRAPHIC = 0
		setCamera((BITFIELD3D & ORTHOGRAPHIC) == 0);
		setEnvironment((BITFIELD3D & ORTHOGRAPHIC) == 0);
		camera.position.set(0, 200, 0);
		//camera.position.applyQuaternion( new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3( 0, 1, 0 ), Math.PI));
		camera.lookAt(new THREE.Vector3(0, 0, 0));
		controls.minPolarAngle = -2 * Math.PI;
		controls.maxPolarAngle = -2 * Math.PI;
		controls.update();
		let html = `<div style='padding-left: 5px;padding-right: 5px;padding-bottom: 5px'>
		<table>
			<tr><td>General Arrangement:<br><button onclick="document.OpenGA();">Open</button></td></tr>
			<tr><td>&alpha;: <input type="range" min="0" max="100" value="50" onchange="document.getElementById('gadiv').style.opacity = this.value / 100"></td></tr>
			<tr><td><button onclick="DATA.modModeFixed=!DATA.modModeFixed; this.innerHTML = (DATA.modModeFixed) ? 'Free' : 'Fixed'; ">Locked</button></td></tr>
			<tr><td><button onclick="document.CreateShip();">Redraw</button></td></tr>
			<tr><td><hr></td></tr>
			<tr><td>Orientation:<br/><button onclick="document.SetOrientation(6);">XY</button>&nbsp;<button onclick="document.SetOrientation(5);">XZ</button>&nbsp;<button onclick="document.SetOrientation(3);">YZ</button></td></tr>
		</table></div>`;
		Common.MessageBox("EditControls", "GA Controls", html, null, false);

		document.getElementById('gadiv').style.visibility = 'visible';

		let shipcross = new THREE.Group();
		shipcross.add(Common.lineMesh([Common.vMapShip2World(-300, 50, 0), Common.vMapShip2World(300, 50, 0)], 0xFF00FF));
		shipcross.add(Common.lineMesh([Common.vMapShip2World(0, 50, -100), Common.vMapShip2World(0, 50, 100)], 0xFF00FF));
		shipcross.name = "shipcross";
		scene.safeAdd(shipcross);

	} else {
		//exit edit mode
		let shipcross = scene.getObjectByName("shipcross");
		if (shipcross) scene.remove(shipcross);

		Common.remove("EditControls");

		document.SetState(ORTHOGRAPHIC, false); // ORTHOGRAPHIC = true;
		setCamera((BITFIELD3D & ORTHOGRAPHIC) == 0);
		setEnvironment((BITFIELD3D & ORTHOGRAPHIC) == 0);
		//camera.position.set( 0, 200, -200 );	
		camera.position.set(0, 200, -200);
		camera.lookAt(new THREE.Vector3(0, 0, 0));
		document.getElementById('gadiv').style.visibility = 'hidden';
	}

}

//XYZ = 111
document.SetOrientation = function (axisPair) {
	switch(axisPair) {
		case 6://XY
		break;
		case 5://XZ
		break;
		case 3://YZ
		break;
	}
}


document.UpdateGA = function () {
	document.getElementById('gadiv').src = "GA1.png" + `?v=${new Date().getTime()}`;
}

document.OpenGA = function() {
	const input = document.createElement('input');
	input.type = 'file';
	input.onchange = e => { 
		const file = e.target.files[0];

		var reader = new FileReader();
		reader.readAsDataURL(file);
	
		reader.onload = readerEvent => {
			var content = readerEvent.target.result; // this is the content!
			document.getElementById('gadiv').src = content;
		}
	}

	input.click();
}


//function PrintGeo(text) {
//	const b4 = container.renderer.info.memory.geometries;
//	if (camera) {
//		container.renderer.render(scene, camera);
//		if (DEBUG) console.log(`#Geo ${text}: ${b4} : ${container.renderer.info.memory.geometries}`);
//	} else {
//		if (DEBUG) console.log(`#Geo ${text}: no camera`);
//	}
//}




//const gadiv = document.getElementById('gadiv');
//function render1() {

//slow
//gimbal.rotation.copy( camera.rotation) ;

//var time = performance.now() * 0.001;

//get direction facing
//	camera.getWorldDirection( orientation );
/*
	let bearing = - Math.atan2(orientation.x,orientation.z) * 180 / Math.PI - DATA.SceneToTrueNorth;
	if (bearing < 0) bearing += 360; 
	document.getElementById('orientation').value = bearing.toFixed(2);
	document.getElementById('altitude').value = camera.position.y.toFixed(2);
*/
//OVERLAY
//TODO: only need to process this when move. When no waves only need render when move too!
//DATA.modModeFixed == null if out of mode

/*
if (DATA.modModeFixed === false) {
	//layer in sync

	//let ops = DATA.OverlayParams.get1(orientation, camera);
	let ops = DATA.OverlayParams.get(controls, camera);

	if (DATA.overlayDelta.on == true) {
		//Slip is on
		DATA.overlayDelta.on = false;
		//Get the slip during free movement

		//set layerRef to new position in world.

		//get centre of GA layer
		let screenX = parseInt(gadiv.style.left, 10) + GAORIGRECT.width/2;
		let screenY = parseInt(gadiv.style.top, 10) + GAORIGRECT.height/2;
		//if (DEBUG) console.log( "SCN ",screenX, screenY );
		let worldPos = DATA.Screen2World(screenX, screenY, camera);

		//Move layer zero by delta 
		layerRef.copy( worldPos );

		//camera.updateMatrixWorld();

		DATA.OverlayParams.get(controls, camera)
		
		let deltacps = DATA.OverlayParams.sub( ops, DATA.overlayDelta.ops0 );
		//store this slip
		DATA.overlayDelta.delta = deltacps;
		DATA.overlayDelta.newzero = ops;

		//update rolling slip with delta
		DATA.overlayDelta.ops = DATA.OverlayParams.add( DATA.overlayDelta.ops, deltacps );

	}
	
	DATA.OverlayParams.applyAffineWDeltaSlip(ops, DATA.overlayDelta.ops);
				
} else if (DATA.modModeFixed === true) {
	if ( DATA.overlayDelta.on == false ) {
		//record current camera status when go fixed
		DATA.overlayDelta.ops0 = DATA.OverlayParams.get(controls, camera);;
		DATA.overlayDelta.on = true;
	}
}
*/

//if (DEBUG) console.log( camera.rotation );

//camera.updateMatrixWorld();
/*
let fs = Math.round(1200/zoomlevel);
fs = (fs > 8) ? '8pt' : fs + 'pt'; 
AsyncCommon.addTextObject
detectableObjects.forEach( (obj, idx) => {
	if (obj.name != undefined) {
		let div = GetNameLabel(obj.name, idx);
		let coord = document.getScreenXYFromModelV( obj );
		div.style.top = coord.y + 'px';
		div.style.left = coord.x + 'px';
		div.style.zIndex = coord.z;
		div.style.fontSize =  fs;
	}
});
*/


/*
function setZoomThreshold(newth) {		
	newZoomTheshhold = newth;
	if (zoomThreshold != newZoomTheshhold) {
		//change
		//if (DEBUG) console.log(newth);
		zoomThreshold = newZoomTheshhold;
		removeLines();
		createLines(false);
	}
}

	
//0,1,..,4,...
//Use an exponential decay y=a b^x
zoomlevel = Math.floor(camera.position.length()/50);
switch(zoomlevel) {
	case 0:
	case 1:
	case 2:
	case 3:
		setZoomThreshold(0);
		break;
	case 4:
		setZoomThreshold(0.10);
		break;
	case 5:
		setZoomThreshold(0.28);
		break;
	case 6:
		setZoomThreshold(0.5);
		break;
	case 7:
		setZoomThreshold(0.75);
		break;
	default:		//>4
		setZoomThreshold(1);
		break;
}
*/




/*
//this technique works
test.position.copy( camera.position );
test.rotation.copy( camera.rotation );
test.updateMatrix();
test.translateZ( - 10 );
test.translateX( - 10 );

arrowHelper.position.copy( test.position );
*/

//controls.movementSpeed = 0.33;

/*
	//Look ahead to see if collision
	var vector = new THREE.Vector3();
	camera.getWorldDirection( vector );

	raycaster.set( mouse3D, camera );

	var intersects = raycaster.intersectObjects( detectableObjects, true );

	if ( intersects.length > 0 ) {

		document.getElementById('info').style.display = "inline";

		var infoX, infoY;

*/


//Fly Controls
//if (FLY) {
//const delta = clock.getDelta();
//controls.update( delta );
//}
//controls.movementSpeed = radar() ? 0: 50;

//Edit Controls
//if (collision()) {
//	controls.state = EditorControls.STATE.NONE;
//}

/*
if (render.count == undefined || render.count++ > 2) {
	water.material.uniforms[ 'time' ].value += 1.0 / 60 / waterspeed;
	render.count = 0;
}
*/

// required if controls.enableDamping or controls.autoRotate are set to true
//controls.update();

//composer.render();

/*
//rotating text
if (count++ % 2 == 0) {
	detectableObjects.forEach( (obj) => {
		let text = obj.getObjectByName('text');
		if (text != undefined) text.rotation.y += 0.01;
	});
}
*/

//if (STATSON) stats.update();

//container.renderer.render( scene, camera );
//composer.render();

//}

/*
document.addEventListener2('keyup', (e) => {
	//if (DEBUG) console.log(e.code);
	switch(e.code) {
		case "Digit0":		//0
			toggleHidden();
			break;
		case "Space":		//0
			document.setVideoState(Replay.MODE.PLAY);
			break;
		case "KeyR":		//0
		document.setVideoState(Replay.MODE.RECORD);
			break;
		case "KeyS":		//0
			document.setVideoState(Replay.MODE.STOP);
			break;
		case "KeyZ":		//0
			document.replay.reset();
			break;
	}
});
*/

/*
document.addEventListener2('keyup', (e) => {
	//if (DEBUG) console.log(e.code);

	switch(e.code) {
		case "Digit0":		//0
			break;
		case "Backslash":	//#
			//Use to hide
			//if (DEBUG) console.log( document.RECORD );
			break;
		case "Quote":		//'
			//document.PLAY = document.FRAMES.length - 1;
			//if (DEBUG) console.log( "Play..." );
			break;
		case "Space":
			//if (DEBUG) console.log(DATA);
			//test speed
			let ts = (new Date()).getTime();
			let data = container.renderer.domElement.toDataURL('image/jpeg', 0.5);
			wktest.postMessage( data );
			if (DEBUG) console.log( (new Date()).getTime() - ts );
			*/
//document.RECORD = ! document.RECORD;
//if (DEBUG) console.log( document.RECORD ? "Saving..." : "Saved." );

//keep MOUSE updated
/*
let _listener = function(event) {

	var x, y;

	if ( event.changedTouches ) {

		x = event.changedTouches[ 0 ].pageX;
		y = event.changedTouches[ 0 ].pageY;

	} else {

		x = event.clientX;
		y = event.clientY;

	}

	MOUSE.x = ( x / window.innerWidth ) * 2 - 1;
	MOUSE.y = - ( y / window.innerHeight ) * 2 + 1;

}

if (document.RECORD)

	document.addEventListener2( 'mousemove', _listener, true );

else {

	document.removeEventListener('mousemove', _listener, true);

}
	
	
break;


case "[":
controls.movementSpeed -= 5;
controls.update();
break;
case "]":
controls.movementSpeed += 5;
controls.update();
break;

}

});
*/


//var camtheta = 0, camradius = 200, camheight = 30;
/*
document.addEventListener2('keyup', (e) => {
	if (DEBUG) console.log(e.code);
	switch(e.code) {
		case "Minus":
			var xp1 = camradius * Math.cos(camtheta);
			var zp1 = camradius * Math.sin(camtheta);
			SetParameter("SETCAMERA", "[" + xp1 + "," + camheight + "," + zp1 + ",0,0,0,0,30,0]");
			break;
		case "KeyI":
			camtheta -= Math.PI/36;
			xp1 = camradius * Math.cos(camtheta);
			zp1 = camradius * Math.sin(camtheta);
			SetParameter("SETCAMERA", "[" + xp1 + "," + camheight + "," + zp1 + ",0,0,0,0,30,0]");
			break;
		case "KeyU":
			camtheta += Math.PI/36;
			xp1 = camradius * Math.cos(camtheta);
			zp1 = camradius * Math.sin(camtheta);
			SetParameter("SETCAMERA", "[" + xp1 + "," + camheight + "," + zp1 + ",0,0,0,0,30,0]");
			break;
		case "KeyY":
			camheight += 5;
			xp1 = camradius * Math.cos(camtheta);
			zp1 = camradius * Math.sin(camtheta);
			SetParameter("SETCAMERA", "[" + xp1 + "," + camheight + "," + zp1 + ",0,0,0,0,30,0]");
			break;
		case "KeyH":
			camheight -= 5;
			xp1 = camradius * Math.cos(camtheta);
			zp1 = camradius * Math.sin(camtheta);
			SetParameter("SETCAMERA", "[" + xp1 + "," + camheight + "," + zp1 + ",0,0,0,0,30,0]");
			break;
		case "KeyJ":
			camradius -= 5;
			xp1 = camradius * Math.cos(camtheta);
			zp1 = camradius * Math.sin(camtheta);
			SetParameter("SETCAMERA", "[" + xp1 + "," + camheight + "," + zp1 + ",0,0,0,0,30,0]");
			break;
		case "KeyK":
			camradius += 5;
			xp1 = camradius * Math.cos(camtheta);
			zp1 = camradius * Math.sin(camtheta);
			SetParameter("SETCAMERA", "[" + xp1 + "," + camheight + "," + zp1 + ",0,0,0,0,30,0]");
			break;
		case "Digit1":
			SetParameter("SETCAMERA", "[0,250,-150,0,0,0,0,0,100]");
			break;
		case "Digit2":
			SetParameter("SETCAMERA", "[0,200," + DATA.centreLine + ",0,0," + (-Math.PI) + ",0,0," + DATA.centreLine + "]");
			//camera.position.set( 0, 200, centreLine );
			//camera.lookAt(new THREE.Vector3(0,0,centreLine));
			//camera.rotation.z = -Math.PI;
			break;
		case "Digit3":
			SetParameter("SETCAMERA", "[85,10,1, 0,0,0, -1,0,0]");
			//camera.position.set( 85, 10, 1 );
			//camera.lookAt(new THREE.Vector3(-1,0,0));
			break;
		case "Digit4":
			SetParameter("SETCAMERA", "[110,70," + DATA.centreLine + ", 0,0,"+ -Math.PI +", 110,0," + DATA.centreLine + "]");
			//camera.position.set( 110, 70, centreLine );
			//camera.lookAt(new THREE.Vector3(110, 0, centreLine));
			//camera.rotation.z = -Math.PI;
			break;
		case "Digit5":
			SetParameter("SETCAMERA", "[-180,60," + DATA.centreLine + ", 0,0,"+ -Math.PI +", -180,0," + DATA.centreLine + "]");
			//camera.position.set( -180, 60, centreLine );
			//camera.lookAt(new THREE.Vector3(-180, 0, centreLine));
			//camera.rotation.z = -Math.PI;
			break;
		case "Digit0":
			SetParameter("TOGGLEHIDDEN",null);
			break;

		case "KeyO":
			document.ToggleView();
			break;

		case "KeyP":
			//radar1();
			break;

		case "KeyG":


			break;


		case "Period":
			boatCollection.forEach(function(obj, idx) {
				obj.position.z += 50;
			});

			//ship based on centre line but fairleads not!

			DATA.centreLine += 50;

			removeLine();
			DATA.winchangles = createLines();

			break;
		case "Comma":
			boatCollection.forEach(function(obj, idx) {
				obj.position.z -= 50;
			});

			DATA.centreLine -= 50;

			removeLine();
			DATA.winchangles = createLines();
			break;
		case "Key-":
			alert(camera.position.x + "," + camera.position.y + "," + camera.position.z);
			var lookAtVector = new THREE.Vector3(0,0, -1);
			lookAtVector.applyQuaternion(camera.quaternion);
			alert(lookAtVector.x + "," + lookAtVector.y + "," + lookAtVector.z);
			break;

		default:
			break;
	}
});
*/

document.ToggleState = function (state3d) {
	BITFIELD3D ^= state3d

	//eBitfieldchanged.mask = state3d;
	//container.dispatchEvent(eBitfieldchanged);
}

document.SetState = function (state3d, ON) {

	if (DEBUG) console.log(`Bitfield change: ${state3d} + ${ON}`)

	BITFIELD3D = (ON) ? BITFIELD3D | state3d : BITFIELD3D & !state3d;

	//unused
	//eBitfieldchanged.mask = state3d;
	//container.dispatchEvent(eBitfieldchanged);
}

document.GetState = function (state3d) {
	return ((BITFIELD3D & state3d) != 0) ? 1 : 0;
}




document.SetLabels = function (state) {

	if(state & 1)
		camera.layers.enable(LAYER_LABEL_DECK);
	else
		camera.layers.disable(LAYER_LABEL_DECK);

	if (state & 2)
		camera.layers.enable(LAYER_LABEL_QUAY);
	else
		camera.layers.disable(LAYER_LABEL_QUAY);

	if (state & 4)
		camera.layers.enable(LAYER_LABEL_FENDER);
	else
		camera.layers.disable(LAYER_LABEL_FENDER);

	if (state & 8)
		camera.layers.enable(LAYER_LABEL_FAIRLEAD);
	else
		camera.layers.disable(LAYER_LABEL_FAIRLEAD);

	if (state & 16)
		camera.layers.enable(LAYER_LABEL_LINE);
	else
		camera.layers.disable(LAYER_LABEL_LINE);

}


document.ToggleView = function () {

	//DATA.PerspectiveCamera = !DATA.PerspectiveCamera;
	//BITFIELD3D ^= ORTHOGRAPHIC
	document.ToggleState(ORTHOGRAPHIC)

	setCamera((BITFIELD3D & ORTHOGRAPHIC) == 0);
	setEnvironment((BITFIELD3D & ORTHOGRAPHIC) == 0);
	/*
		const oldpos = camera.position;
		var oldquat = camera.quaternion;
		
		if (isPerspective) {
			camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
		} else {
			camera = new THREE.OrthographicCamera( window.innerWidth / - 4, window.innerWidth / 4, window.innerHeight / 4, window.innerHeight / - 4, 0.1, 10000 );
		}
		camera.quaternion.copy( oldquat );
		camera.position.copy( oldpos );
		const oldtarget = controls.target;
		
		controls.dispose();		//remove event listeners
	
		controls = new OrbitControls( camera, container.renderer.domElement );
		controls.panSpeed = 0.2;
		controls.rotateSpeed = 0.05;
		controls.zoomSpeed = 0.6;
		controls.target = oldtarget;
		controls.enableDamping = false;
		controls.update();
		
		setupTransformControls();
		*/
}

document.TogglePier = function () {
	DATA.BerthSolid = !DATA.BerthSolid;

	pillarBerthObjects.forEach(function (obj, idx) {
		obj.visible = !DATA.BerthSolid;
	});

	solidBerthObjects.forEach(function (obj, idx) {
		obj.visible = DATA.BerthSolid;
	});
}

/* Not API */

//doesn't handle events

//function MoveShip(Xlongit, Ztrans, Yrot, Xlongit2, Ztrans2, Yrot2) {
//Reflects Model now
//Handler for 'datachangedvessel' event

container.addEventListener2("vesseldatachanged", OnDataChangedVessel, false);

function OnDataChangedVessel(event) {

	if (DATA.HOST.needsUpdate) DoMoveShip("HOST");
	if (DATA.GUEST && DATA.GUEST.needsUpdate) DoMoveShip("GUEST");
	if (DATA.PASSINGpos && DATA.PASSINGneedsUpdate) {
		const pv = scene.getObjectByName("vesselpassing");
		//#TODO this needs the Y correction
		pv.position.set(DATA.PASSINGpos.Item1, DATA.heightWater, DATA.PASSINGpos.Item2);
		pv.updateMatrix();
	}

	//IMPORTANT: move both vessels first before creating lines

	//Rigging config not changed!
	//if (DATA.HOST.needsUpdate) createLines("HOST", true);
	//if (DATA.GUEST && DATA.GUEST.needsUpdate) createLines("GUEST", true);
	if (DATA.HOST.needsUpdate) DrawLines("HOST");
	if (DATA.GUEST && DATA.GUEST.needsUpdate) DrawLines("GUEST");

	//document.dispatchEvent(datachangedvessel);

	DATA.HOST.needsUpdate = false;
	if (DATA.GUEST) DATA.GUEST.needsUpdate = false;

	//processingComplete.Update();

	//if (collisionDetectionOn) document.detectCollision();

	container.dispatchEvent(eVesselmoved);

}

//Handle details of a vessel move (don't call: call UpdateVessels!)
function DoMoveShip(strHostGst) {

	//#TODO Update Trim

	let vessel = (strHostGst == "HOST") ? scene.getObjectByName("vessel") : scene.getObjectByName("vesselguest");

	let DATA1 = DATA[strHostGst];

	if (!DATA1) return;

	//vessel.position.copy(Common.vShipPos("HOST", Xlongit, Ztrans));
	vessel.position.copy(Common.vShipPos(strHostGst, DATA1.excursion.x, DATA1.excursion.z));

	vessel.position.y += DATA1.heave;

	//-ve, +ve (-ve,-ve in Optimoor)
	//Same with offset (see Common offset)
	//vessel.position.add(new THREE.Vector3(-Xlongit, 0, Ztrans));

	vessel.rotation.order = "ZXY";

	vessel.rotation.z = DATA1.trim * 0.017453;

	//vessel.rotation.y = -Yrot * DATA.HOST.VesselFacing;
	//vessel.rotation.y = DATA1.excursion.y * DATA1.VesselFacing;
	vessel.rotation.y = DATA1.excursion.y;
	//All rotation including vessel start rotation now included in motion here
	vessel.rotation.y += (1 - DATA1.VesselFacing) * 0.5 * Math.PI;

	if (DEBUG) console.log("Do Move Ship.. VF:" + DATA1.VesselFacing + ", rot:" + vessel.rotation.y);

	vessel.updateMatrix();

	//Update forcearrow
	let arrowname = (strHostGst == "HOST") ? "arrowhost" : "arrowguest";
	let arrowHelper = vessel.getObjectByName(arrowname);
	//#TODO is angle force arrow independent of North (0)
	//const fangle = vecForce2World(vessel.rotation.y, DATA1.vecForce[0]);
	//DATA1.vecForce[0] = fangle;
	Common.updateArrowWText(arrowHelper, DATA1.vecForce, 0, DATA1.shipBreadth);
	Common.repaintArrowWText(arrowHelper, camera);

	//if (DATA.GUEST) {
	//	let vesselguest = scene.getObjectByName("vesselguest");

	//	//vesselguest.position.copy(Common.vShipPos("GUEST", Xlongit2, Ztrans2));
	//	vesselguest.position.copy(Common.vShipPos("GUEST", DATA.GUEST.excursion.x, DATA.GUEST.excursion.z));
	//	//vesselguest.position.add(new THREE.Vector3(-Xlongit2, 0, Ztrans2));
	//	//vesselguest.rotation.y = -Yrot2 * DATA.GUEST.VesselFacing;
	//	vesselguest.rotation.y = -DATA.GUEST.excursion.y * DATA.GUEST.VesselFacing;
	//	vesselguest.updateMatrix();
	//}


	//Set CollisionObjects for update
	//This is coupled! Needs collision update.
	const deck = vessel.getObjectByName("deck")	
	if (deck) deck.OBBProcessed = false;
	const belowdeck = vessel.getObjectByName("belowdeck")
	if (belowdeck) belowdeck.OBBProcessed = false;
	const hull = vessel.getObjectByName("hull")	
	if (hull) hull.OBBProcessed = false;
	
};

//function UpdateEnvironment(vecWind, vecCurrent, vecWaves, vecSwell, vecSurge) {

//	//Update the model here
//	DATA.vecWind = vecWind;
//	DATA.vecCurrent = vecCurrent;
//	DATA.vecWaves = vecWaves;
//	DATA.vecSwell = vecSwell;
//	DATA.vecSurge = vecSurge;

//	document.dispatchEvent(datachangedenvironment);

//}





//
// Cleanup
//

/*
//Iterate elements and arrays to depth
function iterate(obj, action, depth ) {
	if (!obj) return;
	if (!depth) depth = 1;
	if (depth > 10) {
		action(obj);
		return;
	}
	
	if (Array.isArray(obj)) {
		for(let i = obj.length - 1; i>=0; i--) {
			iterate(obj[i], action, ++depth));
		}
		//how to distinguish object with recursable elements from the one you want to apply action
	} else {
		action(obj);
	}
}
*/

//Call this on unload
document.dispose = function () {

	if (DEBUG) console.log("### Dispose.");

	Stop();

	//HACK this should have no state!
	Common.dispose();


	if (container.renderer) {
		if (DEBUG) console.log("Number of Triangles :", container.renderer.info.render.triangles);
		if (DEBUG) console.log("Number of Geometries :", container.renderer.info.memory.geometries);
		if (DEBUG) console.log("Number of Textures :", container.renderer.info.memory.textures);
		//container.renderer.forceContextLoss();
		//container.renderer.dispose();
	}

	RemoveRenderers()

	
	//
	// Listeners
	//
	window.removeEventListener('resize', onWindowResize, true);
	removeEventListeners();

	//
	//Removed from Globals
	//
	//Raycaster helper
	detectableObjects = [];
	MAPS.linesDict = {};
	solidBerthObjects = null;
	pillarBerthObjects = null;

	//collision detection
	collisionObjects = {};

	//Module cleanup
	Ship.Dispose();//references to vessel asset vertices
	Lines.dispose();//this is actually part of DATA

	CACHE.dispose();

	//
	// Scene cleanup
	//

	//Individual treatment
	if (cubeCamera) {
		cubeCamera.remove.apply(cubeCamera, cubeCamera.children);//6 cameras
		cubeCamera = null;
	}

	if (gimbal) gimbal.parentNode.removeChild(gimbal);
	gimbal = null;

	if (controls && controls.dispose) controls.dispose();

	if (stats) {
		//stats.dispose();
		document.body.removeChild(stats.dom);
		//stats.end();
		stats = null;
	}

	//Remove scene
	//dispose scene object geometry
	//materials/Textures all in CACHE
	scene.traverse(function (object) {
		if (object.geometry) object.geometry.dispose();
		if (object.renderTarget) object.renderTarget.dispose();
		if (object.dispose) object.dispose();
	});

	//TODO check water fully disposed


	//Recursively remove children from scene
	//Compare with
	//scene.remove.apply(scene, scene.children);
	function clearObject3DR(obj) {
		for (var i = obj.children.length - 1; i >= 0; i--) {
			let e = obj.children.pop();

			if (e.children) {
				clearObject3DR(e);
			}
		}
		//obj.children.clear();
	}
	clearObject3DR(scene);

	scene = null;

	//Other scene objects (#TODO check this is not duplicate)
	//if (transformcossntrol) {
	//	transformcontrol.removeEventListener('objectChange', DATA.mouseMoveClosure, false);
	//	transformcontrol.removeEventListener('dragging-changed', transformConntrolEventListener, true);
	//}


	//Clear DATA
	//document.emptyDATA();
	if (DEBUG) console.log("Empty data");

	Object.forEach(DATA, function (key, asset) {
		if (asset && asset.dispose) asset.dispose();
		asset = null;
		delete DATA[key];
	});
	
	//DATA = null;//triggers XSS warning
	
	if (DEBUG) console.log("Scene disposed.");
	
	
/*
	document.ClearScene = function() {

	Stop();
	
	if (DEBUG) console.log("Number of Geometries b4:", container.renderer.info.memory.geometries);

	const water = scene.getObjectByName("water");

	scene.remove(camera);
	camera.dispose();
	scene.remove(stats);
	//gimbal.dispose();
	//transformcontrol.dispose();
	
	scene.background.texture.dispose();
	scene.background = null;

	cubeCamera.dispose();
	
	scene.traverse(function (object) {
		
		if (object.geometry) {
			object.geometry.dispose();
			if (DEBUG) console.log(`Disposed: ${object.parent.name}.${object.name}`);
		}
		if (object.dispose) object.dispose();
	});

	if (DEBUG) console.log(water);

	//camera = null;
	//stats = null;
	//cubeCamera = null;

	
	//scene.clear();
	
	//scene.traverse(function (object) {
	//	if (object.children) object.children.clear();
	//});

	
	if (DEBUG) console.log("Number of Geometries aft:", container.renderer.info.memory.geometries);

	if (DEBUG) console.log(scene);
	
}
*/
}


if (AUTOSTART && DATAIN) {
	DATAIN.AUTO = 1;
	//document.LoadAssets();
	//init(DATAIN);
}

//PAGELOADED
pageLoaded = true;
//auto the next stage
updateProgress(33);
document.LoadAssets();
if (DEBUG) console.log("Page loaded.");

//window.MessageClient("PAGELOADED");