import { MMU } from './mmu.js';
import { CPU } from './cpu.js';
import { PPU } from './ppu.js';

const mmu = new MMU();
const cpu = new CPU(mmu);
const canvas = document.getElementById('screen');
const ppu = new PPU(mmu, canvas);

let isRunning = false;

async function loadROM(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error("File ROM non trovato");
        const buffer = await response.arrayBuffer();
        const rom = new Uint8Array(buffer);
        mmu.loadROM(rom);
        console.log("ROM caricata con successo:", path);
    } catch (e) {
        console.error("Errore nel caricamento della ROM:", e);
    }
}

const romSelect = document.getElementById('rom-select');
if (romSelect) {
    loadROM(romSelect.value);
    romSelect.addEventListener('change', (e) => {
        isRunning = false;
        loadROM(e.target.value);
    });
}

document.getElementById('avvia-btn')?.addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        requestAnimationFrame(runEmulation);
    }
});

document.getElementById('pausa-btn')?.addEventListener('click', () => {
    isRunning = false;
});

function runEmulation() {
    if (!isRunning) return;

    let cyclesThisFrame = 0;
    const maxCyclesPerFrame = 70224;

    while (cyclesThisFrame < maxCyclesPerFrame) {
        const cycles = cpu.step();
        ppu.update(cycles);
        cyclesThisFrame += cycles;
    }

    const pcElem = document.getElementById('pc-debug');
    if (pcElem) {
        pcElem.innerText = "PC: 0x" + cpu.pc.toString(16).toUpperCase().padStart(4, '0');
    }

    requestAnimationFrame(runEmulation);
}

// --- GESTIONE DEI TASTI (D-Pad, A, B, Start, Select) ---
function bindButton(id, keyName) {
    const btn = document.getElementById(id);
    if (!btn) return;

    ['mousedown', 'touchstart'].forEach(evt => {
        btn.addEventListener(evt, (e) => {
            e.preventDefault();
            mmu.keys[keyName] = true;
        });
    });

    ['mouseup', 'touchend', 'mouseleave'].forEach(evt => {
        btn.addEventListener(evt, (e) => {
            e.preventDefault();
            mmu.keys[keyName] = false;
        });
    });
}

bindButton('btn-up', 'up');
bindButton('btn-down', 'down');
bindButton('btn-left', 'left');
bindButton('btn-right', 'right');
bindButton('btn-a', 'a');
bindButton('btn-b', 'b');
bindButton('btn-start', 'start');
bindButton('btn-select', 'select');
