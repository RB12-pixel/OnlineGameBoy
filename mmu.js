export class MMU {
    constructor() {
        this.rom = new Uint8Array(0x10000);
        this.vram = new Uint8Array(0x2000);
        this.wram = new Uint8Array(0x2000);
        this.io = new Uint8Array(0x80);
        this.keys = {
            a: false, b: false, start: false, select: false,
            up: false, down: false, left: false, right: false
        };
    }

    loadROM(romData) {
        this.rom.set(romData);
    }

    read8(addr) {
        addr &= 0xFFFF;
        if (addr < 0x8000) return this.rom[addr];
        if (addr >= 0x8000 && addr < 0xA000) return this.vram[addr - 0x8000];
        if (addr >= 0xC000 && addr < 0xE000) return this.wram[addr - 0xC000];
        if (addr >= 0xFF00 && addr < 0xFF80) {
            // Gestione base registro Joypad (0xFF00)
            if (addr === 0xFF00) {
                let p1 = this.io[0x00];
                let res = 0xCF; // Bit non usati a 1
                const joyp = this.io[0x00];
                
                if (!(joyp & 0x20)) { // Controlla direzionali se bit 5 è 0
                    if (this.keys.down) res &= ~0x8;
                    if (this.keys.up) res &= ~0x4;
                    if (this.keys.left) res &= ~0x2;
                    if (this.keys.right) res &= ~0x1;
                }
                if (!(joyp & 0x10)) { // Controlla bottoni se bit 4 è 0
                    if (this.keys.start) res &= ~0x8;
                    if (this.keys.select) res &= ~0x4;
                    if (this.keys.b) res &= ~0x2;
                    if (this.keys.a) res &= ~0x1;
                }
                return res | (p1 & 0x30);
            }
            return this.io[addr - 0xFF00];
        }
        return 0;
    }

    write8(addr, val) {
        addr &= 0xFFFF;
        val &= 0xFF;
        if (addr >= 0x8000 && addr < 0xA000) {
            this.vram[addr - 0x8000] = val;
        } else if (addr >= 0xC000 && addr < 0xE000) {
            this.wram[addr - 0xC000] = val;
        } else if (addr >= 0xFF00 && addr < 0xFF80) {
            this.io[addr - 0xFF00] = val;
        }
    }
}
