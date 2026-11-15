import {test} from 'node:test';
import assert from 'node:assert/strict';
import {personalize,moods,islandBounds,islandHeight} from '../src/paradise-world.js';
import {readFileSync} from 'node:fs';
test('creative prompts choose existing, bounded presets',()=>{assert.equal(personalize('free and curious','glowing forest island').nature,.95);assert.equal(personalize('peaceful','tropical shore').nature,.25);for(const preset of Object.values(moods))for(const value of Object.values(preset))assert.ok(value>=0&&value<=1);});
test('shore, grove and overlook remain within a bounded island',()=>{for(const [x,z] of [[-9,5],[4,16],[-8,21]])assert.deepEqual(islandBounds(x,z),{x,z});const p=islandBounds(100,100);assert.ok((p.x/13)**2+((p.z-10)/18)**2<=1.00001);assert.equal(islandHeight(-8,21),1.5);});
test('all original authored SATIE hosts are still present',()=>{const source=readFileSync('src/main.ts','utf8'),contract=JSON.parse(readFileSync('public/satie/scene.contract.json'));for(const {id} of contract.scene.objects||[])assert.ok(source.includes(`'${id}'`),id);});
test('SATIE files load relative to the Pages base path',()=>{const source=readFileSync('src/main.ts','utf8');assert.ok(source.includes('${import.meta.env.BASE_URL}satie/scene.contract.json'));assert.ok(!source.includes("fetch('/satie/"));});
