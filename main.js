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

// Gestione dei click sui pulsanti dello schermo
document.getElementById('btn-up')?.addEventListener('click', () => { console.log("Premuto: SU"); });
document.getElementById('btn-down')?.addEventListener('click', () => { console.log("Premuto: GIÙ"); });
document.getElementById('btn-left')?.addEventListener('click', () => { console.log("Premuto: SINISTRA"); });
document.getElementById('btn-right')?.addEventListener('click', () => { console.log("Premuto: DESTRA"); });
document.getElementById('btn-a')?.addEventListener('click', () => { console.log("Premuto: A"); });
document.getElementById('btn-b')?.addEventListener('click', () => { console.log("Premuto: B"); });
document.getElementById('btn-start')?.addEventListener('click', () => { console.log("Premuto: START"); });
document.getElementById('btn-select')?.addEventListener('click', () => { console.log("Premuto: SELECT"); });
